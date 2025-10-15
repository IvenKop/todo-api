import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import createDb from "./lib/db";
import auth from "./routes/auth";
import todos from "./routes/todos";
import { requireAuth } from "./middleware/auth";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const db = createDb();
app.set("db", db);

app.use("/api", auth);
app.use("/api", requireAuth, todos);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
