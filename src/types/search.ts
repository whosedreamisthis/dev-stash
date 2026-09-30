import type { CollectionSummary } from "@/types/collections";
import type { ItemSummary } from "@/types/items";

// An item in the command palette; a short preview replaces the full copy text
export interface SearchItem extends Omit<ItemSummary, "copyText"> {
  contentPreview: string | null;
  language: string | null;
}

// Everything the command palette searches, loaded once and filtered in the browser
export interface SearchData {
  items: SearchItem[];
  collections: CollectionSummary[];
}
