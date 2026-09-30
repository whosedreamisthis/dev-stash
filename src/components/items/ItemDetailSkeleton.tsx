import { Skeleton } from "@/components/ui/skeleton";

// Shown in the drawer while an item's details load
export function ItemDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading item">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}
