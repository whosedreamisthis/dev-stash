"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Layers, Settings, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarSection } from "@/components/dashboard/SidebarSection";
import { collections, currentUser, itemTypes } from "@/lib/mock-data";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

const linkClass =
  "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const favoriteCollections = collections.filter((c) => c.isFavorite);
const recentCollections = collections.filter((c) => !c.isFavorite);

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-white">
          <Layers className="size-4" />
        </div>
        <span className="text-lg font-semibold">DevStash</span>
      </div>

      <nav className="flex-1 overflow-y-auto">
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
                <Icon className={cn("size-4", ITEM_TYPE_TEXT_COLORS[type.slug])} />
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
          <p className="px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Favorites
          </p>
          {favoriteCollections.map((collection) => (
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

          <p className="px-2 pt-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Recent
          </p>
          {recentCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              onClick={onNavigate}
              className={linkClass}
            >
              <Folder className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{collection.name}</span>
              <span className="text-xs text-muted-foreground">
                {collection.itemCount}
              </span>
            </Link>
          ))}
        </SidebarSection>
      </nav>

      <div className="flex shrink-0 items-center gap-3 border-t p-4">
        <Avatar size="lg">
          {currentUser.image && (
            <AvatarImage src={currentUser.image} alt={currentUser.name} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{currentUser.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser.email}
          </p>
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
