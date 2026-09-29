"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  // "group" keeps the wrapper visible and fades in its .reveal-item children instead
  variant?: "fade" | "group";
  threshold?: number;
}

// Fades its content in once it scrolls into view (styles in globals.css)
export function Reveal({ children, className, variant = "fade", threshold }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      data-shown={inView || undefined}
      className={cn(variant === "group" ? "reveal-group" : "reveal", className)}
    >
      {children}
    </div>
  );
}
