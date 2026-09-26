"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ForgotPasswordResult } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";

const INITIAL_STATE: ForgotPasswordResult = { success: false };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    INITIAL_STATE,
  );

  if (state.success) {
    return (
      <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
        If an account exists for that email, we&apos;ve sent a link to reset your password.
        The link expires in 1 hour.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField id="email" label="Email" type="email" autoComplete="email" required />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
