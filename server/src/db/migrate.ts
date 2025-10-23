import { runMigrations } from "./index.js";

async function main() {
  const directionArg = process.argv[2];
  const countArg = process.argv[3];

  const direction = directionArg === "down" ? "down" : "up";
  const parsedCount = countArg ? Number.parseInt(countArg, 10) : undefined;
  const count = Number.isNaN(parsedCount ?? NaN) ? undefined : parsedCount;

  await runMigrations({ direction, count });
}

void main().catch((error) => {
  console.error("Migration failed", error);
  process.exitCode = 1;
})