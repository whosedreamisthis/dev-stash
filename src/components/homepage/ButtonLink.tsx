import Link from "next/link";
import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: "default" | "large";
  className?: string;
}

// A link styled as a button; in-page anchors (#section) use a plain <a>
export function ButtonLink({ href, children, variant = "default", size = "default", className }: ButtonLinkProps) {
  const classes = cn(
    buttonVariants({ variant }),
    size === "large" && "h-11 px-6 text-[15px]",
    className
  );

  if (href.startsWith("#")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
