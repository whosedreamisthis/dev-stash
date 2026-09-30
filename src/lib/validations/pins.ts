import { z } from "zod";
import { idSchema } from "@/lib/validations/ids";

// Sets the pinned state rather than flipping it, so repeated clicks can't drift
export const setPinSchema = z.object({
  id: idSchema,
  isPinned: z.boolean(),
});

export type SetPinInput = z.input<typeof setPinSchema>;
