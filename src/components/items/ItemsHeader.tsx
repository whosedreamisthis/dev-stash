import { Skeleton } from "@/components/ui/skeleton";
import {
  ITEM_TYPE_ICONS,
  ITEM_TYPE_SLUG_ICONS,
  ITEM_TYPE_TEXT_COLORS,
} from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

interface ItemsHeaderProps {
  title: string;
  slug: string;
  // Lucide icon name from the database; system types fall back to their slug
  icon?: string;
}

export function ItemsHeader({ title, slug, icon }: ItemsHeaderProps) {
  const Icon = (icon && ITEM_TYPE_ICONS[icon]) || ITEM_TYPE_SLUG_ICONS[slug];

  return (
    <header className="flex items-center gap-3">
      {Icon ? (
        <Icon className={cn("size-7", ITEM_TYPE_TEXT_COLORS[slug])} />
      ) : (
        <Skeleton className="size-7" />
      )}
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    </header>
  );
}
