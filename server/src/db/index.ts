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
import { connectMongo } from "../mongo/connection.js";
import { TodoMongo } from "../mongo/models/todo.js";

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
      ssl: { rejectUnauthorized: false },
    });
    await pool.query(
      `DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`,
    );
    await pool.end();
  }

  const require = createRequire(import.meta.url);
  const { runner } = require("node-pg-migrate");

  await runner({
    databaseUrl: {
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    dir: migrationsDir,
    direction,
    migrationsTable: "pgmigrations",
    count,
    verbose: true,
    ignorePattern: "",
  } as any);
}

export async function runSeed(knex: Knex) {
  BaseModel.knex(knex);

  const users = createUsersRepository();
  const todos = createTodosRepository();

  await users.ensureSeedUser();
  const seedUser = await users.findByEmail("user@mail.com");
  if (!seedUser) {
    throw new Error("[seed] seed user not found after ensureSeedUser()");
  }

  await todos.create(seedUser.id, "Buy milk");
  await todos.create(seedUser.id, "Read docs");
  await todos.create(seedUser.id, "Ship feature");

  return { userId: seedUser.id, todosInserted: 3 };
}

export async function initDb() {
  BaseModel.knex(knexConn);

  if (flags.migrateOnStart) {
    await runMigrations({ direction: "up" });
  }

  await connectMongo();
  try {
    await TodoMongo.createIndexes();
  } catch (e) {
    console.warn("[mongo] createIndexes failed:", e);
  }

  const todos = createTodosRepository();
  const users = createUsersRepository();

  try {
    await users.ensureSeedUser();
  } catch (e) {
    console.warn("[db] ensureSeedUser failed:", e);
  }

  return { knex: knexConn, todos, users };
}

export type Db = Awaited<ReturnType<typeof initDb>>;
