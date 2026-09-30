import Link from "next/link";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import type { CollectionSummary } from "@/types/collections";

interface RecentCollectionsProps {
  collections: CollectionSummary[];
}

export function RecentCollections({ collections }: RecentCollectionsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Collections</h2>
        <Link
          href="/collections"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>
      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      ) : (
        // One swipeable row on mobile, so Pinned and Recent stay near the top
        <div className="scrollbar-thin flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
          {collections.map((collection) => (
            <div key={collection.id} className="grid w-72 max-w-[85%] shrink-0 snap-start sm:w-auto sm:max-w-none">
              <CollectionCard collection={collection} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
