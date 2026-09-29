"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { setCollectionFavorite } from "@/actions/collections";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { rememberCollection } from "@/lib/collection-preview";
import type { CollectionSummary } from "@/types/collections";
import {
  ITEM_TYPE_BORDER_COLORS,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_TEXT_COLORS,
} from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  collection: CollectionSummary;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const { mainType, types } = collection;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isFavorite, toggle } = useFavoriteToggle({
    isFavorite: collection.isFavorite,
    save: (next) => setCollectionFavorite(collection.id, next),
  });

  return (
    <div className="relative">
      <Link
        href={`/collections/${collection.id}`}
        // Lets the collection page's loading state show the name and description
        onClick={() => rememberCollection(collection)}
        className={cn(
          "flex h-full flex-col gap-3 rounded-xl border bg-card p-5 pr-12 transition-colors hover:bg-accent/40",
          mainType && ITEM_TYPE_BORDER_COLORS[mainType.slug]
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{collection.name}</h3>
            {isFavorite && (
              <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        {collection.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {collection.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          {types.map((type) => {
            const Icon = ITEM_TYPE_ICONS[type.icon];
            return Icon ? (
              <Icon
                key={type.id}
                aria-label={type.name}
                className={cn("size-4", ITEM_TYPE_TEXT_COLORS[type.slug])}
              />
            ) : null;
          })}
        </div>
      </Link>

      {/* Sibling of the link, since a button can't be nested inside one */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Collection actions"
              className="absolute top-3 right-3"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={toggle}>
            <Star className={cn(isFavorite && "fill-yellow-400 text-yellow-400")} />
            {isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => setDeleteOpen(false)}
      />
    </div>
  );
}
