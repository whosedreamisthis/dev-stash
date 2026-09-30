"use client";

import Link from "next/link";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { FAVORITE_BUTTON_CLASS, FavoriteStar } from "@/components/shared/FavoriteStar";
import { Button } from "@/components/ui/button";
import { useCollectionActions } from "@/hooks/useCollectionActions";
import { cn } from "@/lib/utils";
import type { CollectionDetail } from "@/types/collections";

interface CollectionHeaderProps {
  collection: CollectionDetail;
}

// Shared by the collection page and its loading state
export function CollectionHeader({ collection }: CollectionHeaderProps) {
  const { isFavorite, toggleFavorite, editOpen, setEditOpen, deleteOpen, setDeleteOpen } =
    useCollectionActions(collection);

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Link
          href="/collections"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Collections
        </Link>
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
          onClick={toggleFavorite}
          className={cn(isFavorite && FAVORITE_BUTTON_CLASS)}
        >
          <FavoriteStar filled={isFavorite} className="size-4" />
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
