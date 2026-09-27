"use client";

import { useCallback, useRef, useState } from "react";
import { fetchItemDetail, ITEM_LOAD_ERROR } from "@/lib/items-api";
import type { ItemDetail } from "@/types/items";

function without(record: Record<string, string>, key: string) {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

// Loads each item's full detail at most once, so a hover prefetch and the click
// that follows share one request. Failed loads are retried on the next call.
export function useItemDetailCache() {
  const [details, setDetails] = useState<Record<string, ItemDetail>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const requests = useRef(new Set<string>());

  const loadItem = useCallback((itemId: string) => {
    if (requests.current.has(itemId)) return;
    requests.current.add(itemId);
    setErrors((prev) => without(prev, itemId));

    fetchItemDetail(itemId)
      .then((detail) => setDetails((prev) => ({ ...prev, [itemId]: detail })))
      .catch((error: unknown) => {
        requests.current.delete(itemId);
        const message = error instanceof Error ? error.message : ITEM_LOAD_ERROR;
        setErrors((prev) => ({ ...prev, [itemId]: message }));
      });
  }, []);

  // Replaces a cached item with a fresh copy, such as the result of a save
  const setDetail = useCallback((detail: ItemDetail) => {
    requests.current.add(detail.id);
    setErrors((prev) => without(prev, detail.id));
    setDetails((prev) => ({ ...prev, [detail.id]: detail }));
  }, []);

  return { details, errors, loadItem, setDetail };
}
