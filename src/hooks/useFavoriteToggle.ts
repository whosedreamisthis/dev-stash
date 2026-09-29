"use client";

import { useOptimisticToggle } from "@/hooks/useOptimisticToggle";

interface UseFavoriteToggleOptions {
  isFavorite: boolean;
  save: (isFavorite: boolean) => Promise<{ success: boolean; error?: string }>;
  // Runs after a successful save, e.g. to update a client-side cache
  onSaved?: (isFavorite: boolean) => void;
}

const SAVE_ERROR = "Couldn't update favorites. Please try again.";

// Flips the star right away, saves in the background and reverts on failure
export function useFavoriteToggle({ isFavorite, save, onSaved }: UseFavoriteToggleOptions) {
  const { value, toggle, isSaving } = useOptimisticToggle({
    value: isFavorite,
    save,
    onSaved,
    errorMessage: SAVE_ERROR,
  });

  return { isFavorite: value, toggle, isSaving };
}
