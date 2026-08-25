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

/** 교비자금(수입) cells_json — 헤더 [계정코드] 기준 */
const EDU_FUND_COL = {
  tuitionRevenue: 11, // 4.등록금수입[1002]
  ordinaryExpense: 29, // 5.경상비전입금[1015]
  legalObligation: 30, // 5.법정부담전입금[1020]
  assetTransfer: 43, // 5.자산전입금[1026]
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
  tuitionRevenue: number;
  ordinaryExpenseTransfer: number;
  legalObligationTransfer: number;
  assetTransfer: number;
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

export function parseAlimiEduFundTransferRow(
  raw: Record<string, string>,
): AlimiEduFundTransfer | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    tuitionRevenue: parseNum(cells[EDU_FUND_COL.tuitionRevenue]),
    ordinaryExpenseTransfer: parseNum(cells[EDU_FUND_COL.ordinaryExpense]),
    legalObligationTransfer: parseNum(cells[EDU_FUND_COL.legalObligation]),
    assetTransfer: parseNum(cells[EDU_FUND_COL.assetTransfer]),
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
  const fundByCode = new Map<string, AlimiEduFundTransfer>();
  for (const row of eduFund) {
    if (row.year !== displayYear) continue;
    fundByCode.set(row.schoolCodeStd, row);
  }

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    CORP_TRANSFER_REP_COHORT_DIVISION[cohort],
  );
  const rows: CorpTransferRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    for (const campus of campuses) {
      const fund = fundByCode.get(campus.schoolCodeStd);
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
