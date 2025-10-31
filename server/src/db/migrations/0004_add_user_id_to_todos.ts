export async function up(pgm: any): Promise<void> {
  pgm.addColumn("todos", {
    user_id: { type: "uuid", references: "users", onDelete: "CASCADE" }
  });

  pgm.createIndex("todos", "user_id");

  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM users WHERE email = 'user@mail.com') THEN
        UPDATE todos
        SET user_id = (SELECT id FROM users WHERE email = 'user@mail.com')
        WHERE user_id IS NULL;
      END IF;
    END
    $$;
  `);
}

export async function down(pgm: any): Promise<void> {
  pgm.dropIndex("todos", "user_id");
  pgm.dropColumn("todos", "user_id");
}
