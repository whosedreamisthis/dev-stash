import { z } from "zod";
import { ITEM_LIMITS } from "@/lib/validations/items";

// The item as currently typed in the form, so unsaved drafts can be tagged too
export const generateAutoTagsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a title first")
    .max(ITEM_LIMITS.title, `Title can be up to ${ITEM_LIMITS.title} characters`),
  // Not trimmed so the excerpt sent to the AI keeps its indentation
  content: z.string().max(ITEM_LIMITS.content).nullish().transform((value) => value || null),
  // Only gives the AI context, so any short slug is accepted
  typeSlug: z.string().trim().min(1).max(50),
  // Tags already on the item, left out of the suggestions
  tags: z.array(z.string().trim().max(ITEM_LIMITS.tag)).max(ITEM_LIMITS.tags),
});

export type GenerateAutoTagsInput = z.input<typeof generateAutoTagsSchema>;
