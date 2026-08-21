import {
  parseAlimiEduBalanceRow,
} from "@/lib/analysis/fund-secure-rate-rep-rollup";
import {
  buildEnrolledASplitByRep,
  parseAlimiEnrolledStudentsGrad,
  parseAlimiEnrolledStudentsUndergrad,
  rosterForYear,
} from "@/lib/analysis/enrolled-students-rep-count";
import {
  normalizeSchoolCodeText,
  parseAnalysisTargetCampus,
  parseYearText,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { loadCompetitivenessTargetUnivMock } from "@/lib/data/competitiveness-target-univ-mock";
import { loadRegionalDeclineDashboard } from "@/lib/data/regional-decline";
import { loadSchoolAgePopulationDashboard } from "@/lib/data/school-age-population";
import { readCsvFile } from "@/lib/csv/read";
import {
  getEditionFull,
  listEditionSummaries,
} from "@/lib/competitiveness-analysis/editions-db";
import { gradeFromCompositeScore } from "@/lib/competitiveness-analysis/diagnostic-grade";
import {
  MOCK_CPI_FORWARD_ASSUMPTION_PCT,
  laborCagrPct,
  type ProjectionTargetRow,
} from "@/lib/competitiveness-analysis/financial-projection/mock-data";
import {
  buildNationalWeightedSchoolAgeDeclineSeries,
  buildSidoSchoolAgeDeclineSeries,
} from "@/lib/competitiveness-analysis/financial-projection/school-age-tuition-index";
import type {
  HistoryStudentYear,
  MacroData,
  ProgramSegmentBase,
  SchoolAgeDeclinePoint,
  TuitionActualYear,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";
import {
  FP_DEFAULT_ANALYSIS_YEAR,
  FP_GRAD_PROGRAM_YEARS,
  FP_HISTORY_START_YEAR,
  isFpAnalysisYear,
  mergeFpAnalysisYears,
  projectionEndYearOf,
  schoolAgeIndexBaseYearOf,
  settlementYearOf,
} from "@/lib/competitiveness-analysis/financial-projection/years";

/** 교비 운영계산서 cells_json — 수업료 폴백용 */
const EDU_OP_COL = {
  tuition: 10, // 3.등록금수입[1001]
} as const;
/** 교비자금(지출) cells_json — 천원 */
const EDU_FUND_EXPENSE_COL = {
  labor: 10, // 3.보수[1136]
  admin: 38, // 3.관리운영비[1154]
  researchStudent: 71, // 3.연구학생경비[1186]
  nonEdu: 89, // 3.교육외비용[1205]
} as const;

/** 평균등록금 대학전문 — 수업료 */
const AVG_TUITION_UG_COL = 7;
/** 평균등록금 대학원 — 수업료 (B) */
const AVG_TUITION_GRAD_COL = 8;
/** 교비자금(수입) cells_json — 천원 */
const EDU_FUND_COL = {
  operatingIncome: 9, // 2.운영수입[1086]
  undergrad: 17, // 6.학부생수업료[1008]
  graduate: 20, // 6.대학원생수업료[1009]
  grant: 67, // 4.국고보조금수입[1048]
} as const;
/** 재정지원 cells_json — 원 */
const SUPPORT_SCHOLAR_COL = 7; // (맞춤형국가장학금)
const METRO_REGIONS = new Set(["서울"]);
const WIDE_REGIONS = new Set([
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
]);

function parseNum(value: string | undefined): number {
  if (value == null) return 0;
  const text = value.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!text || text === "-" || text === "—" || text === "–") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function parseCellsJson(raw: string | undefined): string[] {
  try {
    const cells = JSON.parse(raw ?? "[]") as unknown;
    return Array.isArray(cells) ? cells.map((c) => String(c ?? "")) : [];
  } catch {
    return [];
  }
}

function cheonToWon(cheon: number): number {
  return cheon * 1000;
}

type EduFundYearAmounts = {
  operatingIncome: number;
  undergrad: number;
  graduate: number;
  grant: number;
};

function grossOtherWonFromFund(row: EduFundYearAmounts | undefined): number {
  if (!row) return 0;
  return Math.max(
    0,
    cheonToWon(row.operatingIncome - row.undergrad - row.graduate),
  );
}

function lookbackMaxAvg(y2: number, y1: number, y0: number): number {
  return Math.max((y2 + y1 + y0) / 3, (y1 + y0) / 2);
}

/**
 * 국가장학금 = min(재정지원 맞춤형국가장학금, 교비 국고[1048]).
 * 기타수입 = (운영수입[1086]−수업료[1008·1009] − 국가장학금).
 * 각각 결산연 S 기준 max(S-2~S 평균, S-1~S 평균).
 */
function otherAndScholarshipLookback(
  fundByRepYear: Map<string, EduFundYearAmounts>,
  scholarByRepYear: Map<string, number>,
  code: string,
  settlementYear: number,
): { otherRevenues: number; nationalScholarship: number } {
  const yearParts = (year: number) => {
    const fund = fundByRepYear.get(`${code}::${year}`);
    const cap = fund ? cheonToWon(fund.grant) : 0;
    const scholar = Math.max(
      0,
      Math.min(scholarByRepYear.get(`${code}::${year}`) ?? 0, cap),
    );
    const gross = grossOtherWonFromFund(fund);
    return { scholar, net: Math.max(0, gross - scholar) };
  };
  const a = yearParts(settlementYear);
  const b = yearParts(settlementYear - 1);
  const c = yearParts(settlementYear - 2);
  return {
    otherRevenues: lookbackMaxAvg(c.net, b.net, a.net),
    nationalScholarship: lookbackMaxAvg(c.scholar, b.scholar, a.scholar),
  };
}

function expenseLookback(
  expByRepYear: Map<string, EduFundExpenseAmounts>,
  code: string,
  settlementYear: number,
): {
  fixedCheon: number;
  variableCheon: number;
  laborCheon: number;
  adminCheon: number;
  nonEduCheon: number;
} {
  const yearParts = (year: number) => {
    const exp = expByRepYear.get(`${code}::${year}`);
    return {
      labor: exp?.labor ?? 0,
      admin: exp?.admin ?? 0,
      nonEdu: exp?.nonEdu ?? 0,
      fixed: exp ? exp.labor + exp.admin + exp.nonEdu : 0,
      variable: exp?.researchStudent ?? 0,
    };
  };
  const a = yearParts(settlementYear);
  const b = yearParts(settlementYear - 1);
  const c = yearParts(settlementYear - 2);
  return {
    fixedCheon: lookbackMaxAvg(c.fixed, b.fixed, a.fixed),
    variableCheon: lookbackMaxAvg(c.variable, b.variable, a.variable),
    laborCheon: lookbackMaxAvg(c.labor, b.labor, a.labor),
    adminCheon: lookbackMaxAvg(c.admin, b.admin, a.admin),
    nonEduCheon: lookbackMaxAvg(c.nonEdu, b.nonEdu, a.nonEdu),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function cohortOf(kind: "대학" | "전문대학"): "university" | "junior-college" {
  return kind === "전문대학" ? "junior-college" : "university";
}

function repKey(cohort: string, code: string): string {
  return `${cohort}::${code}`;
}

function indexRepAtYear(
  raw: Record<string, string>[],
  year: number,
): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>();
  for (const row of raw) {
    const rowYear = parseYearText(row.year ?? "");
    const code = normalizeSchoolCodeText(row.school_rep_code ?? "");
    const cohort = row.cohort?.trim() ?? "";
    if (rowYear !== year || !code || !cohort) continue;
    out.set(repKey(cohort, code), row);
  }
  return out;
}

function pickRep(
  index: Map<string, Record<string, string>>,
  kind: "대학" | "전문대학",
  code: string,
): Record<string, string> | undefined {
  return index.get(repKey(cohortOf(kind), code));
}

function pickCohort(
  index: Map<string, Record<string, string>>,
  cohort: string,
  code: string,
): Record<string, string> | undefined {
  return index.get(repKey(cohort, code));
}

function indexRepByYear(
  raw: Record<string, string>[],
): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>();
  for (const row of raw) {
    const year = parseYearText(row.year ?? "");
    const code = normalizeSchoolCodeText(row.school_rep_code ?? "");
    const cohort = row.cohort?.trim() ?? "";
    if (!year || !code || !cohort) continue;
    out.set(`${cohort}::${code}::${year}`, row);
  }
  return out;
}

function pickCohortYear(
  index: Map<string, Record<string, string>>,
  cohort: string,
  code: string,
  year: number,
): Record<string, string> | undefined {
  return index.get(`${cohort}::${code}::${year}`);
}

function weightedAvg(items: { price: number; qty: number }[]): number {
  let pq = 0;
  let q = 0;
  for (const item of items) {
    if (item.price > 0 && item.qty > 0) {
      pq += item.price * item.qty;
      q += item.qty;
    }
  }
  if (q > 0) return pq / q;
  const prices = items.map((item) => item.price).filter((p) => p > 0);
  if (!prices.length) return 0;
  return prices.reduce((s, p) => s + p, 0) / prices.length;
}

function tuitionByCampus(
  raw: Record<string, string>[],
  preferYear: number,
  col: number,
): Map<string, number> {
  const byCode = new Map<string, { year: number; value: number }[]>();
  for (const row of raw) {
    const year = parseYearText(row.year_text ?? "");
    const code = normalizeSchoolCodeText(row.school_code_std ?? "");
    if (!year || !code) continue;
    const value = parseNum(parseCellsJson(row.cells_json)[col]);
    if (value <= 0) continue;
    const list = byCode.get(code) ?? [];
    list.push({ year, value });
    byCode.set(code, list);
  }
  const out = new Map<string, number>();
  for (const [code, list] of byCode) {
    const preferred = list.find((row) => row.year === preferYear);
    if (preferred) out.set(code, preferred.value);
  }
  return out;
}

function enrolledAByCampus(
  rows: { year: number; schoolCodeStd: string; enrolledA: number }[],
  year: number,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) {
    if (row.year !== year) continue;
    out.set(
      row.schoolCodeStd,
      (out.get(row.schoolCodeStd) ?? 0) + row.enrolledA,
    );
  }
  return out;
}

type CampusRep = {
  schoolCodeStd: string;
  schoolRepCode: string;
  region: string;
};

function buildCampusRepMap(raw: Record<string, string>[]): Map<string, CampusRep> {
  const out = new Map<string, CampusRep>();
  const parsed = raw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => a.year - b.year);
  for (const row of parsed) {
    out.set(row.schoolCodeStd, {
      schoolCodeStd: row.schoolCodeStd,
      schoolRepCode: row.schoolRepCode || row.schoolCodeStd,
      region: row.region,
    });
  }
  return out;
}

