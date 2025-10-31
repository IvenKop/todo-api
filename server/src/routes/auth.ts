import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { z } from "zod";
import { LoginBodySchema } from "../schemas/auth.js";
import type { Db } from "../db/index.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/auth/jwt.js";

const router = Router();

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginBodySchema.parse(req.body);
    const db = req.app.get("db") as Db;
    const user = await db.users.findByCredentials(email, password);
    if (!user) return res.status(401).json({ error: "WRONG_EMAIL_OR_PASSWORD" });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

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

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginBodySchema.parse(req.body);
    const db = req.app.get("db") as Db;

    const exists = await db.users.findByEmail(email);
    if (exists) return res.status(409).json({ error: "EMAIL_TAKEN" });

    const user = await db.users.register(email, password);

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    res.status(201).json({
      token: accessToken,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    next(error);
  }
});

const RefreshBodySchema = z.object({ refreshToken: z.string().min(1) });

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = RefreshBodySchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const db = req.app.get("db") as Db;
    const user = await db.users.findById(String((payload as any).sub));
    if (!user) return res.status(401).json({ error: "UNAUTHORIZED" });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const newRefresh = signRefreshToken({ sub: user.id, email: user.email });

    res.json({
      token: accessToken,
      accessToken,
      refreshToken: newRefresh,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    res.status(401).json({ error: "UNAUTHORIZED" });
  }
});

export default router;
