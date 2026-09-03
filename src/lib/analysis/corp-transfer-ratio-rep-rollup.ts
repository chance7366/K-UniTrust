import {
  findFinanceAlimiRowForCampus,
  financeAlimiSchoolName,
} from "@/lib/analysis/finance-alimi-campus-join";
import {
  numByAccountCode,
  parseFinanceAlimiCells,
} from "@/lib/analysis/finance-alimi-header-lookup";
import type { CorpTransferRatioRow } from "@/lib/ingest/corp-transfer-ratio-config";
import {
  groupAnalysisTargetByRep,
  normalizeSchoolCodeText,
  parseYearText,
  roundRate1,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";

export type CorpTransferRepCohort = "university" | "junior-college";

export const CORP_TRANSFER_REP_COHORT_LABEL: Record<
  CorpTransferRepCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

export const CORP_TRANSFER_REP_COHORT_DIVISION: Record<
  CorpTransferRepCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

const EDU_FUND_CODE = {
  tuitionRevenue: "1002",
  ordinaryExpense: "1015",
  legalObligation: "1020",
  assetTransfer: "1026",
} as const;
const EDU_FUND_FALLBACK = {
  tuitionRevenue: 11,
  ordinaryExpense: 29,
  legalObligation: 30,
  assetTransfer: 43,
} as const;

export type CorpTransferRepCounts = {
  ordinaryExpenseTransfer: number;
  legalObligationTransfer: number;
  assetTransfer: number;
  totalTransfer: number;
  tuitionRevenue: number;
};

export type CorpTransferRepRow = CorpTransferRepCounts & {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  transferRatio: number | null;
  hasAlimi: boolean;
};

export type AlimiEduFundTransfer = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  tuitionRevenue: number;
  ordinaryExpenseTransfer: number;
  legalObligationTransfer: number;
  assetTransfer: number;
};

export function parseAlimiEduFundTransferRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiEduFundTransfer | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: financeAlimiSchoolName(raw),
    tuitionRevenue: numByAccountCode(cells, headers, EDU_FUND_CODE.tuitionRevenue, EDU_FUND_FALLBACK.tuitionRevenue),
    ordinaryExpenseTransfer: numByAccountCode(cells, headers, EDU_FUND_CODE.ordinaryExpense, EDU_FUND_FALLBACK.ordinaryExpense),
    legalObligationTransfer: numByAccountCode(cells, headers, EDU_FUND_CODE.legalObligation, EDU_FUND_FALLBACK.legalObligation),
    assetTransfer: numByAccountCode(cells, headers, EDU_FUND_CODE.assetTransfer, EDU_FUND_FALLBACK.assetTransfer),
  };
}

function emptyCounts(): CorpTransferRepCounts {
  return {
    ordinaryExpenseTransfer: 0,
    legalObligationTransfer: 0,
    assetTransfer: 0,
    totalTransfer: 0,
    tuitionRevenue: 0,
  };
}

function addCounts(
  a: CorpTransferRepCounts,
  b: CorpTransferRepCounts,
): CorpTransferRepCounts {
  return {
    ordinaryExpenseTransfer:
      a.ordinaryExpenseTransfer + b.ordinaryExpenseTransfer,
    legalObligationTransfer:
      a.legalObligationTransfer + b.legalObligationTransfer,
    assetTransfer: a.assetTransfer + b.assetTransfer,
    totalTransfer: a.totalTransfer + b.totalTransfer,
    tuitionRevenue: a.tuitionRevenue + b.tuitionRevenue,
  };
}

function countsFromSources(
  fund: AlimiEduFundTransfer | undefined,
): CorpTransferRepCounts {
  const ordinaryExpenseTransfer = fund?.ordinaryExpenseTransfer ?? 0;
  const legalObligationTransfer = fund?.legalObligationTransfer ?? 0;
  const assetTransfer = fund?.assetTransfer ?? 0;
  return {
    ordinaryExpenseTransfer,
    legalObligationTransfer,
    assetTransfer,
    totalTransfer:
      ordinaryExpenseTransfer + legalObligationTransfer + assetTransfer,
    tuitionRevenue: fund?.tuitionRevenue ?? 0,
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

export function buildCorpTransferRepRows(args: {
  cohort: CorpTransferRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  eduFund: AlimiEduFundTransfer[];
}): CorpTransferRepRow[] {
  const { cohort, displayYear, roster, eduFund } = args;
  const fundYear = eduFund.filter((row) => row.year === displayYear);

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    CORP_TRANSFER_REP_COHORT_DIVISION[cohort],
  );
  const rows: CorpTransferRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    const usedFund = new Set<(typeof fundYear)[number]>();
    for (const campus of campuses) {
      const fund = findFinanceAlimiRowForCampus(campus, fundYear, usedFund);
      if (!fund) continue;
      campusHit += 1;
      counts = addCounts(counts, countsFromSources(fund));
    }

    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision: CORP_TRANSFER_REP_COHORT_DIVISION[cohort],
      campusCount: campuses.length,
      ...counts,
      transferRatio: roundRate1(counts.totalTransfer, counts.tuitionRevenue),
      hasAlimi: campusHit > 0,
    });
  }

  return rows.sort(
    (a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko") ||
      a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

export function sumCorpTransferCohortRate(rows: CorpTransferRepRow[]): {
  transferRatio: number | null;
} {
  let totalTransfer = 0;
  let tuitionRevenue = 0;
  for (const row of rows) {
    totalTransfer += row.totalTransfer;
    tuitionRevenue += row.tuitionRevenue;
  }
  return { transferRatio: roundRate1(totalTransfer, tuitionRevenue) };
}

export function toCorpTransferRatioRows(
  rows: CorpTransferRepRow[],
): CorpTransferRatioRow[] {
  return rows.map((row) => ({
    year: row.year,
    schoolCodeStd: row.schoolRepCode,
    schoolName: row.schoolRepName,
    schoolDivision: row.schoolDivision,
    schoolKind: row.schoolDivision,
    region: row.region,
    estb: row.estb,
    ordinaryExpenseTransfer: row.ordinaryExpenseTransfer,
    legalObligationTransfer: row.legalObligationTransfer,
    assetTransfer: row.assetTransfer,
    totalTransfer: row.totalTransfer,
    tuitionRevenue: row.tuitionRevenue,
    transferRatio: row.transferRatio ?? 0,
  }));
}
