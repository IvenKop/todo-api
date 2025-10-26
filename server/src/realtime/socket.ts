import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "../config/env.js";

type ServerToClientEvents = {
  hello: (payload: { message: string; time: string }) => void;
};
type ClientToServerEvents = { ping: (text: string) => void };

export function initSocket(httpServer: HttpServer) {
  const allowedOrigins =
    env.CORS_ORIGIN?.split(",").map(s => s.trim()) ?? true;

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
      message: "Hi, conection is ready",
      time: new Date().toISOString(),
    });
    socket.on("ping", (text) => {
      console.log("[socket] ping from client:", text);
    });
    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });
  });

  console.log("[socket] Socket.IO initialized at /socket.io");
  return io;
}
