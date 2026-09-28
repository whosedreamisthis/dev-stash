"use client";

import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import type { CollectionDetail } from "@/types/collections";

interface CollectionHeaderProps {
  collection: CollectionDetail;
}

// Shared by the collection page and its loading state
export function CollectionHeader({ collection }: CollectionHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="truncate text-3xl font-bold tracking-tight">{collection.name}</h1>
          {collection.isFavorite && (
            <Star aria-label="Favorite" className="size-5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        {collection.description && (
          <p className="mt-2 text-muted-foreground">{collection.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled
          title="Favoriting isn't available yet"
          aria-label="Favorite collection"
        >
          <Star className="size-4" />
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
