import mongoose from "mongoose";
import { env } from "../config/env.js";

let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }
  await mongoose.connect(env.MONGODB_URI, {
  } as any);
  isConnected = true;
  console.log("[mongo] connected");
}

export function getMongo() {
  if (!isConnected) {
    throw new Error("MongoDB is not connected. Call connectMongo() first.");
  }
  return mongoose;
}
