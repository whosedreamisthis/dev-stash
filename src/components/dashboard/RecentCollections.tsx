import Link from "next/link";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { collections, itemTypes, type MockItemType } from "@/lib/mock-data";

const RECENT_COLLECTIONS_LIMIT = 6;

const typesById = new Map(itemTypes.map((type) => [type.id, type]));

function getCollectionTypes(typeIds: string[]): MockItemType[] {
  return typeIds.flatMap((id) => typesById.get(id) ?? []);
}

export function RecentCollections() {
  const recent = collections.slice(0, RECENT_COLLECTIONS_LIMIT);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            types={getCollectionTypes(collection.typeIds)}
          />
        ))}
      </div>
    </section>
  );
}
