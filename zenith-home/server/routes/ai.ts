import { RequestHandler } from "express";

// Mock AI parser: accepts { imageData: string } (data URL) and returns a GridSpec-like object
export const parseLayout: RequestHandler = (req, res) => {
  const body = req.body || {};
  const imageData = body.imageData || null;

  // Very simple heuristic/mock: if client provided current grid in body, echo it; otherwise return a sample 3x2 grid
  if (body.grid) {
    return res.json({ grid: body.grid });
  }

  const grid = {
    nx: 3,
    ny: 2,
    xSpacingsM: [5, 5, 5],
    ySpacingsM: [4, 4],
    columns: Array.from({ length: 4 }, (_, i) => Array.from({ length: 3 }, (_, j) => true)),
    xLabels: ["1", "2", "3", "4"],
    yLabels: ["A", "B", "C"],
  };

  // If imageData exists, try to infer count from image width/height encoded in data URL (not reliable) — keep mock
  return res.json({ grid });
};
