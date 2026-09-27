"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import {
  createItemSchema,
  updateItemSchema,
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
  };
}

export async function createItem(data: CreateItemInput): Promise<CreateItemResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in." };

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: INVALID_FIELDS_ERROR,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  try {
    const item = await createItemQuery(userId, parsed.data);
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in." };

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

export interface DeleteItemResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "You must be signed in." };

  const parsed = itemIdSchema.safeParse(itemId);
  if (!parsed.success) return { success: false, error: "Item not found." };

  try {
    const deleted = await deleteItemQuery(userId, parsed.data);
    if (!deleted) return { success: false, error: "Item not found." };
    return { success: true, data: { id: parsed.data } };
  } catch (error) {
    console.error("Deleting item failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
