import type Stripe from "stripe";
import { getBillingUser, setStripeCustomerId, syncSubscription } from "@/lib/db/billing";
import { getStripe } from "@/lib/stripe";

// Returns the user's Stripe customer, creating and saving one on first checkout.
// The idempotency key stops a double click from creating two customers. It changes every
// minute because Stripe replays a key's response for 24 hours, which would hand back a
// customer that was since deleted.
const CUSTOMER_KEY_WINDOW_MS = 60_000;

export async function getOrCreateCustomerId(userId: string): Promise<string | null> {
  const user = await getBillingUser(userId);
  if (!user) return null;
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create(
    {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId },
    },
    { idempotencyKey: `customer-${userId}-${Math.floor(Date.now() / CUSTOMER_KEY_WINDOW_MS)}` },
  );
  await setStripeCustomerId(userId, customer.id);
  return customer.id;
}

// Always re-fetches, so retried or out-of-order events apply the current state
export async function syncSubscriptionById(subscriptionId: string): Promise<void> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription);
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      await syncSubscriptionById(subscriptionId);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscriptionById(event.data.object.id);
      return;
    default:
      return;
  }
}

// Called by the billing page on return from Checkout, so Pro shows immediately even
// when the webhook hasn't arrived yet. The session must belong to the signed-in user.
export async function syncCheckoutSession(userId: string, sessionId: string): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== userId || session.status !== "complete") return;
  if (typeof session.subscription === "string") await syncSubscriptionById(session.subscription);
}
