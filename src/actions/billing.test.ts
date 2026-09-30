import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { getOrCreateCustomerId } from "@/lib/billing";
import { getBillingUser, type BillingUser } from "@/lib/db/billing";
import { getStripe } from "@/lib/stripe";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/billing", () => ({ getOrCreateCustomerId: vi.fn() }));
vi.mock("@/lib/db/billing", () => ({ getBillingUser: vi.fn() }));
vi.mock("@/lib/stripe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stripe")>()),
  getStripe: vi.fn(),
}));

// auth() is overloaded (it also wraps middleware), so narrow it to the session getter
const mockAuth = auth as unknown as Mock<() => Promise<Session | null>>;
const mockGetBillingUser = vi.mocked(getBillingUser);

const stripe = {
  checkout: { sessions: { create: vi.fn() } },
  billingPortal: { sessions: { create: vi.fn() } },
};

const FREE_USER: BillingUser = {
  email: "ada@example.com",
  name: "Ada",
  isPro: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripeCurrentPeriodEnd: null,
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

function signIn(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId, isPro: false }, expires: "" } as Session);
}

function signInDemo() {
  mockAuth.mockResolvedValue({
    user: { id: "demo-1", isPro: true, isDemo: true },
    expires: "",
  } as Session);
}

const DEMO_ACCOUNT_ERROR = "This isn't available on the demo account.";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("AUTH_URL", "https://devstash.test");
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly");
  vi.mocked(getStripe).mockReturnValue(stripe as unknown as Stripe);
});

describe("createCheckoutSession", () => {
  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createCheckoutSession("monthly")).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("refuses demo accounts before reaching Stripe", async () => {
    signInDemo();
    await expect(createCheckoutSession("monthly")).resolves.toEqual({
      success: false,
      error: DEMO_ACCOUNT_ERROR,
    });
    expect(getBillingUser).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects an unknown interval", async () => {
    signIn();
    await expect(createCheckoutSession("weekly")).resolves.toEqual({
      success: false,
      error: "Please choose a plan.",
    });
    expect(getBillingUser).not.toHaveBeenCalled();
  });

  it("refuses users who already have a subscription", async () => {
    signIn();
    mockGetBillingUser.mockResolvedValue({ ...FREE_USER, stripeSubscriptionId: "sub_1" });
    await expect(createCheckoutSession("monthly")).resolves.toEqual({
      success: false,
      error: "You already have Pro. Manage it from Settings.",
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it.each([
    ["monthly", "price_monthly"],
    ["yearly", "price_yearly"],
  ])("returns the Checkout URL for the %s plan", async (interval, price) => {
    signIn("user-42");
    mockGetBillingUser.mockResolvedValue(FREE_USER);
    vi.mocked(getOrCreateCustomerId).mockResolvedValue("cus_1");
    stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.test/cs_1" });

    await expect(createCheckoutSession(interval)).resolves.toEqual({
      success: true,
      data: { url: "https://checkout.stripe.test/cs_1" },
    });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_1",
      client_reference_id: "user-42",
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { userId: "user-42" } },
      success_url: "https://devstash.test/settings?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://devstash.test/settings?checkout=canceled",
    });
  });

  it("returns a generic error when Stripe fails", async () => {
    signIn();
    mockGetBillingUser.mockResolvedValue(FREE_USER);
    vi.mocked(getOrCreateCustomerId).mockResolvedValue("cus_1");
    stripe.checkout.sessions.create.mockRejectedValue(new Error("stripe down"));
    await expect(createCheckoutSession("monthly")).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
  });
});

describe("createPortalSession", () => {
  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createPortalSession()).resolves.toEqual({
      success: false,
      error: "You must be signed in.",
    });
  });

  it("refuses demo accounts before reaching Stripe", async () => {
    signInDemo();
    await expect(createPortalSession()).resolves.toEqual({
      success: false,
      error: DEMO_ACCOUNT_ERROR,
    });
    expect(getBillingUser).not.toHaveBeenCalled();
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("returns an error for users without a Stripe customer", async () => {
    signIn();
    mockGetBillingUser.mockResolvedValue(FREE_USER);
    await expect(createPortalSession()).resolves.toEqual({
      success: false,
      error: "No billing account found.",
    });
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("returns the portal URL for the user's customer", async () => {
    signIn();
    mockGetBillingUser.mockResolvedValue({ ...FREE_USER, stripeCustomerId: "cus_1" });
    stripe.billingPortal.sessions.create.mockResolvedValue({ url: "https://billing.stripe.test/p_1" });

    await expect(createPortalSession()).resolves.toEqual({
      success: true,
      data: { url: "https://billing.stripe.test/p_1" },
    });
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "https://devstash.test/settings",
    });
  });

  it("returns a generic error when Stripe fails", async () => {
    signIn();
    mockGetBillingUser.mockResolvedValue({ ...FREE_USER, stripeCustomerId: "cus_1" });
    stripe.billingPortal.sessions.create.mockRejectedValue(new Error("stripe down"));
    await expect(createPortalSession()).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
  });
});
