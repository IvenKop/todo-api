import knexFactory, { type Knex } from "knex";
import { env, isProd } from "../config/env.js";

const connection = isProd
  ? { connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : env.DATABASE_URL;

export const knex = knexFactory({
  client: "pg",
  connection,
  pool: { min: 0, max: 10 }
});

knex.on("query-error", (error) => {
  console.error("Unexpected database error", error);
});

export type DbConnection = Knex;
