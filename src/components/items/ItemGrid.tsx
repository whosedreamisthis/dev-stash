import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageThumbnailCard } from "@/components/items/ImageThumbnailCard";
import { getItemsByType } from "@/lib/db/items";
import {
  ITEM_GALLERY_GRID_CLASS,
  ITEM_LIST_GRID_CLASS,
  isGalleryTypeSlug,
} from "@/lib/item-grid";

interface ItemGridProps {
  userId: string;
  itemTypeId: string;
  typeName: string;
  typeSlug: string;
}

export async function ItemGrid({ userId, itemTypeId, typeName, typeSlug }: ItemGridProps) {
  const items = await getItemsByType(userId, itemTypeId);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No {typeName.toLowerCase()}s yet.
      </p>
    );
  }

  const isGallery = isGalleryTypeSlug(typeSlug);

  return (
    <section>
      <p className="mb-4 text-muted-foreground">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>
      <div className={isGallery ? ITEM_GALLERY_GRID_CLASS : ITEM_LIST_GRID_CLASS}>
        {items.map((item) =>
          isGallery ? (
            <ImageThumbnailCard key={item.id} item={item} />
          ) : (
            <ItemCard key={item.id} item={item} />
          )
        )}
      </div>
    </section>
  );
}
