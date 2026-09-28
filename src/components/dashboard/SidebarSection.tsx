"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const SIDEBAR_LINK_CLASS =
  "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="px-2 py-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {title}
        <ChevronDown
          className={cn("size-4 transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </section>
  );
}
