"use server";

import { GENERIC_ERROR, runUserAction } from "@/lib/action-result";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  setCollectionFavorite as setCollectionFavoriteQuery,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import { toFirstFieldErrors } from "@/lib/validations/errors";
import { setFavoriteSchema } from "@/lib/validations/favorites";
import { idSchema } from "@/lib/validations/ids";
import { getSessionUser, getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { checkCollectionLimit } from "@/lib/usage-limits";
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from "@/lib/validations/collections";
import type { ActionResult } from "@/types/actions";
import type { CollectionOption, CollectionSummary } from "@/types/collections";

export type CreateCollectionFieldErrors = Partial<Record<keyof CreateCollectionInput, string>>;
export type UpdateCollectionFieldErrors = Partial<Record<keyof UpdateCollectionInput, string>>;

export interface CreateCollectionResult extends ActionResult<CollectionSummary> {
  fieldErrors?: CreateCollectionFieldErrors;
}

export interface UpdateCollectionResult extends ActionResult<CollectionSummary> {
  fieldErrors?: UpdateCollectionFieldErrors;
}

const INVALID_FIELDS_ERROR = "Please fix the highlighted fields.";
const COLLECTION_NOT_FOUND_ERROR = "Collection not found.";

export async function createCollection(
  data: CreateCollectionInput
): Promise<CreateCollectionResult> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_FIELDS_ERROR,
      fieldErrors: toFirstFieldErrors<keyof CreateCollectionInput>(parsed.error),
    };
  }

  try {
    const limitError = await checkCollectionLimit(user);
    if (limitError) return { success: false, error: limitError };

    const collection = await createCollectionQuery(user.id, parsed.data);
    return { success: true, data: collection };
  } catch (error) {
    console.error("Creating collection failed:", error);
    return { success: false, error: GENERIC_ERROR };
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
      error: INVALID_FIELDS_ERROR,
      fieldErrors: toFirstFieldErrors<keyof UpdateCollectionInput>(parsed.error),
    };
  }

  try {
    const collection = await updateCollectionQuery(userId, collectionId, parsed.data);
    if (!collection) return { success: false, error: COLLECTION_NOT_FOUND_ERROR };
    return { success: true, data: collection };
  } catch (error) {
    console.error("Updating collection failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export type GetCollectionOptionsResult = ActionResult<CollectionOption[]>;

// The user's collections for the item forms' collection picker
export async function getCollectionOptions(): Promise<GetCollectionOptionsResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  try {
    return { success: true, data: await getCollectionOptionsQuery(userId) };
  } catch (error) {
    console.error("Loading collection options failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export type SetCollectionFavoriteResult = ActionResult<{ id: string; isFavorite: boolean }>;

export async function setCollectionFavorite(
  collectionId: string,
  isFavorite: boolean
): Promise<SetCollectionFavoriteResult> {
  return runUserAction({
    schema: setFavoriteSchema,
    input: { id: collectionId, isFavorite },
    notFound: COLLECTION_NOT_FOUND_ERROR,
    logLabel: "Updating collection favorite",
    run: async (userId, data) =>
      (await setCollectionFavoriteQuery(userId, data.id, data.isFavorite)) ? data : null,
  });
}

export type DeleteCollectionResult = ActionResult<{ id: string }>;

export async function deleteCollection(collectionId: string): Promise<DeleteCollectionResult> {
  return runUserAction({
    schema: idSchema,
    input: collectionId,
    notFound: COLLECTION_NOT_FOUND_ERROR,
    logLabel: "Deleting collection",
    run: async (userId, id) => ((await deleteCollectionQuery(userId, id)) ? { id } : null),
  });
}
