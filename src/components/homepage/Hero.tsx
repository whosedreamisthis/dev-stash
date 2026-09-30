import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { TryDemoButton } from "@/components/auth/TryDemoButton";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/homepage/ButtonLink";
import { ChaosIcons } from "@/components/homepage/ChaosIcons";
import { Container } from "@/components/homepage/Container";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { Reveal } from "@/components/homepage/Reveal";
import { getStartHref } from "@/lib/homepage-content";

interface HeroProps {
  isSignedIn: boolean;
}

function HeroPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card/60 p-4 shadow-2xl">
      <p className="mb-3 text-sm font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function Hero({ isSignedIn }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-44">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-175 bg-[radial-gradient(600px_300px_at_30%_30%,rgb(59_130_246/0.18),transparent_70%),radial-gradient(500px_300px_at_70%_20%,rgb(236_72_153/0.12),transparent_70%)]"
      />
      <Container className="relative">
        <Reveal className="mx-auto mb-16 max-w-3xl text-center">
          <Badge variant="outline" className="mb-5 h-auto px-3 py-1 text-xs text-muted-foreground">
            Your developer knowledge hub
          </Badge>
          <h1 className="mb-6 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl md:text-7xl">
            Stop Losing Your
            <br />
            <span className="bg-brand-gradient bg-clip-text text-transparent">Developer Knowledge</span>
          </h1>
          <p className="mx-auto mb-9 max-w-2xl text-lg text-muted-foreground">
            Snippets in VS Code, prompts in old chats, commands in bash history, links in a hundred
            bookmarks. DevStash brings all of it into one fast, searchable, AI-enhanced place.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {isSignedIn ? (
              <ButtonLink href={getStartHref(isSignedIn)} size="large">
                Go to Dashboard
              </ButtonLink>
            ) : (
              <>
                <TryDemoButton size="large" />
                <ButtonLink href={getStartHref(isSignedIn)} variant="outline" size="large">
                  Start for Free
                </ButtonLink>
              </>
            )}
            <ButtonLink href="#features" variant="outline" size="large">
              See Features
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <HeroPanel label="Your knowledge today...">
            <ChaosIcons />
          </HeroPanel>
          <div
            aria-hidden
            className="grid size-14 animate-pulse-ring place-items-center justify-self-center rounded-full bg-brand-gradient text-white motion-reduce:animate-none"
          >
            <ArrowRight className="size-6 rotate-90 md:rotate-0" />
          </div>
          <HeroPanel label="...with DevStash">
            <DashboardPreview />
          </HeroPanel>
        </Reveal>
      </Container>
    </section>
  );
}
