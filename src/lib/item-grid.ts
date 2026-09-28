// Item types listed as a thumbnail gallery instead of regular item cards
const GALLERY_TYPE_SLUGS: ReadonlySet<string> = new Set(["images"]);

export function isGalleryTypeSlug(slug: string): boolean {
  return GALLERY_TYPE_SLUGS.has(slug);
}

// Shared by the grid and its loading skeleton so both use the same layout.
// The gallery waits for xl before 3 columns because the sidebar takes 256px,
// which leaves thumbnails too small at lg.
export const ITEM_LIST_GRID_CLASS = "grid grid-cols-1 gap-3 md:grid-cols-2";
export const ITEM_GALLERY_GRID_CLASS = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";
