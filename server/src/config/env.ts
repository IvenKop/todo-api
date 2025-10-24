import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().optional(),
  RESET_DB_ON_START: z.string().optional(),
  MIGRATE_ON_START: z.string().optional(),
  ACCESS_TOKEN_SECRET: z.string().optional(),
  ACCESS_TOKEN_TTL: z.string().optional().default("15m")
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid env", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
const toBool = (v?: string) => v === "true";
export const flags = {
  resetDbOnStart: toBool(env.RESET_DB_ON_START),
  migrateOnStart: toBool(env.MIGRATE_ON_START)
};
