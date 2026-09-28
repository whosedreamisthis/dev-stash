import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { CollectionHeader } from "@/components/collections/CollectionHeader";
import { CollectionItems } from "@/components/collections/CollectionItems";
import { ItemGridSkeleton } from "@/components/items/ItemGridSkeleton";
import { getCollectionById } from "@/lib/db/collections";

export default async function CollectionPage({ params }: PageProps<"/collections/[id]">) {
  // Render per request so the list reflects the current database state
  await connection();

  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/sign-in?callbackUrl=/collections/${encodeURIComponent(id)}`);

  // Scoped to the session user, so another user's collection is a 404
  const collection = await getCollectionById(userId, id);
  if (!collection) notFound();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <CollectionHeader collection={collection} />

      <Suspense fallback={<ItemGridSkeleton />}>
        <CollectionItems userId={userId} collectionId={collection.id} />
      </Suspense>
    </div>
  );
}
