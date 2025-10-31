import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";

function makeOpts(ttl?: string, fallback?: string): SignOptions {
  const opts: SignOptions = {};
  (opts as any).expiresIn = ttl || fallback;
  return opts;
}

export function signAccessToken(payload: object) {
  if (!env.ACCESS_TOKEN_SECRET) throw new Error("ACCESS_TOKEN_SECRET is not set");
  const secret: Secret = env.ACCESS_TOKEN_SECRET;
  const opts = makeOpts(env.ACCESS_TOKEN_TTL, "15m");
  return jwt.sign(payload as object, secret, opts);
}

export function verifyAccessToken(token: string) {
  if (!env.ACCESS_TOKEN_SECRET) throw new Error("ACCESS_TOKEN_SECRET is not set");
  const secret: Secret = env.ACCESS_TOKEN_SECRET;
  return jwt.verify(token, secret) as { sub: string; [k: string]: unknown };
}

export function signRefreshToken(payload: object) {
  if (!env.REFRESH_TOKEN_SECRET) throw new Error("REFRESH_TOKEN_SECRET is not set");
  const secret: Secret = env.REFRESH_TOKEN_SECRET;
  const opts = makeOpts(env.REFRESH_TOKEN_TTL, "7d");
  return jwt.sign(payload as object, secret, opts);
}

export function verifyRefreshToken(token: string) {
  if (!env.REFRESH_TOKEN_SECRET) throw new Error("REFRESH_TOKEN_SECRET is not set");
  const secret: Secret = env.REFRESH_TOKEN_SECRET;
  return jwt.verify(token, secret) as { sub: string; [k: string]: unknown };
}
