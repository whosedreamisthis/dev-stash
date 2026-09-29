import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/homepage/ButtonLink";
import { Checklist } from "@/components/homepage/Checklist";
import { Container } from "@/components/homepage/Container";
import { PlanPrice } from "@/components/homepage/PlanPrice";
import { BillingProvider, BillingToggle, ProPrice } from "@/components/homepage/PricingToggle";
import { Reveal } from "@/components/homepage/Reveal";
import { SectionHeading } from "@/components/homepage/SectionHeading";
import { FREE_PLAN_PRICE, PLANS, getStartHref } from "@/lib/homepage-content";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  isSignedIn: boolean;
}

export function PricingSection({ isSignedIn }: PricingSectionProps) {
  const href = getStartHref(isSignedIn);

  return (
    <section id="pricing" className="scroll-mt-16 py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, start free"
          description="Upgrade when your stash outgrows the free plan."
        />
        <BillingProvider>
          <Reveal className="mb-12">
            <BillingToggle />
          </Reveal>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            {PLANS.map((plan) => {
              const featured = plan.id === "pro";
              return (
                <Reveal key={plan.id}>
                  <article
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
                    <h3 className="mb-3.5 text-xl font-semibold">{plan.name}</h3>
                    {featured ? <ProPrice /> : <PlanPrice {...FREE_PLAN_PRICE} />}
                    <Checklist items={plan.features} className="mx-auto mb-8 w-fit flex-1 md:mx-0" />
                    <ButtonLink href={href} variant={featured ? "default" : "outline"} className="w-full">
                      {plan.cta}
                    </ButtonLink>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </BillingProvider>
      </Container>
    </section>
  );
}
