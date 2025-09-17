import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BuildingSpec } from "@/lib/structural/types";
import { SOILS, USAGES } from "@/lib/structural/calc";

interface Props {
  building: BuildingSpec;
  onChange: (b: BuildingSpec) => void;
}

export default function InputsPanel({ building, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Soil Condition</Label>
          <Select value={building.soil} onValueChange={(v)=>onChange({ ...building, soil: v as any })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {Object.values(SOILS).map(s=> <SelectItem key={s.key} value={s.key}>{s.name} ({s.bearingCapacityKPa} kPa)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Building Use</Label>
          <Select value={building.usage} onValueChange={(v)=>onChange({ ...building, usage: v as any })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {Object.values(USAGES).map(u=> <SelectItem key={u.key} value={u.key}>{u.name} (LL {u.liveLoadKPa} kPa)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Location</Label>
          <Input value={building.locationText} onChange={(e)=>onChange({ ...building, locationText: e.target.value })} placeholder="District/City" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Number of Stories</Label>
            <Input type="number" min={1} value={building.floors} onChange={(e)=>onChange({ ...building, floors: parseInt(e.target.value||"1") })} />
          </div>
          <div>
            <Label>Floor Height (m)</Label>
            <Input type="number" step="0.1" value={building.floorHeightM} onChange={(e)=>onChange({ ...building, floorHeightM: parseFloat(e.target.value||"0") })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 col-span-2">
          <div>
            <Label>Concrete f'c (MPa)</Label>
            <Input type="number" value={building.materials.fckMPa} onChange={(e)=>onChange({ ...building, materials: { ...building.materials, fckMPa: parseFloat(e.target.value||"0") } })} />
          </div>
          <div>
            <Label>Steel f_y (MPa)</Label>
            <Input type="number" value={building.materials.fyMPa} onChange={(e)=>onChange({ ...building, materials: { ...building.materials, fyMPa: parseFloat(e.target.value||"0") } })} />
          </div>
          <div>
            <Label>Finishes DL (kPa)</Label>
            <Input type="number" step="0.1" value={building.finishesLoadKPa} onChange={(e)=>onChange({ ...building, finishesLoadKPa: parseFloat(e.target.value||"0") })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 col-span-2">
          <div>
            <Label>Beam width b (m)</Label>
            <Input type="number" step="0.05" value={building.beamWidthM} onChange={(e)=>onChange({ ...building, beamWidthM: parseFloat(e.target.value||"0") })} />
          </div>
          <div>
            <Label>Beam depth h (m)</Label>
            <Input type="number" step="0.05" value={building.beamDepthM} onChange={(e)=>onChange({ ...building, beamDepthM: parseFloat(e.target.value||"0") })} />
          </div>
          <div>
            <Label>Slab thickness (m)</Label>
            <Input type="number" step="0.01" value={building.slabThicknessM} onChange={(e)=>onChange({ ...building, slabThicknessM: parseFloat(e.target.value||"0") })} />
          </div>
        </div>
        <div className="col-span-2">
          <Label>Foundation</Label>
          <Select value={building.foundationType} onValueChange={(v)=>onChange({ ...building, foundationType: v as any })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="isolated">Isolated footing</SelectItem>
              <SelectItem value="combined">Combined footing</SelectItem>
              <SelectItem value="raft">Raft foundation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
