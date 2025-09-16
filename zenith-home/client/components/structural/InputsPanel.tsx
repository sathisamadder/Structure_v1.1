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
          <Label>মাটির অবস্থা</Label>
          <Select value={building.soil} onValueChange={(v)=>onChange({ ...building, soil: v as any })}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              {Object.values(SOILS).map(s=> <SelectItem key={s.key} value={s.key}>{s.name} ({s.bearingCapacityKPa} kPa)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>ভবনের ব্যবহার</Label>
          <Select value={building.usage} onValueChange={(v)=>onChange({ ...building, usage: v as any })}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              {Object.values(USAGES).map(u=> <SelectItem key={u.key} value={u.key}>{u.name} (LL {u.liveLoadKPa} kPa)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>অবস্থান</Label>
          <Input value={building.locationText} onChange={(e)=>onChange({ ...building, locationText: e.target.value })} placeholder="জেলা/উ���জেলা" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>তলার সংখ্যা</Label>
            <Input type="number" min={1} value={building.floors} onChange={(e)=>onChange({ ...building, floors: parseInt(e.target.value||"1") })} />
          </div>
          <div>
            <Label>ফ্লোর ��চ্চতা (মিটার)</Label>
            <Input type="number" step="0.1" value={building.floorHeightM} onChange={(e)=>onChange({ ...building, floorHeightM: parseFloat(e.target.value||"0") })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 col-span-2">
          <div>
            <Label>কংক্রিট f'c (MPa)</Label>
            <Input type="number" value={building.materials.fckMPa} onChange={(e)=>onChange({ ...building, materials: { ...building.materials, fckMPa: parseFloat(e.target.value||"0") } })} />
          </div>
          <div>
            <Label>স্টিল f_y (MPa)</Label>
            <Input type="number" value={building.materials.fyMPa} onChange={(e)=>onChange({ ...building, materials: { ...building.materials, fyMPa: parseFloat(e.target.value||"0") } })} />
          </div>
          <div>
            <Label>ফিনিশেস DL (kPa)</Label>
            <Input type="number" step="0.1" value={building.finishesLoadKPa} onChange={(e)=>onChange({ ...building, finishesLoadKPa: parseFloat(e.target.value||"0") })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 col-span-2">
          <div>
            <Label>বিম প্রস্থ b (m)</Label>
            <Input type="number" step="0.05" value={building.beamWidthM} onChange={(e)=>onChange({ ...building, beamWidthM: parseFloat(e.target.value||"0") })} />
          </div>
          <div>
            <Label>বিম গভীরতা h (m)</Label>
            <Input type="number" step="0.05" value={building.beamDepthM} onChange={(e)=>onChange({ ...building, beamDepthM: parseFloat(e.target.value||"0") })} />
          </div>
          <div>
            <Label>স্ল্যাব বেধ (m)</Label>
            <Input type="number" step="0.01" value={building.slabThicknessM} onChange={(e)=>onChange({ ...building, slabThicknessM: parseFloat(e.target.value||"0") })} />
          </div>
        </div>
        <div className="col-span-2">
          <Label>ফাউন্ডেশন</Label>
          <Select value={building.foundationType} onValueChange={(v)=>onChange({ ...building, foundationType: v as any })}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="isolated">আইসোলেটেড ফুটিং</SelectItem>
              <SelectItem value="combined">কম্বাইন্ড ফুটিং</SelectItem>
              <SelectItem value="raft">রাফট ���াউন্ডেশন</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
