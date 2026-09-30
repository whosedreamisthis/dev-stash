"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createItem } from "@/actions/items";
import { FileUpload, type UploadedFileInfo } from "@/components/items/FileUpload";
import { ItemFormField } from "@/components/items/ItemFormField";
import { ItemFormFields } from "@/components/items/ItemFormFields";
import { ItemTypeSelector } from "@/components/items/ItemTypeSelector";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useItemFormValues } from "@/hooks/useItemFormValues";
import {
  EMPTY_ITEM_FORM_VALUES,
  ITEM_TYPE_LABELS,
  getItemFields,
  toItemPayload,
} from "@/lib/item-fields";
import { isUploadTypeSlug } from "@/lib/upload-constraints";
import type { CreatableTypeSlug } from "@/lib/validations/items";

interface NewItemFormProps {
  defaultType: CreatableTypeSlug;
  onCreated: () => void;
}

// Rendered inside the dialog so its state resets each time the dialog opens
export function NewItemForm({ defaultType, onCreated }: NewItemFormProps) {
  const router = useRouter();
  const [typeSlug, setTypeSlug] = useState<CreatableTypeSlug>(defaultType);
  const form = useItemFormValues(() => EMPTY_ITEM_FORM_VALUES);
  const { values, collectionIds, fieldErrors, setFieldErrors, clearError, setField } = form;
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fields = getItemFields(typeSlug);
  const uploadType = isUploadTypeSlug(typeSlug) ? typeSlug : null;
  const canSubmit =
    values.title.trim() &&
    (!fields.url || values.url.trim()) &&
    (!fields.upload || uploadToken) &&
    !isUploading;

  function handleUploaded(token: string | null, file?: UploadedFileInfo) {
    setUploadToken(token);
    setUploadedFile(file ?? null);
    clearError("uploadToken");
  }

  // Errors and uploads belong to the previous type, so they're cleared
  function handleTypeChange(slug: CreatableTypeSlug) {
    setTypeSlug(slug);
    setFieldErrors({});
    setUploadToken(null);
    setUploadedFile(null);
    setIsUploading(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createItem({
        ...toItemPayload(values, fields),
        typeSlug,
        collectionIds,
        ...(fields.upload && uploadToken && { uploadToken }),
      });
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? "Couldn't create the item");
        return;
      }
      toast.success(`${ITEM_TYPE_LABELS[typeSlug]} created`);
      onCreated();
      // Refreshes the server-rendered lists, stats and sidebar counts
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
      <ItemTypeSelector id="new-item-type" value={typeSlug} onChange={handleTypeChange} />

      <div className="scrollbar-none -mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1">
        <ItemFormField id="new-item-title" label="Title" error={fieldErrors.title}>
          {(props) => (
            <Input
              {...props}
              value={values.title}
              onChange={(event) => setField("title", event.target.value)}
              required
              autoFocus
            />
          )}
        </ItemFormField>
        <ItemFormFields
          idPrefix="new-item"
          typeSlug={typeSlug}
          form={form}
          file={uploadedFile ?? undefined}
          disabled={isPending}
          uploadSlot={
            uploadType && (
              <ItemFormField
                id="new-item-file"
                label={ITEM_TYPE_LABELS[uploadType]}
                error={fieldErrors.uploadToken}
              >
                {(props) => (
                  <FileUpload
                    // Remounts for each type so a previous upload isn't shown
                    key={uploadType}
                    id={props.id}
                    typeSlug={uploadType}
                    onUploaded={handleUploaded}
                    onUploadingChange={setIsUploading}
                    disabled={isPending}
                    invalid={props["aria-invalid"]}
                    aria-describedby={props["aria-describedby"]}
                  />
                )}
              </ItemFormField>
            )
          }
        />
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={isPending} />}>Cancel</DialogClose>
        <Button type="submit" disabled={isPending || !canSubmit}>
          {isPending ? "Creating..." : "Create item"}
        </Button>
      </DialogFooter>
    </form>
  );
}