function campusesOfRep(
  campusMap: Map<string, CampusRep>,
  repCode: string,
): CampusRep[] {
  return [...campusMap.values()].filter((row) => row.schoolRepCode === repCode);
}

type OpAmounts = {
  year: number;
  tuition: number;
};

function parseEduOperation(raw: Record<string, string>): {
  year: number;
  schoolCodeStd: string;
  amounts: Omit<OpAmounts, "year">;
} | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    amounts: {
      tuition: parseNum(cells[EDU_OP_COL.tuition]),
    },
  };
}

function addOp(a: Omit<OpAmounts, "year">, b: Omit<OpAmounts, "year">) {
  return {
    tuition: a.tuition + b.tuition,
  };
}

type EduFundExpenseAmounts = {
  labor: number;
  admin: number;
  researchStudent: number;
  nonEdu: number;
};

function addExp(a: EduFundExpenseAmounts, b: EduFundExpenseAmounts): EduFundExpenseAmounts {
  return {
    labor: a.labor + b.labor,
    admin: a.admin + b.admin,
    researchStudent: a.researchStudent + b.researchStudent,
    nonEdu: a.nonEdu + b.nonEdu,
  };
}

type Liquidity = {
  carryover: number;
  discretionary: number;
  principal: number;
};

function emptyLiq(): Liquidity {
  return {
    carryover: 0,
    discretionary: 0,
    principal: 0,
  };
}

