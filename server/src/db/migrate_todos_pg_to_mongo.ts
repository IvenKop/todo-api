import { knex } from "../lib/db.js";
import { connectMongo } from "../mongo/connection.js";
import { TodoMongo } from "../mongo/models/todo.js";

async function run() {
  await connectMongo();
  const rows = await knex("todos").select("*");

  if (rows.length > 0) {
    const docs = rows.map(r => ({
      text: r.text,
      completed: r.completed ?? false,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      user_id: r.user_id,
    }));
    await TodoMongo.insertMany(docs, { ordered: false });
    console.log(`[migrate] inserted ${docs.length} todos to Mongo`);
  } else {
    console.log("[migrate] no todos found in Postgres");
  }

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
