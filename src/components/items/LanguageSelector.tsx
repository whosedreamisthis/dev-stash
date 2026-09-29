"use client";

import { ItemFormField } from "@/components/items/ItemFormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CODE_LANGUAGES, getCodeLanguageLabel, toMonacoLanguage } from "@/lib/code-editor";

interface LanguageSelectorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function LanguageSelector({ id, value, onChange, error }: LanguageSelectorProps) {
  return (
    <ItemFormField id={id} label="Language" error={error}>
      {(props) => (
        <Select
          // Older free-text values like "ts" select their Monaco language
          value={toMonacoLanguage(value)}
          // The value is never cleared, so null can be ignored
          onValueChange={(next: string | null) => next && onChange(next)}
        >
          <SelectTrigger {...props} className="w-full">
            <SelectValue>{(languageId: string) => getCodeLanguageLabel(languageId)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CODE_LANGUAGES.map((language) => (
              <SelectItem key={language.id} value={language.id}>
                {language.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </ItemFormField>
  );
}
