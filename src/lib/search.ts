import { getCodeLanguageLabel } from "@/lib/code-editor";
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
    // The label ("TypeScript") and the stored ID ("ts") so either finds it
    item.language && getCodeLanguageLabel(item.language),
    item.language,
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

// cmdk score for a result: 0 hides it, higher ranks first (max 1).
// Every search word must appear in a keyword; words found in earlier
// (more important) keywords score higher, and a title prefix scores highest.
export function scoreSearchMatch(keywords: string[], search: string): number {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  const fields = keywords.map((keyword) => keyword.toLowerCase());
  if (fields[0]?.startsWith(words.join(" "))) return 1;

  let total = 0;
  for (const word of words) {
    const index = fields.findIndex((field) => field.includes(word));
    if (index === -1) return 0;
    total += 1 / (index + 2);
  }
  return total / words.length;
}

export function isMacPlatform(userAgent: string): boolean {
  return /Mac|iPhone|iPad|iPod/.test(userAgent);
}
