"use client";

import { Pin } from "lucide-react";
import { CopyButton } from "@/components/items/CopyButton";
import { ItemFavoriteButton } from "@/components/items/ItemFavoriteButton";
import { ItemOpenOverlay } from "@/components/items/ItemOpenOverlay";
import type { ItemSummary } from "@/types/items";
import {
  ITEM_TYPE_BORDER_COLORS,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_TEXT_COLORS,
} from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: ItemSummary;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// Bigger touch targets on mobile, compact on larger screens
const TOUCH_ICON_BUTTON = "size-10 sm:size-6";

export function ItemCard({ item }: ItemCardProps) {
  const { type } = item;
  const Icon = ITEM_TYPE_ICONS[type.icon];

  return (
    <article
      className={cn(
        "relative flex flex-wrap gap-x-4 gap-y-3 rounded-xl sm:flex-nowrap border bg-card p-5 transition-colors hover:bg-accent/40",
        ITEM_TYPE_BORDER_COLORS[type.slug]
      )}
    >
      <ItemOpenOverlay item={item} className="rounded-xl focus-visible:ring-primary" />
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        {Icon && (
          <Icon
            aria-label={type.name}
            className={cn("size-5", ITEM_TYPE_TEXT_COLORS[type.slug])}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 sm:items-center">
          {/* Two lines on mobile, where the card is narrow */}
          <h3 className="line-clamp-2 font-medium wrap-break-word sm:line-clamp-none sm:truncate">
            {item.title}
          </h3>
          {item.isPinned && (
            <Pin className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
        {item.description && (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Its own row on mobile so the title and description keep the full width */}
      <div className="flex shrink-0 basis-full items-center justify-between gap-2 sm:basis-auto sm:flex-col sm:items-end sm:justify-start">
        <time
          dateTime={item.createdAt.toISOString()}
          className="text-xs text-muted-foreground"
        >
          {dateFormatter.format(item.createdAt)}
        </time>
        {/* Above the card's button so clicking them doesn't open the drawer */}
        <div className="relative z-10 flex items-center gap-1">
          <ItemFavoriteButton item={item} className={TOUCH_ICON_BUTTON} />
          {item.copyText && (
            <CopyButton
              value={item.copyText}
              label={`Copy ${item.title}`}
              className={TOUCH_ICON_BUTTON}
            />
          )}
        </div>
      </div>
    </article>
  );
}
