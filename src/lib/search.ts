import type { CollectionSummary } from "@/types/collections";
import type { SearchItem } from "@/types/search";

export const SEARCH_PREVIEW_LENGTH = 120;

// One line of an item's content for the palette, with whitespace collapsed
export function toContentPreview(text: string | null): string | null {
  const flat = text?.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  return flat.length > SEARCH_PREVIEW_LENGTH
    ? `${flat.slice(0, SEARCH_PREVIEW_LENGTH)}…`
    : flat;
}

// The text an item is matched on, most important first
export function getItemKeywords(item: SearchItem): string[] {
  return [
    item.title,
    item.type.name,
    ...item.tags,
    item.description,
    item.fileName,
    item.contentPreview,
  ].filter((keyword): keyword is string => Boolean(keyword));
}

export function getCollectionKeywords(collection: CollectionSummary): string[] {
  return [collection.name, collection.description].filter(
    (keyword): keyword is string => Boolean(keyword)
  );
}

export function isMacPlatform(userAgent: string): boolean {
  return /Mac|iPhone|iPad|iPod/.test(userAgent);
}
