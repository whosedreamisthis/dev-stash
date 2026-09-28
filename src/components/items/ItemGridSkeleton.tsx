import { Skeleton } from "@/components/ui/skeleton";
import { ITEM_GALLERY_GRID_CLASS, ITEM_LIST_GRID_CLASS } from "@/lib/item-grid";

const PLACEHOLDER_COUNT = 6;

interface ItemGridSkeletonProps {
  // Thumbnail placeholders for gallery types such as images
  gallery?: boolean;
}

function GalleryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="aspect-video rounded-none" />
      <div className="px-4 py-3">
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ gallery = false }: ItemGridSkeletonProps) {
  return (
    <section aria-busy="true" aria-label="Loading items">
      <Skeleton className="mb-4 h-5 w-20" />
      <div className={gallery ? ITEM_GALLERY_GRID_CLASS : ITEM_LIST_GRID_CLASS}>
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) =>
          gallery ? (
            <GalleryCardSkeleton key={i} />
          ) : (
            <Skeleton key={i} className="h-[98px] rounded-xl" />
          )
        )}
      </div>
    </section>
  );
}
