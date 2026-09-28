"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCollection, type UpdateCollectionFieldErrors } from "@/actions/collections";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EditCollectionDialogProps {
  collection: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CollectionFormValues {
  name: string;
  description: string;
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
  function setValue(field: keyof CollectionFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };
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
          <ItemFormField id="edit-collection-name" label="Name" error={fieldErrors.name}>
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
            id="edit-collection-description"
            label="Description"
            error={fieldErrors.description}
          >
            {(props) => (
              <Textarea {...props} value={values.description} onChange={setValue("description")} />
            )}
          </ItemFormField>

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
