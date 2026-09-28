import { z } from "zod";

// Empty inputs clear the field; undefined leaves it unchanged
function emptyToNull(value: string | null | undefined) {
  return value === "" ? null : value;
}

const optionalText = z.string().trim().nullish().transform(emptyToNull);

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalText,
  // Not trimmed so leading indentation in code is kept
  content: z.string().nullish().transform(emptyToNull),
  url: optionalText.pipe(z.httpUrl("Enter a valid http(s) URL").nullish()),
  language: optionalText,
  // Duplicates are dropped so each tag is linked once
  tags: z
    .array(z.string().trim().min(1))
    .transform((tags) => [...new Set(tags)]),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type UpdateItemData = z.output<typeof updateItemSchema>;

// File and Image need uploads, so they can't be created from the form yet
export const CREATABLE_TYPE_SLUGS = [
  "snippets",
  "prompts",
  "commands",
  "notes",
  "links",
] as const;

export type CreatableTypeSlug = (typeof CREATABLE_TYPE_SLUGS)[number];

export function isCreatableTypeSlug(slug: string): slug is CreatableTypeSlug {
  return (CREATABLE_TYPE_SLUGS as readonly string[]).includes(slug);
}

// Item types whose content is code, so a language can be set
export const LANGUAGE_TYPE_SLUGS: ReadonlySet<string> = new Set(["snippets", "commands"]);

// Item types whose content is written in Markdown
export const MARKDOWN_TYPE_SLUGS: ReadonlySet<string> = new Set(["notes", "prompts"]);

export const createItemSchema = updateItemSchema
  .extend({
    typeSlug: z.enum(CREATABLE_TYPE_SLUGS, "Choose an item type"),
  })
  .refine((data) => data.typeSlug !== "links" || data.url, {
    message: "URL is required",
    path: ["url"],
  });

export type CreateItemInput = z.input<typeof createItemSchema>;
export type CreateItemData = z.output<typeof createItemSchema>;

// Turns the comma-separated tags input into a tag list
export function parseTagInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
