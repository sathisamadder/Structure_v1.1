import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const FILE = path.join(DATA_DIR, "projects.json");
const API_KEY = process.env.LOCAL_API_KEY || "LOCAL_DEV_KEY";

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([]), "utf-8");
}

function readAll() {
  ensureFile();
  try { return JSON.parse(fs.readFileSync(FILE, "utf-8")); } catch { return []; }
}
function writeAll(arr: any[]) { ensureFile(); fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), "utf-8"); }

function requireApiKey(req: any) {
  const key = req.headers["x-api-key"] || req.query.apiKey;
  return key === API_KEY;
}

export const listProjects: RequestHandler = (req, res) => {
  if (!requireApiKey(req)) return res.status(401).json({ error: "Missing or invalid API key" });
  res.json(readAll());
};

export const createProject: RequestHandler = (req, res) => {
  if (!requireApiKey(req)) return res.status(401).json({ error: "Missing or invalid API key" });
  const body = req.body || {};
  const all = readAll();
  const id = Date.now().toString(36);
  const item = { id, createdAt: new Date().toISOString(), ...body };
  all.push(item);
  writeAll(all);
  res.status(201).json(item);
};

export const getProject: RequestHandler = (req, res) => {
  if (!requireApiKey(req)) return res.status(401).json({ error: "Missing or invalid API key" });
  const id = req.params.id;
  const all = readAll();
  const found = all.find((a: any) => a.id === id);
  if (!found) return res.status(404).json({ error: "Not found" });
  res.json(found);
};

export const updateProject: RequestHandler = (req, res) => {
  if (!requireApiKey(req)) return res.status(401).json({ error: "Missing or invalid API key" });
  const id = req.params.id;
  const all = readAll();
  const idx = all.findIndex((a: any) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  all[idx] = { ...all[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeAll(all);
  res.json(all[idx]);
};

export const deleteProject: RequestHandler = (req, res) => {
  if (!requireApiKey(req)) return res.status(401).json({ error: "Missing or invalid API key" });
  const id = req.params.id;
  const all = readAll();
  const idx = all.findIndex((a: any) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const removed = all.splice(idx, 1)[0];
  writeAll(all);
  res.json(removed);
};
