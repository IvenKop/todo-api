import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";

import auth from "./routes/auth.js";
import todos from "./routes/todos.js";
import refresh from "./routes/refresh.js";
import { requireAuth } from "./middleware/auth.js";
import { initDb } from "./db/index.js";
import { env } from "./config/env.js";
import { initSocket } from "./realtime/socket.js";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN?.split(",").map(s => s.trim()) ?? "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", auth);
app.use("/api", refresh);
app.use("/api", requireAuth, todos);

const httpServer = createServer(app);

initSocket(httpServer);

void (async () => {
  try {
    const db = await initDb();
    app.set("db", db);

    const PORT = Number(env.PORT ?? 4000);
    console.log("[boot] preparing to listen on port", PORT);

    httpServer.listen(PORT, () => {
      console.log(`API + Socket.io listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize application", error);
    process.exit(1);
  }
})();
