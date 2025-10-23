// server/src/db/index.ts
import type { Knex } from "knex";
import path from "node:path";
import { fileURLToPath } from "node:url";
const { migrate } = require("node-pg-migrate");
import { env } from "../config/env.js";
import { knex as knexConn } from "../lib/db.js";
import { BaseModel } from "./models/base-model.js";
import { createTodosRepository } from "./queries/todos.js";
import { createUsersRepository } from "./queries/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, "migrations");

type MigrationDirection = "up" | "down";
interface RunMigrationsOptions {
  direction?: MigrationDirection;
  count?: number;
}

export async function runMigrations(opts: RunMigrationsOptions = {}) {
  const direction: MigrationDirection = opts.direction ?? "up";

  await migrate({
    databaseUrl: env.DATABASE_URL,
    dir: migrationsDir,
    direction,
    migrationsTable: "pgmigrations",
    count: opts.count,
    logger: console,
  } as any);
}

export async function runSeed(knex: Knex) {
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

  await runMigrations({ direction: "up" });

  const todos = createTodosRepository();
  const users = createUsersRepository();

  await users.ensureSeedUser();

  return {
    knex: knexConn,
    todos,
    users,
  };
}

export type Db = Awaited<ReturnType<typeof initDb>>;
