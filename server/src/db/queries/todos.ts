import type { Pool } from "pg";

export interface TodoRecord {
  id: string;
  text: string;
  completed: boolean;
  created_at: Date;
}

export type TodoFilter = "all" | "active" | "completed";

export interface TodosRepository {
  list(params: { filter: TodoFilter; page: number; limit: number }): Promise<{
    items: TodoRecord[];
    total: number;
  }>;
  create(text: string): Promise<TodoRecord>;
  update(id: string, data: { text?: string; completed?: boolean }): Promise<TodoRecord | null>;
  delete(id: string): Promise<boolean>;
  clearCompleted(): Promise<void>;
}

export function createTodosRepository(pool: Pool): TodosRepository {
  const filterClauses: Record<TodoFilter, string> = {
    all: "",
    active: "WHERE completed = false",
    completed: "WHERE completed = true",
  };

  return {
    async list({ filter, page, limit }) {
      const where = filterClauses[filter];
      const offset = (page - 1) * limit;

      const [itemsResult, countResult] = await Promise.all([
        pool.query<TodoRecord>(
          `SELECT id, text, completed, created_at FROM todos ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset],
        ),
        pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM todos ${where}`,
        ),
      ]);

      return {
        items: itemsResult.rows,
        total: Number(countResult.rows[0]?.count ?? 0),
      };
    },

    async create(text) {
      const { rows } = await pool.query<TodoRecord>(
        "INSERT INTO todos (text) VALUES ($1) RETURNING id, text, completed, created_at",
        [text],
      );

      return rows[0];
    },

    async update(id, data) {
      const fields: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (data.text !== undefined) {
        fields.push(`text = $${index++}`);
        values.push(data.text);
      }

      if (data.completed !== undefined) {
        fields.push(`completed = $${index++}`);
        values.push(data.completed);
      }

      if (fields.length === 0) {
        const { rows } = await pool.query<TodoRecord>(
          "SELECT id, text, completed, created_at FROM todos WHERE id = $1",
          [id],
        );
        return rows[0] ?? null;
      }

      values.push(id);

      const { rows } = await pool.query<TodoRecord>(
        `UPDATE todos SET ${fields.join(", ")} WHERE id = $${index} RETURNING id, text, completed, created_at`,
        values,
      );

      return rows[0] ?? null;
    },

    async delete(id) {
      const { rowCount } = await pool.query("DELETE FROM todos WHERE id = $1", [id]);
      return (rowCount ?? 0) > 0;
    },

    async clearCompleted() {
      await pool.query("DELETE FROM todos WHERE completed = true");
    },
  };
}
