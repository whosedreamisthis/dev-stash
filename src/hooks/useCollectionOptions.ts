"use client";

import { useEffect, useState } from "react";
import { COLLECTIONS_LOAD_ERROR, fetchCollectionOptions } from "@/lib/collections-api";
import type { CollectionOption } from "@/types/collections";

// Loads the user's collections once when the form using it mounts
export function useCollectionOptions() {
  const [collections, setCollections] = useState<CollectionOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchCollectionOptions()
      .then((options) => {
        if (!ignore) setCollections(options);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : COLLECTIONS_LOAD_ERROR);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return { collections, error, isLoading: !collections && !error };
}
