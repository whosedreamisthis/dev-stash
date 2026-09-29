"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/billing";
import type { BillingInterval } from "@/lib/stripe";

// Starts Stripe Checkout for the chosen interval and redirects there
export function useCheckout() {
  const [isPending, startTransition] = useTransition();

  function checkout(interval: BillingInterval) {
    startTransition(async () => {
      const result = await createCheckoutSession(interval);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  return { checkout, isPending };
}
