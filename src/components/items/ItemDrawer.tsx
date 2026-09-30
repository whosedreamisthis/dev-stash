"use client";

import { useRef, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { ItemDrawerActions } from "@/components/items/ItemDrawerActions";
import { ItemDrawerHeader } from "@/components/items/ItemDrawerHeader";
import { ItemDetailSections } from "@/components/items/ItemDetailSections";
import { ItemDetailSkeleton } from "@/components/items/ItemDetailSkeleton";
import { ItemEditForm } from "@/components/items/ItemEditForm";
import type { ItemDetail, ItemSummary } from "@/types/items";

interface ItemDrawerProps {
  item: ItemSummary | null;
  detail: ItemDetail | null;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: ItemDetail) => void;
  onFavoriteSaved: (itemId: string, isFavorite: boolean) => void;
  onPinSaved: (itemId: string, isPinned: boolean) => void;
  onDeleted: (itemId: string) => void;
}

export function ItemDrawer({
  item,
  detail,
  error,
  open,
  onOpenChange,
  onSaved,
  onFavoriteSaved,
  onPinSaved,
  onDeleted,
}: ItemDrawerProps) {
  // Tracks the edited item's ID so opening another item starts in view mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  // A deleted item leaves the cache as the drawer closes, so no skeleton flashes
  const isLoading = open && !detail && !error;
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

  function handleDeleted(itemId: string) {
    setIsDeleteOpen(false);
    handleOpenChange(false);
    onDeleted(itemId);
  }

  // The card's summary renders the header instantly while the full item loads
  const current = detail ?? item;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        ref={popupRef}
        // Focuses the panel, not the first button, so Enter doesn't toggle Favorite
        initialFocus={popupRef}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
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
                  // Keyed so opening another item resets the favorite and pin toggles' state
                  key={current.id}
                  itemId={current.id}
                  isFavorite={current.isFavorite}
                  onFavoriteSaved={(isFavorite) => onFavoriteSaved(current.id, isFavorite)}
                  isPinned={current.isPinned}
                  onPinSaved={(isPinned) => onPinSaved(current.id, isPinned)}
                  copyValue={detail?.copyText ?? null}
                  onEdit={detail ? () => setEditingId(detail.id) : undefined}
                  onDelete={detail ? () => setIsDeleteOpen(true) : undefined}
                />

                <div className="scrollbar-none flex-1 overflow-y-auto p-6">
                  {isLoading && <ItemDetailSkeleton />}
                  {error && <p className="text-destructive">{error}</p>}
                  {detail && <ItemDetailSections item={detail} />}
                </div>
              </>
            )}
            {detail && (
              <DeleteItemDialog
                item={detail}
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onDeleted={handleDeleted}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
