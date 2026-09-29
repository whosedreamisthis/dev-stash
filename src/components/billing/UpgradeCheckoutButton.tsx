"use client";

import { useBillingPeriod } from "@/components/homepage/PricingToggle";
import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/useCheckout";

interface UpgradeCheckoutButtonProps {
  label: string;
}

// Starts checkout for the monthly/yearly period picked in the surrounding BillingProvider
export function UpgradeCheckoutButton({ label }: UpgradeCheckoutButtonProps) {
  const period = useBillingPeriod();
  const { checkout, isPending } = useCheckout();

  return (
    <Button className="w-full" disabled={isPending} onClick={() => checkout(period)}>
      {isPending ? "Redirecting..." : label}
    </Button>
  );
}
