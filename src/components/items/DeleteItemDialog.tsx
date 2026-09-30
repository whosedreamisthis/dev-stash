"use client";

import { useRouter } from "next/navigation";
import { deleteItem } from "@/actions/items";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

interface DeleteItemDialogProps {
  item: { id: string; title: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (itemId: string) => void;
}

export function DeleteItemDialog({ item, open, onOpenChange, onDeleted }: DeleteItemDialogProps) {
  const router = useRouter();

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this item?"
      description={
        <>
          &ldquo;{item.title}&rdquo; will be permanently deleted. This can&apos;t be undone.
        </>
      }
      onConfirm={() => deleteItem(item.id)}
      errorMessage="Couldn't delete the item"
      successMessage="Item deleted"
      onDeleted={() => {
        onDeleted(item.id);
        // Refreshes the server-rendered card lists, stats and sidebar counts
        router.refresh();
      }}
    />
  );
}
