"use client";

import { useEffect, useState } from "react";
import { getCollectionOptions } from "@/actions/collections";
import type { CollectionOption } from "@/types/collections";

const COLLECTIONS_LOAD_ERROR = "Couldn't load your collections. Please try again.";

// Loads the user's collections once when the form using it mounts
export function useCollectionOptions() {
  const [collections, setCollections] = useState<CollectionOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getCollectionOptions()
      .then((result) => {
        if (ignore) return;
        if (result.data) setCollections(result.data);
        else setError(result.error ?? COLLECTIONS_LOAD_ERROR);
      })
      // The action call itself failed, e.g. the network dropped
      .catch(() => {
        if (!ignore) setError(COLLECTIONS_LOAD_ERROR);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return { collections, error, isLoading: !collections && !error };
}
