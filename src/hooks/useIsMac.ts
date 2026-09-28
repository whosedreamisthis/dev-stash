"use client";

import { useSyncExternalStore } from "react";
import { isMacPlatform } from "@/lib/search";

// The platform never changes, so there is nothing to subscribe to
function subscribe() {
  return () => {};
}

// False during server rendering, so the hydrated page matches before it updates
export function useIsMac(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isMacPlatform(navigator.userAgent),
    () => false
  );
}
