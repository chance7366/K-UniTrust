import { buildContingencyActions, scenarioParams, wonToEok } from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import type { TornadoItem } from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import { riskStage, type RiskStage } from "@/lib/competitiveness-analysis/financial-projection/risk-stage";
import {
  FP_RUN_SCENARIOS,
  storedToProjection,
  type FpGoalSeekStored,
  type FpStoredSchoolRun,
} from "@/lib/competitiveness-analysis/financial-projection/run-results-cache";
import {
  readFpServerRun,
  readFpServerSession,
} from "@/lib/competitiveness-analysis/financial-projection/server-store";
import type {
  ProjectionYearRow,
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";
import { settlementYearOf } from "@/lib/competitiveness-analysis/financial-projection/years";

export const FP_SCENARIO_LABEL: Record<SimulationScenario, string> = {
  best: "낙관",
  base: "기본",
  worst: "비관",
  stress: "한계",
};

export type FpReportPerCapitaRow = {
  year: number;
  /** 1인당 지출 (백만원) */
  expenseMan: number;
  /** 1인당 등록금 (백만원) */
  tuitionMan: number;
  /** 갭 = 지출 − 등록금 (백만원) */
  gapMan: number;
};

export type FpReportScenario = {
  scenario: SimulationScenario;
  label: string;
  params: SimulationParams;
  operatingLossYear: number | null;
  cashDeficitYear: number | null;
  liquidityDepletionYear: number | null;
  stage: RiskStage;
  rows: ProjectionYearRow[];
};

export type FpReportPayload = {
  analysisYear: number;
  settlementYear: number;
  endYear: number;
  cpiPct: number;
  lastRunAt: string | null;
  school: {
    schoolCodeStd: string;
    schoolName: string;
    region: string;
    sigungu: string;
    schoolKind: "대학" | "전문대학";
    quota: number;
    currentStudents: number;
    freshmanFillRatePct: number;
    enrolledFillRatePct: number;
    dropoutRatePct: number;
    tuitionPerStudentEok: number;
    fixedCostsEok: number;
    fixedCostLaborEok: number | null;
    fixedCostAdminEok: number | null;
    fixedCostNonEduEok: number | null;
    variableCostPerStudentEok: number;
    otherRevenuesEok: number;
    nationalScholarshipEok: number;
    usableLiquidityEok: number;
    laborCostCagrPct: number;
  };
  /** 기본(base) 시나리오 — 본문 추계결과의 기준 */
  base: FpReportScenario;
  scenarios: FpReportScenario[];
  perCapitaRows: FpReportPerCapitaRow[];
  tornado: TornadoItem[];
  goalSeekByDelay: Record<string, FpGoalSeekStored>;
  contingencyActions: {
    priority: number;
    action: string;
    effect: string;
    delayYears: number;
  }[];
  /** 분석연도 구조 지표 */
  structure: {
    /** 분석연도 등록금수입/총수입 (%) */
    tuitionDependencePct: number | null;
    /** 분석연도 학생 1인당 고정비 (백만원) */
    fixedCostPerStudentMan: number | null;
    /** 분석연도 학령인구 지수 → 끝연도 지수 */
    schoolAgeIndexStart: number | null;
    schoolAgeIndexEnd: number | null;
  };
};

function resolveScenarioParams(
  scenario: SimulationScenario,
  sessionParams: SimulationParams,
  cpiPct: number,
): SimulationParams {
  if (sessionParams.scenario === scenario) return sessionParams;
  return { ...scenarioParams(scenario, cpiPct), inflationRatePct: cpiPct };
}

function toScenarioData(
  scenario: SimulationScenario,
  stored: FpStoredSchoolRun,
  params: SimulationParams,
  analysisYear: number,
): FpReportScenario {
  return {
    scenario,
    label: FP_SCENARIO_LABEL[scenario],
    params,
    operatingLossYear: stored.operatingLossYear,
    cashDeficitYear: stored.cashDeficitYear,
    liquidityDepletionYear: stored.liquidityDepletionYear,
    stage: riskStage(
      stored.operatingLossYear,
      stored.cashDeficitYear,
      stored.liquidityDepletionYear,
      analysisYear,
    ),
    rows: stored.rows,
  };
}

function perCapitaRows(rows: ProjectionYearRow[]): FpReportPerCapitaRow[] {
  return rows
    .filter((r) => r.rowKind !== "actual")
    .map((r) => {
      const expenseMan =
        r.students > 0 ? (r.expenseEok * 100) / r.students : 0;
      const tuitionMan =
        r.students > 0 ? (r.tuitionRevenueEok * 100) / r.students : 0;
      return {
        year: r.year,
        expenseMan: Math.round(expenseMan * 10) / 10,
        tuitionMan: Math.round(tuitionMan * 10) / 10,
        gapMan: Math.round((expenseMan - tuitionMan) * 10) / 10,
      };
    });
}

export async function buildFpReportPayload(args: {
  analysisYear: number;
  schoolCodeStd: string;
}): Promise<FpReportPayload> {
  const { analysisYear, schoolCodeStd } = args;

  const session = await readFpServerSession(analysisYear);
  if (!session?.universities.length) {
    throw new Error(
      `${analysisYear}년 재정추계 기본설정이 없습니다. 기본설정을 먼저 저장해 주세요.`,
    );
  }
  const edition = await readFpServerRun(analysisYear);
  if (!edition) {
    throw new Error(
      `${analysisYear}년 분석실행 결과가 없습니다. 시나리오 탭에서 분석실행을 완료해 주세요.`,
    );
  }

  const univ: UnivBaseData | undefined = session.universities.find(
    (row) => row.schoolCodeStd === schoolCodeStd,
  );
  if (!univ) {
    throw new Error(`대상대학(${schoolCodeStd})을 찾을 수 없습니다.`);
  }

  const scenarios: FpReportScenario[] = [];
  for (const scenario of FP_RUN_SCENARIOS) {
    const stored = edition.scenarios[scenario]?.find(
      (row) => row.code === schoolCodeStd,
    );
    if (!stored || !stored.rows.length) {
      throw new Error(
        `${FP_SCENARIO_LABEL[scenario]} 시나리오의 저장된 추계가 없습니다. 분석실행을 다시 완료해 주세요.`,
      );
    }
    scenarios.push(
      toScenarioData(
        scenario,
        stored,
        resolveScenarioParams(scenario, session.params, session.cpiPct),
        analysisYear,
      ),
    );
  }

  const base = scenarios.find((s) => s.scenario === "base");
  if (!base) throw new Error("기본 시나리오 추계가 없습니다.");

  const baseStored = edition.scenarios.base!.find(
    (row) => row.code === schoolCodeStd,
  )!;

  const endYear = base.rows[base.rows.length - 1]?.year ?? analysisYear + 19;
  const analysisRow = base.rows.find((r) => r.year === analysisYear);
  const forecastRows = base.rows.filter((r) => r.rowKind !== "actual");
  const lastForecast = forecastRows[forecastRows.length - 1];

  const tuitionDependencePct =
    analysisRow && analysisRow.revenueEok > 0
      ? Math.round((analysisRow.tuitionRevenueEok / analysisRow.revenueEok) * 1000) / 10
      : null;
  const fixedCostPerStudentMan =
    analysisRow && analysisRow.students > 0
      ? Math.round((wonToEok(univ.fixedCosts) * 100 / analysisRow.students) * 10) / 10
      : null;

  return {
    analysisYear,
    settlementYear: univ.settlementYear ?? settlementYearOf(analysisYear),
    endYear,
    cpiPct: session.cpiPct,
    lastRunAt: session.lastRunAt,
    school: {
      schoolCodeStd: univ.schoolCodeStd,
      schoolName: univ.schoolName,
      region: univ.region,
      sigungu: univ.sigungu,
      schoolKind: univ.schoolKind,
      quota: univ.quota,
      currentStudents: univ.currentStudents,
      freshmanFillRatePct: univ.freshmanFillRatePct,
      enrolledFillRatePct: univ.enrolledFillRatePct,
      dropoutRatePct: univ.dropoutRatePct,
      tuitionPerStudentEok: wonToEok(univ.tuitionPerStudent),
      fixedCostsEok: wonToEok(univ.fixedCosts),
      fixedCostLaborEok:
        univ.fixedCostLabor != null && Number.isFinite(univ.fixedCostLabor)
          ? wonToEok(univ.fixedCostLabor)
          : null,
      fixedCostAdminEok:
        univ.fixedCostAdmin != null && Number.isFinite(univ.fixedCostAdmin)
          ? wonToEok(univ.fixedCostAdmin)
          : null,
      fixedCostNonEduEok:
        univ.fixedCostNonEdu != null && Number.isFinite(univ.fixedCostNonEdu)
          ? wonToEok(univ.fixedCostNonEdu)
          : null,
      variableCostPerStudentEok: wonToEok(univ.variableCostPerStudent),
      otherRevenuesEok: wonToEok(univ.otherRevenues),
      nationalScholarshipEok: wonToEok(univ.nationalScholarship),
      usableLiquidityEok: wonToEok(univ.usableLiquidity),
      laborCostCagrPct: univ.laborCostCagrPct,
    },
    base,
    scenarios,
    perCapitaRows: perCapitaRows(base.rows),
    tornado: baseStored.tornado ?? [],
    goalSeekByDelay: baseStored.goalSeekByDelay ?? {},
    contingencyActions: buildContingencyActions(
      univ,
      storedToProjection(baseStored),
      {
        goalSeekByDelay: baseStored.goalSeekByDelay ?? {},
        tornado: baseStored.tornado ?? [],
      },
    ),
    structure: {
      tuitionDependencePct,
      fixedCostPerStudentMan,
      schoolAgeIndexStart:
        forecastRows.find((r) => r.schoolAgeDeclineIndex > 0)
          ?.schoolAgeDeclineIndex ?? null,
      schoolAgeIndexEnd:
        lastForecast && lastForecast.schoolAgeDeclineIndex > 0
          ? lastForecast.schoolAgeDeclineIndex
          : null,
    },
  };
}
