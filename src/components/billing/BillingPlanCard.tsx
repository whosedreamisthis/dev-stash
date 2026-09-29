import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { UpgradeButtons } from "@/components/billing/UpgradeButtons";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel } from "@/components/ui/progress";

interface BillingPlanCardProps {
  isPro: boolean;
  periodEnd: Date | null;
  hasCustomer: boolean;
  usage: { items: number; collections: number };
  limits: { items: number; collections: number };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

interface UsageBarProps {
  label: string;
  count: number;
  limit: number;
}

function UsageBar({ label, count, limit }: UsageBarProps) {
  return (
    <Progress value={Math.min(count, limit)} max={limit}>
      <ProgressLabel>{label}</ProgressLabel>
      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
        {count} / {limit}
      </span>
    </Progress>
  );
}

export function BillingPlanCard({ isPro, periodEnd, hasCustomer, usage, limits }: BillingPlanCardProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Billing</h2>
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{isPro ? "DevStash Pro" : "Free"}</h3>
              {isPro && <Badge>PRO</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? periodEnd
                  ? `Renews on ${dateFormatter.format(periodEnd)}.`
                  : "Unlimited items, collections and uploads."
                : "Upgrade for unlimited items and collections, file and image uploads, and AI features."}
            </p>
          </div>
          {isPro ? <ManageBillingButton /> : <UpgradeButtons />}
        </div>
        {!isPro && (
          <div className="space-y-4 border-t pt-5">
            <UsageBar label="Items" count={usage.items} limit={limits.items} />
            <UsageBar label="Collections" count={usage.collections} limit={limits.collections} />
          </div>
        )}
        {!isPro && hasCustomer && (
          <div className="flex flex-col gap-2 border-t pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>View past invoices and payment methods.</p>
            <ManageBillingButton />
          </div>
        )}
      </div>
    </section>
  );
}
