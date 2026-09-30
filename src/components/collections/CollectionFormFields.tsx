"use client";

import { ItemFormField } from "@/components/items/ItemFormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CollectionFormValues } from "@/types/collections";

interface CollectionFormFieldsProps {
  // Prefixes each field id, e.g. "new-collection" gives "new-collection-name"
  idPrefix: string;
  values: CollectionFormValues;
  errors: Partial<Record<keyof CollectionFormValues, string>>;
  onChange: (field: keyof CollectionFormValues, value: string) => void;
}

// The name and description fields shared by the new and edit collection forms
export function CollectionFormFields({
  idPrefix,
  values,
  errors,
  onChange,
}: CollectionFormFieldsProps) {
  return (
    <>
      <ItemFormField id={`${idPrefix}-name`} label="Name" error={errors.name}>
        {(props) => (
          <Input
            {...props}
            value={values.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="React Patterns"
            required
            autoFocus
          />
        )}
      </ItemFormField>
      <ItemFormField
        id={`${idPrefix}-description`}
        label="Description"
        error={errors.description}
      >
        {(props) => (
          <Textarea
            {...props}
            value={values.description}
            onChange={(event) => onChange("description", event.target.value)}
          />
        )}
      </ItemFormField>
    </>
  );
}
