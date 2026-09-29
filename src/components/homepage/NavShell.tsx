"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const SCROLL_OFFSET = 20;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > SCROLL_OFFSET;

// Fixed header that turns more opaque, with a border, once the page scrolls
export function NavShell({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, isScrolled, () => false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        scrolled ? "border-border bg-background/90" : "border-transparent bg-background/40"
      )}
    >
      {children}
    </header>
  );
}
