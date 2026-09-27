"use client";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ItemDrawerActions } from "@/components/items/ItemDrawerActions";
import { ItemDetailSections, ItemDetailSkeleton } from "@/components/items/ItemDetailSections";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { ItemDetail, ItemSummary } from "@/types/items";

interface ItemDrawerProps {
  item: ItemSummary | null;
  detail: ItemDetail | null;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getCopyValue(detail: ItemDetail | null) {
  if (!detail) return null;
  return detail.contentType === "URL" ? detail.url : detail.content;
}

export function ItemDrawer({ item, detail, error, open, onOpenChange }: ItemDrawerProps) {
  const isLoading = !detail && !error;

  // The card's summary renders the header instantly while the full item loads
  const current = detail ?? item;
  const Icon = current ? ITEM_TYPE_ICONS[current.type.icon] : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl">
        {current && (
          <>
            <header className="flex items-start gap-4 p-6 pr-12">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                {Icon && (
                  <Icon className={cn("size-6", ITEM_TYPE_TEXT_COLORS[current.type.slug])} />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <SheetTitle className="text-xl font-semibold">{current.title}</SheetTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{current.type.name}s</Badge>
                  {detail?.language && <Badge variant="outline">{detail.language}</Badge>}
                </div>
              </div>
            </header>

            <ItemDrawerActions
              isFavorite={current.isFavorite}
              isPinned={current.isPinned}
              copyValue={getCopyValue(detail)}
            />

            <div className="scrollbar-none flex-1 overflow-y-auto p-6">
              {isLoading && <ItemDetailSkeleton />}
              {error && <p className="text-destructive">{error}</p>}
              {detail && <ItemDetailSections item={detail} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
