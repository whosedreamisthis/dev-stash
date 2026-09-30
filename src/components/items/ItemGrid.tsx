import { ItemCard } from "@/components/dashboard/ItemCard";
import { FileListRow } from "@/components/items/FileListRow";
import { ImageThumbnailCard } from "@/components/items/ImageThumbnailCard";
import { Pagination } from "@/components/shared/Pagination";
import { getItemsByType } from "@/lib/db/items";
import { ITEM_LAYOUT_CLASSES, getItemLayout } from "@/lib/item-grid";
import type { ItemSummary } from "@/types/items";

interface ItemGridProps {
  userId: string;
  itemTypeId: string;
  typeName: string;
  typeSlug: string;
  page: number;
}

function renderItems(items: ItemSummary[], typeSlug: string) {
  const layout = getItemLayout(typeSlug);
  const className = ITEM_LAYOUT_CLASSES[layout];

  if (layout === "list") {
    return (
      <ul className={className}>
        {items.map((item) => (
          <FileListRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  const Card = layout === "gallery" ? ImageThumbnailCard : ItemCard;
  return (
    <div className={className}>
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </div>
  );
}

export async function ItemGrid({
  userId,
  itemTypeId,
  typeName,
  typeSlug,
  page,
}: ItemGridProps) {
  const result = await getItemsByType(userId, itemTypeId, page);

  if (result.total === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No {typeName.toLowerCase()}s yet.
      </p>
    );
  }

  return (
    <section>
      {/* The section's heading, so card titles (h3) don't skip a level */}
      <h2 className="mb-4 font-normal text-muted-foreground">
        {result.total} {result.total === 1 ? "item" : "items"}
      </h2>
      {renderItems(result.items, typeSlug)}
      <Pagination
        basePath={`/items/${typeSlug}`}
        page={result.page}
        totalPages={result.totalPages}
      />
    </section>
  );
}
