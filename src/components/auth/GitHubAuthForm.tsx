"use client";

import { useActionState } from "react";
import { signInWithGitHub, type GitHubSignInResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useRateLimitToast } from "@/hooks/useRateLimitToast";

interface GitHubAuthFormProps {
  label: string;
  callbackUrl?: string;
}

const INITIAL_STATE: GitHubSignInResult = { success: false };

// GitHub sign-in creates the account on first use, so this serves both sign-in and sign-up
export function GitHubAuthForm({ label, callbackUrl }: GitHubAuthFormProps) {
  const [state, formAction, isPending] = useActionState(signInWithGitHub, INITIAL_STATE);
  // Demo-only mode refuses GitHub sign-in with a toast
  useRateLimitToast(state);

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
        <Button type="submit" variant="outline" size="lg" className="w-full" disabled={isPending}>
          {label}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
