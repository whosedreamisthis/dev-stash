import { CollectionsHeader } from "@/components/collections/CollectionsHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTION_GRID_CLASS } from "@/lib/item-grid";

const PLACEHOLDER_COUNT = 6;

// Shown instantly on navigation, before the server has loaded the collections
export default function CollectionsLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <CollectionsHeader />
      <section aria-busy="true" aria-label="Loading collections">
        <Skeleton className="mb-4 h-5 w-28" />
        <div className={COLLECTION_GRID_CLASS}>
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
