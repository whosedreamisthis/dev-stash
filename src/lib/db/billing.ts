import type Stripe from "stripe";
import { prisma } from "@/lib/db";

const PRO_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);

export interface BillingUser {
  email: string | null;
  name: string | null;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: Date | null;
}

export function getBillingUser(userId: string): Promise<BillingUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
    },
  });
}

export async function setStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
}

// Idempotent: writes the subscription's current state to the user who owns its customer.
// A stale event for an old subscription can't clear a newer one, because losing Pro
// only applies to the subscription that's stored.
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  // Moved from the subscription to its items in API 2025-03-31.basil
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const stripeCurrentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;

  if (PRO_STATUSES.has(subscription.status)) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { isPro: true, stripeSubscriptionId: subscription.id, stripeCurrentPeriodEnd },
    });
    return;
  }

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId, stripeSubscriptionId: subscription.id },
    data: { isPro: false, stripeSubscriptionId: null, stripeCurrentPeriodEnd: null },
  });
}
