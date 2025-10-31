import "express";

declare global {
  namespace Express {
    interface UserTokenPayload {
      id: string;
      email?: string;
    }
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

export {};
