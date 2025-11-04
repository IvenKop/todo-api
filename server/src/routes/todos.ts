import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { Db } from "../db/index.js";
import type { TodoFilter } from "../db/queries/todos.js";
import { getIO } from "../realtime/socket.js";
import {
  TodoListQuerySchema,
  TodoCreateBodySchema,
  TodoPatchBodySchema,
  TodoPatchBulkBodySchema,
} from "../schemas/todo.js";

const router = Router();

router.get(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { filter, page, limit } = TodoListQuerySchema.parse(req.query);
      const db = req.app.get("db") as Db;

      const typedFilter = filter as TodoFilter;
      const { items, total } = await db.todos.list({ userId, filter: typedFilter, page, limit });

      res.json({ items, total, page, limit });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { text } = TodoCreateBodySchema.parse(req.body);

      const db = req.app.get("db") as Db;
      const todo = await db.todos.create(userId, text);

      getIO().emit("todos:invalidate");

      res.status(201).json(todo);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/todos/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = TodoPatchBodySchema.parse(req.body);

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

router.patch(
  "/todos",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { ids, patch } = TodoPatchBulkBodySchema.parse(req.body);

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
