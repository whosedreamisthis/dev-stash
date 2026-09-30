import { TryDemoButton } from "@/components/auth/TryDemoButton";
import { ButtonLink } from "@/components/homepage/ButtonLink";
import { Container } from "@/components/homepage/Container";
import { HomeMobileMenu } from "@/components/homepage/HomeMobileMenu";
import { NavShell } from "@/components/homepage/NavShell";
import { Logo } from "@/components/shared/Logo";
import { getSectionLinks, type HomeNavPage } from "@/lib/homepage-content";

interface HomeNavProps {
  isSignedIn: boolean;
  // The page showing the nav; defaults to the homepage
  page?: HomeNavPage;
}

export function HomeNav({ isSignedIn, page = "home" }: HomeNavProps) {
  const sectionLinks = getSectionLinks(page);

  return (
    <NavShell>
      <Container className="flex h-16 items-center gap-4 md:gap-8">
        <Logo />
        <nav aria-label="Primary" className="hidden gap-7 text-sm font-medium text-muted-foreground md:flex">
          {sectionLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <HomeMobileMenu
            sectionLinks={sectionLinks}
            showSignIn={!isSignedIn && page !== "sign-in"}
          />
          {isSignedIn ? (
            <ButtonLink href="/dashboard">Go to Dashboard</ButtonLink>
          ) : (
            <>
              {page !== "sign-in" && (
                <ButtonLink href="/sign-in" variant="ghost" className="hidden md:inline-flex">
                  Sign In
                </ButtonLink>
              )}
              {page !== "register" && (
                <ButtonLink href="/register" variant="outline" className="hidden md:inline-flex">
                  Get Started
                </ButtonLink>
              )}
              <TryDemoButton />
            </>
          )}
        </div>
      </Container>
    </NavShell>
  );
}
