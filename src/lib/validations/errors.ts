import { z } from "zod";

// The first validation message, for forms that show a single error
export function firstIssueMessage(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}

// Keeps the first error message for each top-level field
export function toFirstFieldErrors<K extends string>(
  error: z.ZodError
): Partial<Record<K, string>> {
  const { fieldErrors } = z.flattenError(error) as {
    fieldErrors: Partial<Record<K, string[]>>;
  };
  const result: Partial<Record<K, string>> = {};
  for (const key of Object.keys(fieldErrors) as K[]) {
    const message = fieldErrors[key]?.[0];
    if (message) result[key] = message;
  }
  return result;
}
