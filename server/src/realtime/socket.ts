import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "../config/env.js";

export type TodoDTO = { id: string; text: string; completed: boolean };

type ServerToClientEvents = {
  // test event
  hello: (payload: { message: string; time: string }) => void;
  // prod events
  "todos:invalidate": () => void;
  "todo:created": (todo: TodoDTO) => void;
  "todo:updated": (todo: TodoDTO) => void;
  "todo:removed": (payload: { id: string }) => void;
};

type ClientToServerEvents = {
  ping: (text: string) => void;
};

let ioRef: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initSocket(httpServer: HttpServer) {
  const allowedOrigins =
    env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true;

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/socket.io",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[socket] client connected:", socket.id);

    socket.emit("hello", {
      message: "Hi, connection is ready",
      time: new Date().toISOString(),
    });

    socket.on("ping", (text) => {
      console.log("[socket] ping from client:", text);
      socket.emit("hello", {
        message: "Pong from server",
        time: new Date().toISOString(),
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });
  });

  ioRef = io;
  console.log("[socket] Socket.IO initialized at /socket.io");
  return io;
}

export function getIO() {
  if (!ioRef) throw new Error("Socket.IO is not initialized");
  return ioRef;
}
