"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, Search, Sparkles, Star } from "lucide-react";
import { useHasProAccess } from "@/components/billing/PlanContext";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useIsMac } from "@/hooks/useIsMac";
import { COMPACT_BUTTON, COMPACT_LABEL } from "@/lib/compact-button";
import { isUploadTypeSlug } from "@/lib/upload-constraints";
import { cn } from "@/lib/utils";
import { isCreatableTypeSlug } from "@/lib/validations/items";

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
}

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  onOpenMobileSidebar,
  onOpenSearch,
}: TopBarProps) {
  const shortcut = useIsMac() ? "⌘K" : "Ctrl+K";
  const hasProAccess = useHasProAccess();
  const pathname = usePathname();
  const typeSlug = pathname.startsWith("/items/") ? pathname.slice("/items/".length) : null;
  // Type pages show their own "New <Type>" button (unless the type is Pro-gated)
  const pageHasNewButton =
    typeSlug !== null &&
    isCreatableTypeSlug(typeSlug) &&
    (hasProAccess || !isUploadTypeSlug(typeSlug));

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:gap-4 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
        className="hidden md:inline-flex"
      >
        <PanelLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={onOpenMobileSidebar}
        aria-label="Open sidebar"
        className="md:hidden"
      >
        <PanelLeft />
      </Button>
      {/* Styled like the search input; searching happens in the command palette */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-8 w-full max-w-md min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-input/30"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate lg:hidden">Search...</span>
        <span className="hidden truncate lg:inline">Search items and collections...</span>
        <kbd className="ml-auto hidden shrink-0 rounded border bg-muted px-1.5 font-mono text-xs md:inline">
          {shortcut}
        </kbd>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {!hasProAccess && (
          <Link
            href="/upgrade"
            title="Upgrade to Pro"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              COMPACT_BUTTON,
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles />
            <span className={COMPACT_LABEL}>Upgrade</span>
          </Link>
        )}
        <Link
          href="/favorites"
          aria-label="Favorites"
          title="Favorites"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Star />
        </Link>
        <NewCollectionDialog compact />
        {!pageHasNewButton && <NewItemDialog compact />}
      </div>
    </header>
  );
}
