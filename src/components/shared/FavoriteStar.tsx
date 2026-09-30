import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Turns a favorite toggle button yellow while it's on
export const FAVORITE_BUTTON_CLASS = "text-yellow-400 hover:text-yellow-400";

interface FavoriteStarProps {
  // Yellow and filled when true; a plain outline star otherwise (e.g. in a toggle that's off)
  filled?: boolean;
  className?: string;
}

export function FavoriteStar({ filled = true, className }: FavoriteStarProps) {
  return <Star className={cn(filled && "fill-yellow-400 text-yellow-400", className)} />;
}
