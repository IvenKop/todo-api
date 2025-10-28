import type { Request, Response, NextFunction } from "express";
import { isDev } from "../config/env.js";
import { verifyAccessToken } from "../lib/auth/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";

  if (isDev && token.startsWith("mock-token-")) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: "MISSING_TOKEN" });
  }

  try {
    verifyAccessToken(token);
    next();
  } catch (err: unknown) {
    const name = typeof err === "object" && err && "name" in err ? (err as any).name : "";
    if (name === "TokenExpiredError") {
      return res.status(401).json({ error: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}
