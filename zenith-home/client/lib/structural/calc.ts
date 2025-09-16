import { AnalysisResults, BeamResult, BOQItem, BuildingSpec, ColumnResult, CostInputs, CostSummary, FootingResult, GridSpec, ProjectData, SlabResult, SoilCondition, SoilConditionKey, Usage, UsageKey } from "./types";

// Constants and catalogs
export const SOILS: Record<SoilConditionKey, SoilCondition> = {
  soft: { key: "soft", name: "নরম মাটি", bearingCapacityKPa: 100 },
  medium: { key: "medium", name: "মাঝারি মাটি", bearingCapacityKPa: 200 },
  stiff: { key: "stiff", name: "শক্ত মাটি", bearingCapacityKPa: 300 },
};

export const USAGES: Record<UsageKey, Usage> = {
  residential: { key: "residential", name: "আবাসিক", liveLoadKPa: 2.0 },
  office: { key: "office", name: "অফিস", liveLoadKPa: 2.5 },
  commercial: { key: "commercial", name: "বাণিজ্যিক", liveLoadKPa: 3.0 },
  industrial: { key: "industrial", name: "ইন্ডাস্ট্রিয়াল", liveLoadKPa: 5.0 },
};

const gammaConcreteKNm3 = 25; // unit weight
const phiColumn = 0.65;
const phiFlexure = 0.9;
const phiShear = 0.75;
const steelDensityKgPerM3 = 7850;

const barAreasMM2: Record<number, number> = {
  10: 78.54,
  12: 113.10,
  16: 201.06,
  20: 314.16,
  25: 490.87,
  28: 615.75,
  32: 804.25,
};

export function defaultProject(): ProjectData {
  const grid: GridSpec = {
    nx: 3,
    ny: 2,
    xSpacingsM: [5, 5, 5],
    ySpacingsM: [4, 4],
    columns: Array.from({ length: 4 }, (_, i) => Array.from({ length: 3 }, (_, j) => true)),
  };
  const building: BuildingSpec = {
    floors: 5,
    floorHeightM: 3.2,
    usage: "residential",
    soil: "medium",
    materials: { fckMPa: 25, fyMPa: 500 },
    slabThicknessM: 0.125,
    beamWidthM: 0.25,
    beamDepthM: 0.45,
    foundationType: "isolated",
    locationText: "",
    finishesLoadKPa: 1.5,
  };
  const costs: CostInputs = {
    concreteRatePerM3: 9000,
    steelRatePerKg: 110,
  };
  return { grid, building, costs };
}

function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }

function tributaryAreaAt(grid: GridSpec, i: number, j: number): number {
  // compute tributary area at grid node (i,j)
  const xLeft = i === 0 ? grid.xSpacingsM[0] / 2 : grid.xSpacingsM[i - 1] / 2;
  const xRight = i === grid.nx ? grid.xSpacingsM[grid.nx - 1] / 2 : grid.xSpacingsM[i] / 2;
  const yDown = j === 0 ? grid.ySpacingsM[0] / 2 : grid.ySpacingsM[j - 1] / 2;
  const yUp = j === grid.ny ? grid.ySpacingsM[grid.ny - 1] / 2 : grid.ySpacingsM[j] / 2;
  return (xLeft + xRight) * (yDown + yUp);
}

function slabSelfWeightKPa(thicknessM: number): number {
  // thickness * 25 kN/m3 -> kN/m2 = kPa
  return thicknessM * gammaConcreteKNm3;
}

function beamSelfWeightKNperm(beamWidthM: number, beamDepthM: number): number {
  return beamWidthM * beamDepthM * gammaConcreteKNm3; // per meter length
}

function factoredLoad(D: number, L: number): number {
  return 1.2 * D + 1.6 * L;
}

function pickBars(requiredAreaMM2: number): { diameterMM: number; count: number } {
  const diameters = [12, 16, 20, 25, 28, 32];
  let best: { diameterMM: number; count: number; area: number } | null = null;
  for (const d of diameters) {
    for (let n = 4; n <= 12; n += 2) {
      const area = barAreasMM2[d] * n;
      if (area >= requiredAreaMM2) {
        if (!best || area < best.area) best = { diameterMM: d, count: n, area };
        break;
      }
    }
  }
  if (!best) {
    const d = 32, n = 16; // upper bound
    return { diameterMM: d, count: n };
  }
  return { diameterMM: best.diameterMM, count: best.count };
}

