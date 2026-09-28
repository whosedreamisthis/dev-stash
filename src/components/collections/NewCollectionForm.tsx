"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCollection, type CreateCollectionFieldErrors } from "@/actions/collections";
import { ItemFormField } from "@/components/items/ItemFormField";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NewCollectionFormProps {
  onCreated: () => void;
}

interface CollectionFormValues {
  name: string;
  description: string;
}

// Rendered inside the dialog so its state resets each time the dialog opens
export function NewCollectionForm({ onCreated }: NewCollectionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CollectionFormValues>({ name: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState<CreateCollectionFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  // Editing a field clears its error so fixed fields stop showing one
  function setValue(field: keyof CollectionFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createCollection(values);
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? "Couldn't create the collection");
        return;
      }
      toast.success("Collection created");
      onCreated();
      // Refreshes the server-rendered collections, stats and sidebar
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ItemFormField id="new-collection-name" label="Name" error={fieldErrors.name}>
        {(props) => (
          <Input
            {...props}
            value={values.name}
            onChange={setValue("name")}
            placeholder="React Patterns"
            required
            autoFocus
          />
        )}
      </ItemFormField>
      <ItemFormField
        id="new-collection-description"
        label="Description"
        error={fieldErrors.description}
      >
        {(props) => (
          <Textarea {...props} value={values.description} onChange={setValue("description")} />
        )}
      </ItemFormField>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={isPending} />}>Cancel</DialogClose>
        <Button type="submit" disabled={isPending || !values.name.trim()}>
          {isPending ? "Creating..." : "Create collection"}
        </Button>
      </DialogFooter>
    </form>
  );
}
