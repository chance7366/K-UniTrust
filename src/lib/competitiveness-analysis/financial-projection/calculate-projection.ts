import type {
  MacroData,
  ProgramSegmentBase,
  ProjectionResult,
  ProjectionRowKind,
  ProjectionYearRow,
  SimulationParams,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";
import { schoolAgeIndexAtYear } from "@/lib/competitiveness-analysis/financial-projection/school-age-tuition-index";
import {
  FP_ANALYSIS_YEAR,
  FP_GRAD_PROGRAM_YEARS,
  FP_SETTLEMENT_YEAR,
} from "@/lib/competitiveness-analysis/financial-projection/years";

const WON_PER_EOK = 100_000_000;

export function wonToEok(won: number): number {
  return Math.round((won / WON_PER_EOK) * 10) / 10;
}

export function fmtEok(eok: number): string {
  return `${eok.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`;
}

function macroAt(macro: MacroData, year: number) {
  const pt = macro.years.find((y) => y.year === year);
  if (pt) return pt;
  const last = macro.years[macro.years.length - 1];
  return last ?? {
    year,
    populationRatio: 0.7,
    schoolAgeDeclineIndex: 70,
    extinctionIndex: 0.5,
  };
}

function reputationMultiplier(reputationRatio: number): number {
  return 1 + reputationRatio * 0.35;
}

function schoolAgeDeclineIndexAt(
  univ: UnivBaseData,
  macro: MacroData,
  year: number,
): number {
  const fromUniv = schoolAgeIndexAtYear(univ.schoolAgeDecline, year);
  if (fromUniv != null) return fromUniv;
  const pt = macroAt(macro, year);
  if (pt.schoolAgeDeclineIndex != null) return pt.schoolAgeDeclineIndex;
  return round1((pt.populationRatio ?? 1) * 100);
}

/** 대학원 충원 — 학령인구·소멸지수 미적용. 시나리오 가감·평판만. */
function projectedGraduateFillRatePct(
  univ: UnivBaseData,
  segment: ProgramSegmentBase,
  fillAdjPct: number,
): number {
  const m = reputationMultiplier(univ.reputationRatio);
  const rate = (segment.freshmanFillRatePct + fillAdjPct) * m;
  return Math.max(20, Math.min(115, rate));
}

function stepCohort(
  students: number,
  quota: number,
  fillPct: number,
  dropoutPct: number,
  programYears: number,
): { freshmen: number; students: number } {
  const years = Math.max(1, programYears);
  const freshmen = Math.round((quota * fillPct) / 100);
  const graduates = Math.round(students / years);
  const next = Math.max(
    0,
    Math.round((students - graduates) * (1 - dropoutPct / 100) + freshmen),
  );
  return { freshmen, students: next };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function weightedFill(
  ugFill: number,
  ugStudents: number,
  grFill: number,
  grStudents: number,
): number {
  const n = ugStudents + grStudents;
  if (n <= 0) return round1(ugFill);
  return round1((ugFill * ugStudents + grFill * grStudents) / n);
}

export function resolveUnivSegments(univ: UnivBaseData): {
  analysisYear: number;
  settlementYear: number;
  undergrad: ProgramSegmentBase;
  graduate: ProgramSegmentBase | null;
} {
  const analysisYear = univ.analysisYear ?? FP_ANALYSIS_YEAR;
  const settlementYear = univ.settlementYear ?? FP_SETTLEMENT_YEAR;
  const undergrad: ProgramSegmentBase = univ.undergrad ?? {
    quota: univ.quota,
    currentStudents: univ.currentStudents,
    freshmanFillRatePct: univ.freshmanFillRatePct,
    enrolledFillRatePct: univ.enrolledFillRatePct,
    dropoutRatePct: univ.dropoutRatePct,
    tuitionPerStudent: univ.tuitionPerStudent,
    programYears: univ.programYears,
  };
  const graduate =
    univ.schoolKind === "전문대학"
      ? null
      : univ.graduate === undefined
        ? null
        : univ.graduate;
  return { analysisYear, settlementYear, undergrad, graduate };
}

function emptyRow(
  year: number,
  rowKind: ProjectionRowKind,
  usableEok: number,
  reservesEok: number,
): ProjectionYearRow {
  return {
    year,
    rowKind,
    quota: 0,
    fillRatePct: 0,
    freshmen: 0,
    students: 0,
    undergradStudents: 0,
    graduateStudents: 0,
    undergradFillRatePct: 0,
    graduateFillRatePct: 0,
    undergradFreshmen: 0,
    graduateFreshmen: 0,
    schoolAgeDeclineIndex: 0,
    tuitionRevenueEok: 0,
    revenueEok: 0,
    expenseEok: 0,
    operatingProfitEok: 0,
    cashflowEok: 0,
    usableLiquidityEok: usableEok,
    reservesEok,
    isDeficit: false,
  };
}

export function calculateProjection(
  univ: UnivBaseData,
  macro: MacroData,
  params: SimulationParams,
  startYear: number,
  endYear: number,
  options?: { lite?: boolean; skipTuition?: boolean; minForecastT?: number },
): ProjectionResult {
  const lite = options?.lite === true;
  const skipTuition = options?.skipTuition === true;
  const minForecastT = options?.minForecastT ?? 0;
  const rows: ProjectionYearRow[] = [];
  const tuitionByYear: Record<number, number> = {};
  const { analysisYear, undergrad, graduate } = resolveUnivSegments(univ);
  let ugStudents = undergrad.currentStudents;
  let grStudents = graduate?.currentStudents ?? 0;
  let ugStockShare = 1;
  let usable = univ.usableLiquidity;
  let bookReserves = univ.currentReserves;
  let operatingLossYear: number | null = null;
  let cashDeficitYear: number | null = null;
  let liquidityDepletionYear: number | null = null;
  const actualByYear = new Map(
    (univ.tuitionActuals ?? []).map((row) => [row.year, row]),
  );
  const historyByYear = new Map(
    (univ.historyStudents ?? []).map((row) => [row.year, row]),
  );
  const loopStart =
    lite && skipTuition ? Math.max(startYear, analysisYear) : startYear;

  for (let year = loopStart; year <= endYear; year += 1) {
    const forecastT = Math.max(minForecastT, year - analysisYear);
    const startingUsableEok = wonToEok(univ.usableLiquidity);
    const startingReservesEok = wonToEok(univ.currentReserves);

    if (year < analysisYear) {
      const actual = actualByYear.get(year);
      const hist = historyByYear.get(year);
      if (!actual && !hist) continue;

      const ug = hist?.undergrad ?? 0;
      const gr = hist?.graduate ?? 0;
      const tuitionWon =
        (actual?.undergradWon ?? 0) + (actual?.graduateWon ?? 0);
      const tuitionEok = wonToEok(tuitionWon);
      if (!skipTuition) tuitionByYear[year] = tuitionEok;
      const ugFill = hist?.undergradFillRatePct ?? undergrad.freshmanFillRatePct;
      const grFill = hist?.graduateFillRatePct ?? graduate?.freshmanFillRatePct ?? 0;
      const quota = undergrad.quota + (graduate?.quota ?? 0);

      if (!lite) {
        rows.push({
          ...emptyRow(year, "actual", startingUsableEok, startingReservesEok),
          quota,
          fillRatePct: weightedFill(ugFill, ug, grFill, gr),
          students: ug + gr,
          undergradStudents: ug,
          graduateStudents: gr,
          undergradFillRatePct: round1(ugFill),
          graduateFillRatePct: round1(grFill),
          tuitionRevenueEok: tuitionEok,
          revenueEok: tuitionEok,
        });
      }
      continue;
    }

    const declineIndex = schoolAgeDeclineIndexAt(univ, macro, year);
    const ugQuota =
      undergrad.quota * Math.pow(1 - params.quotaReductionRatePct / 100, forecastT);
    const grQuota = graduate
      ? graduate.quota * Math.pow(1 - params.quotaReductionRatePct / 100, forecastT)
      : 0;
    const incomingRatio = Math.max(
      0.05,
      (declineIndex / 100) * (1 + params.fillRateAdjPct / 100),
    );
    const ugFill =
      year === analysisYear && minForecastT < 1
        ? undergrad.freshmanFillRatePct
        : Math.max(
            20,
            Math.min(
              115,
              undergrad.freshmanFillRatePct * incomingRatio,
            ),
          );
    const grFill = graduate
      ? projectedGraduateFillRatePct(univ, graduate, params.fillRateAdjPct)
      : 0;
    const ugDropout = undergrad.dropoutRatePct + params.dropoutRateAddonPct;
    const grDropout =
      (graduate?.dropoutRatePct ?? 0) + params.dropoutRateAddonPct;

    let ugFreshmen = 0;
    let grFreshmen = 0;
    if (year === analysisYear) {
      ugStudents = undergrad.currentStudents;
      grStudents = graduate?.currentStudents ?? 0;
      ugStockShare = 1;
      ugFreshmen = Math.round((ugQuota * undergrad.freshmanFillRatePct) / 100);
      grFreshmen = graduate
        ? Math.round((grQuota * graduate.freshmanFillRatePct) / 100)
        : 0;
    } else {
      const years = Math.max(1, undergrad.programYears);
      const persist = (1 - 1 / years) * (1 - ugDropout / 100);
      const quotaFactor = Math.pow(
        1 - params.quotaReductionRatePct / 100,
        forecastT,
      );
      ugStockShare =
        persist * ugStockShare + (1 / years) * incomingRatio * quotaFactor;
      ugStudents = Math.max(
        0,
        Math.round(undergrad.currentStudents * ugStockShare),
      );
      ugFreshmen = Math.round(
        (ugQuota * undergrad.freshmanFillRatePct * incomingRatio) / 100,
      );
      if (graduate) {
        const grNext = stepCohort(
          grStudents,
          grQuota,
          grFill,
          grDropout,
          graduate.programYears || FP_GRAD_PROGRAM_YEARS,
        );
        grFreshmen = grNext.freshmen;
        grStudents = grNext.students;
      } else {
        grStudents = 0;
      }
    }

    const students = ugStudents + grStudents;
    const tuitionFactor = Math.pow(
      1 + params.tuitionIncreaseRatePct / 100,
      forecastT,
    );
    const ugTuition = undergrad.tuitionPerStudent * tuitionFactor;
    const grTuition = (graduate?.tuitionPerStudent ?? 0) * tuitionFactor;
    const tuitionRevenue = ugStudents * ugTuition + grStudents * grTuition;
    const scholarship =
      (univ.nationalScholarship ?? 0) *
      (students / Math.max(1, univ.currentStudents));
    const otherRev =
      univ.otherRevenues *
      (1 + (params.otherRevenueBoostPct ?? 0) / 100) *
      Math.pow(1 + params.subsidyChangeRatePct / 100, forecastT);
    const revenue = tuitionRevenue + scholarship + otherRev;

    const fixed =
      univ.fixedCosts *
      Math.pow(1 + params.wageInflationRatePct / 100, forecastT) *
      Math.pow(1 - params.fixedCostCutRatePct / 100, forecastT);
    const variable =
      students *
      univ.variableCostPerStudent *
      Math.pow(1 + params.inflationRatePct / 100, forecastT);
    const expense = fixed + variable;
    const operatingProfit = revenue - expense;

    usable += operatingProfit;
    bookReserves += operatingProfit;

    const rowKind: ProjectionRowKind =
      year === analysisYear ? "estimate" : "forecast";
    const tuitionEok = wonToEok(tuitionRevenue);
    if (!skipTuition) tuitionByYear[year] = tuitionEok;
    if (!lite) {
      const displayUgFill =
        year === analysisYear ? undergrad.freshmanFillRatePct : ugFill;
      const displayGrFill =
        year === analysisYear ? (graduate?.freshmanFillRatePct ?? 0) : grFill;

      const row: ProjectionYearRow = {
        year,
        rowKind,
        quota: Math.round(ugQuota + grQuota),
        fillRatePct: weightedFill(
          displayUgFill,
          ugStudents,
          displayGrFill,
          grStudents,
        ),
        freshmen: ugFreshmen + grFreshmen,
        students,
        undergradStudents: ugStudents,
        graduateStudents: grStudents,
        undergradFillRatePct: round1(displayUgFill),
        graduateFillRatePct: round1(displayGrFill),
        undergradFreshmen: ugFreshmen,
        graduateFreshmen: grFreshmen,
        schoolAgeDeclineIndex: round1(year < analysisYear ? 0 : declineIndex),
        tuitionRevenueEok: tuitionEok,
        revenueEok: wonToEok(revenue),
        expenseEok: wonToEok(expense),
        operatingProfitEok: wonToEok(operatingProfit),
        cashflowEok: wonToEok(operatingProfit),
        usableLiquidityEok: wonToEok(usable),
        reservesEok: wonToEok(bookReserves),
        isDeficit: operatingProfit < 0,
      };
      rows.push(row);
    }

    if (operatingLossYear == null && operatingProfit < 0) {
      operatingLossYear = year;
    }
    if (cashDeficitYear == null && operatingProfit < 0) {
      cashDeficitYear = year;
    }
    if (liquidityDepletionYear == null && usable <= 0) {
      liquidityDepletionYear = year;
    }
  }

  return {
    rows,
    tuitionByYear,
    operatingLossYear,
    cashDeficitYear,
    liquidityDepletionYear,
    bankruptcyYear: liquidityDepletionYear,
    deathCrossYear: cashDeficitYear,
  };
}

export function scenarioParams(
  scenario: SimulationParams["scenario"],
  wageInflationRatePct = 2.5,
): SimulationParams {
  const base: SimulationParams = {
    scenario: "base",
    inflationRatePct: 2.5,
    wageInflationRatePct,
    tuitionIncreaseRatePct: 0,
    subsidyChangeRatePct: 0,
    quotaReductionRatePct: 0,
    fixedCostCutRatePct: 0,
    otherRevenueBoostPct: 0,
    dropoutRateAddonPct: 0,
    fillRateAdjPct: 0,
  };
  if (scenario === "best") {
    return {
      ...base,
      scenario: "best",
      tuitionIncreaseRatePct: 2.0,
      fixedCostCutRatePct: 2,
      otherRevenueBoostPct: 0,
      fillRateAdjPct: 2,
    };
  }
  if (scenario === "worst") {
    return {
      ...base,
      scenario: "worst",
    subsidyChangeRatePct: -2,
      dropoutRateAddonPct: 1.5,
      fillRateAdjPct: -3,
    };
  }
  if (scenario === "stress") {
    return {
      ...base,
      scenario: "stress",
      subsidyChangeRatePct: -5,
      dropoutRateAddonPct: 3,
      fillRateAdjPct: -8,
    };
  }
  return base;
}

export type ContingencyAction = {
  priority: number;
  action: string;
  effect: string;
  delayYears: number;
};

/**
 * 우선순위 대응 카드.
 * 지연 효과는 모두 목표탐색(고정비)·민감도(토네이도) 실측값에서 가져오며,
 * 같은 페이지의 목표탐색 표·민감도 표와 항상 같은 수치를 인용한다.
 * 정량화 근거가 없는 레버는 지연 연수를 표기하지 않는다.
 */
export function buildContingencyActions(
  univ: UnivBaseData,
  result: ProjectionResult,
  measured: {
    goalSeekByDelay: Record<
      string,
      { cutPct: number; achieved: boolean; targetYear: number }
    >;
    tornado: TornadoItem[];
  },
): ContingencyAction[] {
  if (!result.liquidityDepletionYear) {
    return [
      {
        priority: 1,
        action: "현행 재정 구조 유지 · 가용자금 모니터링",
        effect: "추계 기간 내 가용자금 고갈 없음",
        delayYears: 0,
      },
    ];
  }

  const betterShiftOf = (factor: string) => {
    const hit = measured.tornado.find((t) => t.factor === factor);
    return hit ? Math.max(0, Math.round(hit.betterShift)) : 0;
  };

  /** 보고서 목표탐색 표에 실리는 지연 구간(1~5년) 중 달성 가능한 최대치 */
  const bestGoalSeek = [5, 4, 3, 2, 1]
    .map((delay) => ({ delay, hit: measured.goalSeekByDelay[String(delay)] }))
    .find(({ hit }) => hit != null && hit.achieved && hit.cutPct > 0);

  const cards: Omit<ContingencyAction, "priority">[] = [];

  if (bestGoalSeek?.hit) {
    cards.push({
      action: `고정비(보수·관리운영비·교육외비용) 연 ${fmtPct(bestGoalSeek.hit.cutPct)}% 절감`,
      effect: `지출 경직성 완화 — 고갈 ${bestGoalSeek.hit.targetYear}년으로 이연`,
      delayYears: bestGoalSeek.delay,
    });
  }

  cards.push({
    action: "신입생·재학생 충원율 +1%p 방어 (모집 경쟁력·중도탈락 관리)",
    effect: "등록금 수입 궤적 유지",
    delayYears: betterShiftOf("충원율 ±1%p"),
  });

  cards.push({
    action: "등록금 인상률 +1%p 적용",
    effect: "학생 1인당 등록금 수입 개선",
    delayYears: betterShiftOf("등록금 인상 ±1%p"),
  });

  cards.sort((a, b) => b.delayYears - a.delayYears);

  cards.push({
    action: `법인전입금 연 ${Math.max(5, Math.ceil(univ.fixedCosts / WON_PER_EOK / 40))}억 확충`,
    effect: "가용자금 방어선 상향 (추계 모델 미반영 — 정량 효과 별도 산정)",
    delayYears: 0,
  });

  return cards.map((card, i) => ({ ...card, priority: i + 1 }));
}

function fmtPct(v: number): string {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

export type TornadoItem = {
  factor: string;
  worseShift: number;
  betterShift: number;
};

function depletionOrHorizon(result: ProjectionResult, horizon: number) {
  return result.liquidityDepletionYear ?? horizon + 1;
}

const METRICS_ONLY = { lite: true, skipTuition: true } as const;

export function tornadoSensitivity(
  univ: UnivBaseData,
  macro: MacroData,
  params: SimulationParams,
  startYear: number,
  endYear: number,
): TornadoItem[] {
  const base = calculateProjection(
    univ,
    macro,
    params,
    startYear,
    endYear,
    METRICS_ONLY,
  );
  const b = depletionOrHorizon(base, endYear);

  const run = (partial: Partial<SimulationParams>) =>
    depletionOrHorizon(
      calculateProjection(
        univ,
        macro,
        { ...params, ...partial, scenario: "base" },
        startYear,
        endYear,
        METRICS_ONLY,
      ),
      endYear,
    ) - b;

  return [
    { factor: "충원율 ±1%p", worseShift: run({ fillRateAdjPct: params.fillRateAdjPct - 1 }), betterShift: run({ fillRateAdjPct: params.fillRateAdjPct + 1 }) },
    { factor: "보수(임금) ±1%p", worseShift: run({ wageInflationRatePct: params.wageInflationRatePct + 1 }), betterShift: run({ wageInflationRatePct: Math.max(0, params.wageInflationRatePct - 1) }) },
    { factor: "CPI(변동비) ±1%p", worseShift: run({ inflationRatePct: params.inflationRatePct + 1 }), betterShift: run({ inflationRatePct: Math.max(0, params.inflationRatePct - 1) }) },
    { factor: "등록금 인상 ±1%p", worseShift: run({ tuitionIncreaseRatePct: Math.max(0, params.tuitionIncreaseRatePct - 1) }), betterShift: run({ tuitionIncreaseRatePct: params.tuitionIncreaseRatePct + 1 }) },
    { factor: "정원 감축 ±1%/년", worseShift: run({ quotaReductionRatePct: params.quotaReductionRatePct + 1 }), betterShift: run({ quotaReductionRatePct: Math.max(0, params.quotaReductionRatePct - 1) }) },
  ].sort(
    (a, b2) =>
      Math.abs(b2.worseShift) +
      Math.abs(b2.betterShift) -
      (Math.abs(a.worseShift) + Math.abs(a.betterShift)),
  );
}

export function seekFixedCostCutForDelay(
  univ: UnivBaseData,
  macro: MacroData,
  params: SimulationParams,
  extraYears: number,
  startYear: number,
  endYear: number,
): { cutPct: number; achieved: boolean; targetYear: number } {
  const base = calculateProjection(
    univ,
    macro,
    params,
    startYear,
    endYear,
    METRICS_ONLY,
  );
  if (base.liquidityDepletionYear == null) {
    return { cutPct: 0, achieved: true, targetYear: endYear };
  }
  const targetYear = base.liquidityDepletionYear + extraYears;
  let lo = 0;
  let hi = 12;
  for (let i = 0; i < 18; i += 1) {
    const mid = (lo + hi) / 2;
    const r = calculateProjection(
      univ,
      macro,
      { ...params, fixedCostCutRatePct: mid, scenario: "base" },
      startYear,
      endYear,
      METRICS_ONLY,
    );
    const ok =
      r.liquidityDepletionYear == null || r.liquidityDepletionYear >= targetYear;
    if (ok) hi = mid;
    else lo = mid;
  }
  const check = calculateProjection(
    univ,
    macro,
    { ...params, fixedCostCutRatePct: hi, scenario: "base" },
    startYear,
    endYear,
    METRICS_ONLY,
  );
  const achieved =
    check.liquidityDepletionYear == null ||
    check.liquidityDepletionYear >= targetYear;
  return { cutPct: Math.round(hi * 10) / 10, achieved, targetYear };
}
