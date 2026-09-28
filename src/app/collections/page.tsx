import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { CollectionsHeader } from "@/components/collections/CollectionsHeader";
import { getCollections } from "@/lib/db/collections";
import { COLLECTION_GRID_CLASS } from "@/lib/item-grid";

export default async function CollectionsPage() {
  // Render per request so the list reflects the current database state
  await connection();

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/collections");

  const collections = await getCollections(userId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <CollectionsHeader />
      {collections.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No collections yet. Create one to group related items.
        </p>
      ) : (
        <section>
          <p className="mb-4 text-muted-foreground">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
          <div className={COLLECTION_GRID_CLASS}>
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
