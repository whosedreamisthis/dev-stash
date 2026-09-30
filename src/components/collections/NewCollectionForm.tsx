"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCollection, type CreateCollectionFieldErrors } from "@/actions/collections";
import { CollectionFormFields } from "@/components/collections/CollectionFormFields";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import type { CollectionFormValues } from "@/types/collections";

interface NewCollectionFormProps {
  onCreated: () => void;
}

// Rendered inside the dialog so its state resets each time the dialog opens
export function NewCollectionForm({ onCreated }: NewCollectionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CollectionFormValues>({ name: "", description: "" });
  const [fieldErrors, setFieldErrors] = useState<CreateCollectionFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  // Editing a field clears its error so fixed fields stop showing one
  function setValue(field: keyof CollectionFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
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
      <CollectionFormFields
        idPrefix="new-collection"
        values={values}
        errors={fieldErrors}
        onChange={setValue}
      />

      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={isPending} />}>Cancel</DialogClose>
        <Button type="submit" disabled={isPending || !values.name.trim()}>
          {isPending ? "Creating..." : "Create collection"}
        </Button>
      </DialogFooter>
    </form>
  );
}
