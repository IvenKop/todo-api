// src/realtime/socket.ts
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "../config/env.js";

type ServerToClientEvents = {
  hello: (payload: { message: string; time: string }) => void;
};

type ClientToServerEvents = {
  ping: (text: string) => void;
};

export function initSocket(httpServer: HttpServer) {
  const allowedOrigins =
    env.CORS_ORIGIN?.split(",").map(s => s.trim()) ?? true;

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.emit("hello", {
      message: "👋 Привет! Соединение установлено.",
      time: new Date().toISOString(),
    });
    socket.on("ping", (text) => {
      console.log("[socket] ping от клиента:", text);
    });
  });

  return io;
}
