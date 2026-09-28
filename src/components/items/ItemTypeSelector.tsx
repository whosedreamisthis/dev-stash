"use client";

import { ItemFormField } from "@/components/items/ItemFormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_TYPE_LABELS } from "@/lib/item-fields";
import { ITEM_TYPE_SLUG_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { CREATABLE_TYPE_SLUGS, type CreatableTypeSlug } from "@/lib/validations/items";

function TypeOption({ slug }: { slug: CreatableTypeSlug }) {
  const Icon = ITEM_TYPE_SLUG_ICONS[slug];
  return (
    <>
      <Icon className={ITEM_TYPE_TEXT_COLORS[slug]} />
      {ITEM_TYPE_LABELS[slug]}
    </>
  );
}

interface ItemTypeSelectorProps {
  id: string;
  value: CreatableTypeSlug;
  onChange: (value: CreatableTypeSlug) => void;
}

export function ItemTypeSelector({ id, value, onChange }: ItemTypeSelectorProps) {
  return (
    <ItemFormField id={id} label="Type">
      {(props) => (
        <Select
          value={value}
          // The value is never cleared, so null can be ignored
          onValueChange={(next) => next && onChange(next)}
        >
          <SelectTrigger {...props} className="w-full">
            <SelectValue>
              {(slug: CreatableTypeSlug) => <TypeOption slug={slug} />}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CREATABLE_TYPE_SLUGS.map((slug) => (
              <SelectItem key={slug} value={slug}>
                <TypeOption slug={slug} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </ItemFormField>
  );
}
