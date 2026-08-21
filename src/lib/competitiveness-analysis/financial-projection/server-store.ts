import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

import type { SimulationParams } from "@/lib/competitiveness-analysis/financial-projection/types";
import type { UnivBaseData } from "@/lib/competitiveness-analysis/financial-projection/types";
import type { FpRunEdition } from "@/lib/competitiveness-analysis/financial-projection/run-results-cache";
import { isFpAnalysisYear } from "@/lib/competitiveness-analysis/financial-projection/years";

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

const DIR = path.join(process.cwd(), "data", "json", "financial-projection");

function yearDir(year: number) {
  return path.join(DIR, String(year));
}

function sessionPath(year: number) {
  return path.join(yearDir(year), "session.json");
}

function runsPath(year: number) {
  return path.join(yearDir(year), "runs.v3.json");
}

export function assertFpYear(year: number): number | null {
  return isFpAnalysisYear(year) ? year : null;
}

async function ensureYearDir(year: number) {
  await mkdir(yearDir(year), { recursive: true });
}

export async function readFpServerSession(
  year: number,
): Promise<FpServerSession | null> {
  try {
    const raw = await readFile(sessionPath(year), "utf8");
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
  await ensureYearDir(session.analysisYear);
  await writeFile(sessionPath(session.analysisYear), JSON.stringify(session), "utf8");
}

export async function readFpServerRun(year: number): Promise<FpRunEdition | null> {
  try {
    const raw = await readFile(runsPath(year), "utf8");
    const parsed = JSON.parse(raw) as FpRunEdition;
    if (parsed?.v !== 3 || !parsed.signature) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeFpServerRun(year: number, edition: FpRunEdition) {
  await ensureYearDir(year);
  await writeFile(runsPath(year), JSON.stringify(edition), "utf8");
}

export async function clearFpServerRun(year: number) {
  await rm(runsPath(year), { force: true });
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
