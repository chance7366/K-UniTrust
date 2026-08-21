import {
  calculateProjection,
  scenarioParams,
  seekFixedCostCutForDelay,
  tornadoSensitivity,
} from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import {
  FP_GOAL_SEEK_DELAYS,
  FP_RUN_SCENARIOS,
  fpRunSignature,
  fpUnisSignature,
  type FpGoalSeekStored,
  type FpRunEdition,
  type FpStoredSchoolRun,
} from "@/lib/competitiveness-analysis/financial-projection/run-results-cache";
import type {
  MacroData,
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";

function withUnivWage(params: SimulationParams, wagePct: number): SimulationParams {
  return { ...params, wageInflationRatePct: wagePct };
}

export function computeStoredSchool(
  univ: UnivBaseData,
  nationalMacro: MacroData,
  simParams: SimulationParams,
  startYear: number,
  endYear: number,
): FpStoredSchoolRun {
  const wageParams = withUnivWage(simParams, univ.laborCostCagrPct);
  const result = calculateProjection(
    univ,
    nationalMacro,
    wageParams,
    startYear,
    endYear,
  );
  const tornado = tornadoSensitivity(
    univ,
    nationalMacro,
    wageParams,
    startYear,
    endYear,
  );
  const goalSeekByDelay: Record<string, FpGoalSeekStored> = {};
  for (const delay of FP_GOAL_SEEK_DELAYS) {
    goalSeekByDelay[String(delay)] = seekFixedCostCutForDelay(
      univ,
      nationalMacro,
      wageParams,
      delay,
      startYear,
      endYear,
    );
  }
  return {
    code: univ.schoolCodeStd,
    operatingLossYear: result.operatingLossYear,
    cashDeficitYear: result.cashDeficitYear,
    liquidityDepletionYear: result.liquidityDepletionYear,
    tuitionByYear: result.tuitionByYear ?? {},
    rows: result.rows,
    tornado,
    goalSeekByDelay,
  };
}

export function computeFpRunEdition(opts: {
  universities: UnivBaseData[];
  nationalMacro: MacroData;
  cpiPct: number;
  runParams: SimulationParams;
  paramsScenario: SimulationScenario;
  startYear: number;
  endYear: number;
}): FpRunEdition {
  const {
    universities,
    nationalMacro,
    cpiPct,
    runParams,
    paramsScenario,
    startYear,
    endYear,
  } = opts;
  const signature = fpRunSignature({
    uniSignature: fpUnisSignature(universities),
    cpiPct,
    params: runParams,
  });
  const paramsForScenario = (scenario: SimulationScenario): SimulationParams =>
    scenario === paramsScenario
      ? runParams
      : { ...scenarioParams(scenario, cpiPct), inflationRatePct: cpiPct };
  const scenarios: FpRunEdition["scenarios"] = {};
  for (const scenario of FP_RUN_SCENARIOS) {
    const simParams = paramsForScenario(scenario);
    scenarios[scenario] = universities.map((univ) =>
      computeStoredSchool(univ, nationalMacro, simParams, startYear, endYear),
    );
  }
  return { v: 3, signature, scenarios };
}
