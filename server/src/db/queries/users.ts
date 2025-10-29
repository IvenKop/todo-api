import { UserModel } from "../models/user-model.js";
import { hashPassword, verifyPassword } from "../../lib/auth/password.js";
import { isDev } from "../../config/env.js";

export type UserRecord = Pick<UserModel, "id" | "email">;

export interface UsersRepository {
  findByCredentials(email: string, password: string): Promise<UserRecord | null>;
  ensureSeedUser(): Promise<void>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
}

const toRecord = (user: UserModel): UserRecord => ({
  id: user.id,
  email: user.email
});

export function createUsersRepository(): UsersRepository {
  return {
    async findByCredentials(email, password) {
      const user = await UserModel.query().findOne({ email });
      if (!user) return null;

      const ph = (user as any).password_hash as string | null | undefined;
      if (ph && ph.length > 0) {
        const ok = await verifyPassword(password, ph);
        return ok ? toRecord(user) : null;
      }

      if (isDev) {
        if ((user as any).password === password) {
          return toRecord(user);
        }
      }

      return null;
    },

    async findByEmail(email) {
      const user = await UserModel.query().findOne({ email });
      return user ? toRecord(user) : null;
    },

    async findById(id) {
      const user = await UserModel.query().findById(id);
      return user ? toRecord(user) : null;
    },

    async ensureSeedUser() {
      const email = "user@mail.com";
      const password = "Aa1!abcd";
      const exists = await UserModel.query().findOne({ email });
      if (exists) return;
      const password_hash = await hashPassword(password);
      await UserModel.query()
        .insert({ email, password, password_hash } as any)
        .onConflict("email")
        .ignore();
    }
  };
}
