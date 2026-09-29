"use client";

import { Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { setItemFavorite, toggleItemPin } from "@/actions/items";
import { Button } from "@/components/ui/button";
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

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Couldn't copy to the clipboard");
  }
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

  return (
    <div className="flex items-center gap-1 border-b px-6 py-3">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isFavorite}
        onClick={toggle}
        className={cn(isFavorite && "text-yellow-400 hover:text-yellow-400")}
      >
        <Star className={cn(isFavorite && "fill-yellow-400")} />
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
        onClick={() => copyValue && copyToClipboard(copyValue)}
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
