import { ButtonLink } from "@/components/homepage/ButtonLink";
import { Container } from "@/components/homepage/Container";
import { Reveal } from "@/components/homepage/Reveal";
import { getStartHref } from "@/lib/homepage-content";

interface CtaSectionProps {
  isSignedIn: boolean;
}

export function CtaSection({ isSignedIn }: CtaSectionProps) {
  return (
    <section className="pb-24 md:pb-28">
      <Container>
        <Reveal className="rounded-3xl border bg-card bg-[radial-gradient(400px_200px_at_20%_0%,rgb(59_130_246/0.25),transparent_70%),radial-gradient(400px_200px_at_80%_100%,rgb(236_72_153/0.2),transparent_70%)] px-8 py-16 text-center md:py-20">
          <h2 className="mb-3.5 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Organize Your Knowledge?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Stash your first snippet in under a minute. No credit card required.
          </p>
          <ButtonLink href={getStartHref(isSignedIn)} size="large">
            {isSignedIn ? "Go to Dashboard" : "Get Started for Free"}
          </ButtonLink>
        </Reveal>
      </Container>
    </section>
  );
}
