import React, { useMemo, useRef, useState } from "react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { round } from "@/lib/structural/calc";
import { GridSpec } from "@/lib/structural/types";

interface Props {
  grid: GridSpec;
  onGridChange: (grid: GridSpec) => void;
}

export default function GridEditor({ grid, onGridChange }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageOpacity, setImageOpacity] = useState(0.4);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const widthM = useMemo(() => grid.xSpacingsM.reduce((a, b) => a + b, 0), [grid]);
  const heightM = useMemo(() => grid.ySpacingsM.reduce((a, b) => a + b, 0), [grid]);

  const handleToggle = (i: number, j: number) => {
    const next = grid.columns.map(row => row.slice());
    next[i][j] = !next[i][j];
    onGridChange({ ...grid, columns: next });
  };

  const updateSpacing = (axis: "x" | "y", idx: number, val: number) => {
    if (isNaN(val) || val <= 0) return;
    if (axis === "x") {
      const x = grid.xSpacingsM.slice();
      x[idx] = val; onGridChange({ ...grid, xSpacingsM: x });
    } else {
      const y = grid.ySpacingsM.slice();
      y[idx] = val; onGridChange({ ...grid, ySpacingsM: y });
    }
  };

  const updateLabel = (axis: "x" | "y", idx: number, value: string) => {
    if (axis === "x") {
      const labels = (grid.xLabels || Array.from({ length: grid.nx + 1 }, (_, i) => String(i + 1))).slice();
      labels[idx] = value;
      onGridChange({ ...grid, xLabels: labels });
    } else {
      const labels = (grid.yLabels || Array.from({ length: grid.ny + 1 }, (_, i) => String.fromCharCode(65 + i))).slice();
      labels[idx] = value;
      onGridChange({ ...grid, yLabels: labels });
    }
  };

  const addBay = (axis: "x" | "y") => {
    if (axis === "x") {
      const x = grid.xSpacingsM.concat(grid.xSpacingsM[grid.xSpacingsM.length - 1] || 5);
      const cols = Array.from({ length: x.length + 1 }, (_, i) =>
        Array.from({ length: grid.ny + 1 }, (_, j) => grid.columns[Math.min(i, grid.nx)]?.[j] ?? true),
      );
      const xLabels = (grid.xLabels || Array.from({ length: grid.nx + 1 }, (_, i) => String(i + 1))).concat(String(grid.nx + 2));
      onGridChange({ ...grid, nx: grid.nx + 1, xSpacingsM: x, columns: cols, xLabels });
    } else {
      const y = grid.ySpacingsM.concat(grid.ySpacingsM[grid.ySpacingsM.length - 1] || 4);
      const cols = Array.from({ length: grid.nx + 1 }, (_, i) =>
        Array.from({ length: y.length + 1 }, (_, j) => grid.columns[i]?.[Math.min(j, grid.ny)] ?? true),
      );
      const yLabels = (grid.yLabels || Array.from({ length: grid.ny + 1 }, (_, i) => String.fromCharCode(65 + i))).concat(String.fromCharCode(65 + grid.ny + 1));
      onGridChange({ ...grid, ny: grid.ny + 1, ySpacingsM: y, columns: cols, yLabels });
    }
  };

  const removeBay = (axis: "x" | "y") => {
    if (axis === "x" && grid.nx > 1) {
      const x = grid.xSpacingsM.slice(0, -1);
      const cols = grid.columns.slice(0, -1);
      const xLabels = (grid.xLabels || []).slice(0, -1);
      onGridChange({ ...grid, nx: grid.nx - 1, xSpacingsM: x, columns: cols, xLabels });
    }
    if (axis === "y" && grid.ny > 1) {
      const y = grid.ySpacingsM.slice(0, -1);
      const cols = grid.columns.map(r => r.slice(0, -1));
      const yLabels = (grid.yLabels || []).slice(0, -1);
      onGridChange({ ...grid, ny: grid.ny - 1, ySpacingsM: y, columns: cols, yLabels });
    }
  };

  const analyzeLayout = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return alert('Please choose an image first');
    setAnalyzing(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
      const res = await fetch('/api/ai/parse-layout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ imageData: dataUrl }) });
      if (!res.ok) throw new Error('AI parse failed');
      const json = await res.json();
      if (json?.grid) {
        // normalize columns shape
        onGridChange({ ...json.grid });
        setImageUrl((prev)=>prev); // keep preview
      } else {
        alert('AI returned no grid');
      }
    } catch (err) {
      console.error(err);
      alert('AI analysis failed: ' + err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">Total: {round(widthM,2)}m × {round(heightM,2)}m</div>
        <div className="flex items-center gap-2">
          <Input ref={fileRef} type="file" accept="image/*,application/pdf,video/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return; const url = URL.createObjectURL(f); setImageUrl(url);
          }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>Upload layout image</Button>
          <Button size="sm" variant="default" onClick={analyzeLayout} disabled={analyzing}>{analyzing ? 'Analyzing...' : 'Analyze layout (AI)'}</Button>
          <div className="flex items-center gap-2 text-xs"><span>Opacity</span><input type="range" min={0} max={1} step={0.05} value={imageOpacity} onChange={(e)=>setImageOpacity(parseFloat(e.target.value))} /></div>
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="space-y-2">
          <div className="text-xs font-medium">X bay spacing (m)</div>
          <div className="flex flex-col gap-2">
            {grid.xSpacingsM.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input type="number" step="0.1" value={v} onChange={(e)=>updateSpacing("x", i, parseFloat(e.target.value))} className="w-24" />
                <Input type="text" value={(grid.xLabels||[])[i]||String(i+1)} onChange={(e)=>updateLabel("x", i, e.target.value)} className="w-20" />
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={()=>addBay("x")}>Add X bay</Button>
              <Button size="sm" variant="outline" onClick={()=>removeBay("x")}>Remove X bay</Button>
            </div>
          </div>
        </div>
        <div className="relative border rounded-md aspect-[4/3] bg-white">
          {imageUrl && (
            <img src={imageUrl} alt="layout" className="absolute inset-0 w-full h-full object-contain" style={{opacity: imageOpacity}} />
          )}
          <SvgGrid grid={grid} onToggle={handleToggle} />
        </div>
      </div>
      <div>
        <div className="text-xs font-medium mb-1">Y bay spacing (m)</div>
        <div className="flex flex-wrap gap-2">
          {grid.ySpacingsM.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input type="number" step="0.1" value={v} onChange={(e)=>updateSpacing("y", i, parseFloat(e.target.value))} className="w-24" />
              <Input type="text" value={(grid.yLabels||[])[i]||String.fromCharCode(65+i)} onChange={(e)=>updateLabel("y", i, e.target.value)} className="w-20" />
            </div>
          ))}
          <Button size="sm" onClick={()=>addBay("y")}>Add Y bay</Button>
          <Button size="sm" variant="outline" onClick={()=>removeBay("y")}>Remove Y bay</Button>
        </div>
      </div>
    </div>
  );
}

