import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: {
      type: "text",
      notNull: true,
      unique: true,
    },
    password: {
      type: "text",
      notNull: true,
    },
  });

  pgm.createTable("todos", {
    id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
    text: {
      type: "text",
      notNull: true,
    },
    completed: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("todos");
  pgm.dropTable("users");
  pgm.dropExtension("pgcrypto", { ifExists: true });
}