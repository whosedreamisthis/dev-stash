"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createItem, type CreateItemFieldErrors } from "@/actions/items";
import { ItemFormField } from "@/components/items/ItemFormField";
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
import { Textarea } from "@/components/ui/textarea";
import { ITEM_TYPE_SLUG_ICONS, ITEM_TYPE_TEXT_COLORS } from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";
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
};

// Static class names so Tailwind can detect the selected type colors at build time
const SELECTED_TYPE_CLASSES: Record<CreatableTypeSlug, string> = {
  snippets: "border-[#3b82f6] bg-[#3b82f6]/15 hover:bg-[#3b82f6]/20",
  prompts: "border-[#8b5cf6] bg-[#8b5cf6]/15 hover:bg-[#8b5cf6]/20",
  commands: "border-[#f97316] bg-[#f97316]/15 hover:bg-[#f97316]/20",
  notes: "border-[#fde047] bg-[#fde047]/15 hover:bg-[#fde047]/20",
  links: "border-[#10b981] bg-[#10b981]/15 hover:bg-[#10b981]/20",
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
function toPayload(typeSlug: CreatableTypeSlug, values: FormValues): CreateItemInput {
  const isLink = typeSlug === "links";
  return {
    typeSlug,
    title: values.title,
    description: values.description,
    tags: parseTagInput(values.tags),
    ...(!isLink && { content: values.content }),
    ...(LANGUAGE_TYPE_SLUGS.has(typeSlug) && { language: values.language }),
    ...(isLink && { url: values.url }),
  };
}

interface TypeSelectorProps {
  value: CreatableTypeSlug;
  onChange: (value: CreatableTypeSlug) => void;
}

function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div role="group" aria-label="Item type" className="flex flex-wrap gap-2">
      {CREATABLE_TYPE_SLUGS.map((slug) => {
        const Icon = ITEM_TYPE_SLUG_ICONS[slug];
        const selected = slug === value;
        return (
          <Button
            key={slug}
            type="button"
            aria-pressed={selected}
            variant="outline"
            size="sm"
            onClick={() => onChange(slug)}
            className={cn(
              selected
                ? cn("font-semibold text-foreground", SELECTED_TYPE_CLASSES[slug])
                : "text-muted-foreground"
            )}
          >
            <Icon className={ITEM_TYPE_TEXT_COLORS[slug]} />
            {TYPE_LABELS[slug]}
          </Button>
        );
      })}
    </div>
  );
}

interface NewItemFormProps {
  onCreated: () => void;
}

// Rendered inside the dialog so its state resets each time the dialog opens
function NewItemForm({ onCreated }: NewItemFormProps) {
  const router = useRouter();
  const [typeSlug, setTypeSlug] = useState<CreatableTypeSlug>("snippets");
  const [values, setValues] = useState(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<CreateItemFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const isLink = typeSlug === "links";
  const canSubmit = values.title.trim() && (!isLink || values.url.trim());

  // Editing a field clears its error so fixed fields stop showing one
  function setValue(field: keyof FormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  // Errors belong to the previous type's fields, so they're cleared
  function handleTypeChange(slug: CreatableTypeSlug) {
    setTypeSlug(slug);
    setFieldErrors({});
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createItem(toPayload(typeSlug, values));
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
        {!isLink && (
          <ItemFormField id="new-item-content" label="Content" error={fieldErrors.content}>
            {(props) => (
              <Textarea
                {...props}
                value={values.content}
                onChange={setValue("content")}
                className="min-h-40 font-mono"
              />
            )}
          </ItemFormField>
        )}
        {LANGUAGE_TYPE_SLUGS.has(typeSlug) && (
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

export function NewItemDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New Item
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Choose a type and fill in the details.</DialogDescription>
        </DialogHeader>
        <NewItemForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
