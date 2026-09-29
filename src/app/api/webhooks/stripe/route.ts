import type Stripe from "stripe";
import { handleStripeEvent } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

// Signature checks need the raw body exactly as Stripe sent it, so it's read as text
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature check failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    // A 500 makes Stripe retry the event later
    console.error(`Stripe webhook ${event.type} failed:`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
