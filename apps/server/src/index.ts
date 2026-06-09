import { auth } from "@forge/auth";
import { env } from "@forge/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import projectRoutes from "./routes/projects";
import { errorHandler } from "./middleware/error-handler";
import { subdomainProxy } from "./proxy";
import { createSocketServer } from "./utils/socket";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/projects", projectRoutes);

app.use(subdomainProxy);

app.use(errorHandler);

const server = createSocketServer(app);

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
