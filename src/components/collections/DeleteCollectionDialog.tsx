"use client";

import { useRouter } from "next/navigation";
import { deleteCollection } from "@/actions/collections";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

interface DeleteCollectionDialogProps {
  collection: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Omit when the dialog is used from a page that isn't navigating away (e.g. the collections grid)
  onDeleted?: (collectionId: string) => void;
}

export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCollectionDialogProps) {
  const router = useRouter();

  function handleDeleted() {
    if (onDeleted) {
      onDeleted(collection.id);
    } else {
      router.push("/collections");
    }
    router.refresh();
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this collection?"
      description={
        <>
          &ldquo;{collection.name}&rdquo; will be permanently deleted. Its items won&apos;t be
          deleted — they&apos;ll just no longer belong to this collection. This can&apos;t be
          undone.
        </>
      }
      onConfirm={() => deleteCollection(collection.id)}
      errorMessage="Couldn't delete the collection"
      successMessage="Collection deleted"
      onDeleted={handleDeleted}
    />
  );
}
