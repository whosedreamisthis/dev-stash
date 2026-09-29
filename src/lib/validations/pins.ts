import { z } from "zod";

// Sets the pinned state rather than flipping it, so repeated clicks can't drift
export const setPinSchema = z.object({
  id: z.string().trim().min(1),
  isPinned: z.boolean(),
});

export type SetPinInput = z.input<typeof setPinSchema>;
