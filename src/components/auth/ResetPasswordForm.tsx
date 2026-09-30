"use client";

import { useActionState } from "react";
import { resetPasswordWithToken, type ResetPasswordActionResult } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { FormError, SubmitButton } from "@/components/auth/FormMessages";
import { isToastError, useRateLimitToast } from "@/hooks/useRateLimitToast";

interface ResetPasswordFormProps {
  token: string;
}

const INITIAL_STATE: ResetPasswordActionResult = { success: false };

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordWithToken,
    INITIAL_STATE,
  );
  useRateLimitToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
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
      <FormError message={isToastError(state) ? undefined : state.error} />
      <SubmitButton pending={isPending} pendingLabel="Updating password...">
        Update password
      </SubmitButton>
    </form>
  );
}
