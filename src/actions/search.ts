"use server";

import { GENERIC_ERROR } from "@/lib/action-result";
import { getSearchCollections } from "@/lib/db/collections";
import { getSearchItems } from "@/lib/db/items";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import type { ActionResult } from "@/types/actions";
import type { SearchData } from "@/types/search";

export type GetSearchDataResult = ActionResult<SearchData>;

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
    return { success: false, error: GENERIC_ERROR };
  }
}
