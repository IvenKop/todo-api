import { TodoModel } from "../models/todo-model.js";

export type TodoRecord = Pick<
  TodoModel,
  "id" | "text" | "completed" | "created_at"
>;

export type TodoFilter = "all" | "active" | "completed";

export interface TodosRepository {
  list(params: {
    filter: TodoFilter;
    page: number;
    limit: number;
  }): Promise<{
    items: TodoRecord[];
    total: number;
  }>;
  create(text: string): Promise<TodoRecord>;
  update(
    id: string,
    data: { text?: string; completed?: boolean }
  ): Promise<TodoRecord | null>;
  delete(id: string): Promise<boolean>;
  clearCompleted(): Promise<void>;
}

const toRecord = (todo: TodoModel): TodoRecord => ({
  id: todo.id,
  text: todo.text,
  completed: todo.completed,
  created_at: todo.created_at
});

export function createTodosRepository(): TodosRepository {
  return {
    async list({ filter, page, limit }) {
      const query = TodoModel.query().modify((builder) => {
        if (filter === "active") {
          builder.where("completed", false);
        } else if (filter === "completed") {
          builder.where("completed", true);
        }
      });

      const { results, total } = await query
        .orderBy("created_at", "desc")
        .page(page - 1, limit);

      return {
        items: results.map(toRecord),
        total
      };
    },

    async create(text) {
      const todo = await TodoModel.query().insertAndFetch({ text });
      return toRecord(todo);
    },

    async update(id, data) {
      if (Object.keys(data).length === 0) {
        const existing = await TodoModel.query().findById(id);
        return existing ? toRecord(existing) : null;
      }

      const todo = await TodoModel.query().patchAndFetchById(id, data);
      return todo ? toRecord(todo) : null;
    },

    async delete(id) {
      const deleted = await TodoModel.query().deleteById(id);
      return deleted > 0;
    },

    async clearCompleted() {
      await TodoModel.query().delete().where("completed", true);
    }
  };
}
