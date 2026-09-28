"use server";

import { z } from "zod";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import {
  createCollectionSchema,
  type CreateCollectionInput,
} from "@/lib/validations/collections";
import type { CollectionSummary } from "@/types/collections";

export type CreateCollectionFieldErrors = Partial<Record<keyof CreateCollectionInput, string>>;

export interface CreateCollectionResult {
  success: boolean;
  data?: CollectionSummary;
  error?: string;
  fieldErrors?: CreateCollectionFieldErrors;
}

// Keeps the first error message for each field
function toFieldErrors(error: z.ZodError): CreateCollectionFieldErrors {
  const { fieldErrors } = z.flattenError(error) as {
    fieldErrors: Partial<Record<keyof CreateCollectionInput, string[]>>;
  };
  return {
    name: fieldErrors.name?.[0],
    description: fieldErrors.description?.[0],
  };
}

export async function createCollection(
  data: CreateCollectionInput
): Promise<CreateCollectionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const collection = await createCollectionQuery(userId, parsed.data);
    return { success: true, data: collection };
  } catch (error) {
    console.error("Creating collection failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