function pickColumnSize(PuKN: number, fckMPa: number, fyMPa: number): { b: number; h: number; bars: { diameterMM: number; count: number }; phiPn: number } {
  // Iterate typical sizes 300x300 to 600x600 mm
  const sizesMM = [300, 350, 400, 450, 500, 550, 600];
  for (const size of sizesMM) {
    const b = size / 1000, h = b; // square columns for simplicity
    const AgMM2 = (size * size);
    // try reinforcement ratio 1% to 4%
    for (const rho of [0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04]) {
      const AstMM2 = rho * AgMM2;
      const bars = pickBars(AstMM2);
      const AstUse = barAreasMM2[bars.diameterMM] * bars.count; // mm2
      const fckNmm2 = fckMPa; const fyNmm2 = fyMPa;
      const PnN = 0.85 * fckNmm2 * (AgMM2 - AstUse) + fyNmm2 * AstUse;
      const phiPnN = phiColumn * PnN;
      const phiPnKN = phiPnN / 1000; // kN
      if (phiPnKN >= PuKN) {
        return { b, h, bars, phiPn: phiPnKN };
      }
    }
  }
  // if none, return largest with heavy steel
  const size = 600, b = 0.6, h = 0.6;
  const bars = { diameterMM: 32, count: 16 };
  const AgMM2 = size * size;
  const AstUse = barAreasMM2[bars.diameterMM] * bars.count;
  const PnN = 0.85 * fckMPa * (AgMM2 - AstUse) + fyMPa * AstUse;
  const phiPn = phiColumn * PnN / 1000;
  return { b, h, bars, phiPn };
}

function beamFlexure(spanM: number, wULS_KNperm: number, bwM: number, dM: number, fyMPa: number): { Mu_kNm: number; As_req_MM2: number; suggestion: { diameterMM: number; count: number } } {
  const Mu = wULS_KNperm * spanM * spanM / 8; // kNm
  const dEffM = Math.max(dM - 0.06, 0.05); // effective depth (approx: 60 mm cover)
  const jdM = 0.9 * dEffM;
  const fyNmm2 = fyMPa;
  const As_req = (Mu * 1e6) / (phiFlexure * fyNmm2 * jdM * 1e3); // mm2
  const suggestion = pickBars(As_req);
  return { Mu_kNm: Mu, As_req_MM2: As_req, suggestion };
}

function slabFlexure(spanM: number, wULS_KPa: number, thicknessM: number, fyMPa: number): { Mu_kNm_per_m: number; bar: { diameterMM: number; spacingMM: number } } {
  const w_kNpm = wULS_KPa; // per m width
  const Mu = w_kNpm * spanM * spanM / 8; // kNm per m
  // required As per meter: Mu = phi*As*fy*jd -> As = Mu*1e6 / (phi*fy*jd*1e3)
  const dEffM = Math.max(thicknessM - 0.03, 0.02);
  const jdM = 0.9 * dEffM;
  const As_req = (Mu * 1e6) / (phiFlexure * fyMPa * jdM * 1e3); // mm2 per m
  // choose bar and spacing: try 10,12,16 with spacing 100-300
  const diameters = [10, 12, 16];
  for (const d of diameters) {
    for (let s = 100; s <= 300; s += 25) {
      const AsProv = (1000 / s) * barAreasMM2[d];
      if (AsProv >= As_req) {
        return { Mu_kNm_per_m: Mu, bar: { diameterMM: d, spacingMM: s } };
      }
    }
  }
  return { Mu_kNm_per_m: Mu, bar: { diameterMM: 16, spacingMM: 100 } };
}

