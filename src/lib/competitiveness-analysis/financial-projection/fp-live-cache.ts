import type { BaselineIndicatorPick, ProjectionTargetRow } from "@/lib/competitiveness-analysis/financial-projection/mock-data";
import type {
  MacroData,
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";

export type FpLiveSnapshot = {
  analysisYear: number;
  targets: ProjectionTargetRow[];
  universities: UnivBaseData[];
  indicators: BaselineIndicatorPick[];
  baselineReady: boolean;
  hasRun: boolean;
  lastRunAt: string | null;
  cpiPct: number;
  params: SimulationParams;
  lookupCode: string;
  resultViewScenario: SimulationScenario;
  nationalMacro: MacroData;
  schoolAgeLive: {
    regionLabel: string;
    dataYear: number;
    admissionBaselineYear: number;
    declineSeries: { year: number; index: number; weightedResource: number }[];
  } | null;
  coverage: { hasTargetRoster: boolean; hasSchoolAge: boolean };
  availableYears: number[];
  loadError: string | null;
};

let snapshot: FpLiveSnapshot | null = null;

export function readFpLiveSnapshot(year: number): FpLiveSnapshot | null {
  return snapshot?.analysisYear === year ? snapshot : null;
}

export function writeFpLiveSnapshot(next: FpLiveSnapshot) {
  snapshot = next;
}
