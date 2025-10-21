import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db";
import type { TodoFilter } from "../db/queries/todos";

const router = Router();

const filters = ["all", "active", "completed"] as const satisfies readonly TodoFilter[];

const ListQuerySchema = z.object({
  filter: z.enum(filters).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { filter, page, limit } = ListQuerySchema.parse(req.query);
      const db = req.app.get("db") as Db;
      const { items, total } = await db.todos.list({ filter, page, limit });
      res.json({ items, total, page, limit });
    } catch (error) {
      next(error);
    }
  },
);

const CreateTodoBodySchema = z.object({
  text: z.string().trim().min(1).max(200),
});

router.post(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { text } = CreateTodoBodySchema.parse(req.body);
      const db = req.app.get("db") as Db;
      const todo = await db.todos.create(text);
      res.status(201).json(todo);
    } catch (error) {
      next(error);
    }
  },
);

const PatchTodoBodySchema = z.object({
  text: z.string().trim().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

router.patch(
  "/todos/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = PatchTodoBodySchema.parse(req.body);
      const db = req.app.get("db") as Db;
      const todo = await db.todos.update(id, data);
      if (!todo) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json(todo);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/todos/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = req.app.get("db") as Db;
      const deleted = await db.todos.delete(req.params.id);
      res.status(deleted ? 204 : 404).end();
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const db = req.app.get("db") as Db;
      await db.todos.clearCompleted();
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
