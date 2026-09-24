import { Pin, Star } from "lucide-react";
import type { MockItem, MockItemType } from "@/lib/mock-data";
import {
  ITEM_TYPE_BORDER_COLORS,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_TEXT_COLORS,
} from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: MockItem;
  type: MockItemType;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function ItemCard({ item, type }: ItemCardProps) {
  const Icon = ITEM_TYPE_ICONS[type.icon];

  return (
    <article
      className={cn(
        "flex gap-4 rounded-xl border border-l-4 bg-card p-5 transition-colors hover:bg-accent/40",
        ITEM_TYPE_BORDER_COLORS[type.slug]
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className={cn("size-5", ITEM_TYPE_TEXT_COLORS[type.slug])} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{item.title}</h3>
          {item.isPinned && (
            <Pin className="size-4 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {item.description}
        </p>
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
      <time
        dateTime={item.createdAt}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {dateFormatter.format(new Date(item.createdAt))}
      </time>
    </article>
  );
}
