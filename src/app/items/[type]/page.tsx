import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { ItemGrid } from "@/components/items/ItemGrid";
import { ItemGridSkeleton } from "@/components/items/ItemGridSkeleton";
import { ItemsHeader } from "@/components/items/ItemsHeader";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { getItemTypeBySlug } from "@/lib/db/items";
import { getItemLayout } from "@/lib/item-grid";
import { isCreatableTypeSlug } from "@/lib/validations/items";

export default async function ItemsByTypePage({
  params,
}: PageProps<"/items/[type]">) {
  // Render per request so the list reflects the current database state
  await connection();

  const { type: slug } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/sign-in?callbackUrl=/items/${encodeURIComponent(slug)}`);

  const type = await getItemTypeBySlug(userId, slug);
  if (!type) notFound();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <ItemsHeader
        title={`${type.name}s`}
        slug={type.slug}
        icon={type.icon}
        action={isCreatableTypeSlug(type.slug) && <NewItemDialog defaultType={type.slug} />}
      />
      <Suspense fallback={<ItemGridSkeleton layout={getItemLayout(type.slug)} />}>
        <ItemGrid
          userId={userId}
          itemTypeId={type.id}
          typeName={type.name}
          typeSlug={type.slug}
        />
      </Suspense>
    </div>
  );
}