function localOriginRatio(
  region: string,
  origin: Record<string, string> | undefined,
): number {
  if (!origin) return 0.5;
  const special = parseNum(origin.special_city_ratio);
  const metro = parseNum(origin.metro_ratio);
  const wide = parseNum(origin.wide_city_ratio);
  const small = parseNum(origin.small_city_ratio);
  const town = parseNum(origin.town_special_other_ratio);
  let pct = small + town;
  if (METRO_REGIONS.has(region)) pct = metro + special;
  else if (WIDE_REGIONS.has(region)) pct = wide + special;
  return clamp(pct / 100, 0, 1);
}

async function loadLatestGrades(
  analysisYear: number,
): Promise<
  Map<string, { grade: UnivBaseData["compositeGrade"]; reputation: number }>
> {
  const out = new Map<
    string,
    { grade: UnivBaseData["compositeGrade"]; reputation: number }
  >();
  try {
    const summaries = await listEditionSummaries();
    const withResults = summaries
      .filter((s) => s.hasRunResults)
      .sort((a, b) => b.analysisYear - a.analysisYear);
    const latest =
      withResults.find((s) => s.analysisYear === analysisYear) ??
      withResults[0];
    if (!latest) return out;
    const edition = await getEditionFull(latest.analysisYear);
    const rows = edition?.results.runResults ?? [];
    for (const row of rows) {
      const code = normalizeSchoolCodeText(row.schoolCodeStd);
      if (!code) continue;
      out.set(code, {
        grade: gradeFromCompositeScore(row.compositeIndex),
        reputation: clamp(row.compositeIndex / 100, 0.08, 0.95),
      });
    }
  } catch {
    /* 경쟁력분석 미실행이어도 추계 기초자료는 생성 */
  }
  return out;
}

export type FinancialProjectionCoverage = {
  hasTargetRoster: boolean;
  hasSchoolAge: boolean;
};

export type FinancialProjectionBootstrap = {
  analysisYear: number;
  settlementYear: number;
  endYear: number;
  indexBaseYear: number;
  availableYears: number[];
  coverage: FinancialProjectionCoverage;
  rosterYear: number | null;
  targets: ProjectionTargetRow[];
  nationalMacro: MacroData;
  schoolAge: {
    regionLabel: string;
    dataYear: number;
    admissionBaselineYear: number;
    declineSeries: SchoolAgeDeclinePoint[];
  } | null;
  cpiAssumptionPct: number;
};

function resolveAnalysisYear(
  requested: number | undefined,
  available: number[],
): number {
  if (requested != null && isFpAnalysisYear(requested)) return requested;
  return available[0] ?? FP_DEFAULT_ANALYSIS_YEAR;
}

