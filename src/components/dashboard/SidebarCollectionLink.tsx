import Link from "next/link";
import { Folder, Star } from "lucide-react";
import { SIDEBAR_LINK_ACTIVE_CLASS, SIDEBAR_LINK_CLASS } from "@/components/dashboard/SidebarSection";
import { rememberCollection } from "@/lib/collection-preview";
import { ITEM_TYPE_BG_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { CollectionSummary } from "@/types/collections";

interface SidebarCollectionLinkProps {
  collection: CollectionSummary;
  // Favorites show a folder and a star; recent ones show a type-colored dot and the item count
  variant: "favorite" | "recent";
  isActive: boolean;
  onNavigate?: () => void;
}

export function SidebarCollectionLink({
  collection,
  variant,
  isActive,
  onNavigate,
}: SidebarCollectionLinkProps) {
  const isFavorite = variant === "favorite";

  return (
    <Link
      href={`/collections/${collection.id}`}
      onClick={() => {
        rememberCollection(collection);
        onNavigate?.();
      }}
      aria-current={isActive ? "page" : undefined}
      className={cn(SIDEBAR_LINK_CLASS, isActive && SIDEBAR_LINK_ACTIVE_CLASS)}
    >
      {isFavorite ? (
        <Folder className="size-4 text-muted-foreground" />
      ) : (
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
      )}
      <span className="flex-1 truncate">{collection.name}</span>
      {isFavorite ? (
        <Star className="size-4 fill-yellow-400 text-yellow-400" />
      ) : (
        <span className="text-xs text-muted-foreground">{collection.itemCount}</span>
      )}
    </Link>
  );
}
