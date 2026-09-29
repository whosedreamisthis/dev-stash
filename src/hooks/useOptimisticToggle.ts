"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseOptimisticToggleOptions {
  value: boolean;
  save: (value: boolean) => Promise<{ success: boolean; error?: string }>;
  // Runs after a successful save, e.g. to update a client-side cache
  onSaved?: (value: boolean) => void;
  // Shown when the save fails without its own error message
  errorMessage: string;
  // Success toast for the new value; no toast when omitted
  successMessage?: (value: boolean) => string;
}

// Flips the value right away, saves in the background and reverts on failure.
// The page is refreshed after a save so lists, stats and the sidebar catch up.
export function useOptimisticToggle({
  value: savedValue,
  save,
  onSaved,
  errorMessage,
  successMessage,
}: UseOptimisticToggleOptions) {
  const router = useRouter();
  const [value, setValue] = useState(savedValue);
  const [synced, setSynced] = useState(savedValue);
  const [isSaving, setIsSaving] = useState(false);

  // Follows the prop when fresh data arrives, such as after the refresh
  if (savedValue !== synced) {
    setSynced(savedValue);
    setValue(savedValue);
  }

  async function toggle() {
    if (isSaving) return;
    const next = !value;
    setValue(next);
    setIsSaving(true);

    function fail(message = errorMessage) {
      setValue(!next);
      toast.error(message);
    }

    try {
      const result = await save(next);
      if (!result.success) return fail(result.error);
      if (successMessage) toast.success(successMessage(next));
      onSaved?.(next);
      router.refresh();
    } catch {
      // The action call itself failed, e.g. the network dropped
      fail();
    } finally {
      setIsSaving(false);
    }
  }

  return { value, toggle, isSaving };
}
