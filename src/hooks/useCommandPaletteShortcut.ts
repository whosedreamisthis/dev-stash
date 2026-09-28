"use client";

import { useEffect, useEffectEvent } from "react";

// Calls onToggle on Cmd+K (Mac) or Ctrl+K (Windows and Linux)
export function useCommandPaletteShortcut(onToggle: () => void) {
  // Always calls the latest onToggle, so the listener is attached only once
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    // Browser autofill fires keydown events without a key
    if (event.key?.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
    // Stops the browser's own Ctrl+K, which focuses its search bar
    event.preventDefault();
    onToggle();
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
