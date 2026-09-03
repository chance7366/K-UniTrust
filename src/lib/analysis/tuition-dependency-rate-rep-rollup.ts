import {
  findFinanceAlimiRowForCampus,
  financeAlimiSchoolName,
} from "@/lib/analysis/finance-alimi-campus-join";
import {
  numByAccountCode,
  parseFinanceAlimiCells,
} from "@/lib/analysis/finance-alimi-header-lookup";
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

/** 교비자금(수입) — 계정코드, 폴백은 기존 열 번호 */
const EDU_FUND_CODE = {
  operatingRevenue: "1086",
  tuitionRevenue: "1002",
} as const;
const EDU_FUND_FALLBACK = {
  operatingRevenue: 9,
  tuitionRevenue: 11,
} as const;

/** 산단현금 — 계정코드 */
const INDUSTRY_CASH_CODE = {
  operatingCashInflow: "2003",
} as const;
const INDUSTRY_CASH_FALLBACK = {
  operatingCashInflow: 9,
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
  schoolName: string;
  tuitionRevenue: number;
  operatingRevenue: number;
};

export type AlimiIndustryCash = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  operatingCashInflow: number;
};

export function parseAlimiEduFundTuitionRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiEduFundTuition | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: financeAlimiSchoolName(raw),
    tuitionRevenue: numByAccountCode(
      cells,
      headers,
      EDU_FUND_CODE.tuitionRevenue,
      EDU_FUND_FALLBACK.tuitionRevenue,
    ),
    operatingRevenue: numByAccountCode(
      cells,
      headers,
      EDU_FUND_CODE.operatingRevenue,
      EDU_FUND_FALLBACK.operatingRevenue,
    ),
  };
}

export function parseAlimiIndustryCashRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiIndustryCash | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    operatingCashInflow: numByAccountCode(
      cells,
      headers,
      INDUSTRY_CASH_CODE.operatingCashInflow,
      INDUSTRY_CASH_FALLBACK.operatingCashInflow,
    ),
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
  const fundYear = eduFund.filter((row) => row.year === displayYear);
  const cashYear = industryCash.filter((row) => row.year === displayYear);

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    TUITION_DEP_REP_COHORT_DIVISION[cohort],
  );
  const rows: TuitionDepRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    const usedFund = new Set<(typeof fundYear)[number]>();
    const usedCash = new Set<(typeof cashYear)[number]>();
    for (const campus of campuses) {
      const fund = findFinanceAlimiRowForCampus(campus, fundYear, usedFund);
      const cash = findFinanceAlimiRowForCampus(campus, cashYear, usedCash);
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
