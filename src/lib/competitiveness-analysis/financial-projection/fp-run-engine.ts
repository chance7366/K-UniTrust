import { scenarioParams } from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import { computeStoredSchool } from "@/lib/competitiveness-analysis/financial-projection/compute-run-edition";
import {
  FP_RUN_SCENARIOS,
  clearFpRunPending,
  fpRunSignature,
  fpUnisSignature,
  hydrateFpBatchRows,
  persistFpRunEditionIdb,
  readFpRunEdition,
  writeFpRunEdition,
  type FpHydratedRunRow,
  type FpRunEdition,
  type FpStoredSchoolRun,
} from "@/lib/competitiveness-analysis/financial-projection/run-results-cache";
import type {
  MacroData,
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";

export type FpRunProgress = {
  done: number;
  total: number;
  running: boolean;
};

type RunJob = {
  token: number;
  year: number;
  signature: string;
};

let job: RunJob | null = null;
const progressListeners = new Set<(progress: FpRunProgress) => void>();
let lastProgress: FpRunProgress = { done: 0, total: 0, running: false };
let lastEmitAt = 0;
let persistGen = 0;

/** 한 슬라이스에서 여러 학교를 이어서 계산. 학교마다 양보하지 않음. */
const SLICE_MS = 50;
const PROGRESS_MS = 200;

function emit(progress: FpRunProgress, force = false) {
  const now = performance.now();
  if (!force && progress.running && now - lastEmitAt < PROGRESS_MS) {
    lastProgress = progress;
    return;
  }
  lastEmitAt = now;
  lastProgress = progress;
  progressListeners.forEach((fn) => fn(progress));
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function subscribeFpRunProgress(fn: (progress: FpRunProgress) => void) {
  progressListeners.add(fn);
  fn(lastProgress);
  return () => {
    progressListeners.delete(fn);
  };
}

export function fpRunProgressSnapshot(): FpRunProgress {
  return lastProgress;
}

export function invalidateFpRunPersist() {
  persistGen += 1;
}

export async function startFpRunCompute(opts: {
  year: number;
  unis: UnivBaseData[];
  nationalMacro: MacroData;
  cpiPct: number;
  runParams: SimulationParams;
  paramsScenario: SimulationScenario;
  startYear: number;
  endYear: number;
}): Promise<boolean> {
  const { year, unis, nationalMacro, cpiPct, runParams, paramsScenario, startYear, endYear } =
    opts;
  if (!unis.length) return false;
  const signature = fpRunSignature({
    uniSignature: fpUnisSignature(unis),
    cpiPct,
    params: runParams,
  });
  if (job && job.year === year && job.signature === signature) return false;

  const token = Date.now();
  job = { token, year, signature };

  const uniCount = unis.length;
  const total = uniCount * FP_RUN_SCENARIOS.length;
  const paramsForScenario = (scenario: SimulationScenario): SimulationParams =>
    scenario === paramsScenario
      ? runParams
      : { ...scenarioParams(scenario, cpiPct), inflationRatePct: cpiPct };
  const existing = readFpRunEdition(year);
  const scenarios: Partial<Record<SimulationScenario, FpStoredSchoolRun[]>> =
    existing?.signature === signature ? { ...existing.scenarios } : {};
  const order: SimulationScenario[] = [
    paramsScenario,
    ...FP_RUN_SCENARIOS.filter((scenario) => scenario !== paramsScenario),
  ].filter((scenario) => {
    const rows = scenarios[scenario] ?? [];
    return (
      rows.length !== uniCount ||
      rows.some((row) => !(row.rows?.length) || !row.tornado?.length)
    );
  });

  let done = (FP_RUN_SCENARIOS.length - order.length) * uniCount;
  emit({ done, total, running: true }, true);

  const stillCurrent = () => job?.token === token;

  try {
    const res = await fetch("/api/financial-projection/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisYear: year,
        cpiPct,
        params: runParams,
        paramsScenario,
        universities: unis,
      }),
    });
    const json = (await res.json()) as { edition?: FpRunEdition; error?: string };
    if (res.ok && json.edition?.v === 3 && stillCurrent()) {
      writeFpRunEdition(year, json.edition, true);
      const persistToken = ++persistGen;
      void persistFpRunEditionIdb(year, json.edition, () => persistToken === persistGen).catch(
        () => {},
      );
      clearFpRunPending(year);
      if (job?.token === token) job = null;
      emit({ done: total, total, running: false }, true);
      return true;
    }
  } catch {
    /* 서버 저장 실패 시 이 브라우저에서만 계산 */
  }
  if (!stillCurrent()) return false;

  for (const scenario of order) {
    if (!stillCurrent()) return false;
    const simParams = paramsForScenario(scenario);
    const acc: FpStoredSchoolRun[] = [];
    let i = 0;
    while (i < uniCount) {
      if (!stillCurrent()) return false;
      const sliceStart = performance.now();
      do {
        acc.push(
          computeStoredSchool(
            unis[i]!,
            nationalMacro,
            simParams,
            startYear,
            endYear,
          ),
        );
        i += 1;
        done += 1;
      } while (i < uniCount && performance.now() - sliceStart < SLICE_MS);
      emit({ done, total, running: true });
      if (i < uniCount) await yieldToMain();
    }
    scenarios[scenario] = acc;
    writeFpRunEdition(year, { v: 3, signature, scenarios }, false);
  }

  if (!stillCurrent()) return false;
  const edition = { v: 3 as const, signature, scenarios };
  writeFpRunEdition(year, edition, true);
  clearFpRunPending(year);
  if (job?.token === token) job = null;
  emit({ done: total, total, running: false }, true);
  const persistToken = ++persistGen;
  void persistFpRunEditionIdb(year, edition, () => persistToken === persistGen).catch(
    () => {},
  );
  return true;
}

export function hydrateFpRunView(opts: {
  year: number;
  unis: UnivBaseData[];
  cpiPct: number;
  runParams: SimulationParams;
  scenario: SimulationScenario;
}): FpHydratedRunRow[] | null {
  const edition = readFpRunEdition(opts.year);
  if (!edition) return null;
  const cached = edition.scenarios[opts.scenario];
  if (!cached?.length) return null;
  return hydrateFpBatchRows(cached, opts.unis, opts.year);
}
