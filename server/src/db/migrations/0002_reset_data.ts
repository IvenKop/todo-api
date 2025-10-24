import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'todos') THEN
        TRUNCATE TABLE public.todos RESTART IDENTITY CASCADE;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'users') THEN
        TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;
      END IF;
    END$$;
  `);
}

export async function down(): Promise<void> {}
