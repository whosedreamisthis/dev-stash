"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import type { BillingInterval } from "@/lib/stripe";

export function UpgradeButtons() {
  const [isPending, startTransition] = useTransition();

  function upgrade(interval: BillingInterval) {
    startTransition(async () => {
      const result = await createCheckoutSession(interval);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="outline" disabled={isPending} onClick={() => upgrade("monthly")}>
        $8 / month
      </Button>
      <Button disabled={isPending} onClick={() => upgrade("yearly")}>
        $72 / year — save 25%
      </Button>
    </div>
  );
}
