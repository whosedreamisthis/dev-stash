import Link from "next/link";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { COLLECTION_GRID_CLASS } from "@/lib/item-grid";
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
        <div className={COLLECTION_GRID_CLASS}>
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </section>
  );
}
