import { ItemCard } from "@/components/dashboard/ItemCard";
import { getItemsByCollection } from "@/lib/db/items";
import { ITEM_LAYOUT_CLASSES } from "@/lib/item-grid";

interface CollectionItemsProps {
  userId: string;
  collectionId: string;
}

// Streamed in after the collection's header, so the name shows while items load
export async function CollectionItems({ userId, collectionId }: CollectionItemsProps) {
  const items = await getItemsByCollection(userId, collectionId);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No items in this collection yet.
      </p>
    );
  }

  return (
    <section>
      <p className="mb-4 text-muted-foreground">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>
      <div className={ITEM_LAYOUT_CLASSES.cards}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
