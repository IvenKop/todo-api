import { Router } from "express";
import { LoginBodySchema } from "../schemas/auth";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = LoginBodySchema.parse(req.body);
  const db = req.app.get("db");
  const user = db.prepare("SELECT * FROM users WHERE email=? AND password=?").get(email, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = "mock-token-" + email;
  res.json({ token, user: { id: user.id, email } });
});

export default router;