export async function loadFinancialProjectionBootstrap(args?: {
  analysisYear?: number;
}): Promise<FinancialProjectionBootstrap> {
  const [targetData, schoolAge, decline] = await Promise.all([
    loadCompetitivenessTargetUnivMock(
      args?.analysisYear != null ? { year: args.analysisYear } : {},
    ),
    loadSchoolAgePopulationDashboard(),
    loadRegionalDeclineDashboard(),
  ]);

  const availableYears = mergeFpAnalysisYears(
    targetData.years,
    schoolAge.years,
    args?.analysisYear != null ? [args.analysisYear] : [],
  );
  const analysisYear = resolveAnalysisYear(args?.analysisYear, availableYears);
  const settlementYear = settlementYearOf(analysisYear);
  const endYear = projectionEndYearOf(analysisYear);
  const indexBaseYear = schoolAgeIndexBaseYearOf(analysisYear);
  const hasTargetRoster = targetData.years.includes(analysisYear);
  const hasSchoolAge = schoolAge.years.includes(analysisYear);

  const targets: ProjectionTargetRow[] = hasTargetRoster
    ? [
        ...targetData.allCohortRows.university,
        ...targetData.allCohortRows["junior-college"],
      ].map((row) => {
        const kind: "대학" | "전문대학" =
          row.schoolDivision === "전문대학" ? "전문대학" : "대학";
        return {
          schoolCodeStd: row.schoolRepCode,
          schoolName: row.schoolRepName,
          schoolKind: kind,
          region: row.region,
          estb: row.estb,
          campusCount: row.campusCount,
          enrolledTotal: row.enrolledTotal,
          studentAidRestrict: row.studentAidRestrict === "해당" ? "해당" : "",
          provisionalBoard: row.provisionalBoard === "해당" ? "해당" : "",
          noSettlement: row.noSettlement === "해당" ? "해당" : "",
          fundShortage: row.fundShortage === "해당" ? "해당" : "",
          included: true,
        };
      })
    : [];

  const dataYear = hasSchoolAge ? analysisYear : null;
  const nationalDecline =
    dataYear != null
      ? buildNationalWeightedSchoolAgeDeclineSeries(
          schoolAge.rows,
          dataYear,
          endYear,
        )
      : [];

  const sidoLatest = new Map<number, number[]>();
  for (const row of decline.rows) {
    if (row.region === "전국") continue;
    for (const [yearText, cell] of Object.entries(row.byYear)) {
      const year = Number(yearText);
      if (!Number.isFinite(year) || !cell) continue;
      const list = sidoLatest.get(year) ?? [];
      list.push(cell.index);
      sidoLatest.set(year, list);
    }
  }
  const declineYears = [...sidoLatest.keys()].sort((a, b) => a - b);
  const lastDeclineYear = declineYears.at(-1) ?? analysisYear;
  const lastObservedExtinction = (() => {
    const vals = sidoLatest.get(lastDeclineYear) ?? [];
    if (!vals.length) return 0.3;
    return clamp(
      1 - vals.reduce((s, v) => s + v, 0) / vals.length / 100,
      0,
      1,
    );
  })();

  const years: MacroData["years"] = [];
  for (let year = analysisYear; year <= endYear; year += 1) {
    const pop = nationalDecline.find((r) => r.year === year);
    const declineVals = sidoLatest.get(year);
    const extinctionIndex = declineVals?.length
      ? clamp(
          1 - declineVals.reduce((s, v) => s + v, 0) / declineVals.length / 100,
          0,
          1,
        )
      : lastObservedExtinction;
    const index = pop?.index ?? (year <= indexBaseYear ? 100 : 70);
    years.push({
      year,
      populationRatio: Math.round((index / 100) * 1000) / 1000,
      schoolAgeDeclineIndex: index,
      extinctionIndex: round1(extinctionIndex),
    });
  }

  return {
    analysisYear,
    settlementYear,
    endYear,
    indexBaseYear,
    availableYears,
    coverage: { hasTargetRoster, hasSchoolAge },
    rosterYear: hasTargetRoster ? analysisYear : targetData.displayYear,
    targets,
    nationalMacro: {
      regionLabel: "전국 · 시도 입학자원가중 학령인구 감소 지수",
      years,
    },
    schoolAge: nationalDecline.length && dataYear != null
      ? {
          regionLabel: "전국 (시도별 입학자원가중)",
          dataYear,
          admissionBaselineYear: indexBaseYear,
          declineSeries: nationalDecline,
        }
      : null,
    cpiAssumptionPct: MOCK_CPI_FORWARD_ASSUMPTION_PCT,
  };
}

