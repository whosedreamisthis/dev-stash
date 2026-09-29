"use client";

import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";
import { setCollectionFavorite } from "@/actions/collections";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { cn } from "@/lib/utils";
import type { CollectionDetail } from "@/types/collections";

interface CollectionHeaderProps {
  collection: CollectionDetail;
}

// Shared by the collection page and its loading state
export function CollectionHeader({ collection }: CollectionHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isFavorite, toggle } = useFavoriteToggle({
    isFavorite: collection.isFavorite,
    save: (next) => setCollectionFavorite(collection.id, next),
  });

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-3xl font-bold tracking-tight">{collection.name}</h1>
        {collection.description && (
          <p className="mt-2 text-muted-foreground">{collection.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Unfavorite collection" : "Favorite collection"}
          title={isFavorite ? "Unfavorite" : "Favorite"}
          onClick={toggle}
          className={cn(isFavorite && "text-yellow-400 hover:text-yellow-400")}
        >
          <Star className={cn("size-4", isFavorite && "fill-yellow-400")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit collection"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete collection"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCollectionDialog collection={collection} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </header>
  );
}
