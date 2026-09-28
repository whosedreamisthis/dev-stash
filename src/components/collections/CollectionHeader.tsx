import { Star } from "lucide-react";
import type { CollectionDetail } from "@/types/collections";

interface CollectionHeaderProps {
  collection: CollectionDetail;
}

// Shared by the collection page and its loading state
export function CollectionHeader({ collection }: CollectionHeaderProps) {
  return (
    <header className="min-w-0">
      <div className="flex items-center gap-3">
        <h1 className="truncate text-3xl font-bold tracking-tight">{collection.name}</h1>
        {collection.isFavorite && (
          <Star aria-label="Favorite" className="size-5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </div>
      {collection.description && (
        <p className="mt-2 text-muted-foreground">{collection.description}</p>
      )}
    </header>
  );
}
