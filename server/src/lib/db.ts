import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on("error", (error: Error) => {
  console.error("Unexpected PostgreSQL client error", error);
});

export type DbPool = Pool;
