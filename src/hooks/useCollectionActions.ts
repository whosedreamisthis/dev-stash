"use client";

import { useState } from "react";
import { setCollectionFavorite } from "@/actions/collections";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";

// Favorite toggle and edit/delete dialog state for a collection's action menu or buttons
export function useCollectionActions(collection: { id: string; isFavorite: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isFavorite, toggle: toggleFavorite } = useFavoriteToggle({
    isFavorite: collection.isFavorite,
    save: (next) => setCollectionFavorite(collection.id, next),
  });

  return { isFavorite, toggleFavorite, editOpen, setEditOpen, deleteOpen, setDeleteOpen };
}
