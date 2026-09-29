import { z } from "zod";

// Sets the favorite state rather than flipping it, so repeated clicks can't drift
export const setFavoriteSchema = z.object({
  id: z.string().trim().min(1),
  isFavorite: z.boolean(),
});

export type SetFavoriteInput = z.input<typeof setFavoriteSchema>;
