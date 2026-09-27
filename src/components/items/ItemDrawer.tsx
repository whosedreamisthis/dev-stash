"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ItemDrawerActions } from "@/components/items/ItemDrawerActions";
import { ItemDrawerHeader } from "@/components/items/ItemDrawerHeader";
import { ItemDetailSections, ItemDetailSkeleton } from "@/components/items/ItemDetailSections";
import { ItemEditForm } from "@/components/items/ItemEditForm";
import type { ItemDetail, ItemSummary } from "@/types/items";

interface ItemDrawerProps {
  item: ItemSummary | null;
  detail: ItemDetail | null;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: ItemDetail) => void;
}

function getCopyValue(detail: ItemDetail | null) {
  if (!detail) return null;
  return detail.contentType === "URL" ? detail.url : detail.content;
}

export function ItemDrawer({
  item,
  detail,
  error,
  open,
  onOpenChange,
  onSaved,
}: ItemDrawerProps) {
  // Tracks the edited item's ID so opening another item starts in view mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const isLoading = !detail && !error;
  const isEditing = detail !== null && editingId === detail.id;

  function handleOpenChange(nextOpen: boolean) {
    // Closing the drawer discards unsaved changes
    if (!nextOpen) setEditingId(null);
    onOpenChange(nextOpen);
  }

  function handleSaved(saved: ItemDetail) {
    onSaved(saved);
    setEditingId(null);
  }

  // The card's summary renders the header instantly while the full item loads
  const current = detail ?? item;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl">
        {current && (
          <>
            {/* The edit form renders its own header with the title input */}
            {isEditing && detail ? (
              <ItemEditForm
                item={detail}
                onCancel={() => setEditingId(null)}
                onSaved={handleSaved}
              />
            ) : (
              <>
                <ItemDrawerHeader item={current} language={detail?.language} />
                <ItemDrawerActions
                  isFavorite={current.isFavorite}
                  isPinned={current.isPinned}
                  copyValue={getCopyValue(detail)}
                  onEdit={detail ? () => setEditingId(detail.id) : undefined}
                />

                <div className="scrollbar-none flex-1 overflow-y-auto p-6">
                  {isLoading && <ItemDetailSkeleton />}
                  {error && <p className="text-destructive">{error}</p>}
                  {detail && <ItemDetailSections item={detail} />}
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
