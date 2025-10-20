import type { Pool } from "pg";

export interface UserRecord {
  id: string;
  email: string;
  password: string;
}

export interface UsersRepository {
  findByCredentials(email: string, password: string): Promise<UserRecord | null>;
  ensureSeedUser(): Promise<void>;
}

export function createUsersRepository(pool: Pool): UsersRepository {
  return {
    async findByCredentials(email, password) {
      const { rows } = await pool.query<UserRecord>(
        "SELECT id, email, password FROM users WHERE email = $1 AND password = $2 LIMIT 1",
        [email, password],
      );

      return rows[0] ?? null;
    },

    async ensureSeedUser() {
      await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING",
        ["user@mail.com", "Aa1!abcd"],
      );
    },
  };
}
