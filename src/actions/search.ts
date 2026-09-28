"use server";

import { getSearchCollections } from "@/lib/db/collections";
import { getSearchItems } from "@/lib/db/items";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import type { SearchData } from "@/types/search";

export interface GetSearchDataResult {
  success: boolean;
  data?: SearchData;
  error?: string;
}

// The command palette's search data; filtering happens in the browser
export async function getSearchData(): Promise<GetSearchDataResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  try {
    const [items, collections] = await Promise.all([
      getSearchItems(userId),
      getSearchCollections(userId),
    ]);
    return { success: true, data: { items, collections } };
  } catch (error) {
    console.error("Loading search data failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
