import type { z } from "zod";
import { getSessionUserId, NOT_SIGNED_IN_ERROR } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

export const GENERIC_ERROR = "Something went wrong. Please try again.";

interface RunUserActionOptions<S extends z.ZodType, T> {
  schema: S;
  input: unknown;
  // Also returned for invalid input, so bad IDs look the same as another user's records
  notFound: string;
  // Logged as "<logLabel> failed:"
  logLabel: string;
  // Returns null when the record doesn't exist or isn't the user's
  run: (userId: string, data: z.output<S>) => Promise<T | null>;
}

// Runs a signed-in action on one of the user's records: session, validation, not found and errors
export async function runUserAction<S extends z.ZodType, T>({
  schema,
  input,
  notFound,
  logLabel,
  run,
}: RunUserActionOptions<S, T>): Promise<ActionResult<T>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN_ERROR };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: notFound };

  try {
    const data = await run(userId, parsed.data);
    if (data === null) return { success: false, error: notFound };
    return { success: true, data };
  } catch (error) {
    console.error(`${logLabel} failed:`, error);
    return { success: false, error: GENERIC_ERROR };
  }
}
