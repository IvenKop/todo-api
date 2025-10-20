import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UserRecord } from "./queries/users";
import { pool } from "../lib/db";
import { createTodosRepository } from "./queries/todos";
import { createUsersRepository } from "./queries/users";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const sql = await fs.readFile(schemaPath, "utf8");
  await pool.query(sql);
}

export async function runSeed() {
  await pool.query("TRUNCATE TABLE todos, users RESTART IDENTITY CASCADE");

  const seedUser = {
    email: "user@mail.com",
    password: "Aa1!abcd",
  };

  const { rows } = await pool.query<UserRecord>(
    `INSERT INTO users (email, password)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
     RETURNING id, email, password`,
    [seedUser.email, seedUser.password],
  );

  const user = rows[0];

  const todoSeeds = [
    { text: "Review backlog items", completed: false },
    { text: "Prepare sprint demo", completed: true },
    { text: "Update documentation", completed: false },
  ];

  for (const todo of todoSeeds) {
    await pool.query(
      `INSERT INTO todos (text, completed)
       VALUES ($1, $2)`,
      [todo.text, todo.completed],
    );
  }

  return {
    userId: user.id,
    todosInserted: todoSeeds.length,
  };
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
