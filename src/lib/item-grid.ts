// How an items page lists its type: regular cards, a thumbnail gallery or a file list
export type ItemLayout = "cards" | "gallery" | "list";

const LAYOUT_BY_TYPE_SLUG: Record<string, ItemLayout> = {
  images: "gallery",
  files: "list",
};

export function getItemLayout(typeSlug: string): ItemLayout {
  return LAYOUT_BY_TYPE_SLUG[typeSlug] ?? "cards";
}

// Shared by the grid and its loading skeleton so both use the same layout.
// The gallery waits for xl before 3 columns because the sidebar takes 256px,
// which leaves thumbnails too small at lg.
export const ITEM_LAYOUT_CLASSES: Record<ItemLayout, string> = {
  cards: "grid grid-cols-1 gap-3 md:grid-cols-2",
  gallery: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
  list: "divide-y overflow-hidden rounded-xl border bg-card",
};
