"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_LABELS, type ItemSort } from "@/lib/favorites-sort";

interface FavoritesSortSelectProps<T extends ItemSort> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

export function FavoritesSortSelect<T extends ItemSort>({
  label,
  options,
  value,
  onChange,
}: FavoritesSortSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger size="sm" aria-label={label} className="w-24 font-sans normal-case">
        <SelectValue>{(selected: T) => SORT_LABELS[selected]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
