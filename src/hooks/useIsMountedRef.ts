"use client";

import { useEffect, useRef } from "react";

// Set again on remount, so Strict Mode's simulated unmount doesn't stick
export function useIsMountedRef() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}
