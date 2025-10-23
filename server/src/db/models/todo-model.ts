import { BaseModel } from "./base-model.js";

export class TodoModel extends BaseModel {
  static override tableName = "todos";

  declare id: string;
  text!: string;

  completed: boolean = false;

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
        completed: { type: "boolean", default: false },
        created_at: { type: "string", format: "date-time" }
      },
      additionalProperties: false
    };
  }

  override $beforeInsert() {
    if (this.completed === undefined || this.completed === null) {
      this.completed = false;
    }
    if (!this.created_at) {
      this.created_at = new Date().toISOString();
    }
  }
}
