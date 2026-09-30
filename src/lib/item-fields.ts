import { isUploadTypeSlug } from "@/lib/upload-constraints";
import {
  LANGUAGE_TYPE_SLUGS,
  parseTagInput,
  type CreatableTypeSlug,
  type UpdateItemInput,
} from "@/lib/validations/items";
import type { ItemDetail } from "@/types/items";

export const ITEM_TYPE_LABELS: Record<CreatableTypeSlug, string> = {
  snippets: "Snippet",
  prompts: "Prompt",
  commands: "Command",
  notes: "Note",
  links: "Link",
  files: "File",
  images: "Image",
};

export interface ItemFormValues {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string;
}

export const EMPTY_ITEM_FORM_VALUES: ItemFormValues = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

// Missing optional fields become empty strings so the inputs stay controlled
export function toItemFormValues(
  item: Pick<ItemDetail, "title" | "description" | "content" | "language" | "url" | "tags">
): ItemFormValues {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
    tags: item.tags.join(", "),
  };
}

// Which optional fields an item type uses
export interface ItemFields {
  content: boolean;
  language: boolean;
  url: boolean;
  upload: boolean;
}

export function getItemFields(typeSlug: string): ItemFields {
  const url = typeSlug === "links";
  const upload = isUploadTypeSlug(typeSlug);
  return {
    content: !url && !upload,
    language: LANGUAGE_TYPE_SLUGS.has(typeSlug),
    url,
    upload,
  };
}

// Sends only the fields that belong to the item's type
export function toItemPayload(values: ItemFormValues, fields: ItemFields): UpdateItemInput {
  return {
    title: values.title,
    description: values.description,
    tags: parseTagInput(values.tags),
    ...(fields.content && { content: values.content }),
    ...(fields.language && { language: values.language }),
    ...(fields.url && { url: values.url }),
  };
}
