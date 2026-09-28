import { z } from "zod";

export const COLLECTION_LIMITS = {
  name: 100,
  description: 1_000,
} as const;

export const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(COLLECTION_LIMITS.name, `Name can be up to ${COLLECTION_LIMITS.name} characters`),
  // An empty description is saved as null
  description: z
    .string()
    .trim()
    .max(
      COLLECTION_LIMITS.description,
      `Description can be up to ${COLLECTION_LIMITS.description.toLocaleString("en-US")} characters`
    )
    .nullish()
    .transform((value) => value || null),
});

export type CreateCollectionInput = z.input<typeof createCollectionSchema>;
export type CreateCollectionData = z.output<typeof createCollectionSchema>;
