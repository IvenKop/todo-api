export async function up(pgm: any): Promise<void> {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      default: (pgm as any).func("gen_random_uuid()")
    },
    email: {
      type: "text",
      notNull: true,
      unique: true
    },
    password: {
      type: "text",
      notNull: true
    },
    password_hash: {
      type: "text",
      notNull: false
    }
  });

  pgm.createTable("todos", {
    id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      default: (pgm as any).func("gen_random_uuid()")
    },
    text: {
      type: "text",
      notNull: true
    },
    completed: {
      type: "boolean",
      notNull: true,
      default: false
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: (pgm as any).func("current_timestamp")
    },
    user_id: {
      type: "uuid",
      references: "users",
      onDelete: "CASCADE"
    }
  });
}

export async function down(pgm: any): Promise<void> {
  pgm.dropTable("todos");
  pgm.dropTable("users");
  pgm.sql(`DROP EXTENSION IF EXISTS pgcrypto`);
}
