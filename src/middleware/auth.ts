import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.get("authorization") || "";
  if (!h.startsWith("Bearer mock-token-")) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}
