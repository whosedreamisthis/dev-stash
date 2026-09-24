import type { LucideIcon } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
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
      <h2 className="mb-4 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