export async function loadFinancialProjectionBaseline(args: {
  schoolCodes: string[];
  analysisYear?: number;
}): Promise<UnivBaseData[]> {
  const wanted = new Set(
    args.schoolCodes.map((c) => normalizeSchoolCodeText(c)).filter(Boolean),
  );
  if (!wanted.size) return [];

  const analysisYearHint =
    args.analysisYear != null && isFpAnalysisYear(args.analysisYear)
      ? args.analysisYear
      : undefined;

  const [
    targetRaw,
    freshmanRaw,
    enrolledRaw,
    dropoutRaw,
    fundRaw,
    originRaw,
    tuitionUgRaw,
    tuitionGradRaw,
    eduFundRaw,
    eduFundExpRaw,
    supportRaw,
    enrolledUgRaw,
    enrolledGradRaw,
    eduOpRaw,
    eduBalRaw,
    bootstrap,
    schoolAgeDash,
  ] = await Promise.all([
    readCsvFile("univMapAnalysisTarget").catch(() => []),
    readCsvFile("financeAnalysisFreshmanEnrollmentRep").catch(() => []),
    readCsvFile("financeAnalysisEnrolledEnrollmentRep").catch(() => []),
    readCsvFile("financeAnalysisDropoutRateRep").catch(() => []),
    readCsvFile("financeAnalysisFundSecureRateRep").catch(() => []),
    readCsvFile("financeAnalysisOriginRegion").catch(() => []),
    readCsvFile("univMapAvgTuitionUndergrad").catch(() => []),
    readCsvFile("univMapAvgTuitionGrad").catch(() => []),
    readCsvFile("univMapEduFund").catch(() => []),
    readCsvFile("univMapEduFundExpense").catch(() => []),
    readCsvFile("univMapFinancialSupport").catch(() => []),
    readCsvFile("univMapEnrolledStudentsUndergrad").catch(() => []),
    readCsvFile("univMapEnrolledStudentsGrad").catch(() => []),
    readCsvFile("univMapEduOperation").catch(() => []),
    readCsvFile("univMapEduBalance").catch(() => []),
    loadFinancialProjectionBootstrap({ analysisYear: analysisYearHint }),
    loadSchoolAgePopulationDashboard(),
  ]);

  const analysisYear = bootstrap.analysisYear;
  const settlementYear = bootstrap.settlementYear;
  const endYear = bootstrap.endYear;
  const grades = await loadLatestGrades(analysisYear);

  const targets = bootstrap.targets.filter((t) => wanted.has(t.schoolCodeStd));
  const campusMap = buildCampusRepMap(targetRaw);

  const freshmanIdx = indexRepAtYear(freshmanRaw, analysisYear);
  const enrolledIdx = indexRepAtYear(enrolledRaw, analysisYear);
  const dropoutIdx = indexRepAtYear(dropoutRaw, analysisYear);
  const freshmanByYear = indexRepByYear(freshmanRaw);
  const enrolledByYear = indexRepByYear(enrolledRaw);
  const fundIdx = indexRepAtYear(fundRaw, settlementYear);

  const originLatest = new Map<string, Record<string, string>>();
  for (const row of originRaw) {
    const year = parseYearText(row.year ?? "");
    const code = normalizeSchoolCodeText(row.school_code_std ?? "");
    if (!year || !code || year > analysisYear) continue;
    const prev = originLatest.get(code);
    const prevYear = prev ? parseYearText(prev.year ?? "") : null;
    if (prevYear == null || year >= prevYear) originLatest.set(code, row);
  }

  const rosterAll = targetRaw
    .map(parseAnalysisTargetCampus)
    .filter((row): row is AnalysisTargetCampus => row != null);
  const rosterYears = [...new Set(rosterAll.map((row) => row.year))].sort(
    (a, b) => b - a,
  );
  const undergradEnrolled = enrolledUgRaw
    .map(parseAlimiEnrolledStudentsUndergrad)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const gradEnrolled = enrolledGradRaw
    .map(parseAlimiEnrolledStudentsGrad)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const splitByYear = new Map<
    number,
    ReturnType<typeof buildEnrolledASplitByRep>
  >();
  for (let year = FP_HISTORY_START_YEAR; year <= analysisYear; year += 1) {
    splitByYear.set(
      year,
      buildEnrolledASplitByRep({
        year,
        roster: rosterForYear(rosterAll, rosterYears, year),
        undergrad: undergradEnrolled,
        grad: gradEnrolled,
      }),
    );
  }

  const ugAByCampus = enrolledAByCampus(undergradEnrolled, analysisYear);
  const grAByCampus = enrolledAByCampus(gradEnrolled, analysisYear);
  const ugTuitionByCampus = tuitionByCampus(
    tuitionUgRaw,
    analysisYear,
    AVG_TUITION_UG_COL,
  );
  const grTuitionByCampus = tuitionByCampus(
    tuitionGradRaw,
    analysisYear,
    AVG_TUITION_GRAD_COL,
  );

  const fundByRepYear = new Map<string, EduFundYearAmounts>();
  for (const raw of eduFundRaw) {
    const year = parseYearText(raw.year_text ?? "");
    const campus = normalizeSchoolCodeText(raw.school_code_std ?? "");
    if (!year || !campus) continue;
    const rep = campusMap.get(campus)?.schoolRepCode;
    if (!rep || !wanted.has(rep)) continue;
    const cells = parseCellsJson(raw.cells_json);
    const add = {
      operatingIncome: parseNum(cells[EDU_FUND_COL.operatingIncome]),
      undergrad: parseNum(cells[EDU_FUND_COL.undergrad]),
      graduate: parseNum(cells[EDU_FUND_COL.graduate]),
      grant: parseNum(cells[EDU_FUND_COL.grant]),
    };
    const key = `${rep}::${year}`;
    const prev = fundByRepYear.get(key);
    fundByRepYear.set(
      key,
      prev
        ? {
            operatingIncome: prev.operatingIncome + add.operatingIncome,
            undergrad: prev.undergrad + add.undergrad,
            graduate: prev.graduate + add.graduate,
            grant: prev.grant + add.grant,
          }
        : add,
    );
  }

  const scholarByRepYear = new Map<string, number>();
  for (const raw of supportRaw) {
    const year = parseYearText(raw.year_text ?? "");
    const campus = normalizeSchoolCodeText(raw.school_code_std ?? "");
    if (!year || !campus) continue;
    const rep = campusMap.get(campus)?.schoolRepCode;
    if (!rep || !wanted.has(rep)) continue;
    const cells = parseCellsJson(raw.cells_json);
    const add = parseNum(cells[SUPPORT_SCHOLAR_COL]);
    const key = `${rep}::${year}`;
    scholarByRepYear.set(key, (scholarByRepYear.get(key) ?? 0) + add);
  }

  const expByRepYear = new Map<string, EduFundExpenseAmounts>();
  const expYearsByRep = new Map<string, number[]>();
  for (const raw of eduFundExpRaw) {
    const year = parseYearText(raw.year_text ?? "");
    const campus = normalizeSchoolCodeText(raw.school_code_std ?? "");
    if (!year || !campus) continue;
    const rep = campusMap.get(campus)?.schoolRepCode;
    if (!rep || !wanted.has(rep)) continue;
    const cells = parseCellsJson(raw.cells_json);
    const add: EduFundExpenseAmounts = {
      labor: parseNum(cells[EDU_FUND_EXPENSE_COL.labor]),
      admin: parseNum(cells[EDU_FUND_EXPENSE_COL.admin]),
      researchStudent: parseNum(cells[EDU_FUND_EXPENSE_COL.researchStudent]),
      nonEdu: parseNum(cells[EDU_FUND_EXPENSE_COL.nonEdu]),
    };
    const key = `${rep}::${year}`;
    const prev = expByRepYear.get(key);
    expByRepYear.set(key, prev ? addExp(prev, add) : add);
    const years = expYearsByRep.get(rep) ?? [];
    if (!years.includes(year)) years.push(year);
    expYearsByRep.set(rep, years);
  }

  const opByRepYear = new Map<string, Omit<OpAmounts, "year">>();
  const opYearsByRep = new Map<string, number[]>();
  for (const raw of eduOpRaw) {
    const parsed = parseEduOperation(raw);
    if (!parsed) continue;
    const rep = campusMap.get(parsed.schoolCodeStd)?.schoolRepCode;
    if (!rep || !wanted.has(rep)) continue;
    const key = `${rep}::${parsed.year}`;
    const prev = opByRepYear.get(key);
    opByRepYear.set(key, prev ? addOp(prev, parsed.amounts) : parsed.amounts);
    const years = opYearsByRep.get(rep) ?? [];
    if (!years.includes(parsed.year)) years.push(parsed.year);
    opYearsByRep.set(rep, years);
  }

  const liqYearCandidates = [
    ...new Set(
      eduBalRaw
        .map((r) => parseYearText(r.year_text ?? ""))
        .filter((y): y is number => y != null && y <= settlementYear),
    ),
  ].sort((a, b) => b - a);
  const liqYear =
    liqYearCandidates.find((year) => year === settlementYear) ??
    liqYearCandidates[0] ??
    null;
  const liqByRep = new Map<string, Liquidity>();
  if (liqYear != null) {
    const balByCode = new Map(
      eduBalRaw
        .map(parseAlimiEduBalanceRow)
        .filter((row): row is NonNullable<typeof row> => row != null && row.year === liqYear)
        .map((row) => [row.schoolCodeStd, row]),
    );
    for (const campus of campusMap.values()) {
      if (!wanted.has(campus.schoolRepCode)) continue;
      const bal = balByCode.get(campus.schoolCodeStd);
      if (!bal) continue;
      const carryover =
        bal.currentAssets - bal.currentLiabilities + bal.shortTermBorrowings;
      const next = liqByRep.get(campus.schoolRepCode) ?? emptyLiq();
      next.carryover += carryover;
      next.discretionary += bal.discretionaryFund;
      next.principal += bal.principalFund;
      liqByRep.set(campus.schoolRepCode, next);
    }
  }

  const universities: UnivBaseData[] = [];
  for (const target of targets) {
    const code = target.schoolCodeStd;
    const ugCohort = cohortOf(target.schoolKind);
    const freshman = pickRep(freshmanIdx, target.schoolKind, code);
    const enrolled = pickRep(enrolledIdx, target.schoolKind, code);
    const dropout = pickRep(dropoutIdx, target.schoolKind, code);
    const freshmanGr =
      target.schoolKind === "대학"
        ? pickCohort(freshmanIdx, "graduate", code)
        : undefined;
    const enrolledGr =
      target.schoolKind === "대학"
        ? pickCohort(enrolledIdx, "graduate", code)
        : undefined;
    const dropoutGr =
      target.schoolKind === "대학"
        ? pickCohort(dropoutIdx, "graduate", code)
        : undefined;
    const fund = pickRep(fundIdx, target.schoolKind, code);

    const campuses = campusesOfRep(campusMap, code);
    const splitAnalysis = splitByYear.get(analysisYear);
    /** 등록금 Q: 재학생충원율 재학생/계 (분석연도 상반기 + 전년 하반기 평균) */
    let ugStudents = Math.round(parseNum(enrolled?.enrolled_total));
    if (ugStudents <= 0) {
      ugStudents =
        splitAnalysis?.undergrad.get(code) ??
        Math.round(parseNum(dropout?.enrolled_students));
    }
    let grStudents = 0;
    if (target.schoolKind === "대학") {
      grStudents = Math.round(parseNum(enrolledGr?.enrolled_total));
      if (grStudents <= 0) {
        grStudents =
          splitAnalysis?.graduate.get(code) ??
          Math.round(parseNum(dropoutGr?.enrolled_students));
      }
    }

    let ugTuition = weightedAvg(
      campuses.map((campus) => ({
        price: ugTuitionByCampus.get(campus.schoolCodeStd) ?? 0,
        qty: ugAByCampus.get(campus.schoolCodeStd) ?? 0,
      })),
    );
    let grTuition =
      target.schoolKind === "대학"
        ? weightedAvg(
            campuses.map((campus) => ({
              price: grTuitionByCampus.get(campus.schoolCodeStd) ?? 0,
              qty: grAByCampus.get(campus.schoolCodeStd) ?? 0,
            })),
          )
        : 0;

    const fundSettlement = fundByRepYear.get(`${code}::${settlementYear}`);
    if (ugTuition <= 0 && ugStudents > 0 && (fundSettlement?.undergrad ?? 0) > 0) {
      ugTuition = cheonToWon(fundSettlement!.undergrad) / ugStudents;
    }
    if (grTuition <= 0 && grStudents > 0 && (fundSettlement?.graduate ?? 0) > 0) {
      grTuition = cheonToWon(fundSettlement!.graduate) / grStudents;
    }

    const ugQuota = Math.round(parseNum(freshman?.admission_quota));
    const grQuota =
      target.schoolKind === "대학"
        ? Math.round(parseNum(freshmanGr?.admission_quota))
        : 0;

    const undergrad: ProgramSegmentBase = {
      quota: ugQuota,
      currentStudents: Math.round(ugStudents),
      freshmanFillRatePct: round1(parseNum(freshman?.fill_rate_within)),
      enrolledFillRatePct: round1(parseNum(enrolled?.fill_rate_within)),
      dropoutRatePct: round1(parseNum(dropout?.enrolled_dropout_rate)),
      tuitionPerStudent: Math.round(ugTuition),
      programYears: target.schoolKind === "전문대학" ? 2 : 4,
    };

    const hasGraduate =
      target.schoolKind === "대학" &&
      (grStudents > 0 || grQuota > 0 || grTuition > 0);
    const graduate: ProgramSegmentBase | null = hasGraduate
      ? {
          quota: grQuota,
          currentStudents: Math.round(grStudents),
          freshmanFillRatePct: round1(parseNum(freshmanGr?.fill_rate_within)),
          enrolledFillRatePct: round1(parseNum(enrolledGr?.fill_rate_within)),
          dropoutRatePct: round1(parseNum(dropoutGr?.enrolled_dropout_rate)),
          tuitionPerStudent: Math.round(grTuition),
          programYears: FP_GRAD_PROGRAM_YEARS,
        }
      : null;
    if (!hasGraduate) grStudents = 0;

    const quota = undergrad.quota + (graduate?.quota ?? 0);
    const currentStudents =
      undergrad.currentStudents + (graduate?.currentStudents ?? 0);
    const freshmanFillRatePct = undergrad.freshmanFillRatePct;
    const enrolledFillRatePct = undergrad.enrolledFillRatePct;
    const dropoutRatePct =
      currentStudents > 0
        ? round1(
            (undergrad.dropoutRatePct * undergrad.currentStudents +
              (graduate?.dropoutRatePct ?? 0) * (graduate?.currentStudents ?? 0)) /
              currentStudents,
          )
        : undergrad.dropoutRatePct;

    const historyStudents: HistoryStudentYear[] = [];
    const tuitionActuals: TuitionActualYear[] = [];
    for (let year = FP_HISTORY_START_YEAR; year <= analysisYear; year += 1) {
      const split = splitByYear.get(year);
      const ugFillRow = pickCohortYear(freshmanByYear, ugCohort, code, year);
      const grFillRow =
        target.schoolKind === "대학"
          ? pickCohortYear(freshmanByYear, "graduate", code, year)
          : undefined;
      const ugEnrolledRow = pickCohortYear(enrolledByYear, ugCohort, code, year);
      const grEnrolledRow =
        target.schoolKind === "대학"
          ? pickCohortYear(enrolledByYear, "graduate", code, year)
          : undefined;
      const ug =
        Math.round(parseNum(ugEnrolledRow?.enrolled_total)) ||
        (split?.undergrad.get(code) ?? 0);
      const gr =
        target.schoolKind === "대학"
          ? Math.round(parseNum(grEnrolledRow?.enrolled_total)) ||
            (split?.graduate.get(code) ?? 0)
          : 0;
      if (ug > 0 || gr > 0) {
        historyStudents.push({
          year,
          undergrad: ug,
          graduate: gr,
          undergradFillRatePct: round1(parseNum(ugFillRow?.fill_rate_within)),
          graduateFillRatePct: round1(parseNum(grFillRow?.fill_rate_within)),
        });
      }
      if (year <= settlementYear) {
        const yearFund = fundByRepYear.get(`${code}::${year}`);
        if (yearFund && (yearFund.undergrad > 0 || yearFund.graduate > 0)) {
          tuitionActuals.push({
            year,
            undergradWon: cheonToWon(yearFund.undergrad),
            graduateWon: cheonToWon(yearFund.graduate),
          });
        }
      }
    }

    const opYears = (opYearsByRep.get(code) ?? [])
      .filter((year) => year <= settlementYear)
      .sort((a, b) => a - b);
    const latestOpYear =
      opYears.find((year) => year === settlementYear) ?? opYears.at(-1);
    const op = latestOpYear != null ? opByRepYear.get(`${code}::${latestOpYear}`) : undefined;

    const expYears = (expYearsByRep.get(code) ?? [])
      .filter((year) => year <= settlementYear)
      .sort((a, b) => a - b);
    const laborPoints = expYears.slice(-5).map((year) => ({
      year,
      laborEok: expByRepYear.get(`${code}::${year}`)?.labor ?? 0,
    }));

    const liq = liqByRep.get(code);
    const usableCheon = liq
      ? liq.carryover + liq.discretionary + liq.principal
      : parseNum(fund?.edu_carryover) + parseNum(fund?.edu_endowment);
    const reservesCheon = usableCheon;

    if (undergrad.tuitionPerStudent <= 0 && currentStudents > 0 && op) {
      undergrad.tuitionPerStudent = Math.round(
        cheonToWon(op.tuition) / currentStudents,
      );
    }
    let tuitionPerStudentBlended =
      currentStudents > 0
        ? (undergrad.currentStudents * undergrad.tuitionPerStudent +
            (graduate?.currentStudents ?? 0) * (graduate?.tuitionPerStudent ?? 0)) /
          currentStudents
        : undergrad.tuitionPerStudent;
    if (tuitionPerStudentBlended <= 0 && currentStudents > 0) {
      const lastActual = [...tuitionActuals]
        .reverse()
        .find((row) => row.undergradWon + row.graduateWon > 0);
      if (lastActual) {
        const hist = historyStudents.find((row) => row.year === lastActual.year);
        const denom = Math.max(
          1,
          (hist?.undergrad ?? 0) + (hist?.graduate ?? 0) || currentStudents,
        );
        tuitionPerStudentBlended =
          (lastActual.undergradWon + lastActual.graduateWon) / denom;
        if (undergrad.tuitionPerStudent <= 0) {
          undergrad.tuitionPerStudent = Math.round(tuitionPerStudentBlended);
        }
      }
    }

    const { fixedCheon, variableCheon, laborCheon, adminCheon, nonEduCheon } =
      expenseLookback(expByRepYear, code, settlementYear);
    const fixedCosts = cheonToWon(fixedCheon);
    const fixedCostLabor = cheonToWon(laborCheon);
    const fixedCostAdmin = cheonToWon(adminCheon);
    const fixedCostNonEdu = cheonToWon(nonEduCheon);
    const variableCostPerStudent =
      currentStudents > 0 ? cheonToWon(variableCheon) / currentStudents : 0;
    const { otherRevenues, nationalScholarship } = otherAndScholarshipLookback(
      fundByRepYear,
      scholarByRepYear,
      code,
      settlementYear,
    );
    const govGrant = 0;

    const gradeInfo = grades.get(code);
    const hasCore =
      quota > 0 ||
      currentStudents > 0 ||
      fixedCosts > 0 ||
      usableCheon !== 0;
    if (!hasCore) continue;

    universities.push({
      schoolCodeStd: code,
      schoolName: target.schoolName,
      region: target.region,
      sigungu: "",
      schoolKind: target.schoolKind,
      programYears: target.schoolKind === "전문대학" ? 2 : 4,
      compositeGrade: gradeInfo?.grade ?? "C",
      quota,
      currentStudents,
      freshmanFillRatePct,
      enrolledFillRatePct,
      dropoutRatePct,
      reputationRatio: round1(
        (gradeInfo?.reputation ??
          clamp(freshmanFillRatePct / 100, 0.1, 0.85)) * 100,
      ) / 100,
      localOriginRatio: round1(
        localOriginRatio(
          target.region,
          campuses.map((c) => originLatest.get(c.schoolCodeStd)).find((row) => row != null),
        ) * 100,
      ) / 100,
      currentReserves: cheonToWon(reservesCheon),
      usableLiquidity: cheonToWon(usableCheon),
      tuitionPerStudent: Math.round(tuitionPerStudentBlended),
      fixedCosts,
      fixedCostLabor,
      fixedCostAdmin,
      fixedCostNonEdu,
      variableCostPerStudent: Math.round(variableCostPerStudent),
      otherRevenues,
      nationalScholarship,
      govGrant,
      laborCostCagrPct: round1(laborCagrPct(laborPoints)),
      analysisYear,
      settlementYear,
      undergrad,
      graduate,
      tuitionActuals,
      historyStudents,
      schoolAgeDecline: buildSidoSchoolAgeDeclineSeries(
        schoolAgeDash.rows,
        target.region,
        analysisYear,
        endYear,
      ),
    });
  }

  return universities.sort((a, b) =>
    a.schoolName.localeCompare(b.schoolName, "ko"),
  );
}
