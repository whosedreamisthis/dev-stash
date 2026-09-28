"use client";

import { ItemFormField } from "@/components/items/ItemFormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollectionOptions } from "@/hooks/useCollectionOptions";

interface CollectionSelectorProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

// Text shown in the closed picker when nothing is selected or it can't be used
function getPlaceholder(isLoading: boolean, loadError: string | null, isEmpty: boolean) {
  if (isLoading) return "Loading collections...";
  if (loadError) return loadError;
  if (isEmpty) return "You don't have any collections yet";
  return "No collections";
}

export function CollectionSelector({
  id,
  value,
  onChange,
  error,
  disabled,
}: CollectionSelectorProps) {
  const { collections, error: loadError, isLoading } = useCollectionOptions();
  const options = collections ?? [];
  const names = new Map(options.map((collection) => [collection.id, collection.name]));
  const placeholder = getPlaceholder(isLoading, loadError, options.length === 0);

  return (
    <ItemFormField id={id} label="Collections" error={error}>
      {(props) => (
        <Select
          multiple
          value={value}
          onValueChange={(next) => onChange(next ?? [])}
          disabled={disabled || options.length === 0}
        >
          <SelectTrigger {...props} className="w-full">
            <SelectValue>
              {(selected: string[]) => {
                // IDs of collections that no longer exist are left out
                const labels = selected.flatMap((selectedId) => names.get(selectedId) ?? []);
                return labels.length ? (
                  <span className="truncate">{labels.join(", ")}</span>
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </ItemFormField>
  );
}
