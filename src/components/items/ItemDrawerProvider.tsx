"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ItemDrawer } from "@/components/items/ItemDrawer";
import { useItemDetailCache } from "@/hooks/useItemDetailCache";
import type { ItemSummary } from "@/types/items";

interface ItemDrawerContextValue {
  openItem: (item: ItemSummary) => void;
  // Starts loading an item's detail before it is clicked (on hover or focus)
  prefetchItem: (itemId: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) throw new Error("useItemDrawer must be used inside ItemDrawerProvider");
  return context;
}

interface ItemDrawerProviderProps {
  children: React.ReactNode;
}

// Holds the drawer state for server-rendered pages, whose item cards open it on click
export function ItemDrawerProvider({ children }: ItemDrawerProviderProps) {
  const [item, setItem] = useState<ItemSummary | null>(null);
  const [open, setOpen] = useState(false);
  const { details, errors, loadItem, setDetail, removeDetail } = useItemDetailCache();

  const openItem = useCallback(
    (nextItem: ItemSummary) => {
      loadItem(nextItem.id);
      setItem(nextItem);
      setOpen(true);
    },
    [loadItem]
  );

  const value = useMemo(
    () => ({ openItem, prefetchItem: loadItem }),
    [openItem, loadItem]
  );

  return (
    <ItemDrawerContext value={value}>
      {children}
      {/* The item is kept after closing so the drawer can animate out with its content */}
      <ItemDrawer
        item={item}
        detail={item ? (details[item.id] ?? null) : null}
        error={item ? (errors[item.id] ?? null) : null}
        open={open}
        onOpenChange={setOpen}
        onSaved={setDetail}
        onDeleted={removeDetail}
      />
    </ItemDrawerContext>
  );
}
