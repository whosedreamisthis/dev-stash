"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface RateLimitState {
  error?: string;
  rateLimited?: boolean;
  demoOnly?: boolean;
}

// Whether the action's error is shown as a toast instead of in the form
export function isToastError(state: RateLimitState): boolean {
  return Boolean((state.rateLimited || state.demoOnly) && state.error);
}

// Shows rate limit and demo-only errors from a server action's state as a toast
export function useRateLimitToast(state: RateLimitState) {
  useEffect(() => {
    if (isToastError(state)) toast.error(state.error);
  }, [state]);
}
