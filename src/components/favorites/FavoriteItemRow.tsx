"use client";

import { ItemOpenOverlay } from "@/components/items/ItemOpenOverlay";
import { FAVORITE_ROW_CLASS } from "@/lib/favorites";
import { DATE_WITH_YEAR_FORMATTER } from "@/lib/format";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { FavoriteItem } from "@/types/favorites";

interface FavoriteItemRowProps {
  item: FavoriteItem;
}

export function FavoriteItemRow({ item }: FavoriteItemRowProps) {
  const { type } = item;
  const Icon = ITEM_TYPE_ICONS[type.icon];

  return (
    <li className={FAVORITE_ROW_CLASS}>
      <ItemOpenOverlay item={item} className="focus-visible:ring-inset" />
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
        {DATE_WITH_YEAR_FORMATTER.format(item.updatedAt)}
      </time>
    </li>
  );
}
