import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { LoginBodySchema } from "../schemas/auth.js";
import type { Db } from "../db/index.js";
import { signAccessToken, signRefreshToken } from "../lib/auth/jwt.js";

const router = Router();

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginBodySchema.parse(req.body);
    const db = req.app.get("db") as Db;
    const user = await db.users.findByCredentials(email, password);
    if (!user) return res.status(401).json({ error: "WRONG_EMAIL_OR_PASSWORD" });

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
