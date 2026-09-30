"use server";

import { z } from "zod";
import { GENERIC_ERROR } from "@/lib/action-result";
import { getOrCreateCustomerId } from "@/lib/billing";
import { getBillingUser } from "@/lib/db/billing";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { getPriceId, getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/tokens";
import type { ActionResult } from "@/types/actions";

const intervalSchema = z.enum(["monthly", "yearly"]);

export type BillingRedirectResult = ActionResult<{ url: string }>;

export async function createCheckoutSession(interval: string): Promise<BillingRedirectResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = intervalSchema.safeParse(interval);
  if (!parsed.success) return { success: false, error: "Please choose a plan." };

  try {
    const user = await getBillingUser(userId);
    if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
    // Plan changes go through the portal so nobody ends up with two subscriptions
    if (user.stripeSubscriptionId) {
      return { success: false, error: "You already have Pro. Manage it from Settings." };
    }

    const customerId = await getOrCreateCustomerId(userId);
    if (!customerId) return { success: false, error: NOT_SIGNED_IN_ERROR };

    const appUrl = await getAppUrl();
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: getPriceId(parsed.data), quantity: 1 }],
      subscription_data: { metadata: { userId } },
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?checkout=canceled`,
    });
    if (!session.url) throw new Error("Checkout session has no URL");
    return { success: true, data: { url: session.url } };
  } catch (error) {
    console.error("Creating checkout session failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function createPortalSession(): Promise<BillingRedirectResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  try {
    const user = await getBillingUser(userId);
    if (!user?.stripeCustomerId) return { success: false, error: "No billing account found." };

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${await getAppUrl()}/settings`,
    });
    return { success: true, data: { url: session.url } };
  } catch (error) {
    console.error("Creating portal session failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}
