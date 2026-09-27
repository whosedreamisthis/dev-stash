import type { ItemDetail } from "@/types/items";

type ItemDetailJson = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface ItemDetailResponse {
  success: boolean;
  data?: ItemDetailJson;
  error?: string;
}

export const ITEM_LOAD_ERROR = "Couldn't load this item. Please try again.";

// Client-side fetch of GET /api/items/[id]; throws with the API's error message on failure
export async function fetchItemDetail(itemId: string): Promise<ItemDetail> {
  const response = await fetch(`/api/items/${encodeURIComponent(itemId)}`);

  let body: ItemDetailResponse | null = null;
  try {
    body = (await response.json()) as ItemDetailResponse;
  } catch {
    // Non-JSON responses (e.g. a proxy error page) fall through to the generic error
  }
  if (!response.ok || !body?.data) throw new Error(body?.error ?? ITEM_LOAD_ERROR);

  const { createdAt, updatedAt, ...rest } = body.data;
  return { ...rest, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) };
}
