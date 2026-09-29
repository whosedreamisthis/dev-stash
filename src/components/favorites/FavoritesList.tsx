"use client";

import { useMemo, useState } from "react";
import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { FavoritesSection } from "@/components/favorites/FavoritesSection";
import { FavoritesSortSelect } from "@/components/favorites/FavoritesSortSelect";
import {
  COLLECTION_SORTS,
  ITEM_SORTS,
  sortFavoriteCollections,
  sortFavoriteItems,
  type CollectionSort,
  type ItemSort,
} from "@/lib/favorites-sort";
import type { FavoriteCollection, FavoriteItem } from "@/types/favorites";

interface FavoritesListProps {
  items: FavoriteItem[];
  collections: FavoriteCollection[];
}

// Each list sorts on its own in the browser; the server sends both newest first
export function FavoritesList({ items, collections }: FavoritesListProps) {
  const [itemSort, setItemSort] = useState<ItemSort>("date");
  const [collectionSort, setCollectionSort] = useState<CollectionSort>("date");
  const sortedItems = useMemo(() => sortFavoriteItems(items, itemSort), [items, itemSort]);
  const sortedCollections = useMemo(
    () => sortFavoriteCollections(collections, collectionSort),
    [collections, collectionSort]
  );

  return (
    <>
      <FavoritesSection
        title="Items"
        count={sortedItems.length}
        action={
          <FavoritesSortSelect
            label="Sort items"
            options={ITEM_SORTS}
            value={itemSort}
            onChange={setItemSort}
          />
        }
      >
        {sortedItems.map((item) => (
          <FavoriteItemRow key={item.id} item={item} />
        ))}
      </FavoritesSection>
      <FavoritesSection
        title="Collections"
        count={sortedCollections.length}
        action={
          <FavoritesSortSelect
            label="Sort collections"
            options={COLLECTION_SORTS}
            value={collectionSort}
            onChange={setCollectionSort}
          />
        }
      >
        {sortedCollections.map((collection) => (
          <FavoriteCollectionRow key={collection.id} collection={collection} />
        ))}
      </FavoritesSection>
    </>
  );
}
