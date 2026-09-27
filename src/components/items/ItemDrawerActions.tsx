"use client";

import { Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ItemDrawerActionsProps {
  isFavorite: boolean;
  isPinned: boolean;
  // Text to copy; null while loading or when the item has nothing to copy
  copyValue: string | null;
  // Undefined while the item is loading, which disables the buttons
  onEdit?: () => void;
  onDelete?: () => void;
}

// Favorite and pin are wired up in a later feature
function showComingSoon() {
  toast("Coming soon");
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
  isFavorite,
  isPinned,
  copyValue,
  onEdit,
  onDelete,
}: ItemDrawerActionsProps) {
  return (
    <div className="flex items-center gap-1 border-b px-6 py-3">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isFavorite}
        onClick={showComingSoon}
        className={cn(isFavorite && "text-yellow-400 hover:text-yellow-400")}
      >
        <Star className={cn(isFavorite && "fill-yellow-400")} />
        Favorite
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={isPinned}
        onClick={showComingSoon}
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
