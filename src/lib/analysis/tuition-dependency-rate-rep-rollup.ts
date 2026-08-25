import type { TuitionDependencyRateRow } from "@/lib/ingest/tuition-dependency-rate-config";
import {
  groupAnalysisTargetByRep,
  normalizeSchoolCodeText,
  parseYearText,
  roundRate1,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";

export type TuitionDepRepCohort = "university" | "junior-college";

export const TUITION_DEP_REP_COHORT_LABEL: Record<TuitionDepRepCohort, string> =
  {
    university: "대학",
    "junior-college": "전문대학",
  };

export const TUITION_DEP_REP_COHORT_DIVISION: Record<
  TuitionDepRepCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

/** 교비자금(수입) cells_json — 헤더 [계정코드] 기준 */
const EDU_FUND_COL = {
  operatingRevenue: 9, // 2.운영수입[1086]
  tuitionRevenue: 11, // 4.등록금수입[1002]
} as const;

/** 산단현금 cells_json */
const INDUSTRY_CASH_COL = {
  operatingCashInflow: 9, // 2.운영활동현금유입[2003]
} as const;

export type TuitionDepRepCounts = {
  tuitionRevenue: number;
  eduOperatingRevenue: number;
  industryOperatingRevenue: number;
  totalOperatingRevenue: number;
};

export type TuitionDepRepRow = TuitionDepRepCounts & {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  tuitionDependencyRate: number | null;
  hasAlimi: boolean;
};

export type AlimiEduFundTuition = {
  year: number;
  schoolCodeStd: string;
  tuitionRevenue: number;
  operatingRevenue: number;
};

export type AlimiIndustryCash = {
  year: number;
  schoolCodeStd: string;
  operatingCashInflow: number;
};

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

export function parseAlimiEduFundTuitionRow(
  raw: Record<string, string>,
): AlimiEduFundTuition | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    tuitionRevenue: parseNum(cells[EDU_FUND_COL.tuitionRevenue]),
    operatingRevenue: parseNum(cells[EDU_FUND_COL.operatingRevenue]),
  };
}

export function parseAlimiIndustryCashRow(
  raw: Record<string, string>,
): AlimiIndustryCash | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    operatingCashInflow: parseNum(cells[INDUSTRY_CASH_COL.operatingCashInflow]),
  };
}

function emptyCounts(): TuitionDepRepCounts {
  return {
    tuitionRevenue: 0,
    eduOperatingRevenue: 0,
    industryOperatingRevenue: 0,
    totalOperatingRevenue: 0,
  };
}

function addCounts(
  a: TuitionDepRepCounts,
  b: TuitionDepRepCounts,
): TuitionDepRepCounts {
  return {
    tuitionRevenue: a.tuitionRevenue + b.tuitionRevenue,
    eduOperatingRevenue: a.eduOperatingRevenue + b.eduOperatingRevenue,
    industryOperatingRevenue:
      a.industryOperatingRevenue + b.industryOperatingRevenue,
    totalOperatingRevenue: a.totalOperatingRevenue + b.totalOperatingRevenue,
  };
}

function countsFromSources(
  fund: AlimiEduFundTuition | undefined,
  cash: AlimiIndustryCash | undefined,
): TuitionDepRepCounts {
  const tuitionRevenue = fund?.tuitionRevenue ?? 0;
  const eduOperatingRevenue = fund?.operatingRevenue ?? 0;
  const industryOperatingRevenue = cash?.operatingCashInflow ?? 0;
  return {
    tuitionRevenue,
    eduOperatingRevenue,
    industryOperatingRevenue,
    totalOperatingRevenue: eduOperatingRevenue + industryOperatingRevenue,
  };
}

function pickPrimaryCampus(rows: AnalysisTargetCampus[]): AnalysisTargetCampus {
  const main = rows.find((row) => row.mainBranchName === "본교");
  if (main) return main;
  const codeMatch = rows.find(
    (row) => row.schoolRepCode && row.schoolCodeStd === row.schoolRepCode,
  );
  if (codeMatch) return codeMatch;
  return [...rows].sort((a, b) =>
    a.schoolName.localeCompare(b.schoolName, "ko"),
  )[0]!;
}

export function buildTuitionDepRepRows(args: {
  cohort: TuitionDepRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  eduFund: AlimiEduFundTuition[];
  industryCash: AlimiIndustryCash[];
}): TuitionDepRepRow[] {
  const { cohort, displayYear, roster, eduFund, industryCash } = args;
  const fundByCode = new Map<string, AlimiEduFundTuition>();
  for (const row of eduFund) {
    if (row.year !== displayYear) continue;
    fundByCode.set(row.schoolCodeStd, row);
  }
  const cashByCode = new Map<string, AlimiIndustryCash>();
  for (const row of industryCash) {
    if (row.year !== displayYear) continue;
    cashByCode.set(row.schoolCodeStd, row);
  }

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    TUITION_DEP_REP_COHORT_DIVISION[cohort],
  );
  const rows: TuitionDepRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    for (const campus of campuses) {
      const fund = fundByCode.get(campus.schoolCodeStd);
      const cash = cashByCode.get(campus.schoolCodeStd);
      if (!fund && !cash) continue;
      campusHit += 1;
      counts = addCounts(counts, countsFromSources(fund, cash));
    }

    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision: TUITION_DEP_REP_COHORT_DIVISION[cohort],
      campusCount: campuses.length,
      ...counts,
      tuitionDependencyRate: roundRate1(
        counts.tuitionRevenue,
        counts.totalOperatingRevenue,
      ),
      hasAlimi: campusHit > 0,
    });
  }

  return rows.sort(
    (a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko") ||
      a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

export function sumTuitionDepCohortRate(rows: TuitionDepRepRow[]): {
  tuitionDependencyRate: number | null;
} {
  let tuitionRevenue = 0;
  let totalOperatingRevenue = 0;
  for (const row of rows) {
    tuitionRevenue += row.tuitionRevenue;
    totalOperatingRevenue += row.totalOperatingRevenue;
  }
  return {
    tuitionDependencyRate: roundRate1(tuitionRevenue, totalOperatingRevenue),
  };
}

export function toTuitionDependencyRateRows(
  rows: TuitionDepRepRow[],
): TuitionDependencyRateRow[] {
  return rows.map((row) => ({
    year: row.year,
    schoolCodeStd: row.schoolRepCode,
    schoolName: row.schoolRepName,
    schoolDivision: row.schoolDivision,
    schoolKind: row.schoolDivision,
    region: row.region,
    estb: row.estb,
    tuitionRevenue: row.tuitionRevenue,
    schoolOperatingRevenue: row.eduOperatingRevenue,
    industryOperatingRevenue: row.industryOperatingRevenue,
    totalOperatingRevenue: row.totalOperatingRevenue,
    tuitionDependencyRate: row.tuitionDependencyRate ?? 0,
  }));
}
