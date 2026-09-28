"use client";

import { useParams } from "next/navigation";
import { CollectionHeader } from "@/components/collections/CollectionHeader";
import { ItemGridSkeleton } from "@/components/items/ItemGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getRememberedCollection } from "@/lib/collection-preview";

// Shown instantly on navigation. The clicked card or sidebar link remembered the
// collection, so its name and description show while the items load; a direct
// visit falls back to a skeleton header.
export default function CollectionLoading() {
  const { id } = useParams<{ id: string }>();
  const collection = getRememberedCollection(id);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      {collection ? (
        <CollectionHeader collection={collection} />
      ) : (
        <header className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </header>
      )}
      <ItemGridSkeleton />
    </div>
  );
}
