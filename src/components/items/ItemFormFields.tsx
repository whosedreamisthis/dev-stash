"use client";

import { CollectionSelector } from "@/components/collections/CollectionSelector";
import { CodeEditor } from "@/components/items/CodeEditor";
import { DescriptionGenerator } from "@/components/items/DescriptionGenerator";
import { ItemFormField } from "@/components/items/ItemFormField";
import { LanguageSelector } from "@/components/items/LanguageSelector";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { TagSuggestions } from "@/components/items/TagSuggestions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ItemForm } from "@/hooks/useItemFormValues";
import { getItemFields, type ItemFormValues } from "@/lib/item-fields";

interface ItemFormFieldsProps {
  // Prefixes each field id, e.g. "new-item" gives "new-item-url"
  idPrefix: string;
  typeSlug: string;
  form: ItemForm;
  // The uploaded or stored file, used to generate a description
  file?: { name?: string | null; mimeType?: string | null };
  // Rendered below the description, e.g. the file upload
  uploadSlot?: React.ReactNode;
  disabled?: boolean;
}

// The item fields shared by the new and edit forms; the title stays with each form
export function ItemFormFields({
  idPrefix,
  typeSlug,
  form,
  file,
  uploadSlot,
  disabled,
}: ItemFormFieldsProps) {
  const { values, fieldErrors, setField, addTag, collectionIds, setCollectionIds } = form;
  const fields = getItemFields(typeSlug);

  function onInput(field: keyof ItemFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(field, event.target.value);
  }

  // The code and Markdown editors pass the new text instead of an event
  function setContent(content: string) {
    setField("content", content);
  }

  return (
    <>
      {fields.url && (
        <ItemFormField id={`${idPrefix}-url`} label="URL" error={fieldErrors.url}>
          {(props) => (
            <Input
              {...props}
              type="url"
              value={values.url}
              onChange={onInput("url")}
              placeholder="https://"
              required
            />
          )}
        </ItemFormField>
      )}
      <ItemFormField
        id={`${idPrefix}-description`}
        label="Description"
        error={fieldErrors.description}
      >
        {(props) => (
          <DescriptionGenerator
            source={{
              title: values.title,
              typeSlug,
              content: fields.content ? values.content : undefined,
              language: fields.language ? values.language : undefined,
              url: fields.url ? values.url : undefined,
              fileName: file?.name,
              fileMimeType: file?.mimeType,
              tags: values.tags,
            }}
            onGenerate={(description) => setField("description", description)}
          >
            <Textarea {...props} value={values.description} onChange={onInput("description")} />
          </DescriptionGenerator>
        )}
      </ItemFormField>
      {uploadSlot}
      {fields.language && (
        <LanguageSelector
          id={`${idPrefix}-language`}
          value={values.language}
          onChange={(language) => setField("language", language)}
          error={fieldErrors.language}
        />
      )}
      {fields.content && (
        <ItemFormField id={`${idPrefix}-content`} label="Content" error={fieldErrors.content}>
          {(props) =>
            fields.language ? (
              <CodeEditor
                value={values.content}
                language={values.language}
                onChange={setContent}
                ariaLabel="Content"
                invalid={props["aria-invalid"]}
              />
            ) : (
              <MarkdownEditor
                id={props.id}
                value={values.content}
                onChange={setContent}
                ariaLabel="Content"
                invalid={props["aria-invalid"]}
                aria-describedby={props["aria-describedby"]}
              />
            )
          }
        </ItemFormField>
      )}
      <ItemFormField id={`${idPrefix}-tags`} label="Tags" error={fieldErrors.tags}>
        {(props) => (
          <TagSuggestions
            title={values.title}
            content={values.content}
            typeSlug={typeSlug}
            tags={values.tags}
            onAccept={addTag}
          >
            <Input
              {...props}
              value={values.tags}
              onChange={onInput("tags")}
              placeholder="react, hooks, typescript"
            />
          </TagSuggestions>
        )}
      </ItemFormField>
      <CollectionSelector
        id={`${idPrefix}-collections`}
        value={collectionIds}
        onChange={setCollectionIds}
        error={fieldErrors.collectionIds}
        disabled={disabled}
      />
    </>
  );
}
