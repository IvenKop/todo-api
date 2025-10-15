import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

export type DB = Database.Database;

export default function createDb() {
  const dir = path.resolve(process.cwd(), "server", "data");
  fs.mkdirSync(dir, { recursive: true });

  const db = new Database(path.join(dir, "todo.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  const cnt = db.prepare("SELECT COUNT(1) as c FROM users").get() as { c: number };
  if (cnt.c === 0) {
    db.prepare("INSERT INTO users(id,email,password) VALUES(?,?,?)")
      .run("u1", "user@mail.com", "Aa1!abcd");
  }

  return db;
}
