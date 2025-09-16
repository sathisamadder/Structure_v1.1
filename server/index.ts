import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Local projects API (file-based) for testing - requires x-api-key header (default: LOCAL_DEV_KEY)
  const projects = require("./routes/projects");
  app.get("/api/projects", projects.listProjects);
  app.post("/api/projects", projects.createProject);
  app.get("/api/projects/:id", projects.getProject);
  app.put("/api/projects/:id", projects.updateProject);
  app.delete("/api/projects/:id", projects.deleteProject);

  // AI parsing (mock) for layout extraction
  const ai = require("./routes/ai");
  app.post("/api/ai/parse-layout", ai.parseLayout);

  return app;
}