export function analyze(project: ProjectData): AnalysisResults {
  const { grid, building, costs } = project;
  const warnings: string[] = [];

  const usage = USAGES[building.usage];
  const soil = SOILS[building.soil];

  const slabDL = slabSelfWeightKPa(building.slabThicknessM) + building.finishesLoadKPa; // kPa
  const LL = usage.liveLoadKPa; // kPa
  const ULS_kPa = factoredLoad(slabDL, LL);

  // Column loads per floor at each column from tributary area
  const columns: ColumnResult[] = [];
  for (let i = 0; i <= grid.nx; i++) {
    for (let j = 0; j <= grid.ny; j++) {
      if (!grid.columns[i]?.[j]) continue;
      const tribA = tributaryAreaAt(grid, i, j); // m2
      const DL_floor = slabDL * tribA; // kN
      const LL_floor = LL * tribA; // kN
      // add beam self weight tributary: approximate half of adjacent beams per directions
      const bw = building.beamWidthM, bh = building.beamDepthM;
      const beamW = beamSelfWeightKNperm(bw, bh);
      const Lx = (i === 0 ? grid.xSpacingsM[0] : grid.xSpacingsM[i - 1]) / 2 + (i === grid.nx ? grid.xSpacingsM[grid.nx - 1] : grid.xSpacingsM[i]) / 2;
      const Ly = (j === 0 ? grid.ySpacingsM[0] : grid.ySpacingsM[j - 1]) / 2 + (j === grid.ny ? grid.ySpacingsM[grid.ny - 1] : grid.ySpacingsM[j]) / 2;
      const DL_beams = beamW * (Lx + Ly); // kN per floor
      const D = DL_floor + DL_beams;
      const servicePerFloor = D + LL_floor;
      const Pu = factoredLoad(D, LL_floor) * building.floors; // total floors factored
      const pick = pickColumnSize(Pu, building.materials.fckMPa, building.materials.fyMPa);
      const col: ColumnResult = {
        i, j,
        tributaryAreaM2: tribA,
        serviceLoadPerFloorKN: servicePerFloor,
        ultimateLoadKN: Pu,
        suggestedSizeM: { b: pick.b, h: pick.h },
        bars: pick.bars,
        axialCapacityKN: pick.phiPn,
        warnings: pick.phiPn < Pu ? ["কলামের ধারণ ক্ষমতা প্রয়োজনীয় Pu থেকে কম"] : [],
      };
      columns.push(col);
    }
  }

  // Beam results for each span between active columns
  const beams: BeamResult[] = [];
  // X direction (between i and i+1 at each j)
  for (let j = 0; j <= grid.ny; j++) {
    for (let i = 0; i < grid.nx; i++) {
      const c1 = grid.columns[i]?.[j];
      const c2 = grid.columns[i + 1]?.[j];
      if (!c1 || !c2) continue;
      const L = grid.xSpacingsM[i];
      const tribWidth = (j === 0 ? grid.ySpacingsM[0] / 2 : grid.ySpacingsM[j - 1] / 2) + (j === grid.ny ? grid.ySpacingsM[grid.ny - 1] / 2 : grid.ySpacingsM[j] / 2);
      const slabDL_per_m = slabDL * tribWidth; // kN/m
      const LL_per_m = LL * tribWidth; // kN/m
      const beamDL_per_m = beamSelfWeightKNperm(building.beamWidthM, building.beamDepthM);
      const D = slabDL_per_m + beamDL_per_m;
      const wULS = factoredLoad(D, LL_per_m);
      const flex = beamFlexure(L, wULS, building.beamWidthM, building.beamDepthM, building.materials.fyMPa);
      const Mu = flex.Mu_kNm * building.floors; // envelope simple sum
      const Vu = (wULS * L / 2) * building.floors; // per support
      const res: BeamResult = {
        spanM: L,
        direction: "X",
        between: { from: [i, j], to: [i + 1, j] },
        wULS_KN_per_m: wULS,
        Mu_kNm: Mu,
        Vu_kN: Vu,
        requiredSteelAreaMM2: flex.As_req_MM2,
        suggestedBars: flex.suggestion,
        warnings: [],
      };
      beams.push(res);
    }
  }
  // Y direction
  for (let i = 0; i <= grid.nx; i++) {
    for (let j = 0; j < grid.ny; j++) {
      const c1 = grid.columns[i]?.[j];
      const c2 = grid.columns[i]?.[j + 1];
      if (!c1 || !c2) continue;
      const L = grid.ySpacingsM[j];
      const tribWidth = (i === 0 ? grid.xSpacingsM[0] / 2 : grid.xSpacingsM[i - 1] / 2) + (i === grid.nx ? grid.xSpacingsM[grid.nx - 1] / 2 : grid.xSpacingsM[i] / 2);
      const slabDL_per_m = slabDL * tribWidth; // kN/m
      const LL_per_m = LL * tribWidth; // kN/m
      const beamDL_per_m = beamSelfWeightKNperm(building.beamWidthM, building.beamDepthM);
      const D = slabDL_per_m + beamDL_per_m;
      const wULS = factoredLoad(D, LL_per_m);
      const flex = beamFlexure(L, wULS, building.beamWidthM, building.beamDepthM, building.materials.fyMPa);
      const Mu = flex.Mu_kNm * building.floors;
      const Vu = (wULS * L / 2) * building.floors;
      const res: BeamResult = {
        spanM: L,
        direction: "Y",
        between: { from: [i, j], to: [i, j + 1] },
        wULS_KN_per_m: wULS,
        Mu_kNm: Mu,
        Vu_kN: Vu,
        requiredSteelAreaMM2: flex.As_req_MM2,
        suggestedBars: flex.suggestion,
        warnings: [],
      };
      beams.push(res);
    }
  }

  // Slab results: take representative spans in X and Y (average)
  const avgLx = grid.nx > 0 ? sum(grid.xSpacingsM) / grid.nx : 0;
  const avgLy = grid.ny > 0 ? sum(grid.ySpacingsM) / grid.ny : 0;
  const slabs: SlabResult[] = [];
  if (avgLx > 0) {
    const s = slabFlexure(avgLx, ULS_kPa, building.slabThicknessM, building.materials.fyMPa);
    slabs.push({ direction: "X", spanM: avgLx, wULS_KPa: ULS_kPa, Mu_kNm_per_m: s.Mu_kNm_per_m, bar: s.bar, warnings: [] });
  }
  if (avgLy > 0) {
    const s = slabFlexure(avgLy, ULS_kPa, building.slabThicknessM, building.materials.fyMPa);
    slabs.push({ direction: "Y", spanM: avgLy, wULS_KPa: ULS_kPa, Mu_kNm_per_m: s.Mu_kNm_per_m, bar: s.bar, warnings: [] });
  }

  // Footings for each column (isolated): area = Pu / q_allow; with FS=3 for service load (approx). Use Pu/1.5 for service approx, then /q_allow
  const footings: FootingResult[] = [];
  for (const c of columns) {
    const qAllow = soil.bearingCapacityKPa; // kPa
    const Pu = c.ultimateLoadKN; // kN
    const approxService = Pu / 1.5; // kN
    const area = approxService / qAllow; // m2
    const side = Math.sqrt(area);
    const sizeM = Math.max(0.8, Math.min(3.0, Math.round(side * 20) / 20)); // 0.05 m increments
    const f: FootingResult = {
      columnIndex: { i: c.i, j: c.j },
      requiredAreaM2: area,
      suggestedSizeM: { b: sizeM, h: Math.max(0.4, Math.min(1.0, 0.5 + Pu / 5000)) },
      bearingPressureKPa: approxService / (sizeM * sizeM),
      warnings: [],
    };
    if (f.bearingPressureKPa > qAllow) f.warnings.push("ফুটিং আকার বৃদ্ধি প্রয়োজন (বেয়ারিং চাপ বেশি)");
    footings.push(f);
  }

  // BOQ approximate quantities
  let concreteM3 = 0;
  // columns concrete
  for (const c of columns) {
    concreteM3 += c.suggestedSizeM.b * c.suggestedSizeM.h * building.floors * building.floorHeightM;
  }
  // beams concrete (per floor approximate as bw*depth*span)
  for (const b of beams) {
    concreteM3 += building.beamWidthM * building.beamDepthM * b.spanM * building.floors;
  }
  // slabs concrete
  const floorArea = sum(grid.xSpacingsM) * sum(grid.ySpacingsM);
  concreteM3 += floorArea * building.slabThicknessM * building.floors;
  // footings
  for (const f of footings) {
    concreteM3 += f.suggestedSizeM.b * f.suggestedSizeM.b * f.suggestedSizeM.h;
  }

  // Steel weight: approximate from bars area*length
  let steelKg = 0;
  for (const c of columns) {
    const Ast = barAreasMM2[c.bars.diameterMM] * c.bars.count / 1e6; // m2
    const len = building.floors * building.floorHeightM;
    steelKg += Ast * len * steelDensityKgPerM3;
  }
  for (const b of beams) {
    const Ast = barAreasMM2[b.suggestedBars.diameterMM] * b.suggestedBars.count / 1e6; // m2
    steelKg += Ast * b.spanM * building.floors * steelDensityKgPerM3;
  }
  for (const s of slabs) {
    const As_per_m = (1000 / s.bar.spacingMM) * (barAreasMM2[s.bar.diameterMM]) / 1e6; // m2 per m width
    const totalLen = (floorArea / Math.max(s.spanM, 0.1)) * building.floors; // rough
    steelKg += As_per_m * totalLen * steelDensityKgPerM3;
  }

  const boq: BOQItem[] = [
    { name: "কংক্রিট (মোট)", unit: "m³", quantity: round(concreteM3, 2) },
    { name: "স্টিল (মোট)", unit: "kg", quantity: round(steelKg, 1) },
  ];

  const cost: CostSummary = {
    concreteM3: round(concreteM3, 2),
    steelKg: round(steelKg, 1),
    totalCost: round(concreteM3 * costs.concreteRatePerM3 + steelKg * costs.steelRatePerKg, 0),
  };

  return { columns, beams, slabs, footings, boq, cost, warnings };
}

export function round(v: number, d: number): number {
  const m = Math.pow(10, d);
  return Math.round(v * m) / m;
}
