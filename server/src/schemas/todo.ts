import { z } from "zod";

export const filters = ["all", "active", "completed"] as const;
export type TodoFilterLiteral = typeof filters[number];

export const TodoText = z
  .string()
  .trim()
  .min(1, "Text is required.")
  .max(200, "Text must be at most 200 characters.");

export const TodoListQuerySchema = z.object({
  filter: z.enum(filters).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const TodoCreateBodySchema = z.object({
  text: TodoText,
});

export const TodoPatchBodySchema = z
  .object({
    text: TodoText.optional(),
    completed: z.boolean().optional(),
  })
  .refine((d) => d.text !== undefined || d.completed !== undefined, {
    message: "At least one of 'text' or 'completed' must be provided.",
    path: [],
  });

export const TodoPatchBulkBodySchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  patch: TodoPatchBodySchema,
});

export type TodoListQuery = z.infer<typeof TodoListQuerySchema>;
export type TodoCreateBody = z.infer<typeof TodoCreateBodySchema>;
export type TodoPatchBody = z.infer<typeof TodoPatchBodySchema>;
export type TodoPatchBulkBody = z.infer<typeof TodoPatchBulkBodySchema>;
