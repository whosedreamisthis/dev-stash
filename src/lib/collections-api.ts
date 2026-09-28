import type { CollectionOption } from "@/types/collections";

interface CollectionOptionsResponse {
  success: boolean;
  data?: CollectionOption[];
  error?: string;
}

export const COLLECTIONS_LOAD_ERROR = "Couldn't load your collections. Please try again.";

// Client-side fetch of GET /api/collections; throws with the API's error message on failure
export async function fetchCollectionOptions(): Promise<CollectionOption[]> {
  const response = await fetch("/api/collections");

  let body: CollectionOptionsResponse | null = null;
  try {
    body = (await response.json()) as CollectionOptionsResponse;
  } catch {
    // Non-JSON responses (e.g. a proxy error page) fall through to the generic error
  }
  if (!response.ok || !body?.data) throw new Error(body?.error ?? COLLECTIONS_LOAD_ERROR);

  return body.data;
}
