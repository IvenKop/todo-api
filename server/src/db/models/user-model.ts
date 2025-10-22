import { BaseModel } from "./base-model.js";

export class UserModel extends BaseModel {
  static override tableName = "users";

  declare id: string;
  email!: string;
  password!: string;

  static override get relationMappings() {
    return {};
  }

  static override get jsonSchema() {
    return {
      type: "object",
      required: ["email", "password"],
      properties: {
        id: { type: "string", format: "uuid" },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 }
      },
      additionalProperties: false
    };
  }
}
