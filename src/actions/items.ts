"use server";

import { GENERIC_ERROR, runUserAction } from "@/lib/action-result";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemDetail,
  setItemFavorite as setItemFavoriteQuery,
  setItemPinned as setItemPinnedQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { toFirstFieldErrors } from "@/lib/validations/errors";
import { setFavoriteSchema } from "@/lib/validations/favorites";
import { idSchema } from "@/lib/validations/ids";
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
import type { ActionResult } from "@/types/actions";
import type { ItemDetail } from "@/types/items";

export type UpdateItemFieldErrors = Partial<Record<keyof UpdateItemInput, string>>;
export type CreateItemFieldErrors = Partial<Record<keyof CreateItemInput, string>>;

export interface UpdateItemResult extends ActionResult<ItemDetail> {
  fieldErrors?: UpdateItemFieldErrors;
}

export interface CreateItemResult extends ActionResult<ItemDetail> {
  fieldErrors?: CreateItemFieldErrors;
}

const INVALID_FIELDS_ERROR = "Please fix the highlighted fields.";
const UPLOAD_EXPIRED_ERROR = "The upload has expired. Please upload the file again.";
const ITEM_NOT_FOUND_ERROR = "Item not found.";

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
      fieldErrors: toFirstFieldErrors<keyof CreateItemInput>(parsed.error),
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
    return { success: false, error: GENERIC_ERROR };
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
      fieldErrors: toFirstFieldErrors<keyof UpdateItemInput>(parsed.error),
    };
  }

  try {
    const item = await updateItemQuery(userId, itemId, parsed.data);
    if (!item) return { success: false, error: ITEM_NOT_FOUND_ERROR };
    return { success: true, data: item };
  } catch (error) {
    console.error("Updating item failed:", error);
    return { success: false, error: GENERIC_ERROR };
  }
}

export type GetItemResult = ActionResult<ItemDetail>;

// The item drawer's full detail; another user's item is reported as missing
export async function getItem(itemId: string): Promise<GetItemResult> {
  return runUserAction({
    schema: idSchema,
    input: itemId,
    notFound: ITEM_NOT_FOUND_ERROR,
    logLabel: "Loading item",
    run: (userId, id) => getItemDetail(userId, id),
  });
}

export type SetItemFavoriteResult = ActionResult<{ id: string; isFavorite: boolean }>;

export async function setItemFavorite(
  itemId: string,
  isFavorite: boolean
): Promise<SetItemFavoriteResult> {
  return runUserAction({
    schema: setFavoriteSchema,
    input: { id: itemId, isFavorite },
    notFound: ITEM_NOT_FOUND_ERROR,
    logLabel: "Updating item favorite",
    run: async (userId, data) =>
      (await setItemFavoriteQuery(userId, data.id, data.isFavorite)) ? data : null,
  });
}

export type ToggleItemPinResult = ActionResult<{ id: string; isPinned: boolean }>;

// Takes the new state from the client's toggle instead of flipping the stored one
export async function toggleItemPin(
  itemId: string,
  isPinned: boolean
): Promise<ToggleItemPinResult> {
  return runUserAction({
    schema: setPinSchema,
    input: { id: itemId, isPinned },
    notFound: ITEM_NOT_FOUND_ERROR,
    logLabel: "Updating item pin",
    run: async (userId, data) =>
      (await setItemPinnedQuery(userId, data.id, data.isPinned)) ? data : null,
  });
}

export type DeleteItemResult = ActionResult<{ id: string }>;

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  return runUserAction({
    schema: idSchema,
    input: itemId,
    notFound: ITEM_NOT_FOUND_ERROR,
    logLabel: "Deleting item",
    run: async (userId, id) => {
      const deleted = await deleteItemQuery(userId, id);
      if (!deleted) return null;
      if (deleted.fileKey) await deleteUploadedFile(deleted.fileKey);
      return { id };
    },
  });
}
