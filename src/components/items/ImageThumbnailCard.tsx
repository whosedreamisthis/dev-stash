"use client";

import { useState } from "react";
import { Image as ImageIcon, Pin } from "lucide-react";
import { ItemFavoriteButton } from "@/components/items/ItemFavoriteButton";
import { ItemOpenOverlay } from "@/components/items/ItemOpenOverlay";
import { ITEM_TYPE_BORDER_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types/items";

interface ImageThumbnailCardProps {
  item: ItemSummary;
}

export function ImageThumbnailCard({ item }: ImageThumbnailCardProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/40",
        ITEM_TYPE_BORDER_COLORS[item.type.slug]
      )}
    >
      <ItemOpenOverlay item={item} className="z-10 rounded-xl" />
      {/* Clips the hover zoom so the image stays inside the card */}
      <div className="aspect-video overflow-hidden bg-muted">
        {hasError ? (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
        ) : (
          // Served by the app's download proxy, which next/image can't optimize
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/items/${encodeURIComponent(item.id)}/file`}
            alt=""
            loading="lazy"
            onError={() => setHasError(true)}
            // Anchored to the top, where screenshots usually have the useful part
            className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-3">
        <h3 className="truncate font-medium">{item.title}</h3>
        {item.isPinned && <Pin className="size-4 shrink-0 text-muted-foreground" />}
        {/* Above the card's button so clicking it doesn't open the drawer */}
        <ItemFavoriteButton item={item} className="relative z-20 ml-auto shrink-0" />
      </div>
    </article>
  );
}
