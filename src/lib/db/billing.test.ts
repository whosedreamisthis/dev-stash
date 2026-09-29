import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { syncSubscription } from "@/lib/db/billing";

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() } },
}));

const updateMany = vi.mocked(prisma.user.updateMany);

const PERIOD_END = 1_790_000_000;

function makeSubscription(
  status: Stripe.Subscription.Status,
  overrides: { customer?: unknown; periodEnd?: number | null } = {},
): Stripe.Subscription {
  const periodEnd = overrides.periodEnd === undefined ? PERIOD_END : overrides.periodEnd;
  return {
    id: "sub_1",
    status,
    customer: overrides.customer ?? "cus_1",
    items: { data: periodEnd === null ? [] : [{ current_period_end: periodEnd }] },
  } as unknown as Stripe.Subscription;
}

describe("syncSubscription", () => {
  it.each(["active", "trialing"] as const)("sets Pro for a %s subscription", async (status) => {
    await syncSubscription(makeSubscription(status));

    expect(updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_1" },
      data: {
        isPro: true,
        stripeSubscriptionId: "sub_1",
        stripeCurrentPeriodEnd: new Date(PERIOD_END * 1000),
      },
    });
  });

  it.each(["canceled", "past_due"] as const)(
    "clears Pro only for the matching subscription when %s",
    async (status) => {
      await syncSubscription(makeSubscription(status));

      expect(updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" },
        data: { isPro: false, stripeSubscriptionId: null, stripeCurrentPeriodEnd: null },
      });
    },
  );

  it("reads the customer ID from an expanded customer", async () => {
    await syncSubscription(makeSubscription("active", { customer: { id: "cus_2" } }));

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeCustomerId: "cus_2" } }),
    );
  });

  it("stores a null period end when the subscription has no items", async () => {
    await syncSubscription(makeSubscription("active", { periodEnd: null }));

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPro: true, stripeCurrentPeriodEnd: null }),
      }),
    );
  });
});
