"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseFavoriteToggleOptions {
  isFavorite: boolean;
  save: (isFavorite: boolean) => Promise<{ success: boolean; error?: string }>;
  // Runs after a successful save, e.g. to update a client-side cache
  onSaved?: (isFavorite: boolean) => void;
}

const SAVE_ERROR = "Couldn't update favorites. Please try again.";

// Flips the star right away, saves in the background and reverts on failure.
// The page is refreshed after a save so lists, stats and the sidebar catch up.
export function useFavoriteToggle({ isFavorite, save, onSaved }: UseFavoriteToggleOptions) {
  const router = useRouter();
  const [value, setValue] = useState(isFavorite);
  const [synced, setSynced] = useState(isFavorite);
  const [isSaving, setIsSaving] = useState(false);

  // Follows the prop when fresh data arrives, such as after the refresh
  if (isFavorite !== synced) {
    setSynced(isFavorite);
    setValue(isFavorite);
  }

  async function toggle() {
    if (isSaving) return;
    const next = !value;
    setValue(next);
    setIsSaving(true);

    function fail(message = SAVE_ERROR) {
      setValue(!next);
      toast.error(message);
    }

    try {
      const result = await save(next);
      if (!result.success) return fail(result.error);
      onSaved?.(next);
      router.refresh();
    } catch {
      // The action call itself failed, e.g. the network dropped
      fail();
    } finally {
      setIsSaving(false);
    }
  }

  return { isFavorite: value, toggle, isSaving };
}
