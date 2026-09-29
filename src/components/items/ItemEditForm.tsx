"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { updateItem, type UpdateItemFieldErrors } from "@/actions/items";
import { CollectionSelector } from "@/components/collections/CollectionSelector";
import { CodeEditor } from "@/components/items/CodeEditor";
import { ItemMetaSections } from "@/components/items/ItemDetailSections";
import { ItemDrawerHeader } from "@/components/items/ItemDrawerHeader";
import { ItemFormField as EditField } from "@/components/items/ItemFormField";
import { LanguageSelector } from "@/components/items/LanguageSelector";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { TagSuggestions } from "@/components/items/TagSuggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getItemFields, toItemPayload, type ItemFormValues } from "@/lib/item-fields";
import { addTagToInput, MARKDOWN_TYPE_SLUGS } from "@/lib/validations/items";
import type { ItemDetail } from "@/types/items";

function toFormValues(item: ItemDetail): ItemFormValues {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
    tags: item.tags.join(", "),
  };
}

interface ItemEditFormProps {
  item: ItemDetail;
  onCancel: () => void;
  onSaved: (item: ItemDetail) => void;
}

export function ItemEditForm({ item, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(() => toFormValues(item));
  const [collectionIds, setCollectionIds] = useState(() =>
    item.collections.map((collection) => collection.id)
  );
  const [fieldErrors, setFieldErrors] = useState<UpdateItemFieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const fields = getItemFields(item.type.slug);
  const isMarkdown = MARKDOWN_TYPE_SLUGS.has(item.type.slug);

  function setValue(field: keyof ItemFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateItem(item.id, {
        ...toItemPayload(values, fields),
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
              onChange={setValue("title")}
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
        <EditField id="item-description" label="Description" error={fieldErrors.description}>
          {(props) => (
            <Textarea {...props} value={values.description} onChange={setValue("description")} />
          )}
        </EditField>
        {fields.language && (
          <LanguageSelector
            id="item-language"
            value={values.language}
            onChange={(language) => setValues((prev) => ({ ...prev, language }))}
            error={fieldErrors.language}
          />
        )}
        {fields.content && (
          <EditField id="item-content" label="Content" error={fieldErrors.content}>
            {(props) =>
              fields.language ? (
                <CodeEditor
                  value={values.content}
                  language={values.language}
                  onChange={(content) => setValues((prev) => ({ ...prev, content }))}
                  ariaLabel="Content"
                  invalid={props["aria-invalid"]}
                />
              ) : isMarkdown ? (
                <MarkdownEditor
                  id={props.id}
                  value={values.content}
                  onChange={(content) => setValues((prev) => ({ ...prev, content }))}
                  ariaLabel="Content"
                  invalid={props["aria-invalid"]}
                  aria-describedby={props["aria-describedby"]}
                />
              ) : (
                <Textarea
                  {...props}
                  value={values.content}
                  onChange={setValue("content")}
                  className="min-h-48 font-mono"
                />
              )
            }
          </EditField>
        )}
        {fields.url && (
          <EditField id="item-url" label="URL" error={fieldErrors.url}>
            {(props) => (
              <Input {...props} type="url" value={values.url} onChange={setValue("url")} />
            )}
          </EditField>
        )}
        <EditField id="item-tags" label="Tags" error={fieldErrors.tags}>
          {(props) => (
            <TagSuggestions
              title={values.title}
              content={values.content}
              typeSlug={item.type.slug}
              tags={values.tags}
              onAccept={(tag) =>
                setValues((prev) => ({ ...prev, tags: addTagToInput(prev.tags, tag) }))
              }
            >
              <Input
                {...props}
                value={values.tags}
                onChange={setValue("tags")}
                placeholder="react, hooks, typescript"
              />
            </TagSuggestions>
          )}
        </EditField>
        <CollectionSelector
          id="item-collections"
          value={collectionIds}
          onChange={setCollectionIds}
          error={fieldErrors.collectionIds}
          disabled={isPending}
        />
        <ItemMetaSections item={item} />
      </div>
    </form>
  );
}
