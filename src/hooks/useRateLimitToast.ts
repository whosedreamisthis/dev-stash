"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface RateLimitState {
  error?: string;
  rateLimited?: boolean;
}

// Shows rate limit errors from a server action's state as a toast
export function useRateLimitToast(state: RateLimitState) {
  useEffect(() => {
    if (state.rateLimited && state.error) toast.error(state.error);
  }, [state]);
}
