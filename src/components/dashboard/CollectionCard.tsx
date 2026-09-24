import Link from "next/link";
import { Star } from "lucide-react";
import type { MockCollection, MockItemType } from "@/lib/mock-data";
import {
  ITEM_TYPE_BORDER_COLORS,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_TEXT_COLORS,
} from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  collection: MockCollection;
  types: MockItemType[];
}

export function CollectionCard({ collection, types }: CollectionCardProps) {
  // Mock data lists the collection's most common type first
  const mainType = types[0];

  return (
    <Link
      href={`/collections/${collection.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-l-4 bg-card p-5 transition-colors hover:bg-accent/40",
        mainType && ITEM_TYPE_BORDER_COLORS[mainType.slug]
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{collection.name}</h3>
          {collection.isFavorite && (
            <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {collection.itemCount} items
        </p>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {collection.description}
      </p>
      <div className="flex items-center gap-2">
        {types.map((type) => {
          const Icon = ITEM_TYPE_ICONS[type.icon];
          return (
            <Icon
              key={type.id}
              aria-label={type.name}
              className={cn("size-4", ITEM_TYPE_TEXT_COLORS[type.slug])}
            />
          );
        })}
      </div>
    </Link>
  );
}
