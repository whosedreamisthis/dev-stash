"use client";

import { useActionState } from "react";
import type { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { startDemo, type StartDemoResult } from "@/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TryDemoButtonProps {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  // Matches ButtonLink's sizes so it lines up with the homepage buttons
  size?: "default" | "large";
  className?: string;
}

const INITIAL_STATE: StartDemoResult = { success: false };

// Every error shows as a toast, since the button has no form around it to show one in
async function startDemoWithToast(): Promise<StartDemoResult> {
  const result = await startDemo();
  if (!result.success && result.error) toast.error(result.error);
  return result;
}

// Signs the visitor into a new temporary demo account; the action redirects to the dashboard
export function TryDemoButton({ variant = "default", size = "default", className }: TryDemoButtonProps) {
  const [, formAction, isPending] = useActionState(startDemoWithToast, INITIAL_STATE);

  return (
    <form action={formAction} className="contents">
      <Button
        type="submit"
        variant={variant}
        disabled={isPending}
        className={cn(size === "large" && "h-11 px-6 text-[15px]", className)}
      >
        {isPending ? "Setting up your demo..." : "Try the Demo"}
      </Button>
    </form>
  );
}
