import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GridSpec, BuildingSpec } from "@/lib/structural/types";

interface Props { grid: GridSpec; building: BuildingSpec }

export default function ThreeDView({ grid, building }: Props) {
  const nodes = useMemo(()=>buildNodes(grid, building), [grid, building]);
  return (
    <div className="h-[520px] w-full rounded-md border bg-white">
      <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10,20,10]} intensity={0.6} />
        <Suspense fallback={null}>
          <group position={[-nodes.offsetX, 0, -nodes.offsetY]}>
            {nodes.columns.map((c, idx)=> (
              <mesh key={idx} position={[c.x, c.h/2, c.y]}>
                <boxGeometry args={[c.b, c.h, c.b]} />
                <meshStandardMaterial color="#2563eb" />
              </mesh>
            ))}
            {nodes.beams.map((b, idx)=> (
              <mesh key={idx} position={[b.cx, b.cy, b.cz]} rotation={[0, b.ry, 0]}>
                <boxGeometry args={[b.l, b.h, b.b]} />
                <meshStandardMaterial color="#0ea5e9" />
              </mesh>
            ))}
            {/* ground */}
            <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]}>
              <planeGeometry args={[100,100]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          </group>
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}

function buildNodes(grid: GridSpec, building: BuildingSpec){
  const xs: number[] = [0]; for (let i=0;i<grid.xSpacingsM.length;i++) xs.push(xs[i] + grid.xSpacingsM[i]);
  const ys: number[] = [0]; for (let j=0;j<grid.ySpacingsM.length;j++) ys.push(ys[j] + grid.ySpacingsM[j]);
  const offsetX = xs[xs.length-1]/2; const offsetY = ys[ys.length-1]/2;
  const cols: {x:number,y:number,b:number,h:number}[] = [];
  for (let i=0;i<=grid.nx;i++) for (let j=0;j<=grid.ny;j++) if (grid.columns[i]?.[j]) {
    cols.push({ x: xs[i], y: ys[j], b: 0.25, h: building.floors * building.floorHeightM });
  }
  const beams: { cx:number, cy:number, cz:number, l:number, b:number, h:number, ry:number }[] = [];
  const level = building.floorHeightM*0.9;
  // X beams
  for (let j=0;j<=grid.ny;j++) for (let i=0;i<grid.nx;i++) if (grid.columns[i]?.[j] && grid.columns[i+1]?.[j]){
    const l = grid.xSpacingsM[i]; const cx = (xs[i]+xs[i+1])/2; const cz = ys[j];
    beams.push({ cx, cy: level, cz, l, b: building.beamWidthM, h: building.beamDepthM, ry: 0 });
  }
  // Y beams
  for (let i=0;i<=grid.nx;i++) for (let j=0;j<grid.ny;j++) if (grid.columns[i]?.[j] && grid.columns[i]?.[j+1]){
    const l = grid.ySpacingsM[j]; const cx = xs[i]; const cz = (ys[j]+ys[j+1])/2;
    beams.push({ cx, cy: level, cz, l, b: building.beamWidthM, h: building.beamDepthM, ry: Math.PI/2 });
  }
  return { columns: cols, beams, offsetX, offsetY };
}
