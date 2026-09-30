"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInWithCredentials, type SignInResult } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { FormError, SubmitButton } from "@/components/auth/FormMessages";
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton";
import { useRateLimitToast } from "@/hooks/useRateLimitToast";

interface SignInFormProps {
  callbackUrl?: string;
}

const INITIAL_STATE: SignInResult = { success: false };

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInWithCredentials,
    INITIAL_STATE,
  );
  // Controlled so the email survives the form reset after a failed attempt
  const [email, setEmail] = useState("");
  useRateLimitToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />
      <div className="-mt-2 text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <FormError message={state.rateLimited ? undefined : state.error} />
      <SubmitButton pending={isPending} pendingLabel="Signing in...">
        Sign in
      </SubmitButton>
      {state.emailNotVerified && <ResendVerificationButton email={email} />}
    </form>
  );
}
