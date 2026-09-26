"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changeUserPassword, type ChangePasswordActionResult } from "@/actions/profile";
import { FormField } from "@/components/auth/FormField";
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

const INITIAL_STATE: ChangePasswordActionResult = { success: false };

// Rendered inside the dialog so its state resets each time the dialog opens
function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changeUserPassword, INITIAL_STATE);

  if (state.success) {
    return (
      <>
        <p role="status" className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          Your password has been updated.
        </p>
        <DialogFooter>
          <DialogClose render={<Button />}>Done</DialogClose>
        </DialogFooter>
      </>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField
        id="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
      <FormField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.password}
      />
      <FormField
        id="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword}
      />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ChangePasswordDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <KeyRound />
        Change password
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>
        <ChangePasswordForm />
      </DialogContent>
    </Dialog>
  );
}
