import { knex } from "../lib/db.js";
import { runMigrations, runSeed } from "./index.js";
import { BaseModel } from "./models/base-model.js";

async function main() {
  try {
    BaseModel.knex(knex);

    console.info("Running database migrations before seeding…");
    await runMigrations();

    const summary = await runSeed(knex);
    console.info("Seed completed:", summary);
  } catch (error) {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}