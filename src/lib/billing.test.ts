import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOrCreateCustomerId,
  handleStripeEvent,
  syncCheckoutSession,
} from "@/lib/billing";
import { getBillingUser, setStripeCustomerId, syncSubscription } from "@/lib/db/billing";
import { getStripe } from "@/lib/stripe";

vi.mock("@/lib/db/billing", () => ({
  getBillingUser: vi.fn(),
  setStripeCustomerId: vi.fn(),
  syncSubscription: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

const mockGetBillingUser = vi.mocked(getBillingUser);
const mockSetStripeCustomerId = vi.mocked(setStripeCustomerId);
const mockSyncSubscription = vi.mocked(syncSubscription);

const stripe = {
  customers: { create: vi.fn() },
  subscriptions: { retrieve: vi.fn() },
  checkout: { sessions: { retrieve: vi.fn() } },
};

const SUBSCRIPTION = { id: "sub_1", status: "active" };

const BILLING_USER = {
  email: "ada@example.com",
  name: "Ada",
  isPro: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripeCurrentPeriodEnd: null,
};

function makeEvent(type: string, object: unknown): Stripe.Event {
  return { type, data: { object } } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue(stripe as unknown as Stripe);
  stripe.subscriptions.retrieve.mockResolvedValue(SUBSCRIPTION);
});

describe("handleStripeEvent", () => {
  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ])("re-fetches and syncs the subscription on %s", async (type) => {
    await handleStripeEvent(makeEvent(type, { id: "sub_1", status: "canceled" }));

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(mockSyncSubscription).toHaveBeenCalledWith(SUBSCRIPTION);
  });

  it("syncs the subscription of a completed subscription checkout", async () => {
    await handleStripeEvent(
      makeEvent("checkout.session.completed", { mode: "subscription", subscription: "sub_1" }),
    );

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(mockSyncSubscription).toHaveBeenCalledWith(SUBSCRIPTION);
  });

  it("reads an expanded subscription on checkout", async () => {
    await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        mode: "subscription",
        subscription: { id: "sub_1" },
      }),
    );

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
  });

  it("ignores checkouts that aren't subscriptions", async () => {
    await handleStripeEvent(
      makeEvent("checkout.session.completed", { mode: "payment", subscription: null }),
    );

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockSyncSubscription).not.toHaveBeenCalled();
  });

  it("ignores other events", async () => {
    await handleStripeEvent(makeEvent("invoice.paid", { id: "in_1" }));

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockSyncSubscription).not.toHaveBeenCalled();
  });
});

describe("syncCheckoutSession", () => {
  it("syncs the subscription of the user's completed session", async () => {
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      client_reference_id: "user-1",
      status: "complete",
      subscription: "sub_1",
    });

    await syncCheckoutSession("user-1", "cs_1");

    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_1");
    expect(mockSyncSubscription).toHaveBeenCalledWith(SUBSCRIPTION);
  });

  it("ignores another user's session", async () => {
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      client_reference_id: "user-2",
      status: "complete",
      subscription: "sub_1",
    });

    await syncCheckoutSession("user-1", "cs_1");

    expect(mockSyncSubscription).not.toHaveBeenCalled();
  });

  it("ignores an incomplete session", async () => {
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      client_reference_id: "user-1",
      status: "open",
      subscription: null,
    });

    await syncCheckoutSession("user-1", "cs_1");

    expect(mockSyncSubscription).not.toHaveBeenCalled();
  });
});

describe("getOrCreateCustomerId", () => {
  it("returns null when the user doesn't exist", async () => {
    mockGetBillingUser.mockResolvedValue(null);

    await expect(getOrCreateCustomerId("user-1")).resolves.toBeNull();
    expect(stripe.customers.create).not.toHaveBeenCalled();
  });

  it("reuses an existing customer", async () => {
    mockGetBillingUser.mockResolvedValue({ ...BILLING_USER, stripeCustomerId: "cus_1" });

    await expect(getOrCreateCustomerId("user-1")).resolves.toBe("cus_1");
    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(mockSetStripeCustomerId).not.toHaveBeenCalled();
  });

  it("creates and saves a new customer with an idempotency key", async () => {
    mockGetBillingUser.mockResolvedValue(BILLING_USER);
    stripe.customers.create.mockResolvedValue({ id: "cus_new" });

    await expect(getOrCreateCustomerId("user-1")).resolves.toBe("cus_new");
    expect(stripe.customers.create).toHaveBeenCalledWith(
      { email: "ada@example.com", name: "Ada", metadata: { userId: "user-1" } },
      { idempotencyKey: "customer-user-1" },
    );
    expect(mockSetStripeCustomerId).toHaveBeenCalledWith("user-1", "cus_new");
  });
});
