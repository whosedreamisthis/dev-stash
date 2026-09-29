import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleStripeEvent } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { POST } from "./route";

vi.mock("@/lib/billing", () => ({ handleStripeEvent: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

const constructEvent = vi.fn();
const EVENT = { id: "evt_1", type: "customer.subscription.updated" } as Stripe.Event;

function callPost(signature: string | null = "t=1,v1=abc", body = '{"id":"evt_1"}') {
  const headers = signature ? { "stripe-signature": signature } : undefined;
  return POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body, headers }));
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.mocked(getStripe).mockReturnValue({ webhooks: { constructEvent } } as unknown as Stripe);
    constructEvent.mockReturnValue(EVENT);
  });

  it("returns 400 without a signature", async () => {
    const response = await callPost(null);
    expect(response.status).toBe(400);
    expect(handleStripeEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when the webhook secret isn't set", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const response = await callPost();
    expect(response.status).toBe(400);
    expect(handleStripeEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when the signature check fails", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });
    const response = await callPost();
    expect(response.status).toBe(400);
    expect(handleStripeEvent).not.toHaveBeenCalled();
  });

  it("verifies the raw body and handles the event", async () => {
    const response = await callPost("t=1,v1=abc", '{"id":"evt_1"}');
    expect(constructEvent).toHaveBeenCalledWith('{"id":"evt_1"}', "t=1,v1=abc", "whsec_test");
    expect(handleStripeEvent).toHaveBeenCalledWith(EVENT);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("returns 500 so Stripe retries when handling fails", async () => {
    vi.mocked(handleStripeEvent).mockRejectedValue(new Error("db down"));
    const response = await callPost();
    expect(response.status).toBe(500);
  });
});
