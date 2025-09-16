import * as React from "react";
import { AnalysisResults } from "@/lib/structural/types";
import { round } from "@/lib/structural/calc";

export default function ResultsPanel({ results }: { results: AnalysisResults }) {
  return (
    <div className="space-y-6">
      <Section title="Columns">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <Th>#</Th><Th>Trib. A (m²)</Th><Th>Service/Floor (kN)</Th><Th>Pu (kN)</Th><Th>Size</Th><Th>Rebars</Th><Th>φPn (kN)</Th><Th>Notes</Th>
              </tr>
            </thead>
            <tbody>
              {results.columns.map((c, idx)=> (
                <tr key={idx} className="border-b">
                  <Td>C{idx+1}</Td>
                  <Td>{round(c.tributaryAreaM2,2)}</Td>
                  <Td>{round(c.serviceLoadPerFloorKN,1)}</Td>
                  <Td>{round(c.ultimateLoadKN,1)}</Td>
                  <Td>{Math.round(c.suggestedSizeM.b*1000)}×{Math.round(c.suggestedSizeM.h*1000)} mm</Td>
                  <Td>{c.bars.count}−Ø{c.bars.diameterMM}</Td>
                  <Td>{round(c.axialCapacityKN,0)}</Td>
                  <Td className="text-destructive">{c.warnings.join(", ")}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Beams">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <Th>#</Th><Th>Span (m)</Th><Th>w_ULS (kN/m)</Th><Th>Mu (kNm)</Th><Th>Vu (kN)</Th><Th>As (mm²)</Th><Th>Suggested</Th>
              </tr>
            </thead>
            <tbody>
              {results.beams.map((b,idx)=> (
                <tr key={idx} className="border-b">
                  <Td>{idx+1}</Td>
                  <Td>{round(b.spanM,2)}</Td>
                  <Td>{round(b.wULS_KN_per_m,2)}</Td>
                  <Td>{round(b.Mu_kNm,1)}</Td>
                  <Td>{round(b.Vu_kN,1)}</Td>
                  <Td>{round(b.requiredSteelAreaMM2,0)}</Td>
                  <Td>{b.suggestedBars.count}−Ø{b.suggestedBars.diameterMM}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Slabs">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <Th>Direction</Th><Th>Span (m)</Th><Th>w_ULS (kPa)</Th><Th>Mu (kNm/m)</Th><Th>Bars</Th>
              </tr>
            </thead>
            <tbody>
              {results.slabs.map((s,idx)=> (
                <tr key={idx} className="border-b">
                  <Td>{s.direction}</Td>
                  <Td>{round(s.spanM,2)}</Td>
                  <Td>{round(s.wULS_KPa,2)}</Td>
                  <Td>{round(s.Mu_kNm_per_m,2)}</Td>
                  <Td>Ø{s.bar.diameterMM} @ {s.bar.spacingMM} mm</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Footings (Isolated)">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <Th>#</Th><Th>Area (m²)</Th><Th>Suggested size</Th><Th>Bearing (kPa)</Th><Th>Notes</Th>
              </tr>
            </thead>
            <tbody>
              {results.footings.map((f,idx)=> (
                <tr key={idx} className="border-b">
                  <Td>{idx+1}</Td>
                  <Td>{round(f.requiredAreaM2,2)}</Td>
                  <Td>{round(f.suggestedSizeM.b,2)} × {round(f.suggestedSizeM.b,2)} × {round(f.suggestedSizeM.h,2)} m</Td>
                  <Td>{round(f.bearingPressureKPa,1)}</Td>
                  <Td className="text-destructive">{f.warnings.join(", ")}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="BOQ & Cost">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <Th>Item</Th><Th>Unit</Th><Th>Quantity</Th>
              </tr>
            </thead>
            <tbody>
              {results.boq.map((q,idx)=> (
                <tr key={idx} className="border-b">
                  <Td>{q.name}</Td><Td>{q.unit}</Td><Td>{q.quantity}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-right text-sm mt-2 font-semibold">Estimated cost: {results.cost.totalCost.toLocaleString()} ৳</div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="rounded-md border p-3 bg-card">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-2 text-xs font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-2">{children}</td>;
}
