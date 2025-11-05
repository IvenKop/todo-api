import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    });
  }

  if (err && typeof err === "object" && (err as any).code === 11000) {
    return res.status(409).json({
      error: "DuplicateTodo",
      message: "Todo with the same text already exists.",
    });
  }

  return res.status(500).json({ error: "InternalServerError" });
};
