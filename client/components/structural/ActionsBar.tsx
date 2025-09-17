import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CostInputs, ProjectData } from "@/lib/structural/types";

interface Props {
  data: ProjectData;
  onChangeCosts: (c: CostInputs) => void;
  onLoad: (d: ProjectData) => void;
}

export default function ActionsBar({ data, onChangeCosts, onLoad }: Props) {
  const saveLocal = () => {
    localStorage.setItem("structural_project", JSON.stringify(data));
    alert("Saved locally");
  };
  const loadLocal = () => {
    const raw = localStorage.getItem("structural_project");
    if (!raw) {
      alert("No saved project in localStorage");
      return;
    }
    try {
      onLoad(JSON.parse(raw));
      alert("Loaded from localStorage");
    } catch {
      alert("Failed to parse saved project");
    }
  };

  const apiKey =
    (typeof process !== "undefined" &&
      (process as any).env &&
      (process as any).env.LOCAL_API_KEY) ||
    import.meta.env.VITE_LOCAL_API_KEY ||
    "LOCAL_DEV_KEY";
  const saveRemote = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ name: "local-test", data }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      alert("Saved to local API: " + json.id);
    } catch (e) {
      alert("Save remote failed: " + e);
    }
  };
  const listRemote = async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: { "x-api-key": apiKey },
      });
      if (!res.ok) throw new Error("failed");
      const arr = await res.json();
      const id = arr?.[arr.length - 1]?.id;
      if (id) {
        const r = await fetch("/api/projects/" + id, {
          headers: { "x-api-key": apiKey },
        });
        const p = await r.json();
        onLoad(p.data);
        alert("Loaded project " + id);
      } else {
        alert("No remote projects found");
      }
    } catch (e) {
      alert("Load remote failed: " + e);
    }
  };

  const print = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 p-3 bg-muted rounded-md">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={saveLocal}>
          Save (local)
        </Button>
        <Button variant="outline" onClick={loadLocal}>
          Load (local)
        </Button>
        <Button variant="outline" onClick={saveRemote}>
          Save (local API)
        </Button>
        <Button variant="outline" onClick={listRemote}>
          Load (local API)
        </Button>
        <Button onClick={print}>Print / PDF</Button>
      </div>
    </div>
  );
}
