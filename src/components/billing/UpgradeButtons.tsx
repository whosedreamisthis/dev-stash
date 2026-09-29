"use client";

import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/useCheckout";

export function UpgradeButtons() {
  const { checkout, isPending } = useCheckout();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="outline" disabled={isPending} onClick={() => checkout("monthly")}>
        $8 / month
      </Button>
      <Button disabled={isPending} onClick={() => checkout("yearly")}>
        $72 / year — save 25%
      </Button>
    </div>
  );
}
