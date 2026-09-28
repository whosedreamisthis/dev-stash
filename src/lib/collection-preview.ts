import type { CollectionDetail } from "@/types/collections";

// Collections the user clicked in this browser tab, so the collection page's
// loading state can show the name and description before the server responds.
// Only written from click handlers, so it stays empty during server rendering.
const previews = new Map<string, CollectionDetail>();

export function rememberCollection({ id, name, description, isFavorite }: CollectionDetail) {
  previews.set(id, { id, name, description, isFavorite });
}

export function getRememberedCollection(id: string): CollectionDetail | undefined {
  return previews.get(id);
}
