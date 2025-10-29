export async function up(pgm: any): Promise<void> {
  pgm.sql(`
    ALTER TABLE IF EXISTS todos
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE
  `);
  pgm.sql(`
    UPDATE todos
    SET user_id = u.id
    FROM (SELECT id FROM users WHERE email = 'user@mail.com' LIMIT 1) AS u
    WHERE todos.user_id IS NULL
  `);
}

export async function down(pgm: any): Promise<void> {
  pgm.sql(`ALTER TABLE IF EXISTS todos DROP COLUMN IF EXISTS user_id`);
}
