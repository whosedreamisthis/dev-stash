import { Badge } from "@/components/ui/badge";
import { SheetTitle } from "@/components/ui/sheet";
import { ITEM_TYPE_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types/items";

interface ItemDrawerHeaderProps {
  item: ItemSummary;
  language?: string | null;
  // Replaces the visible title, such as with an input in edit mode
  titleSlot?: React.ReactNode;
}

export function ItemDrawerHeader({ item, language, titleSlot }: ItemDrawerHeaderProps) {
  const Icon = ITEM_TYPE_ICONS[item.type.icon];

  return (
    <header className="flex items-start gap-4 p-6 pr-12">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
        {Icon && <Icon className={cn("size-6", ITEM_TYPE_TEXT_COLORS[item.type.slug])} />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* The sheet always needs a title, so it stays for screen readers in edit mode */}
        <SheetTitle className={cn("text-xl font-semibold", titleSlot && "sr-only")}>
          {item.title}
        </SheetTitle>
        {titleSlot}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{item.type.name}s</Badge>
          {language && <Badge variant="outline">{language}</Badge>}
        </div>
      </div>
    </header>
  );
}
