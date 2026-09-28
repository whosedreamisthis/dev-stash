import { Skeleton } from "@/components/ui/skeleton";
import { ITEM_LAYOUT_CLASSES, type ItemLayout } from "@/lib/item-grid";

const PLACEHOLDER_COUNT = 6;

interface ItemGridSkeletonProps {
  // Matches the placeholders to the type's layout, e.g. thumbnails for images
  layout?: ItemLayout;
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

function FileRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-7 w-9 shrink-0 sm:w-24" />
    </div>
  );
}

function PlaceholderItem({ layout }: { layout: ItemLayout }) {
  if (layout === "gallery") return <GalleryCardSkeleton />;
  if (layout === "list") return <FileRowSkeleton />;
  return <Skeleton className="h-[98px] rounded-xl" />;
}

export function ItemGridSkeleton({ layout = "cards" }: ItemGridSkeletonProps) {
  return (
    <section aria-busy="true" aria-label="Loading items">
      <Skeleton className="mb-4 h-5 w-20" />
      <div className={ITEM_LAYOUT_CLASSES[layout]}>
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
          <PlaceholderItem key={i} layout={layout} />
        ))}
      </div>
    </section>
  );
}
