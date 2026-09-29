"use server";

import { z } from "zod";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemDetail,
  setItemFavorite as setItemFavoriteQuery,
  setItemPinned as setItemPinnedQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { setFavoriteSchema } from "@/lib/validations/favorites";
import { setPinSchema } from "@/lib/validations/pins";
import { getSessionUser, getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import { isUploadTypeSlug } from "@/lib/upload-constraints";
import { checkItemLimit, hasProAccess, PRO_REQUIRED_ERROR } from "@/lib/usage-limits";
import { verifyUploadToken, type UploadedFile } from "@/lib/upload-token";
import { deleteUploadedFile } from "@/lib/uploadthing";
import {
  createItemSchema,
  updateItemSchema,
  type CreateItemData,
  type CreateItemInput,
  type UpdateItemInput,
} from "@/lib/validations/items";
import type { ItemDetail } from "@/types/items";

export type UpdateItemFieldErrors = Partial<Record<keyof UpdateItemInput, string>>;
export type CreateItemFieldErrors = Partial<Record<keyof CreateItemInput, string>>;

export interface UpdateItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
  fieldErrors?: UpdateItemFieldErrors;
}

export interface CreateItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
  fieldErrors?: CreateItemFieldErrors;
}

const INVALID_FIELDS_ERROR = "Please fix the highlighted fields.";
const UPLOAD_EXPIRED_ERROR = "The upload has expired. Please upload the file again.";

// Keeps the first error message for each field
function toFieldErrors(error: z.ZodError): CreateItemFieldErrors {
  const { fieldErrors } = z.flattenError(error) as {
    fieldErrors: Partial<Record<keyof CreateItemInput, string[]>>;
  };
  return {
    typeSlug: fieldErrors.typeSlug?.[0],
    title: fieldErrors.title?.[0],
    description: fieldErrors.description?.[0],
    content: fieldErrors.content?.[0],
    url: fieldErrors.url?.[0],
    language: fieldErrors.language?.[0],
    tags: fieldErrors.tags?.[0],
    collectionIds: fieldErrors.collectionIds?.[0],
    uploadToken: fieldErrors.uploadToken?.[0],
  };
}

// The file comes from the server-signed upload token, never from client fields
function getUploadedFile(
  userId: string,
  data: CreateItemData
): { file?: UploadedFile; error?: string } {
  if (!isUploadTypeSlug(data.typeSlug)) return { file: undefined };
  const file = data.uploadToken ? verifyUploadToken(userId, data.uploadToken) : null;
  if (!file || file.typeSlug !== data.typeSlug) return { error: UPLOAD_EXPIRED_ERROR };
  return { file };
}

export async function createItem(data: CreateItemInput): Promise<CreateItemResult> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_FIELDS_ERROR,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // The upload types (File, Image) are the Pro-only types
  if (isUploadTypeSlug(parsed.data.typeSlug) && !hasProAccess(user)) {
    return { success: false, error: PRO_REQUIRED_ERROR };
  }

  const upload = getUploadedFile(user.id, parsed.data);
  if (upload.error) {
    return {
      success: false,
      error: upload.error,
      fieldErrors: { uploadToken: upload.error },
    };
  }

  try {
    const limitError = await checkItemLimit(user);
    if (limitError) return { success: false, error: limitError };

    const item = await createItemQuery(user.id, parsed.data, upload.file);
    if (!item) return { success: false, error: "That item type isn't available." };
    return { success: true, data: item };
  } catch (error) {
    console.error("Creating item failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateItem(
  itemId: string,
  data: UpdateItemInput,
): Promise<UpdateItemResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_FIELDS_ERROR,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const item = await updateItemQuery(userId, itemId, parsed.data);
    if (!item) return { success: false, error: "Item not found." };
    return { success: true, data: item };
  } catch (error) {
    console.error("Updating item failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const itemIdSchema = z.string().trim().min(1);

export interface GetItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

// The item drawer's full detail; another user's item is reported as missing
export async function getItem(itemId: string): Promise<GetItemResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = itemIdSchema.safeParse(itemId);
  if (!parsed.success) return { success: false, error: "Item not found." };

  try {
    const item = await getItemDetail(userId, parsed.data);
    if (!item) return { success: false, error: "Item not found." };
    return { success: true, data: item };
  } catch (error) {
    console.error("Loading item failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export interface SetItemFavoriteResult {
  success: boolean;
  data?: { id: string; isFavorite: boolean };
  error?: string;
}

export async function setItemFavorite(
  itemId: string,
  isFavorite: boolean
): Promise<SetItemFavoriteResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = setFavoriteSchema.safeParse({ id: itemId, isFavorite });
  if (!parsed.success) return { success: false, error: "Item not found." };

  try {
    const updated = await setItemFavoriteQuery(userId, parsed.data.id, parsed.data.isFavorite);
    if (!updated) return { success: false, error: "Item not found." };
    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("Updating item favorite failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export interface ToggleItemPinResult {
  success: boolean;
  data?: { id: string; isPinned: boolean };
  error?: string;
}

// Takes the new state from the client's toggle instead of flipping the stored one
export async function toggleItemPin(
  itemId: string,
  isPinned: boolean
): Promise<ToggleItemPinResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = setPinSchema.safeParse({ id: itemId, isPinned });
  if (!parsed.success) return { success: false, error: "Item not found." };

  try {
    const updated = await setItemPinnedQuery(userId, parsed.data.id, parsed.data.isPinned);
    if (!updated) return { success: false, error: "Item not found." };
    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("Updating item pin failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export interface DeleteItemResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = itemIdSchema.safeParse(itemId);
  if (!parsed.success) return { success: false, error: "Item not found." };

  try {
    const deleted = await deleteItemQuery(userId, parsed.data);
    if (!deleted) return { success: false, error: "Item not found." };
    if (deleted.fileKey) await deleteUploadedFile(deleted.fileKey);
    return { success: true, data: { id: parsed.data } };
  } catch (error) {
    console.error("Deleting item failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
