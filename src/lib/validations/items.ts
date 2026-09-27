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

// Turns the comma-separated tags input into a tag list
export function parseTagInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
