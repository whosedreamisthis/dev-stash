import { ItemCard } from "@/components/dashboard/ItemCard";
import { Pagination } from "@/components/shared/Pagination";
import { getItemsByCollection } from "@/lib/db/items";
import { formatItemCount } from "@/lib/format";
import { ITEM_LAYOUT_CLASSES } from "@/lib/item-grid";

interface CollectionItemsProps {
  userId: string;
  collectionId: string;
  page: number;
}

// Streamed in after the collection's header, so the name shows while items load
export async function CollectionItems({ userId, collectionId, page }: CollectionItemsProps) {
  const result = await getItemsByCollection(userId, collectionId, page);

  if (result.total === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No items in this collection yet.
      </p>
    );
  }

  return (
    <section>
      {/* The section's heading, so card titles (h3) don't skip a level */}
      <h2 className="mb-4 font-normal text-muted-foreground">
        {formatItemCount(result.total)}
      </h2>
      <div className={ITEM_LAYOUT_CLASSES.cards}>
        {result.items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      <Pagination
        basePath={`/collections/${encodeURIComponent(collectionId)}`}
        page={result.page}
        totalPages={result.totalPages}
      />
    </section>
  );
}
