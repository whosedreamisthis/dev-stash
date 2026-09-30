"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAccount } from "@/actions/profile";
import { FormError } from "@/components/auth/FormMessages";
import { CONFIRM_DIALOG_CONTENT_CLASS } from "@/components/shared/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteAccountDialog() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      // On success the action signs out and redirects, so only failures return here
      const result = await deleteUserAccount();
      if (!result.success) setError(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2 />
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent className={CONFIRM_DIALOG_CONTENT_CLASS}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            All of your collections and items will be permanently deleted. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FormError message={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
