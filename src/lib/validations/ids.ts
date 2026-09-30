import { z } from "zod";

// A record ID from the client; ownership is checked by the query, not here
export const idSchema = z.string().trim().min(1);
