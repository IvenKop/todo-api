import { BaseModel } from "./base-model.js";

export class TodoModel extends BaseModel {
  static override tableName = "todos";

  declare id: string;
  text!: string;
  completed!: boolean;
  created_at!: string;

  static override get relationMappings() {
    return {};
  }

  static override get jsonSchema() {
    return {
      type: "object",
      required: ["text"],
      properties: {
        id: { type: "string", format: "uuid" },
        text: { type: "string", minLength: 1, maxLength: 200 },
        completed: { type: "boolean" },
        created_at: { type: "string", format: "date-time" }
      },
      additionalProperties: false
    };
  }
}
