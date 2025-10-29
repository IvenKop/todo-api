import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db/index.js";
import type { TodoFilter } from "../db/queries/todos.js";
import { getIO } from "../realtime/socket.js";

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
      const userId = req.user!.id;
      const { filter, page, limit } = ListQuerySchema.parse(req.query);
      const db = req.app.get("db") as Db;
      const { items, total } = await db.todos.list({ userId, filter, page, limit });
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
      const userId = req.user!.id;
      const { text } = CreateTodoBodySchema.parse(req.body);
      const db = req.app.get("db") as Db;
      const todo = await db.todos.create(userId, text);

      getIO().emit("todos:invalidate");

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
      const userId = req.user!.id;
      const { id } = req.params;
      const data = PatchTodoBodySchema.parse(req.body);
      const db = req.app.get("db") as Db;
      const todo = await db.todos.update(userId, id, data);
      if (!todo) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      getIO().emit("todos:invalidate");

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
      const userId = req.user!.id;
      const db = req.app.get("db") as Db;
      const deleted = await db.todos.delete(userId, req.params.id);

      if (deleted) getIO().emit("todos:invalidate");

      res.status(deleted ? 204 : 404).end();
    } catch (error) {
      next(error);
    }
  },
);

const PatchBulkBodySchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  patch: z.object({
    text: z.string().trim().min(1).max(200).optional(),
    completed: z.boolean().optional(),
  }),
});

router.patch(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { ids, patch } = PatchBulkBodySchema.parse(req.body);
      const db = req.app.get("db") as Db;
      await db.todos.updateBulk(userId, patch, ids);

      getIO().emit("todos:invalidate");
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const db = req.app.get("db") as Db;
      await db.todos.clearCompleted(userId);

      getIO().emit("todos:invalidate");

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
