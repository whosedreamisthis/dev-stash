"use client";

import { useHasProAccess } from "@/components/billing/PlanContext";
import { ItemFormField } from "@/components/items/ItemFormField";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_TYPE_LABELS } from "@/lib/item-fields";
import { ITEM_TYPE_SLUG_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { isUploadTypeSlug } from "@/lib/upload-constraints";
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
  const hasProAccess = useHasProAccess();

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
            {CREATABLE_TYPE_SLUGS.map((slug) => {
              // The upload types (File, Image) are the Pro-only types
              const locked = !hasProAccess && isUploadTypeSlug(slug);
              return (
                <SelectItem key={slug} value={slug} disabled={locked}>
                  <TypeOption slug={slug} />
                  {locked && (
                    <Badge variant="secondary" className="ml-auto">
                      PRO
                    </Badge>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </ItemFormField>
  );
}
