import Stripe from "stripe";

let stripe: Stripe | undefined;

// Created on first use so a missing key doesn't break imports or the build
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key);
  }
  return stripe;
}

export type BillingInterval = "monthly" | "yearly";

export function getPriceId(interval: BillingInterval): string {
  const priceId =
    interval === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
  if (!priceId) throw new Error(`Stripe price for the ${interval} plan is not set`);
  return priceId;
}
