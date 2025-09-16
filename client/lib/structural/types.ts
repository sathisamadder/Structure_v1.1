export type SoilConditionKey = "soft" | "medium" | "stiff";

export interface SoilCondition {
  key: SoilConditionKey;
  name: string;
  bearingCapacityKPa: number; // allowable bearing capacity (kPa)
}

export type UsageKey = "residential" | "commercial" | "office" | "industrial";

export interface Usage {
  key: UsageKey;
  name: string;
  liveLoadKPa: number; // kPa
}

export interface Materials {
  fckMPa: number; // concrete compressive strength
  fyMPa: number; // steel yield strength
}

export interface GridSpec {
  nx: number; // number of bays in X direction
  ny: number; // number of bays in Y direction
  xSpacingsM: number[]; // length nx (bay widths)
  ySpacingsM: number[]; // length ny
  // columns at intersections: (nx+1) x (ny+1)
  columns: boolean[][]; // columns[i][j] true if column at grid node (i,j)
  // optional labels for grid lines (ETABS-like): x lines (1..n), y lines (A..)
  xLabels?: string[]; // length nx+1
  yLabels?: string[]; // length ny+1
}

export interface BuildingSpec {
  floors: number;
  floorHeightM: number;
  usage: UsageKey;
  soil: SoilConditionKey;
  materials: Materials;
  slabThicknessM: number;
  beamWidthM: number;
  beamDepthM: number;
  foundationType: "isolated" | "combined" | "raft";
  locationText: string;
  basicWindSpeedMS?: number; // optional, for future use
  seismicZone?: string; // optional, for future use
  finishesLoadKPa: number; // superimposed dead load on slab (kPa)
}

export interface ColumnResult {
  i: number; // grid i index (x)
  j: number; // grid j index (y)
  tributaryAreaM2: number;
  serviceLoadPerFloorKN: number; // DL+LL per floor at column
  ultimateLoadKN: number; // 1.2D + 1.6L per total floors
  suggestedSizeM: { b: number; h: number };
  bars: { diameterMM: number; count: number };
  axialCapacityKN: number;
  warnings: string[];
}

export interface BeamResult {
  spanM: number;
  direction: "X" | "Y";
  between: { from: [number, number]; to: [number, number] };
  wULS_KN_per_m: number;
  Mu_kNm: number;
  Vu_kN: number;
  requiredSteelAreaMM2: number;
  suggestedBars: { diameterMM: number; count: number };
  warnings: string[];
}

export interface SlabResult {
  direction: "X" | "Y";
  spanM: number;
  wULS_KPa: number; // factored
  Mu_kNm_per_m: number; // per meter strip
  bar: { diameterMM: number; spacingMM: number };
  warnings: string[];
}

export interface FootingResult {
  columnIndex: { i: number; j: number };
  requiredAreaM2: number;
  suggestedSizeM: { b: number; h: number };
  bearingPressureKPa: number;
  warnings: string[];
}

export interface BOQItem {
  name: string;
  unit: string;
  quantity: number;
}

export interface CostInputs {
  concreteRatePerM3: number; // currency per m3
  steelRatePerKg: number; // currency per kg
}

export interface CostSummary {
  concreteM3: number;
  steelKg: number;
  totalCost: number;
}

export interface AnalysisResults {
  columns: ColumnResult[];
  beams: BeamResult[];
  slabs: SlabResult[];
  footings: FootingResult[];
  boq: BOQItem[];
  cost: CostSummary;
  warnings: string[];
}

export interface ProjectData {
  grid: GridSpec;
  building: BuildingSpec;
  costs: CostInputs;
}
