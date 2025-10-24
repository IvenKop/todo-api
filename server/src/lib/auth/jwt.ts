import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";

export function signAccessToken(payload: object) {
  if (!env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not set");
  }
  const secret: Secret = env.ACCESS_TOKEN_SECRET;
  const opts: SignOptions = {};
  if (env.ACCESS_TOKEN_TTL) {
    (opts as any).expiresIn = env.ACCESS_TOKEN_TTL as any;
  } else {
    (opts as any).expiresIn = "15m" as any;
  }
  return jwt.sign(payload as object, secret, opts);
}

export function verifyAccessToken(token: string) {
  if (!env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not set");
  }
  const secret: Secret = env.ACCESS_TOKEN_SECRET;
  return jwt.verify(token, secret) as { sub: string; [k: string]: unknown };
}
