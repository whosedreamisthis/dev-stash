"use client";

import { useActionState, useState } from "react";
import { signInWithCredentials, type SignInResult } from "@/actions/auth";
import { FormField } from "@/components/auth/FormField";
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton";
import { Button } from "@/components/ui/button";

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
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
      {state.emailNotVerified && <ResendVerificationButton email={email} />}
    </form>
  );
}
