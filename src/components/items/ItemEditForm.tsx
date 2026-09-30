"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { updateItem } from "@/actions/items";
import { ItemMetaSections } from "@/components/items/ItemDetailSections";
import { ItemDrawerHeader } from "@/components/items/ItemDrawerHeader";
import { ItemFormFields } from "@/components/items/ItemFormFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useItemFormValues } from "@/hooks/useItemFormValues";
import { getItemFields, toItemFormValues, toItemPayload } from "@/lib/item-fields";
import type { ItemDetail } from "@/types/items";

interface ItemEditFormProps {
  item: ItemDetail;
  onCancel: () => void;
  onSaved: (item: ItemDetail) => void;
}

export function ItemEditForm({ item, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const form = useItemFormValues(
    () => toItemFormValues(item),
    () => item.collections.map((collection) => collection.id)
  );
  const { values, collectionIds, fieldErrors, setFieldErrors, setField } = form;
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateItem(item.id, {
        ...toItemPayload(values, getItemFields(item.type.slug)),
        collectionIds,
      });
      if (!result.success || !result.data) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? "Couldn't save the item");
        return;
      }
      toast.success("Item saved");
      onSaved(result.data);
      // Refreshes the server-rendered card lists behind the drawer
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <ItemDrawerHeader
        item={item}
        language={item.language}
        titleSlot={
          <div className="flex flex-col gap-1">
            <Input
              aria-label="Title"
              autoComplete="off"
              aria-invalid={fieldErrors.title ? true : undefined}
              aria-describedby={fieldErrors.title ? "item-title-error" : undefined}
              value={values.title}
              onChange={(event) => setField("title", event.target.value)}
              required
              autoFocus
              className="h-auto py-1 text-xl font-semibold md:text-xl"
            />
            {fieldErrors.title && (
              <p id="item-title-error" className="text-xs text-destructive">
                {fieldErrors.title}
              </p>
            )}
          </div>
        }
      />

      <div className="flex items-center justify-end gap-2 border-b px-6 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          <X />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !values.title.trim()}>
          <Check />
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="scrollbar-none flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <ItemFormFields
          idPrefix="item"
          typeSlug={item.type.slug}
          form={form}
          file={{ name: item.fileName, mimeType: item.fileMimeType }}
          disabled={isPending}
        />
        <ItemMetaSections item={item} />
      </div>
    </form>
  );
}
