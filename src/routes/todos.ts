import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";

const router = Router();

const ListQuerySchema = z.object({
  filter: z.enum(["all", "active", "completed"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function whereClause(filter: "all" | "active" | "completed"): string {
  if (filter === "active") return "WHERE completed=0";
  if (filter === "completed") return "WHERE completed=1";
  return "";
}

router.get("/todos", (req, res) => {
  const { filter, page, limit } = ListQuerySchema.parse(req.query);
  const db = req.app.get("db");

  const where = whereClause(filter);

const totalRow = db
  .prepare(`SELECT COUNT(*) as c FROM todos ${where}`)
  .get() as { c: number } | undefined;

const total = totalRow?.c ?? 0;

  const rows = db
    .prepare(
      `SELECT * FROM todos ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(limit, (page - 1) * limit);

  res.json({ items: rows, total, page, limit });
});

const CreateTodoBodySchema = z.object({
  text: z.string().trim().min(1).max(200),
});

router.post("/todos", (req, res) => {
  const { text } = CreateTodoBodySchema.parse(req.body);
  const db = req.app.get("db");
  const id = nanoid();

  db.prepare("INSERT INTO todos(id,text,completed) VALUES(?,?,0)").run(
    id,
    text,
  );
  const todo = db.prepare("SELECT * FROM todos WHERE id=?").get(id);
  res.status(201).json(todo);
});

const PatchTodoBodySchema = z.object({
  text: z.string().trim().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

router.patch("/todos/:id", (req, res) => {
  const { id } = req.params;
  const data = PatchTodoBodySchema.parse(req.body);
  const db = req.app.get("db");

  const row = db.prepare("SELECT * FROM todos WHERE id=?").get(id);
  if (!row) return res.status(404).json({ error: "Not found" });

  if (data.text !== undefined)
    db.prepare("UPDATE todos SET text=? WHERE id=?").run(data.text, id);

  if (data.completed !== undefined)
    db.prepare("UPDATE todos SET completed=? WHERE id=?").run(
      data.completed ? 1 : 0,
      id,
    );

  const todo = db.prepare("SELECT * FROM todos WHERE id=?").get(id);
  res.json(todo);
});

router.delete("/todos/:id", (req, res) => {
  const db = req.app.get("db");
  const r = db.prepare("DELETE FROM todos WHERE id=?").run(req.params.id);
  res.status(r.changes ? 204 : 404).end();
});

router.delete("/todos", (req, res) => {
  const db = req.app.get("db");
  db.prepare("DELETE FROM todos WHERE completed=1").run();
  res.status(204).end();
});

export default router;
