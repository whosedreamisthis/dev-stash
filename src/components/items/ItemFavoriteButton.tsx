"use client";

import { setItemFavorite } from "@/actions/items";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { FAVORITE_BUTTON_CLASS, FavoriteStar } from "@/components/shared/FavoriteStar";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types/items";

interface ItemFavoriteButtonProps {
  item: ItemSummary;
  className?: string;
}

// Star icon button for item cards; sits above the card's click target
export function ItemFavoriteButton({ item, className }: ItemFavoriteButtonProps) {
  const { setFavorite } = useItemDrawer();
  const { isFavorite, toggle } = useFavoriteToggle({
    isFavorite: item.isFavorite,
    save: (next) => setItemFavorite(item.id, next),
    onSaved: (next) => setFavorite(item.id, next),
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-pressed={isFavorite}
      aria-label={`${isFavorite ? "Unfavorite" : "Favorite"} ${item.title}`}
      onClick={(event) => {
        // Keeps the click from reaching the card it sits on
        event.stopPropagation();
        toggle();
      }}
      className={cn(
        isFavorite ? FAVORITE_BUTTON_CLASS : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <FavoriteStar filled={isFavorite} />
    </Button>
  );
}
