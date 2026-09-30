"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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

// Narrow on mobile with a margin, a fixed small width from sm up
export const CONFIRM_DIALOG_CONTENT_CLASS =
  "w-[calc(100%-2rem)] max-w-md data-[size=default]:max-w-md data-[size=default]:sm:max-w-md";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  // Toast when the action fails without its own error message
  errorMessage: string;
  successMessage: string;
  onDeleted: () => void;
}

// Confirms a delete, runs it, toasts the result and stays open while it's in flight
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  errorMessage,
  successMessage,
  onDeleted,
}: ConfirmDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    // Stay open while the delete is in flight
    if (isPending) return;
    onOpenChange(nextOpen);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.success) {
        toast.error(result.error ?? errorMessage);
        return;
      }
      toast.success(successMessage);
      onDeleted();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={CONFIRM_DIALOG_CONTENT_CLASS}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
