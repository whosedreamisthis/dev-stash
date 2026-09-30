"use client";

import Link from "next/link";
import { Folder } from "lucide-react";
import { rememberCollection } from "@/lib/collection-preview";
import { FAVORITE_ROW_CLASS } from "@/lib/favorites";
import { DATE_WITH_YEAR_FORMATTER, formatItemCount } from "@/lib/format";
import { ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { FavoriteCollection } from "@/types/favorites";

interface FavoriteCollectionRowProps {
  collection: FavoriteCollection;
}

export function FavoriteCollectionRow({ collection }: FavoriteCollectionRowProps) {
  const typeColor = collection.mainType
    ? ITEM_TYPE_TEXT_COLORS[collection.mainType.slug]
    : "text-muted-foreground";

  return (
    <li>
      <Link
        href={`/collections/${collection.id}`}
        // Lets the collection page's loading state show the name and description
        onClick={() => rememberCollection(collection)}
        className={cn(
          FAVORITE_ROW_CLASS,
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
        )}
      >
        <Folder aria-hidden className={cn("size-4 shrink-0", typeColor)} />
        <span className="min-w-0 flex-1 truncate">{collection.name}</span>
        <span className="hidden shrink-0 rounded bg-muted px-1.5 text-xs text-muted-foreground sm:inline">
          {formatItemCount(collection.itemCount)}
        </span>
        <time
          dateTime={collection.updatedAt.toISOString()}
          className="w-24 shrink-0 text-right text-xs text-muted-foreground"
        >
          {DATE_WITH_YEAR_FORMATTER.format(collection.updatedAt)}
        </time>
      </Link>
    </li>
  );
}
