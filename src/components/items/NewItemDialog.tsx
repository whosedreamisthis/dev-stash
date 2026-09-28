"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createItem, type CreateItemFieldErrors } from "@/actions/items";
import { CodeEditor } from "@/components/items/CodeEditor";
import { FileUpload } from "@/components/items/FileUpload";
import { ItemFormField } from "@/components/items/ItemFormField";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ITEM_TYPE_SLUG_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { isUploadTypeSlug } from "@/lib/upload-constraints";
import {
  CREATABLE_TYPE_SLUGS,
  LANGUAGE_TYPE_SLUGS,
  parseTagInput,
  type CreatableTypeSlug,
  type CreateItemInput,
} from "@/lib/validations/items";

const TYPE_LABELS: Record<CreatableTypeSlug, string> = {
  snippets: "Snippet",
  prompts: "Prompt",
  commands: "Command",
  notes: "Note",
  links: "Link",
  files: "File",
  images: "Image",
};

const EMPTY_VALUES = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

type FormValues = typeof EMPTY_VALUES;

// Sends only the fields that belong to the selected type
function toPayload(
  typeSlug: CreatableTypeSlug,
  values: FormValues,
  uploadToken: string | null
): CreateItemInput {
  const isLink = typeSlug === "links";
  const isUpload = isUploadTypeSlug(typeSlug);
  return {
    typeSlug,
    title: values.title,
    description: values.description,
    tags: parseTagInput(values.tags),
    ...(!isLink && !isUpload && { content: values.content }),
    ...(LANGUAGE_TYPE_SLUGS.has(typeSlug) && { language: values.language }),
    ...(isLink && { url: values.url }),
    ...(isUpload && uploadToken && { uploadToken }),
  };
}

interface TypeSelectorProps {
  value: CreatableTypeSlug;
  onChange: (value: CreatableTypeSlug) => void;
}

function TypeOption({ slug }: { slug: CreatableTypeSlug }) {
  const Icon = ITEM_TYPE_SLUG_ICONS[slug];
  return (
    <>
      <Icon className={ITEM_TYPE_TEXT_COLORS[slug]} />
      {TYPE_LABELS[slug]}
    </>
  );
}

function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <ItemFormField id="new-item-type" label="Type">
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

interface NewItemFormProps {
  defaultType: CreatableTypeSlug;
  onCreated: () => void;
}

// Rendered inside the dialog so its state resets each time the dialog opens
function NewItemForm({ defaultType, onCreated }: NewItemFormProps) {
  const router = useRouter();
  const [typeSlug, setTypeSlug] = useState<CreatableTypeSlug>(defaultType);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<CreateItemFieldErrors>({});
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isLink = typeSlug === "links";
  const uploadType = isUploadTypeSlug(typeSlug) ? typeSlug : null;
  const isUpload = uploadType !== null;
  const isCode = LANGUAGE_TYPE_SLUGS.has(typeSlug);
  const canSubmit =
    values.title.trim() &&
    (!isLink || values.url.trim()) &&
    (!isUpload || uploadToken) &&
    !isUploading;

  // Editing a field clears its error so fixed fields stop showing one
  function setValue(field: keyof FormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  // The code and Markdown editors pass the new text instead of an event
  function setContent(content: string) {
    setValues((prev) => ({ ...prev, content }));
    setFieldErrors((prev) => ({ ...prev, content: undefined }));
  }

  function handleUploaded(token: string | null) {
    setUploadToken(token);
    setFieldErrors((prev) => ({ ...prev, uploadToken: undefined }));
  }

  // Errors and uploads belong to the previous type, so they're cleared
  function handleTypeChange(slug: CreatableTypeSlug) {
    setTypeSlug(slug);
    setFieldErrors({});
    setUploadToken(null);
    setIsUploading(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createItem(toPayload(typeSlug, values, uploadToken));
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? "Couldn't create the item");
        return;
      }
      toast.success(`${TYPE_LABELS[typeSlug]} created`);
      onCreated();
      // Refreshes the server-rendered lists, stats and sidebar counts
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
      <TypeSelector value={typeSlug} onChange={handleTypeChange} />

      <div className="scrollbar-none -mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1">
        <ItemFormField id="new-item-title" label="Title" error={fieldErrors.title}>
          {(props) => (
            <Input {...props} value={values.title} onChange={setValue("title")} required autoFocus />
          )}
        </ItemFormField>
        {isLink && (
          <ItemFormField id="new-item-url" label="URL" error={fieldErrors.url}>
            {(props) => (
              <Input
                {...props}
                type="url"
                value={values.url}
                onChange={setValue("url")}
                placeholder="https://"
                required
              />
            )}
          </ItemFormField>
        )}
        <ItemFormField id="new-item-description" label="Description" error={fieldErrors.description}>
          {(props) => (
            <Textarea {...props} value={values.description} onChange={setValue("description")} />
          )}
        </ItemFormField>
        {uploadType && (
          <ItemFormField
            id="new-item-file"
            label={TYPE_LABELS[uploadType]}
            error={fieldErrors.uploadToken}
          >
            {(props) => (
              <FileUpload
                // Remounts for each type so a previous upload isn't shown
                key={uploadType}
                id={props.id}
                typeSlug={uploadType}
                onUploaded={handleUploaded}
                onUploadingChange={setIsUploading}
                disabled={isPending}
                invalid={props["aria-invalid"]}
                aria-describedby={props["aria-describedby"]}
              />
            )}
          </ItemFormField>
        )}
        {!isLink && !isUpload && (
          <ItemFormField id="new-item-content" label="Content" error={fieldErrors.content}>
            {(props) =>
              isCode ? (
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
        {isCode && (
          <ItemFormField id="new-item-language" label="Language" error={fieldErrors.language}>
            {(props) => (
              <Input
                {...props}
                value={values.language}
                onChange={setValue("language")}
                placeholder="typescript"
              />
            )}
          </ItemFormField>
        )}
        <ItemFormField id="new-item-tags" label="Tags" error={fieldErrors.tags}>
          {(props) => (
            <Input
              {...props}
              value={values.tags}
              onChange={setValue("tags")}
              placeholder="react, hooks, typescript"
            />
          )}
        </ItemFormField>
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={isPending} />}>Cancel</DialogClose>
        <Button type="submit" disabled={isPending || !canSubmit}>
          {isPending ? "Creating..." : "Create item"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface NewItemDialogProps {
  // Preselects this type and names it on the button, e.g. "New Snippet"
  defaultType?: CreatableTypeSlug;
}

export function NewItemDialog({ defaultType }: NewItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New {defaultType ? TYPE_LABELS[defaultType] : "Item"}
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Choose a type and fill in the details.</DialogDescription>
        </DialogHeader>
        <NewItemForm defaultType={defaultType ?? "snippets"} onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
