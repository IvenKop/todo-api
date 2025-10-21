import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { LoginBodySchema } from "../schemas/auth";
import type { Db } from "../db";

const router = Router();

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginBodySchema.parse(req.body);
    const db = req.app.get("db") as Db;
    const user = await db.users.findByCredentials(email, password);

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const token = "mock-token-" + email;
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

export default router;
