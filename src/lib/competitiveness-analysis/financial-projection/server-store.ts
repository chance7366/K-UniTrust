import type { SimulationParams } from "@/lib/competitiveness-analysis/financial-projection/types";
import type { UnivBaseData } from "@/lib/competitiveness-analysis/financial-projection/types";
import type { FpRunEdition } from "@/lib/competitiveness-analysis/financial-projection/run-results-cache";
import { isFpAnalysisYear } from "@/lib/competitiveness-analysis/financial-projection/years";
import {
  deletePersistentTextFile,
  readPersistentTextFile,
  writePersistentTextFile,
} from "@/lib/persistent-data-file";

export type FpServerSession = {
  analysisYear: number;
  universities: UnivBaseData[];
  baselineReady: boolean;
  hasRun: boolean;
  lastRunAt: string | null;
  cpiPct: number;
  params: SimulationParams;
  lookupCode: string;
  updatedAt: string;
};

function sessionRel(year: number) {
  return `json/financial-projection/${year}/session.json`;
}

function runsRel(year: number) {
  return `json/financial-projection/${year}/runs.v3.json`;
}

export function assertFpYear(year: number): number | null {
  return isFpAnalysisYear(year) ? year : null;
}

export async function readFpServerSession(
  year: number,
): Promise<FpServerSession | null> {
  try {
    const raw = await readPersistentTextFile(sessionRel(year));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FpServerSession;
    if (parsed?.analysisYear !== year || !Array.isArray(parsed.universities)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeFpServerSession(session: FpServerSession) {
  await writePersistentTextFile(
    sessionRel(session.analysisYear),
    JSON.stringify(session),
  );
}

export async function readFpServerRun(year: number): Promise<FpRunEdition | null> {
  try {
    const raw = await readPersistentTextFile(runsRel(year));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FpRunEdition;
    if (parsed?.v !== 3 || !parsed.signature) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeFpServerRun(year: number, edition: FpRunEdition) {
  await writePersistentTextFile(runsRel(year), JSON.stringify(edition));
}

export async function clearFpServerRun(year: number) {
  await deletePersistentTextFile(runsRel(year));
}

export async function saveFpServerBaseline(opts: {
  analysisYear: number;
  universities: UnivBaseData[];
  cpiPct?: number;
  params?: SimulationParams;
}) {
  const prev = await readFpServerSession(opts.analysisYear);
  await writeFpServerSession({
    analysisYear: opts.analysisYear,
    universities: opts.universities,
    baselineReady: opts.universities.length > 0,
    hasRun: false,
    lastRunAt: null,
    cpiPct: opts.cpiPct ?? prev?.cpiPct ?? 2.5,
    params: opts.params ??
      prev?.params ?? {
        scenario: "base",
        inflationRatePct: 2.5,
        wageInflationRatePct: 2.5,
        tuitionIncreaseRatePct: 0,
        subsidyChangeRatePct: 0,
        quotaReductionRatePct: 0,
        fixedCostCutRatePct: 0,
        otherRevenueBoostPct: 0,
        dropoutRateAddonPct: 0,
        fillRateAdjPct: 0,
      },
    lookupCode: opts.universities[0]?.schoolCodeStd ?? prev?.lookupCode ?? "",
    updatedAt: new Date().toISOString(),
  });
  await clearFpServerRun(opts.analysisYear);
}
