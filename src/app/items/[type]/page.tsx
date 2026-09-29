import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { ProUpgradePrompt } from "@/components/billing/ProUpgradePrompt";
import { ItemGrid } from "@/components/items/ItemGrid";
import { ItemGridSkeleton } from "@/components/items/ItemGridSkeleton";
import { ItemsHeader } from "@/components/items/ItemsHeader";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { getItemTypeBySlug } from "@/lib/db/items";
import { getItemLayout } from "@/lib/item-grid";
import { parsePage } from "@/lib/pagination";
import { isUploadTypeSlug } from "@/lib/upload-constraints";
import { hasProAccess } from "@/lib/usage-limits";
import { isCreatableTypeSlug } from "@/lib/validations/items";

export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  // Render per request so the list reflects the current database state
  await connection();

  const { type: slug } = await params;
  const page = parsePage((await searchParams).page);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/sign-in?callbackUrl=/items/${encodeURIComponent(slug)}`);

  const type = await getItemTypeBySlug(userId, slug);
  if (!type) notFound();

  // The upload types (File, Image) are the Pro-only types
  if (isUploadTypeSlug(type.slug) && !hasProAccess({ isPro: session?.user?.isPro ?? false })) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <ItemsHeader title={`${type.name}s`} slug={type.slug} icon={type.icon} />
        <ProUpgradePrompt feature={`${type.name}s`} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <ItemsHeader
        title={`${type.name}s`}
        slug={type.slug}
        icon={type.icon}
        action={isCreatableTypeSlug(type.slug) && <NewItemDialog defaultType={type.slug} />}
      />
      {/* Keyed by page so the skeleton shows while another page loads */}
      <Suspense key={page} fallback={<ItemGridSkeleton layout={getItemLayout(type.slug)} />}>
        <ItemGrid
          userId={userId}
          itemTypeId={type.id}
          typeName={type.name}
          typeSlug={type.slug}
          page={page}
        />
      </Suspense>
    </div>
  );
}
