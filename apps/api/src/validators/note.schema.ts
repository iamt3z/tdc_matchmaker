import { z } from "zod";

/**
 * Body for POST /api/customers/:customerId/notes.
 * matchmakerId is intentionally omitted — it comes from the JWT only.
 */
export const createNoteSchema = z
  .object({
    type: z.enum(["CALL", "MEETING", "EMAIL", "OTHER"]),
    subject: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(5000),
    followUpAt: z.string().datetime().optional(),
    followUpAction: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateNoteBody = z.infer<typeof createNoteSchema>;
