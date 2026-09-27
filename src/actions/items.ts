"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { updateItem as updateItemQuery } from "@/lib/db/items";
import { updateItemSchema, type UpdateItemInput } from "@/lib/validations/items";
import type { ItemDetail } from "@/types/items";

export type UpdateItemFieldErrors = Partial<Record<keyof UpdateItemInput, string>>;

export interface UpdateItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
  fieldErrors?: UpdateItemFieldErrors;
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
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: {
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
        content: fieldErrors.content?.[0],
        url: fieldErrors.url?.[0],
        language: fieldErrors.language?.[0],
        tags: fieldErrors.tags?.[0],
      },
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
