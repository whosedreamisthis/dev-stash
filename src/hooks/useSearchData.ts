"use client";

import { useEffect, useRef, useState } from "react";
import { getSearchData } from "@/actions/search";
import type { SearchData } from "@/types/search";

const SEARCH_LOAD_ERROR = "Couldn't load search results. Please try again.";

// Loads the palette's search data when the app loads, then again each time the
// palette opens so new or edited items show up; the last data stays visible meanwhile
export function useSearchData(open: boolean) {
  const [data, setData] = useState<SearchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Closing the palette doesn't need a reload
    if (hasLoaded.current && !open) return;
    hasLoaded.current = true;

    getSearchData()
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error ?? SEARCH_LOAD_ERROR);
        }
      })
      .catch(() => setError(SEARCH_LOAD_ERROR));
  }, [open]);

  return { data, error };
}
