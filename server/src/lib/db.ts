import knexFactory, { type Knex } from "knex";
import { env } from "../config/env.js";

export const knex = knexFactory({
  client: "pg",
  connection: env.DATABASE_URL,
  pool: {
    min: 0,
    max: 10,
  },
});

knex.on("query-error", (error) => {
  console.error("Unexpected database error", error);
});

export type DbConnection = Knex;
