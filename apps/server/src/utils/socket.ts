import { createServer, type Server } from "node:http";
import type { Express } from "express";
import { Server as SocketIOServer } from "socket.io";
import { auth } from "@forge/auth";
import { env } from "@forge/env/server";
import { findProjectById } from "../db/projects.db";
import { logStream } from "./log-stream";

export function createSocketServer(app: Express): Server {
  const server = createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  console.log("[socket] Socket.IO server created");

  io.use(async (socket, next) => {
    const headers = socket.handshake.headers as Record<string, string>;
    try {
      const session = await auth.api.getSession({ headers });
      if (!session?.user?.id) {
        console.log("[socket] Auth failed for socket", socket.id);
        next(new Error("Unauthorized"));
        return;
      }
      (socket as any).userId = session.user.id;
      console.log("[socket] Socket authenticated", socket.id, "user", session.user.id);
      next();
    } catch (err) {
      console.error("[socket] Auth error", err);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId as string;
    const projectId = socket.handshake.query.projectId as string | undefined;
    const deploymentId = socket.handshake.query.deploymentId as string | undefined;

    console.log(
      "[socket] Connected", socket.id,
      "user", userId,
      "project", projectId,
      "deployment", deploymentId,
    );

    if (!projectId || !deploymentId) {
      socket.emit("error", "Missing projectId or deploymentId");
      socket.disconnect();
      return;
    }

    try {
      const project = await findProjectById(projectId);
      if (!project || project.userId !== userId) {
        socket.emit("error", "Forbidden");
        socket.disconnect();
        return;
      }
    } catch {
      socket.emit("error", "Internal server error");
      socket.disconnect();
      return;
    }

    socket.join(`deployment:${deploymentId}`);
    console.log("[socket] Subscribed to deployment", deploymentId);

    const unsubscribe = logStream.subscribe(deploymentId, (chunk) => {
      socket.emit("log", chunk);
    });

    socket.on("disconnect", () => {
      console.log("[socket] Disconnected", socket.id);
      unsubscribe();
    });
  });

  return server;
}
