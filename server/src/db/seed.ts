import { pool } from "../lib/db.js";
import { runMigrations, runSeed } from "./index.js";

async function main() {
  try {
    console.info("Running database migrations before seeding…");
    await runMigrations();

    const summary = await runSeed();
    console.info("Seed completed:", summary);
  } catch (error) {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}