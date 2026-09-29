import { ButtonLink } from "@/components/homepage/ButtonLink";
import { Container } from "@/components/homepage/Container";
import { NavShell } from "@/components/homepage/NavShell";
import { Logo } from "@/components/shared/Logo";
import { SECTION_LINKS } from "@/lib/homepage-content";

interface HomeNavProps {
  isSignedIn: boolean;
}

export function HomeNav({ isSignedIn }: HomeNavProps) {
  return (
    <NavShell>
      <Container className="flex h-16 items-center gap-4 md:gap-8">
        <Logo />
        <nav aria-label="Primary" className="hidden gap-7 text-sm font-medium text-muted-foreground md:flex">
          {SECTION_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isSignedIn ? (
            <ButtonLink href="/dashboard">Go to Dashboard</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/sign-in" variant="ghost" className="hidden md:inline-flex">
                Sign In
              </ButtonLink>
              <ButtonLink href="/register">Get Started</ButtonLink>
            </>
          )}
        </div>
      </Container>
    </NavShell>
  );
}
