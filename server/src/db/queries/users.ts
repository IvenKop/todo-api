import { UserModel } from "../models/user-model.js";

export type UserRecord = Pick<UserModel, "id" | "email" | "password">;

export interface UsersRepository {
  findByCredentials(
    email: string,
    password: string
  ): Promise<UserRecord | null>;
  ensureSeedUser(): Promise<void>;
}

const toRecord = (user: UserModel): UserRecord => ({
  id: user.id,
  email: user.email,
  password: user.password
});

export function createUsersRepository(): UsersRepository {
  return {
    async findByCredentials(email, password) {
      const user = await UserModel.query().findOne({ email, password });
      return user ? toRecord(user) : null;
    },

    async ensureSeedUser() {
      await UserModel.query()
        .insert({ email: "user@mail.com", password: "Aa1!abcd" })
        .onConflict("email")
        .ignore();
    }
  };
}
