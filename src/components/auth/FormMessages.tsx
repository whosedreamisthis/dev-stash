import { Button } from "@/components/ui/button";

interface FormErrorProps {
  // Nothing renders when there's no message
  message?: string | null;
}

// A form-level error, announced to screen readers
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

interface FormSuccessProps {
  children: React.ReactNode;
}

// A green confirmation banner shown after a form succeeds
export function FormSuccess({ children }: FormSuccessProps) {
  return (
    <p role="status" className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
      {children}
    </p>
  );
}

interface SubmitButtonProps {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}

// The full-width submit button of the auth forms
export function SubmitButton({ pending, pendingLabel, children }: SubmitButtonProps) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
