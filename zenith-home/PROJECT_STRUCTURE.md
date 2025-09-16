Project Structure — Structural Analysis Tool

This document lists the main files, components, and server routes added for the preliminary Structural Analysis Tool.

Client (React)
- client/App.tsx
  - Entrypoint that mounts routes.

- client/pages/Index.tsx
  - Main application page. Contains Header, Footer and main layout.
  - Uses components:
    - GridEditor: edit grid bays, upload layout image, toggle columns
    - InputsPanel: building and material inputs
    - ResultsPanel: tables for columns, beams, slabs, footings and BOQ
    - ThreeDView: simple 3D visualization using react-three-fiber
    - ActionsBar: save/load (localStorage + local file-API), cost inputs, print

- client/components/structural/
  - GridEditor.tsx — interactive SVG grid editor, file upload for layout image
  - InputsPanel.tsx — form inputs for soil, usage, floors, materials, geometry
  - ResultsPanel.tsx — displays analysis results in tables
  - ThreeDView.tsx — lightweight 3D model of grid using three.js
  - ActionsBar.tsx — save/load actions, print, remote save via local API

- client/components/ui/
  - Re-usable UI primitives (button, input, select, label, tabs, etc.)

- client/lib/structural/
  - types.ts — data model types for project, results, BOQ, etc.
  - calc.ts — analysis engine: loads, tributary areas, column sizing, beam/slab checks, BOQ and cost estimates.

Server (Express)
- server/index.ts — Express app initialization and route registration
  - /api/ping
  - /api/demo
  - /api/projects (file-based local API with x-api-key header)
    - GET /api/projects
    - POST /api/projects
    - GET /api/projects/:id
    - PUT /api/projects/:id
    - DELETE /api/projects/:id

- server/routes/projects.ts — simple file-based storage in server/data/projects.json
  - Protects endpoints with x-api-key header (default: LOCAL_DEV_KEY)

How to test locally (dev server)
1. Start dev server: pnpm dev (the environment already runs the dev server in this workspace).
2. Open app main page (/) in preview.
3. Use the UI to edit grid, change inputs, and view results.
4. Save locally (localStorage) or save to the file-based API (requires x-api-key header which is sent automatically by the client code using LOCAL_DEV_KEY).

Notes and next steps
- The analysis engine is a preliminary estimator meant for conceptual design and not a replacement for licensed structural calculations.
- AI-based drawing extraction is left as a client-side image upload with placeholder; server-side AI integration or third-party OCR/vision connectors can be added later.
- For production persistence, connect Neon or Supabase (via MCP). To connect, open MCP popover in the Builder UI.
