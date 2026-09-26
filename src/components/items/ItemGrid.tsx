import { ItemCard } from "@/components/dashboard/ItemCard";
import { getItemsByType } from "@/lib/db/items";

interface ItemGridProps {
  userId: string;
  itemTypeId: string;
  typeName: string;
}

export async function ItemGrid({ userId, itemTypeId, typeName }: ItemGridProps) {
  const items = await getItemsByType(userId, itemTypeId);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No {typeName.toLowerCase()}s yet.
      </p>
    );
  }

  return (
    <section>
      <p className="mb-4 text-muted-foreground">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
