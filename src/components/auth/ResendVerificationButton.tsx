"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";

interface ResendVerificationButtonProps {
  email: string;
}

export function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setMessage("If your email still needs verifying, a new link is on its way.");
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending || !email}
        onClick={handleClick}
      >
        {isPending ? "Sending..." : "Resend verification email"}
      </Button>
      {message && <p className="text-sm text-emerald-500">{message}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
