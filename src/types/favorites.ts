import type { CollectionSummary } from "@/types/collections";
import type { ItemSummary } from "@/types/items";

// updatedAt stands in for when the item or collection was favorited
export interface FavoriteItem extends ItemSummary {
  updatedAt: Date;
}

export interface FavoriteCollection extends CollectionSummary {
  updatedAt: Date;
}
