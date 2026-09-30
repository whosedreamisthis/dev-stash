"use client";

import { Copy, Pencil, Pin, Trash2 } from "lucide-react";
import { setItemFavorite, toggleItemPin } from "@/actions/items";
import { FAVORITE_BUTTON_CLASS, FavoriteStar } from "@/components/shared/FavoriteStar";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { useOptimisticToggle } from "@/hooks/useOptimisticToggle";
import { cn } from "@/lib/utils";

interface ItemDrawerActionsProps {
  itemId: string;
  isFavorite: boolean;
  onFavoriteSaved: (isFavorite: boolean) => void;
  isPinned: boolean;
  onPinSaved: (isPinned: boolean) => void;
  // Text to copy; null while loading or when the item has nothing to copy
  copyValue: string | null;
  // Undefined while the item is loading, which disables the buttons
  onEdit?: () => void;
  onDelete?: () => void;
}

const PIN_ERROR = "Couldn't update the pin. Please try again.";

function pinMessage(isPinned: boolean) {
  return isPinned ? "Item pinned" : "Item unpinned";
}

export function ItemDrawerActions({
  itemId,
  isFavorite: savedIsFavorite,
  onFavoriteSaved,
  isPinned: savedIsPinned,
  onPinSaved,
  copyValue,
  onEdit,
  onDelete,
}: ItemDrawerActionsProps) {
  const { isFavorite, toggle } = useFavoriteToggle({
    isFavorite: savedIsFavorite,
    save: (next) => setItemFavorite(itemId, next),
    onSaved: onFavoriteSaved,
  });
  const { value: isPinned, toggle: togglePin } = useOptimisticToggle({
    value: savedIsPinned,
    save: (next) => toggleItemPin(itemId, next),
    onSaved: onPinSaved,
    errorMessage: PIN_ERROR,
    successMessage: pinMessage,
  });
  const { copy } = useCopyToClipboard();

  return (
    <div className="flex flex-wrap items-center gap-1 border-b px-4 py-3 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isFavorite}
        onClick={toggle}
        className={cn(isFavorite && FAVORITE_BUTTON_CLASS)}
      >
        <FavoriteStar filled={isFavorite} />
        Favorite
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isPinned}
        onClick={togglePin}
        className={cn(isPinned && "text-foreground")}
      >
        <Pin className={cn(isPinned && "fill-current")} />
        Pin
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!copyValue}
        onClick={() => copyValue && copy(copyValue)}
      >
        <Copy />
        Copy
      </Button>
      <Button variant="ghost" size="sm" className="ml-auto" disabled={!onEdit} onClick={onEdit}>
        <Pencil />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete"
        disabled={!onDelete}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
