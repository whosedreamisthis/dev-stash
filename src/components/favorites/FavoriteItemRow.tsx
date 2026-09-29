"use client";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { FAVORITE_DATE_FORMATTER, FAVORITE_ROW_CLASS } from "@/lib/favorites";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { FavoriteItem } from "@/types/favorites";

interface FavoriteItemRowProps {
  item: FavoriteItem;
}

export function FavoriteItemRow({ item }: FavoriteItemRowProps) {
  const { type } = item;
  const Icon = ITEM_TYPE_ICONS[type.icon];
  const { openItem, prefetchItem } = useItemDrawer();

  return (
    <li className={FAVORITE_ROW_CLASS}>
      {/* Covers the whole row so a click anywhere opens the drawer */}
      <button
        type="button"
        aria-label={`Open ${item.title}`}
        onClick={() => openItem(item)}
        onPointerEnter={() => prefetchItem(item.id)}
        onFocus={() => prefetchItem(item.id)}
        className="absolute inset-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
      />
      {Icon && (
        <Icon
          aria-hidden
          className={cn("size-4 shrink-0", ITEM_TYPE_TEXT_COLORS[type.slug])}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <span
        className={cn(
          "hidden shrink-0 rounded bg-muted px-1.5 text-xs sm:inline",
          ITEM_TYPE_TEXT_COLORS[type.slug]
        )}
      >
        {type.name.toLowerCase()}
      </span>
      <time
        dateTime={item.updatedAt.toISOString()}
        className="w-24 shrink-0 text-right text-xs text-muted-foreground"
      >
        {FAVORITE_DATE_FORMATTER.format(item.updatedAt)}
      </time>
    </li>
  );
}
