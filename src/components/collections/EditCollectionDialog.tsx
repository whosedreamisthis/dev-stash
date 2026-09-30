"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCollection, type UpdateCollectionFieldErrors } from "@/actions/collections";
import { CollectionFormFields } from "@/components/collections/CollectionFormFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CollectionFormValues } from "@/types/collections";

interface EditCollectionDialogProps {
  collection: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: EditCollectionDialogProps) {
  const router = useRouter();
  const [values, setValues] = useState<CollectionFormValues>({
    name: collection.name,
    description: collection.description ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<UpdateCollectionFieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const [wasOpen, setWasOpen] = useState(open);

  // Resets the form to the collection's current values each time the dialog opens
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues({ name: collection.name, description: collection.description ?? "" });
      setFieldErrors({});
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    // Stay open while the update is in flight
    if (isPending) return;
    onOpenChange(nextOpen);
  }

  // Editing a field clears its error so fixed fields stop showing one
  function setValue(field: keyof CollectionFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateCollection(collection.id, values);
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error ?? "Couldn't update the collection");
        return;
      }
      toast.success("Collection updated");
      onOpenChange(false);
      // Refreshes the server-rendered card lists, header and sidebar
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Update the collection&apos;s name and description.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CollectionFormFields
            idPrefix="edit-collection"
            values={values}
            errors={fieldErrors}
            onChange={setValue}
          />

          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isPending} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending || !values.name.trim()}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
