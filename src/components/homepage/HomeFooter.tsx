import Link from "next/link";
import { Container } from "@/components/homepage/Container";
import { Logo } from "@/components/shared/Logo";
import { FOOTER_COLUMNS } from "@/lib/homepage-content";

export function HomeFooter() {
  return (
    <footer className="border-t pt-16 pb-8">
      <Container className="grid gap-10 text-center sm:grid-cols-[2fr_1fr_1fr] sm:text-left">
        <div className="flex flex-col items-center sm:items-start">
          <Logo />
          <p className="mt-3.5 max-w-xs text-sm text-muted-foreground">
            One fast, searchable, AI-enhanced hub for all your dev knowledge.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col items-center gap-2.5 sm:items-start">
            <h4 className="mb-1 text-sm font-semibold">{column.title}</h4>
            {column.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </Container>
      <Container className="mt-12">
        <p className="border-t pt-6 text-[13px] text-muted-foreground">
          &copy; {new Date().getFullYear()} DevStash. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
