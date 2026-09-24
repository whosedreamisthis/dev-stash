import type { LucideIcon } from "lucide-react";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { itemTypes, type MockItem } from "@/lib/mock-data";

interface ItemListProps {
  title: string;
  icon: LucideIcon;
  items: MockItem[];
}

const typesById = new Map(itemTypes.map((type) => [type.id, type]));

export function ItemList({ title, icon: Icon, items }: ItemListProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const type = typesById.get(item.typeId);
          return type ? <ItemCard key={item.id} item={item} type={type} /> : null;
        })}
      </div>
    </section>
  );
}
