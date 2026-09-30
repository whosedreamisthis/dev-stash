"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ForgotPasswordResult } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { FormError, FormSuccess, SubmitButton } from "@/components/auth/FormMessages";
import { isToastError, useRateLimitToast } from "@/hooks/useRateLimitToast";

const INITIAL_STATE: ForgotPasswordResult = { success: false };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    INITIAL_STATE,
  );
  useRateLimitToast(state);

  if (state.success) {
    return (
      <FormSuccess>
        If an account exists for that email, we&apos;ve sent a link to reset your password.
        The link expires in 1 hour.
      </FormSuccess>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField id="email" label="Email" type="email" autoComplete="email" required />
      <FormError message={isToastError(state) ? undefined : state.error} />
      <SubmitButton pending={isPending} pendingLabel="Sending...">
        Send reset link
      </SubmitButton>
    </form>
  );
}
