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
  // Shown on the right, e.g. the type's add button
  action?: React.ReactNode;
}

export function ItemsHeader({ title, slug, icon, action }: ItemsHeaderProps) {
  const Icon = (icon && ITEM_TYPE_ICONS[icon]) || ITEM_TYPE_SLUG_ICONS[slug];

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <Icon className={cn("size-7 shrink-0", ITEM_TYPE_TEXT_COLORS[slug])} />
        ) : (
          <Skeleton className="size-7 shrink-0" />
        )}
        <h1 className="truncate text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  );
}
