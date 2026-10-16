import "dotenv/config";
import { z } from "zod";

/**
 * Validate configuration at startup.
 * The API should fail immediately if its authentication secret is unsafe.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_EXPIRES_IN: z.string().default("1h"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten());
  throw new Error("The API environment configuration is invalid.");
}

export const env = parsed.data;