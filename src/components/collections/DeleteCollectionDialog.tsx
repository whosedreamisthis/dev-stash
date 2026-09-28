"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCollection } from "@/actions/collections";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Stay open while the delete is in flight
    if (isPending) return;
    onOpenChange(nextOpen);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCollection(collection.id);
      if (!result.success) {
        toast.error(result.error ?? "Couldn't delete the collection");
        return;
      }
      toast.success("Collection deleted");
      if (onDeleted) {
        onDeleted(collection.id);
        router.refresh();
      } else {
        router.push("/collections");
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{collection.name}&rdquo; will be permanently deleted. Its items won&apos;t be
            deleted — they&apos;ll just no longer belong to this collection. This can&apos;t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
