"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { updateItem, type UpdateItemFieldErrors } from "@/actions/items";
import { ItemMetaSections } from "@/components/items/ItemDetailSections";
import { ItemDrawerHeader } from "@/components/items/ItemDrawerHeader";
import { ItemFormField as EditField } from "@/components/items/ItemFormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LANGUAGE_TYPE_SLUGS,
  parseTagInput,
  type UpdateItemInput,
} from "@/lib/validations/items";
import type { ItemDetail } from "@/types/items";

function toFormValues(item: ItemDetail) {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
    tags: item.tags.join(", "),
  };
}

type FormValues = ReturnType<typeof toFormValues>;

// Sends only the fields that belong to the item's type
function toPayload(item: ItemDetail, values: FormValues): UpdateItemInput {
  return {
    title: values.title,
    description: values.description,
    tags: parseTagInput(values.tags),
    ...(item.contentType === "TEXT" && { content: values.content }),
    ...(LANGUAGE_TYPE_SLUGS.has(item.type.slug) && { language: values.language }),
    ...(item.contentType === "URL" && { url: values.url }),
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
  const [fieldErrors, setFieldErrors] = useState<UpdateItemFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function setValue(field: keyof FormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateItem(item.id, toPayload(item, values));
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
        {item.contentType === "TEXT" && (
          <EditField id="item-content" label="Content" error={fieldErrors.content}>
            {(props) => (
              <Textarea
                {...props}
                value={values.content}
                onChange={setValue("content")}
                className="min-h-48 font-mono"
              />
            )}
          </EditField>
        )}
        {LANGUAGE_TYPE_SLUGS.has(item.type.slug) && (
          <EditField id="item-language" label="Language" error={fieldErrors.language}>
            {(props) => (
              <Input {...props} value={values.language} onChange={setValue("language")} />
            )}
          </EditField>
        )}
        {item.contentType === "URL" && (
          <EditField id="item-url" label="URL" error={fieldErrors.url}>
            {(props) => (
              <Input {...props} type="url" value={values.url} onChange={setValue("url")} />
            )}
          </EditField>
        )}
        <EditField id="item-tags" label="Tags" error={fieldErrors.tags}>
          {(props) => (
            <Input
              {...props}
              value={values.tags}
              onChange={setValue("tags")}
              placeholder="react, hooks, typescript"
            />
          )}
        </EditField>
        <ItemMetaSections item={item} />
      </div>
    </form>
  );
}
