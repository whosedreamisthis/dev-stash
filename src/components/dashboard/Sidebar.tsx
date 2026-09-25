"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Layers, Settings, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarSection } from "@/components/dashboard/SidebarSection";
import {
  ITEM_TYPE_BG_COLORS,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_TEXT_COLORS,
} from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { SidebarData } from "@/types/sidebar";

interface SidebarProps {
  data: SidebarData;
  onNavigate?: () => void;
}

const linkClass =
  "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const groupLabelClass =
  "px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase";

export function Sidebar({ data, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, itemTypes, collections } = data;
  const displayName = user?.name ?? user?.email ?? "Guest";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-white">
          <Layers className="size-4" />
        </div>
        <span className="text-lg font-semibold">DevStash</span>
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto">
        <SidebarSection title="Types">
          {itemTypes.map((type) => {
            const Icon = ITEM_TYPE_ICONS[type.icon];
            const href = `/items/${type.slug}`;
            return (
              <Link
                key={type.id}
                href={href}
                onClick={onNavigate}
                className={cn(
                  linkClass,
                  pathname === href && "bg-sidebar-accent"
                )}
              >
                {Icon && (
                  <Icon className={cn("size-4", ITEM_TYPE_TEXT_COLORS[type.slug])} />
                )}
                <span className="flex-1 capitalize">{type.slug}</span>
                <span className="text-xs text-muted-foreground">
                  {type.count}
                </span>
              </Link>
            );
          })}
        </SidebarSection>

        <div className="mx-4 border-t" />

        <SidebarSection title="Collections">
          {collections.favorites.length > 0 && (
            <>
              <p className={cn(groupLabelClass, "pt-2")}>Favorites</p>
              {collections.favorites.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  onClick={onNavigate}
                  className={linkClass}
                >
                  <Folder className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{collection.name}</span>
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                </Link>
              ))}
            </>
          )}

          {collections.recent.length > 0 && (
            <>
              <p className={cn(groupLabelClass, "pt-4")}>Recent</p>
              {collections.recent.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  onClick={onNavigate}
                  className={linkClass}
                >
                  <span className="flex size-4 items-center justify-center">
                    <span
                      aria-label={collection.mainType?.name}
                      className={cn(
                        "size-2.5 rounded-full",
                        collection.mainType
                          ? ITEM_TYPE_BG_COLORS[collection.mainType.slug]
                          : "bg-muted-foreground"
                      )}
                    />
                  </span>
                  <span className="flex-1 truncate">{collection.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {collection.itemCount}
                  </span>
                </Link>
              ))}
            </>
          )}

          <Link
            href="/collections"
            onClick={onNavigate}
            className="mt-2 block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            View all collections
          </Link>
        </SidebarSection>
      </nav>

      <div className="flex shrink-0 items-center gap-3 border-t p-4">
        <Avatar size="lg">
          {user?.image && <AvatarImage src={user.image} alt={displayName} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {user?.email && (
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          )}
        </div>
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-label="Settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </div>
  );
}
