"use client";

import { useActionState } from "react";
import { resetPasswordWithToken, type ResetPasswordActionResult } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { useRateLimitToast } from "@/hooks/useRateLimitToast";

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
      {state.error && !state.rateLimited && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Updating password..." : "Update password"}
      </Button>
    </form>
  );
}
