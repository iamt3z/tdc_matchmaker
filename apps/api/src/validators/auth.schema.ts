import { z } from "zod";

/**
 * Reject malformed login requests before checking credentials.
 */
export const loginSchema = z
  .object({
    username: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(128),
  })
  .strict();

export type LoginRequest = z.infer<typeof loginSchema>;