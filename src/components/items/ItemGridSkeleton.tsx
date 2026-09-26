import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_COUNT = 6;

export function ItemGridSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading items">
      <Skeleton className="mb-4 h-5 w-20" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
          <Skeleton key={i} className="h-[98px] rounded-xl" />
        ))}
      </div>
    </section>
  );
}
