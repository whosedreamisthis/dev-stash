import type { FavoriteCollection, FavoriteItem } from "@/types/favorites";
import { CREATABLE_TYPE_SLUGS } from "@/lib/validations/items";

export const ITEM_SORTS = ["date", "name", "type"] as const;
export const COLLECTION_SORTS = ["date", "name"] as const;

export type ItemSort = (typeof ITEM_SORTS)[number];
export type CollectionSort = (typeof COLLECTION_SORTS)[number];

export const SORT_LABELS: Record<ItemSort, string> = {
  date: "Date",
  name: "Name",
  type: "Type",
};

const compareNames = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

// Newest first
const compareDates = (a: Date, b: Date) => b.getTime() - a.getTime();

const TYPE_ORDER: readonly string[] = CREATABLE_TYPE_SLUGS;

// System type order; unknown types go last
function typeRank(slug: string) {
  const index = TYPE_ORDER.indexOf(slug);
  return index === -1 ? TYPE_ORDER.length : index;
}

export function sortFavoriteItems(items: FavoriteItem[], sort: ItemSort): FavoriteItem[] {
  return [...items].sort((a, b) => {
    if (sort === "date") return compareDates(a.updatedAt, b.updatedAt);
    if (sort === "type") {
      const byType = typeRank(a.type.slug) - typeRank(b.type.slug);
      if (byType !== 0) return byType;
    }
    return compareNames(a.title, b.title);
  });
}

export function sortFavoriteCollections(
  collections: FavoriteCollection[],
  sort: CollectionSort
): FavoriteCollection[] {
  return [...collections].sort((a, b) =>
    sort === "date" ? compareDates(a.updatedAt, b.updatedAt) : compareNames(a.name, b.name)
  );
}
