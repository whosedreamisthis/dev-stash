import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { CollectionsHeader } from "@/components/collections/CollectionsHeader";
import { Pagination } from "@/components/shared/Pagination";
import { getCollections } from "@/lib/db/collections";
import { COLLECTION_GRID_CLASS } from "@/lib/item-grid";
import { parsePage } from "@/lib/pagination";

export default async function CollectionsPage({ searchParams }: PageProps<"/collections">) {
  // Render per request so the list reflects the current database state
  await connection();

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/sign-in?callbackUrl=/collections");

  const page = parsePage((await searchParams).page);
  const result = await getCollections(userId, page);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <CollectionsHeader />
      {result.total === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No collections yet. Create one to group related items.
        </p>
      ) : (
        <section>
          {/* The section's heading, so card titles (h3) don't skip a level */}
          <h2 className="mb-4 font-normal text-muted-foreground">
            {result.total} {result.total === 1 ? "collection" : "collections"}
          </h2>
          <div className={COLLECTION_GRID_CLASS}>
            {result.items.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
          <Pagination basePath="/collections" page={result.page} totalPages={result.totalPages} />
        </section>
      )}
    </div>
  );
}
