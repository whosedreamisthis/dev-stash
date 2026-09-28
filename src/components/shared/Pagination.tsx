import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getPageHref, getPageLinks } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
}

interface StepLinkProps {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}

const STEP_CLASS = cn(buttonVariants({ variant: "ghost" }), "gap-1");

// Prev/next stay in place when unavailable, greyed out and not clickable
function StepLink({ href, disabled, label, children }: StepLinkProps) {
  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(STEP_CLASS, "pointer-events-none opacity-50")}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={STEP_CLASS}>
      {children}
    </Link>
  );
}

export function Pagination({ basePath, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      <StepLink
        href={getPageHref(basePath, page - 1)}
        disabled={page <= 1}
        label="Previous page"
      >
        <ChevronLeft />
        Prev
      </StepLink>

      {getPageLinks(page, totalPages).map((link, index) =>
        link === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={link}
            href={getPageHref(basePath, link)}
            aria-current={link === page ? "page" : undefined}
            className={buttonVariants({
              variant: link === page ? "outline" : "ghost",
              size: "icon",
            })}
          >
            {link}
          </Link>
        )
      )}

      <StepLink
        href={getPageHref(basePath, page + 1)}
        disabled={page >= totalPages}
        label="Next page"
      >
        Next
        <ChevronRight />
      </StepLink>
    </nav>
  );
}
