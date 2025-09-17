import { Suspense, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GridSpec, BuildingSpec } from "@/lib/structural/types";

interface Props {
  grid: GridSpec;
  building: BuildingSpec;
}

type Preset = "iso" | "top" | "front";

export default function ThreeDView({ grid, building }: Props) {
  const nodes = useMemo(() => buildNodes(grid, building), [grid, building]);
  const [showAxes, setShowAxes] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showSlabs, setShowSlabs] = useState(true);
  const [preset, setPreset] = useState<Preset>("iso");

  return (
    <div className="relative h-[520px] w-full rounded-md border bg-white">
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <directionalLight castShadow position={[10, 20, 10]} intensity={0.8} />
        <Suspense fallback={null}>
          <group position={[-nodes.offsetX, 0, -nodes.offsetY]}>
            {showSlabs &&
              nodes.slabs.map((s, idx) => (
                <mesh
                  key={"slab-" + idx}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[s.cx, s.y, s.cy]}
                  receiveShadow
                >
                  <planeGeometry args={[s.lx, s.ly]} />
                  <meshStandardMaterial
                    color="#93c5fd"
                    transparent
                    opacity={0.25}
                  />
                </mesh>
              ))}
            {nodes.columns.map((c, idx) => (
              <mesh key={idx} position={[c.x, c.h / 2, c.y]} castShadow>
                <boxGeometry args={[c.b, c.h, c.b]} />
                <meshStandardMaterial color="#2563eb" />
              </mesh>
            ))}
            {nodes.beams.map((b, idx) => (
              <mesh
                key={idx}
                position={[b.cx, b.cy, b.cz]}
                rotation={[0, b.ry, 0]}
                castShadow
              >
                <boxGeometry args={[b.l, b.h, b.b]} />
                <meshStandardMaterial color="#0ea5e9" />
              </mesh>
            ))}
            {/* ground */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.01, 0]}
              receiveShadow
            >
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
            {showGrid && (
              <gridHelper
                args={[100, 100, "#cbd5e1", "#e2e8f0"]}
                position={[0, 0.001, 0]}
              />
            )}
            {showAxes && <axesHelper args={[4]} />}
          </group>
          <CameraPreset preset={preset} />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
      {/* Toolbar */}
      <div className="absolute right-2 top-2 flex gap-2 rounded-md border bg-white/80 p-2 text-xs">
        <button
          className="px-2 py-1 rounded border"
          onClick={() => setPreset("iso")}
        >
          ISO
        </button>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => setPreset("top")}
        >
          Top
        </button>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => setPreset("front")}
        >
          Front
        </button>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => setShowGrid((s) => !s)}
        >
          {showGrid ? "Grid on" : "Grid off"}
        </button>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => setShowAxes((s) => !s)}
        >
          {showAxes ? "Axes on" : "Axes off"}
        </button>
        <button
          className="px-2 py-1 rounded border"
          onClick={() => setShowSlabs((s) => !s)}
        >
          {showSlabs ? "Slabs on" : "Slabs off"}
        </button>
        <ScreenshotButton />
      </div>
    </div>
  );
}

function CameraPreset({ preset }: { preset: Preset }) {
  const { camera } = useThree();
  // adjust camera position on preset change
  useMemo(() => {
    if (preset === "iso") camera.position.set(10, 10, 10);
    else if (preset === "top") camera.position.set(0.01, 20, 0.01);
    else if (preset === "front") camera.position.set(0, 6, 20);
    camera.lookAt(0, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return undefined;
  }, [preset]);
  return null;
}

function ScreenshotButton() {
  const { gl } = useThree();
  return (
    <button
      className="px-2 py-1 rounded border"
      onClick={() => {
        const url = gl.domElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "preview.png";
        a.click();
      }}
    >
      PNG
    </button>
  );
}

function buildNodes(grid: GridSpec, building: BuildingSpec) {
  const xs: number[] = [0];
  for (let i = 0; i < grid.xSpacingsM.length; i++)
    xs.push(xs[i] + grid.xSpacingsM[i]);
  const ys: number[] = [0];
  for (let j = 0; j < grid.ySpacingsM.length; j++)
    ys.push(ys[j] + grid.ySpacingsM[j]);
  const offsetX = xs[xs.length - 1] / 2;
  const offsetY = ys[ys.length - 1] / 2;
  const cols: { x: number; y: number; b: number; h: number }[] = [];
  for (let i = 0; i <= grid.nx; i++)
    for (let j = 0; j <= grid.ny; j++)
      if (grid.columns[i]?.[j]) {
        cols.push({
          x: xs[i],
          y: ys[j],
          b: 0.25,
          h: building.floors * building.floorHeightM,
        });
      }
  const beams: {
    cx: number;
    cy: number;
    cz: number;
    l: number;
    b: number;
    h: number;
    ry: number;
  }[] = [];
  const level = building.floorHeightM * 0.9;
  // X beams
  for (let j = 0; j <= grid.ny; j++)
    for (let i = 0; i < grid.nx; i++)
      if (grid.columns[i]?.[j] && grid.columns[i + 1]?.[j]) {
        const l = grid.xSpacingsM[i];
        const cx = (xs[i] + xs[i + 1]) / 2;
        const cz = ys[j];
        beams.push({
          cx,
          cy: level,
          cz,
          l,
          b: building.beamWidthM,
          h: building.beamDepthM,
          ry: 0,
        });
      }
  // Y beams
  for (let i = 0; i <= grid.nx; i++)
    for (let j = 0; j < grid.ny; j++)
      if (grid.columns[i]?.[j] && grid.columns[i]?.[j + 1]) {
        const l = grid.ySpacingsM[j];
        const cx = xs[i];
        const cz = (ys[j] + ys[j + 1]) / 2;
        beams.push({
          cx,
          cy: level,
          cz,
          l,
          b: building.beamWidthM,
          h: building.beamDepthM,
          ry: Math.PI / 2,
        });
      }
  // Slabs as full footprint per floor
  const lx = xs[xs.length - 1];
  const ly = ys[ys.length - 1];
  const slabs: { cx: number; cy: number; y: number; lx: number; ly: number }[] =
    [];
  for (let f = 1; f <= building.floors; f++) {
    const y = f * building.floorHeightM - 0.02;
    slabs.push({ cx: lx / 2 - offsetX, cy: ly / 2 - offsetY, y, lx, ly });
  }
  return { columns: cols, beams, slabs, offsetX, offsetY };
}
