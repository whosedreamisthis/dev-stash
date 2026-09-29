"use server";

import { z } from "zod";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  setCollectionFavorite as setCollectionFavoriteQuery,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import { setFavoriteSchema } from "@/lib/validations/favorites";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from "@/lib/validations/collections";
import type { CollectionOption, CollectionSummary } from "@/types/collections";

export type CreateCollectionFieldErrors = Partial<Record<keyof CreateCollectionInput, string>>;
export type UpdateCollectionFieldErrors = Partial<Record<keyof UpdateCollectionInput, string>>;

export interface CreateCollectionResult {
  success: boolean;
  data?: CollectionSummary;
  error?: string;
  fieldErrors?: CreateCollectionFieldErrors;
}

export interface UpdateCollectionResult {
  success: boolean;
  data?: CollectionSummary;
  error?: string;
  fieldErrors?: UpdateCollectionFieldErrors;
}

// Keeps the first error message for each field
function toFieldErrors(
  error: z.ZodError
): Partial<Record<keyof CreateCollectionInput, string>> {
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

export async function updateCollection(
  collectionId: string,
  data: UpdateCollectionInput
): Promise<UpdateCollectionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = updateCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const collection = await updateCollectionQuery(userId, collectionId, parsed.data);
    if (!collection) return { success: false, error: "Collection not found." };
    return { success: true, data: collection };
  } catch (error) {
    console.error("Updating collection failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export interface GetCollectionOptionsResult {
  success: boolean;
  data?: CollectionOption[];
  error?: string;
}

// The user's collections for the item forms' collection picker
export async function getCollectionOptions(): Promise<GetCollectionOptionsResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  try {
    return { success: true, data: await getCollectionOptionsQuery(userId) };
  } catch (error) {
    console.error("Loading collection options failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export interface SetCollectionFavoriteResult {
  success: boolean;
  data?: { id: string; isFavorite: boolean };
  error?: string;
}

export async function setCollectionFavorite(
  collectionId: string,
  isFavorite: boolean
): Promise<SetCollectionFavoriteResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = setFavoriteSchema.safeParse({ id: collectionId, isFavorite });
  if (!parsed.success) return { success: false, error: "Collection not found." };

  try {
    const updated = await setCollectionFavoriteQuery(
      userId,
      parsed.data.id,
      parsed.data.isFavorite
    );
    if (!updated) return { success: false, error: "Collection not found." };
    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("Updating collection favorite failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const collectionIdSchema = z.string().trim().min(1);

export interface DeleteCollectionResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export async function deleteCollection(collectionId: string): Promise<DeleteCollectionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = collectionIdSchema.safeParse(collectionId);
  if (!parsed.success) return { success: false, error: "Collection not found." };

  try {
    const deleted = await deleteCollectionQuery(userId, parsed.data);
    if (!deleted) return { success: false, error: "Collection not found." };
    return { success: true, data: { id: parsed.data } };
  } catch (error) {
    console.error("Deleting collection failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
