"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlanPrice } from "@/components/homepage/PlanPrice";
import { PRO_PRICES, type BillingPeriod } from "@/lib/homepage-content";
import { cn } from "@/lib/utils";

interface BillingContextValue {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
}

const BillingContext = createContext<BillingContextValue | null>(null);

function useBilling() {
  const context = use(BillingContext);
  if (!context) throw new Error("useBilling must be used inside BillingProvider");
  return context;
}

// Shares the monthly/yearly choice between the toggle and the Pro price
export function BillingProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  return <BillingContext value={{ period, setPeriod }}>{children}</BillingContext>;
}

export function BillingToggle() {
  const { period, setPeriod } = useBilling();
  const yearly = period === "yearly";
  const optionClass = (active: boolean) =>
    cn("cursor-pointer py-2 transition-colors", active ? "text-foreground" : "text-muted-foreground");

  return (
    <div className="flex items-center justify-center gap-3 text-sm font-medium">
      <button type="button" onClick={() => setPeriod("monthly")} className={optionClass(!yearly)}>
        Monthly
      </button>
      <Switch
        checked={yearly}
        onCheckedChange={(checked) => setPeriod(checked ? "yearly" : "monthly")}
        aria-label="Bill yearly"
        // Taller invisible hit area for touch; the switch itself stays small
        className="after:-inset-y-3"
      />
      <button type="button" onClick={() => setPeriod("yearly")} className={optionClass(yearly)}>
        Yearly
        <Badge variant="secondary" className="ml-2 bg-emerald-500/15 text-emerald-400">
          Save 25%
        </Badge>
      </button>
    </div>
  );
}

export function useBillingPeriod(): BillingPeriod {
  return useBilling().period;
}

export function ProPrice() {
  const { period } = useBilling();
  return <PlanPrice {...PRO_PRICES[period]} />;
}
