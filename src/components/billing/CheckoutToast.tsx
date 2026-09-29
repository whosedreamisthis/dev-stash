"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type CheckoutStatus = "success" | "canceled";

interface CheckoutToastProps {
  status: CheckoutStatus;
}

// Shows the result of a Checkout visit once, then drops the query so a refresh doesn't repeat it
export function CheckoutToast({ status }: CheckoutToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (status === "success") toast.success("Welcome to DevStash Pro!");
    else toast.info("Checkout canceled. You're still on the Free plan.");
    router.replace("/settings", { scroll: false });
  }, [status, router]);

  return null;
}