function SvgGrid({ grid, onToggle }: { grid: GridSpec; onToggle: (i:number,j:number)=>void }) {
  const padding = 20;
  const W = 800, H = 600;
  const totalX = grid.xSpacingsM.reduce((a,b)=>a+b,0);
  const totalY = grid.ySpacingsM.reduce((a,b)=>a+b,0);
  const sx = (W - 2*padding) / totalX;
  const sy = (H - 2*padding) / totalY;
  const scale = Math.min(sx, sy);
  const xs: number[] = [padding];
  for (let i=0;i<grid.xSpacingsM.length;i++) xs.push(xs[i] + grid.xSpacingsM[i]*scale);
  const ys: number[] = [padding];
  for (let j=0;j<grid.ySpacingsM.length;j++) ys.push(ys[j] + grid.ySpacingsM[j]*scale);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
      <rect x={0} y={0} width={W} height={H} fill="transparent" />
      {/* grid lines */}
      {xs.map((x, i)=>(
        <g key={"vxg"+i}>
          <line x1={x} y1={ys[0]} x2={x} y2={ys[ys.length-1]} stroke="#94a3b8" strokeDasharray="4 4" />
          <text x={x} y={ys[0]-8} textAnchor="middle" fontSize={12} fill="#334155">{(grid.xLabels||[])[i]||String(i+1)}</text>
        </g>
      ))}
      {ys.map((y, j)=>(
        <g key={"hyg"+j}>
          <line x1={xs[0]} y1={y} x2={xs[xs.length-1]} y2={y} stroke="#94a3b8" strokeDasharray="4 4" />
          <text x={xs[0]-12} y={y+4} textAnchor="end" fontSize={12} fill="#334155">{(grid.yLabels||[])[j]||String.fromCharCode(65+j)}</text>
        </g>
      ))}
      {/* columns */}
      {xs.map((x,i)=> ys.map((y,j)=> {
        const active = grid.columns[i]?.[j];
        const r = active ? 7 : 4;
        const fill = active ? "hsl(var(--primary))" : "#cbd5e1";
        return (
          <g key={`n-${i}-${j}`} onClick={()=>onToggle(i,j)} className="cursor-pointer">
            <circle cx={x} cy={y} r={r} fill={fill} />
          </g>
        );
      }))}
    </svg>
  );
}
