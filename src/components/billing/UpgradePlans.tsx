import { UpgradeCheckoutButton } from "@/components/billing/UpgradeCheckoutButton";
import { Checklist } from "@/components/homepage/Checklist";
import { PlanPrice } from "@/components/homepage/PlanPrice";
import { BillingProvider, BillingToggle, ProPrice } from "@/components/homepage/PricingToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FREE_PLAN_PRICE, PLANS } from "@/lib/homepage-content";
import { cn } from "@/lib/utils";

// Free and Pro plan cards like the homepage pricing section, with checkout on the Pro card
export function UpgradePlans() {
  return (
    <BillingProvider>
      <div className="mb-10">
        <BillingToggle />
      </div>
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const featured = plan.id === "pro";
          return (
            <article
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-card p-8 text-center md:text-left",
                featured &&
                  "border-violet-500 bg-linear-to-b from-violet-500/10 to-card to-45% shadow-[0_30px_70px_-35px_rgb(139_92_246/0.6)]"
              )}
            >
              {featured && (
                <Badge className="absolute -top-3 left-1/2 h-auto -translate-x-1/2 border-0 bg-brand-gradient px-3.5 py-1 text-white">
                  Most Popular
                </Badge>
              )}
              <h2 className="mb-3.5 text-xl font-semibold">{plan.name}</h2>
              {featured ? <ProPrice /> : <PlanPrice {...FREE_PLAN_PRICE} />}
              <Checklist items={plan.features} className="mx-auto mb-8 w-fit flex-1 md:mx-0" />
              {featured ? (
                <UpgradeCheckoutButton label={plan.cta} />
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Current plan
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </BillingProvider>
  );
}
