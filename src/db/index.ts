import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../lib/db";
import { createTodosRepository } from "./queries/todos";
import { createUsersRepository } from "./queries/users";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const sql = await fs.readFile(schemaPath, "utf8");
  await pool.query(sql);
}

export async function initDb() {
  await runMigrations();

  const todos = createTodosRepository(pool);
  const users = createUsersRepository(pool);

  await users.ensureSeedUser();

  return {
    pool,
    todos,
    users,
  };
}

export type Db = Awaited<ReturnType<typeof initDb>>;
