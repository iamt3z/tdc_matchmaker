import { z } from "zod";

/**
 * Body for POST /api/matches/generate.
 * customerId identifies the source profile; limit caps the ranked list.
 */
export const generateMatchesSchema = z
  .object({
    customerId: z.string().trim().min(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    includeUnverified: z.boolean().optional().default(false),
  })
  .strict();

export type GenerateMatchesBody = z.infer<typeof generateMatchesSchema>;

/**
 * Allowed match lifecycle statuses from the shared domain type.
 * Do not invent additional values here.
 */
export const matchStatusEnum = z.enum([
  "SUGGESTED",
  "SHORTLISTED",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "WITHDRAWN",
]);

/**
 * Body for PATCH /api/matches/:matchId/status.
 */
export const updateMatchStatusSchema = z
  .object({
    status: matchStatusEnum,
    feedback: z.string().trim().max(2000).optional(),
  })
  .strict();

export type UpdateMatchStatusBody = z.infer<typeof updateMatchStatusSchema>;
