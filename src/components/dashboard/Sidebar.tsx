"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Star } from "lucide-react";
import { SidebarCollectionLink } from "@/components/dashboard/SidebarCollectionLink";
import {
  SIDEBAR_LINK_ACTIVE_CLASS,
  SIDEBAR_LINK_CLASS,
  SidebarSection,
} from "@/components/dashboard/SidebarSection";
import { SidebarTypeLink } from "@/components/dashboard/SidebarTypeLink";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import type { CollectionSummary } from "@/types/collections";
import type { SidebarData } from "@/types/sidebar";

interface SidebarProps {
  data: SidebarData;
  onNavigate?: () => void;
}

interface CollectionGroupProps {
  label: string;
  collections: CollectionSummary[];
  variant: "favorite" | "recent";
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}

// Top-level pages that aren't a type or collection
const MAIN_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/favorites", label: "Favorites", icon: Star },
] as const;

// A labelled list of collection links, hidden when it's empty
function CollectionGroup({
  label,
  collections,
  variant,
  pathname,
  className,
  onNavigate,
}: CollectionGroupProps) {
  if (collections.length === 0) return null;

  return (
    <>
      <p
        className={cn(
          "px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase",
          className
        )}
      >
        {label}
      </p>
      {collections.map((collection) => (
        <SidebarCollectionLink
          key={collection.id}
          collection={collection}
          variant={variant}
          isActive={pathname === `/collections/${collection.id}`}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

export function Sidebar({ data, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, itemTypes, collections } = data;

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Logo onClick={onNavigate} />
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto">
        <div className="px-2 pt-3">
          {MAIN_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(SIDEBAR_LINK_CLASS, isActive && SIDEBAR_LINK_ACTIVE_CLASS)}
              >
                <Icon className="size-4 text-muted-foreground" />
                {label}
              </Link>
            );
          })}
        </div>

        <SidebarSection title="Types">
          {itemTypes.map((type) => (
            <SidebarTypeLink
              key={type.id}
              type={type}
              isActive={pathname === `/items/${type.slug}`}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        <div className="mx-4 border-t" />

        <SidebarSection title="Collections">
          <CollectionGroup
            label="Favorites"
            collections={collections.favorites}
            variant="favorite"
            pathname={pathname}
            className="pt-2"
            onNavigate={onNavigate}
          />
          <CollectionGroup
            label="Recent"
            collections={collections.recent}
            variant="recent"
            pathname={pathname}
            className="pt-4"
            onNavigate={onNavigate}
          />
          <Link
            href="/collections"
            onClick={onNavigate}
            aria-current={pathname === "/collections" ? "page" : undefined}
            className={cn(
              SIDEBAR_LINK_CLASS,
              "mt-2 text-muted-foreground hover:text-foreground",
              pathname === "/collections" && SIDEBAR_LINK_ACTIVE_CLASS
            )}
          >
            View all collections
          </Link>
        </SidebarSection>
      </nav>

      {user && (
        <div className="flex shrink-0 items-center gap-2 border-t p-3">
          <UserMenu user={user} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}
