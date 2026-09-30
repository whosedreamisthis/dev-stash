"use client";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types/items";

interface ItemOpenOverlayProps {
  item: ItemSummary;
  // Rounding, stacking and focus ring to match the card or row
  className?: string;
}

// Covers the whole card or row so a click anywhere opens the drawer.
// The parent needs `relative`; controls that shouldn't open it sit above with a z-index.
export function ItemOpenOverlay({ item, className }: ItemOpenOverlayProps) {
  const { openItem, prefetchItem } = useItemDrawer();

  return (
    <button
      type="button"
      aria-label={`Open ${item.title}`}
      onClick={() => openItem(item)}
      onPointerEnter={() => prefetchItem(item.id)}
      onFocus={() => prefetchItem(item.id)}
      className={cn(
        "absolute inset-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    />
  );
}
