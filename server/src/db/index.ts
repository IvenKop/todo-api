import type { Knex } from "knex";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { Pool } from "pg";
import { env, isDev, flags } from "../config/env.js";
import { knex as knexConn } from "../lib/db.js";
import { BaseModel } from "./models/base-model.js";
import { createTodosRepository } from "./queries/todos.js";
import { createUsersRepository } from "./queries/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

export type MigrationDirection = "up" | "down";

export interface RunMigrationsOptions {
  direction?: MigrationDirection;
  count?: number;
}

export async function runMigrations(opts: RunMigrationsOptions = {}) {
  const direction: MigrationDirection = opts.direction ?? "up";
  const count = opts.count;
  if (isDev && flags.resetDbOnStart) {
    
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
    await pool.query(`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`);
    await pool.end();
  }
  const require = createRequire(import.meta.url);
  const { runner } = require("node-pg-migrate");
  await runner({
  databaseUrl: {
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  },
  dir: migrationsDir,
  direction,
  migrationsTable: "pgmigrations",
  count,
  verbose: true,
  ignorePattern: ""
} as any);
}

export async function runSeed(knex: Knex) {
  BaseModel.knex(knex);
  const users = createUsersRepository();
  const todos = createTodosRepository();
  await users.ensureSeedUser();
  const inserted = [];
  inserted.push(await todos.create("Buy milk"));
  inserted.push(await todos.create("Read docs"));
  inserted.push(await todos.create("Ship feature"));
  return { todosInserted: inserted.length };
}

export async function initDb() {
  BaseModel.knex(knexConn);
  if (flags.migrateOnStart) {
    await runMigrations({ direction: "up" });
  }
  const todos = createTodosRepository();
  const users = createUsersRepository();
  await users.ensureSeedUser();
  return { knex: knexConn, todos, users };
}

export type Db = Awaited<ReturnType<typeof initDb>>;
