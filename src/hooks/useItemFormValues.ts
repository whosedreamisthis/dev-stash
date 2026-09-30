"use client";

import { useState } from "react";
import type { CreateItemFieldErrors } from "@/actions/items";
import type { ItemFormValues } from "@/lib/item-fields";
import { addTagToInput } from "@/lib/validations/items";

// Create errors cover every field the edit form has, plus the type and upload
export type ItemFormErrors = CreateItemFieldErrors;

// Values, collections and errors of the new and edit item forms.
// Editing a field clears its error so fixed fields stop showing one.
export function useItemFormValues(
  initialValues: () => ItemFormValues,
  initialCollectionIds: () => string[] = () => []
) {
  const [values, setValues] = useState(initialValues);
  const [collectionIds, setCollectionIdsState] = useState(initialCollectionIds);
  const [fieldErrors, setFieldErrors] = useState<ItemFormErrors>({});

  function clearError(field: keyof ItemFormErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setField(field: keyof ItemFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  function addTag(tag: string) {
    setValues((prev) => ({ ...prev, tags: addTagToInput(prev.tags, tag) }));
    clearError("tags");
  }

  function setCollectionIds(ids: string[]) {
    setCollectionIdsState(ids);
    clearError("collectionIds");
  }

  return {
    values,
    collectionIds,
    fieldErrors,
    setFieldErrors,
    clearError,
    setField,
    addTag,
    setCollectionIds,
  };
}

export type ItemForm = ReturnType<typeof useItemFormValues>;
