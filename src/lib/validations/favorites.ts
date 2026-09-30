import { z } from "zod";
import { idSchema } from "@/lib/validations/ids";

// Sets the favorite state rather than flipping it, so repeated clicks can't drift
export const setFavoriteSchema = z.object({
  id: idSchema,
  isFavorite: z.boolean(),
});

export type SetFavoriteInput = z.input<typeof setFavoriteSchema>;
