import express from "express";
import cors from "cors";
import morgan from "morgan";
import auth from "./routes/auth.js";
import todos from "./routes/todos.js";
import { requireAuth } from "./middleware/auth.js";
import { initDb } from "./db/index.js";
import { env } from "./config/env.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

void (async () => {
  try {
    const db = await initDb();
    app.set("db", db);

    app.use("/api", auth);
    app.use("/api", requireAuth, todos);

    app.listen(env.PORT, () =>
      console.log(`API listening on http://localhost:${env.PORT}`),
    );
  } catch (error) {
    console.error("Failed to initialize application", error);
    process.exit(1);
  }
})();
