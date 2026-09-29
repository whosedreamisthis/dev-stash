"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createItem, type CreateItemFieldErrors } from "@/actions/items";
import { CollectionSelector } from "@/components/collections/CollectionSelector";
import { CodeEditor } from "@/components/items/CodeEditor";
import { FileUpload } from "@/components/items/FileUpload";
import { ItemFormField } from "@/components/items/ItemFormField";
import { ItemTypeSelector } from "@/components/items/ItemTypeSelector";
import { LanguageSelector } from "@/components/items/LanguageSelector";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_ITEM_FORM_VALUES,
  ITEM_TYPE_LABELS,
  getItemFields,
  toItemPayload,
  type ItemFormValues,
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
  const [values, setValues] = useState(EMPTY_ITEM_FORM_VALUES);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<CreateItemFieldErrors>({});
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fields = getItemFields(typeSlug);
  const uploadType = isUploadTypeSlug(typeSlug) ? typeSlug : null;
  const canSubmit =
    values.title.trim() &&
    (!fields.url || values.url.trim()) &&
    (!fields.upload || uploadToken) &&
    !isUploading;

  // Editing a field clears its error so fixed fields stop showing one
  function setValue(field: keyof ItemFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  // The code and Markdown editors pass the new text instead of an event
  function setContent(content: string) {
    setValues((prev) => ({ ...prev, content }));
    setFieldErrors((prev) => ({ ...prev, content: undefined }));
  }

  function setLanguage(language: string) {
    setValues((prev) => ({ ...prev, language }));
    setFieldErrors((prev) => ({ ...prev, language: undefined }));
  }

  function handleCollectionsChange(ids: string[]) {
    setCollectionIds(ids);
    setFieldErrors((prev) => ({ ...prev, collectionIds: undefined }));
  }

  function handleUploaded(token: string | null) {
    setUploadToken(token);
    setFieldErrors((prev) => ({ ...prev, uploadToken: undefined }));
  }

  // Errors and uploads belong to the previous type, so they're cleared
  function handleTypeChange(slug: CreatableTypeSlug) {
    setTypeSlug(slug);
    setFieldErrors({});
    setUploadToken(null);
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
            <Input {...props} value={values.title} onChange={setValue("title")} required autoFocus />
          )}
        </ItemFormField>
        {fields.url && (
          <ItemFormField id="new-item-url" label="URL" error={fieldErrors.url}>
            {(props) => (
              <Input
                {...props}
                type="url"
                value={values.url}
                onChange={setValue("url")}
                placeholder="https://"
                required
              />
            )}
          </ItemFormField>
        )}
        <ItemFormField id="new-item-description" label="Description" error={fieldErrors.description}>
          {(props) => (
            <Textarea {...props} value={values.description} onChange={setValue("description")} />
          )}
        </ItemFormField>
        {uploadType && (
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
        )}
        {fields.language && (
          <LanguageSelector
            id="new-item-language"
            value={values.language}
            onChange={setLanguage}
            error={fieldErrors.language}
          />
        )}
        {fields.content && (
          <ItemFormField id="new-item-content" label="Content" error={fieldErrors.content}>
            {(props) =>
              fields.language ? (
                <CodeEditor
                  value={values.content}
                  language={values.language}
                  onChange={setContent}
                  ariaLabel="Content"
                  invalid={props["aria-invalid"]}
                />
              ) : (
                <MarkdownEditor
                  id={props.id}
                  value={values.content}
                  onChange={setContent}
                  ariaLabel="Content"
                  invalid={props["aria-invalid"]}
                  aria-describedby={props["aria-describedby"]}
                />
              )
            }
          </ItemFormField>
        )}
        <ItemFormField id="new-item-tags" label="Tags" error={fieldErrors.tags}>
          {(props) => (
            <Input
              {...props}
              value={values.tags}
              onChange={setValue("tags")}
              placeholder="react, hooks, typescript"
            />
          )}
        </ItemFormField>
        <CollectionSelector
          id="new-item-collections"
          value={collectionIds}
          onChange={handleCollectionsChange}
          error={fieldErrors.collectionIds}
          disabled={isPending}
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
