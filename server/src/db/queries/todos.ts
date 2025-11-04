import { TodoMongo, type TodoDoc } from "../../mongo/models/todo.js";

export type TodoRecord = {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
};

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

const toRecord = (doc: TodoDoc & { _id: any }): TodoRecord => ({
  id: String(doc._id),
  text: doc.text,
  completed: doc.completed,
  created_at: new Date(doc.created_at).toISOString(),
});

export function createTodosRepository(): TodosRepository {
  return {
    async list({ userId, filter, page, limit }) {
      const query: any = { user_id: userId };
      if (filter === "active") query.completed = false;
      else if (filter === "completed") query.completed = true;

      const [items, total] = await Promise.all([
        TodoMongo.find(query)
          .sort({ created_at: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean<TodoDoc[]>(),
        TodoMongo.countDocuments(query),
      ]);

      return {
        items: items.map(d => toRecord(d as any)),
        total,
      };
    },

    async create(userId, text) {
      const created = await TodoMongo.create({
        text,
        user_id: userId,
        completed: false,
        created_at: new Date(),
      });
      return toRecord(created.toObject() as any);
    },

    async update(userId, id, data) {
      const updated = await TodoMongo.findOneAndUpdate(
        { _id: id, user_id: userId },
        { $set: data },
        { new: true, lean: true }
      );
      return updated ? toRecord(updated as any) : null;
    },

    async delete(userId, id) {
      const res = await TodoMongo.deleteOne({ _id: id, user_id: userId });
      return res.deletedCount === 1;
    },

    async clearCompleted(userId) {
      await TodoMongo.deleteMany({ user_id: userId, completed: true });
    },

    async updateBulk(userId, patch, ids) {
      const filter: any = { user_id: userId };
      if (ids && ids.length > 0) filter._id = { $in: ids };

      const res = await TodoMongo.updateMany(filter, { $set: patch });
      return res.modifiedCount ?? 0;
    },
  };
}
