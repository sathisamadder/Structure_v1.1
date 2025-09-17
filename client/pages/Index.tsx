import { useMemo, useState } from "react";
import { analyze, defaultProject, round } from "@/lib/structural/calc";
import { ProjectData } from "@/lib/structural/types";
import GridEditor from "@/components/structural/GridEditor";
import InputsPanel from "@/components/structural/InputsPanel";
import ResultsPanel from "@/components/structural/ResultsPanel";
import ThreeDView from "@/components/structural/ThreeDView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ActionsBar from "@/components/structural/ActionsBar";

export default function Index() {
  const [data, setData] = useState<ProjectData>(() => defaultProject());
  const results = useMemo(() => analyze(data), [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100">
      <Header />
      <main className="container py-6">
        <div className="grid lg:grid-cols-3 gap-6 print:block">
          <div className="lg:col-span-1 space-y-6 print:break-inside-avoid">
            <Card title="Input Data">
              <InputsPanel
                building={data.building}
                onChange={(b) => setData({ ...data, building: b })}
              />
            </Card>
            <Card title="Grid & Column Layout">
              <GridEditor
                grid={data.grid}
                onGridChange={(g) => setData({ ...data, grid: g })}
              />
            </Card>
            <Card title="Project, Costs & Export">
              <ActionsBar
                data={data}
                onChangeCosts={(c) => setData({ ...data, costs: c })}
                onLoad={(d) => setData(d)}
              />
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6 print:break-inside-avoid">
            <Card title="Results & Visualization">
              <Tabs defaultValue="results">
                <TabsList className="mb-3">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="3d">3D View</TabsTrigger>
                </TabsList>
                <TabsContent value="results">
                  <ResultsPanel results={results} />
                </TabsContent>
                <TabsContent value="layout">
                  <GridEditor
                    grid={data.grid}
                    onGridChange={(g) => setData({ ...data, grid: g })}
                  />
                </TabsContent>
                <TabsContent value="3d">
                  <ThreeDView grid={data.grid} building={data.building} />
                </TabsContent>
              </Tabs>
            </Card>
            <Card title="Summary">
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <Stat label="Floors" value={`${data.building.floors}`} />
                <Stat
                  label="Floor Area (per floor)"
                  value={`${round(sum(data.grid.xSpacingsM) * round(sum(data.grid.ySpacingsM), 2), 2)} m²`}
                />
                <Stat
                  label="Base Shear (BNBC)"
                  value={
                    results.bnbc
                      ? `${round(results.bnbc.baseShearKN, 0)} kN`
                      : "-"
                  }
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 grid place-items-center text-white font-bold">
            Σ
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight">
              Structural Analysis Tool
            </div>
            <div className="text-xs text-muted-foreground">
              Preliminary design — columns, beams, slabs, footings, seismic
              (BNBC 2020), 3D
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
          <span>EN</span>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container py-4 text-xs text-muted-foreground">
        Warning: This tool provides preliminary estimations and should not
        replace detailed design by a licensed structural engineer.
      </div>
    </footer>
  );
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}
