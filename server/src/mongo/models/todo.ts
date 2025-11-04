import { Schema, model, type HydratedDocument } from "mongoose";

export interface TodoDoc {
  text: string;
  norm?: string;
  completed: boolean;
  created_at: Date;
  user_id: string;
}

const TodoSchema = new Schema<TodoDoc>(
  {
    text: { type: String, required: true, minlength: 1, maxlength: 200 },
    norm: { type: String, required: false },
    completed: { type: Boolean, default: false },
    created_at: { type: Date, default: () => new Date() },
    user_id: { type: String, required: true },
  },
  { versionKey: false, timestamps: false },
);

TodoSchema.index({ user_id: 1, created_at: -1 });
TodoSchema.index({ user_id: 1, completed: 1 });

TodoSchema.index(
  { user_id: 1, norm: 1 },
  { unique: true, partialFilterExpression: { norm: { $type: "string" } } },
);

export const TodoMongo = model<TodoDoc>("todos", TodoSchema);
export type TodoHydrated = HydratedDocument<TodoDoc>;
