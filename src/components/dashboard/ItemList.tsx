import type { LucideIcon } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ITEM_LAYOUT_CLASSES } from "@/lib/item-grid";
import type { ItemSummary } from "@/types/items";

interface ItemListProps {
  title: string;
  icon: LucideIcon;
  items: ItemSummary[];
}

export function ItemList({ title, icon: Icon, items }: ItemListProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Icon className="size-5 text-muted-foreground" />
        {title}
      </h2>
      <div className={ITEM_LAYOUT_CLASSES.cards}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
