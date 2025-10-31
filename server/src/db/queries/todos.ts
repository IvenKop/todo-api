import { TodoModel } from "../models/todo-model.js";

export type TodoRecord = Pick<
  TodoModel,
  "id" | "text" | "completed" | "created_at"
>;

export type TodoFilter = "all" | "active" | "completed";

export interface TodosRepository {
  list(params: {
    userId: string;
    filter: TodoFilter;
    page: number;
    limit: number;
  }): Promise<{ items: TodoRecord[]; total: number }>;

  create(userId: string, text: string): Promise<TodoRecord>;

  update(
    userId: string,
    id: string,
    data: { text?: string; completed?: boolean }
  ): Promise<TodoRecord | null>;

  delete(userId: string, id: string): Promise<boolean>;

  clearCompleted(userId: string): Promise<void>;

  updateBulk(
    userId: string,
    patch: Partial<Pick<TodoRecord, "text" | "completed">>,
    ids?: string[],
  ): Promise<number>;
}

const toRecord = (todo: TodoModel): TodoRecord => ({
  id: todo.id,
  text: todo.text,
  completed: todo.completed,
  created_at: todo.created_at,
});

export function createTodosRepository(): TodosRepository {
  return {
    async list({ userId, filter, page, limit }) {
      const query = TodoModel.query().where("user_id", userId).modify((qb) => {
        if (filter === "active") qb.where("completed", false);
        else if (filter === "completed") qb.where("completed", true);
      });

      const { results, total } = await query
        .orderBy("created_at", "desc")
        .page(page - 1, limit);

      return { items: results.map(toRecord), total };
    },

    async create(userId, text) {
      const todo = await TodoModel.query().insertAndFetch({ text, user_id: userId });
      return toRecord(todo);
    },

    async update(userId, id, data) {
      if (Object.keys(data).length === 0) {
        const existing = await TodoModel.query().findOne({ id, user_id: userId });
        return existing ? toRecord(existing) : null;
      }
      const exists = await TodoModel.query().findOne({ id, user_id: userId });
      if (!exists) return null;

      const updated = await TodoModel.query().patchAndFetchById(id, data);
      return updated ? toRecord(updated) : null;
    },

    async delete(userId, id) {
      const deleted = await TodoModel.query()
        .delete()
        .where({ id, user_id: userId });
      return deleted > 0;
    },

    async clearCompleted(userId) {
      await TodoModel.query()
        .delete()
        .where({ user_id: userId, completed: true });
    },

    async updateBulk(userId, patch, ids) {
      const qb = TodoModel.query().patch(patch).where("user_id", userId);
      if (ids && ids.length > 0) qb.whereIn("id", ids);
      const res = await qb;
      return Number(res) || 0;
    },
  };
}
