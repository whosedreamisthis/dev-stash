"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createPortalSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();

  function openPortal() {
    startTransition(async () => {
      const result = await createPortalSession();
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  return (
    <Button variant="outline" disabled={isPending} onClick={openPortal}>
      {isPending ? "Opening..." : "Manage billing"}
    </Button>
  );
}
