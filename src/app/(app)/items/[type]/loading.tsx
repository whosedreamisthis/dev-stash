"use client";

import { useParams } from "next/navigation";
import { ItemGridSkeleton } from "@/components/items/ItemGridSkeleton";
import { ItemsHeader } from "@/components/items/ItemsHeader";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { getItemLayout } from "@/lib/item-grid";
import { isCreatableTypeSlug } from "@/lib/validations/items";

// Shown instantly on navigation, before the server has looked up the type
export default function ItemsByTypeLoading() {
  const { type: slug } = useParams<{ type: string }>();
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <ItemsHeader
        title={title}
        slug={slug}
        action={isCreatableTypeSlug(slug) && <NewItemDialog defaultType={slug} />}
      />
      <ItemGridSkeleton layout={getItemLayout(slug)} />
    </div>
  );
}
