import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db/index.js";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken
} from "../lib/auth/jwt.js";

const router = Router();

const RefreshBodySchema = z.object({
  refreshToken: z.string().min(10).optional(),
  refresh_token: z.string().min(10).optional(),
  token: z.string().min(10).optional()
});

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = RefreshBodySchema.parse(req.body);
    const raw =
      parsed.refreshToken ?? parsed.refresh_token ?? parsed.token ?? "";

    if (!raw) {
      return res.status(400).json({ error: "MISSING_REFRESH_TOKEN" });
    }

    let payload: { sub?: string; email?: string; [k: string]: unknown };
    try {
      payload = verifyRefreshToken(raw);
    } catch (err: unknown) {
      const name =
        typeof err === "object" && err && "name" in err ? (err as any).name : "";
      if (name === "TokenExpiredError") {
        return res.status(401).json({ error: "REFRESH_EXPIRED" });
      }
      return res.status(401).json({ error: "INVALID_REFRESH" });
    }

    const userId = payload.sub as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: "INVALID_REFRESH" });
    }

    const db = req.app.get("db") as Db;
    const user = await db.users.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "INVALID_REFRESH" });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    res.json({
      token: accessToken,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
