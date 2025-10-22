import type { Knex } from "knex";
import { knex } from "../lib/db.js";
import { BaseModel } from "./models/base-model.js";
import { TodoModel } from "./models/todo-model.js";
import { UserModel } from "./models/user-model.js";
import { createTodosRepository } from "./queries/todos.js";
import { createUsersRepository } from "./queries/users.js";

export async function runMigrations(connection: Knex) {
  await connection.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  const hasUsers = await connection.schema.hasTable("users");
  if (!hasUsers) {
    await connection.schema.createTable("users", (table) => {
      table.uuid("id").primary().defaultTo(connection.raw("gen_random_uuid()"));
      table.text("email").notNullable().unique();
      table.text("password").notNullable();
    });
  }

  const hasTodos = await connection.schema.hasTable("todos");
  if (!hasTodos) {
    await connection.schema.createTable("todos", (table) => {
      table.uuid("id").primary().defaultTo(connection.raw("gen_random_uuid()"));
      table.text("text").notNullable();
      table.boolean("completed").notNullable().defaultTo(false);
      table
        .timestamp("created_at", { useTz: true })
        .notNullable()
        .defaultTo(connection.fn.now());
    });
  }
}

export async function runSeed(connection: Knex) {
  return connection.transaction(async (trx) => {
    await TodoModel.query(trx).delete();
    await UserModel.query(trx).delete();

    const seedUser = {
      email: "user@mail.com",
      password: "Aa1!abcd"
    };

    await UserModel.query(trx)
      .insert(seedUser)
      .onConflict("email")
      .merge();

    const user = await UserModel.query(trx).findOne({ email: seedUser.email });
    if (!user) {
      throw new Error("Failed to seed default user");
    }

    const todoSeeds = [
      { text: "Review backlog items", completed: false },
      { text: "Prepare sprint demo", completed: true },
      { text: "Update documentation", completed: false }
    ];

    await TodoModel.query(trx).insertGraph(todoSeeds);

    return {
      userId: user.id,
      todosInserted: todoSeeds.length
    };
  });
}

export async function initDb() {
  BaseModel.knex(knex);

  await runMigrations(knex);

  const todos = createTodosRepository();
  const users = createUsersRepository();

  await users.ensureSeedUser();

  return {
    knex,
    todos,
    users
  };
}

export type Db = Awaited<ReturnType<typeof initDb>>;
