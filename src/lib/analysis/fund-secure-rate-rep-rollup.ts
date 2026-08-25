import type { FundSecureRateRow } from "@/lib/ingest/fund-secure-rate-config";
import {
  groupAnalysisTargetByRep,
  normalizeSchoolCodeText,
  parseYearText,
  roundRate1,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";

export type FundSecureRepCohort = "university" | "junior-college";

export const FUND_SECURE_REP_COHORT_LABEL: Record<FundSecureRepCohort, string> =
  {
    university: "대학",
    "junior-college": "전문대학",
  };

export const FUND_SECURE_REP_COHORT_DIVISION: Record<
  FundSecureRepCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

/** 교비대차 cells_json — 헤더 [계정코드] 기준 */
const EDU_BALANCE_COL = {
  currentAssets: 9, // 2.유동자산[1001]
  principalFund: 37, // 3.원금보존기금[1110]
  discretionaryFund: 44, // 3.임의기금[1025]
  currentLiabilities: 80, // 3.유동부채[1050]
  shortTermBorrowings: 81, // 4.단기차입금[1051] (공시 코드 10552 없음)
} as const;

/** 산단대차 cells_json */
const INDUSTRY_BALANCE_COL = {
  currentAssets: 10, // 3.유동자산[2003]
  longTermDeposits: 29, // 5.장기금융상품[2022]
  longTermInvestments: 30, // 5.장기투자금융자산[2023]
  currentLiabilities: 62, // 4.유동부채[2055]
} as const;

/** 교비자금(수입) cells_json */
const EDU_FUND_COL = {
  tuitionRevenue: 11, // 4.등록금수입[1002]
} as const;

export type FundSecureRepCounts = {
  eduCarryover: number;
  eduEndowment: number;
  industryCarryover: number;
  industryEndowment: number;
  totalFunds: number;
  tuitionRevenue: number;
};

export type FundSecureRepRow = FundSecureRepCounts & {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  fundSecureRate: number | null;
  hasAlimi: boolean;
};

export type AlimiEduBalance = {
  year: number;
  schoolCodeStd: string;
  currentAssets: number;
  currentLiabilities: number;
  shortTermBorrowings: number;
  principalFund: number;
  discretionaryFund: number;
};

export type AlimiIndustryBalance = {
  year: number;
  schoolCodeStd: string;
  currentAssets: number;
  currentLiabilities: number;
  longTermDeposits: number;
  longTermInvestments: number;
};

export type AlimiEduFund = {
  year: number;
  schoolCodeStd: string;
  tuitionRevenue: number;
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

export function parseAlimiEduBalanceRow(
  raw: Record<string, string>,
): AlimiEduBalance | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    currentAssets: parseNum(cells[EDU_BALANCE_COL.currentAssets]),
    currentLiabilities: parseNum(cells[EDU_BALANCE_COL.currentLiabilities]),
    shortTermBorrowings: parseNum(cells[EDU_BALANCE_COL.shortTermBorrowings]),
    principalFund: parseNum(cells[EDU_BALANCE_COL.principalFund]),
    discretionaryFund: parseNum(cells[EDU_BALANCE_COL.discretionaryFund]),
  };
}

export function parseAlimiIndustryBalanceRow(
  raw: Record<string, string>,
): AlimiIndustryBalance | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    currentAssets: parseNum(cells[INDUSTRY_BALANCE_COL.currentAssets]),
    currentLiabilities: parseNum(cells[INDUSTRY_BALANCE_COL.currentLiabilities]),
    longTermDeposits: parseNum(cells[INDUSTRY_BALANCE_COL.longTermDeposits]),
    longTermInvestments: parseNum(cells[INDUSTRY_BALANCE_COL.longTermInvestments]),
  };
}

export function parseAlimiEduFundRow(
  raw: Record<string, string>,
): AlimiEduFund | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseCellsJson(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    tuitionRevenue: parseNum(cells[EDU_FUND_COL.tuitionRevenue]),
  };
}

function emptyCounts(): FundSecureRepCounts {
  return {
    eduCarryover: 0,
    eduEndowment: 0,
    industryCarryover: 0,
    industryEndowment: 0,
    totalFunds: 0,
    tuitionRevenue: 0,
  };
}

function addCounts(
  a: FundSecureRepCounts,
  b: FundSecureRepCounts,
): FundSecureRepCounts {
  return {
    eduCarryover: a.eduCarryover + b.eduCarryover,
    eduEndowment: a.eduEndowment + b.eduEndowment,
    industryCarryover: a.industryCarryover + b.industryCarryover,
    industryEndowment: a.industryEndowment + b.industryEndowment,
    totalFunds: a.totalFunds + b.totalFunds,
    tuitionRevenue: a.tuitionRevenue + b.tuitionRevenue,
  };
}

function countsFromSources(
  balance: AlimiEduBalance | undefined,
  industry: AlimiIndustryBalance | undefined,
  fund: AlimiEduFund | undefined,
): FundSecureRepCounts {
  const eduCarryover = balance
    ? balance.currentAssets -
      balance.currentLiabilities +
      balance.shortTermBorrowings
    : 0;
  const eduEndowment = balance
    ? balance.principalFund + balance.discretionaryFund
    : 0;
  const industryCarryover = industry
    ? industry.currentAssets - industry.currentLiabilities
    : 0;
  const industryEndowment = industry
    ? industry.longTermDeposits + industry.longTermInvestments
    : 0;
  const tuitionRevenue = fund?.tuitionRevenue ?? 0;
  return {
    eduCarryover,
    eduEndowment,
    industryCarryover,
    industryEndowment,
    totalFunds:
      eduCarryover + eduEndowment + industryCarryover + industryEndowment,
    tuitionRevenue,
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

export function buildFundSecureRepRows(args: {
  cohort: FundSecureRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  eduBalance: AlimiEduBalance[];
  industryBalance: AlimiIndustryBalance[];
  eduFund: AlimiEduFund[];
}): FundSecureRepRow[] {
  const { cohort, displayYear, roster, eduBalance, industryBalance, eduFund } =
    args;
  const balByCode = new Map<string, AlimiEduBalance>();
  for (const row of eduBalance) {
    if (row.year !== displayYear) continue;
    balByCode.set(row.schoolCodeStd, row);
  }
  const indByCode = new Map<string, AlimiIndustryBalance>();
  for (const row of industryBalance) {
    if (row.year !== displayYear) continue;
    indByCode.set(row.schoolCodeStd, row);
  }
  const fundByCode = new Map<string, AlimiEduFund>();
  for (const row of eduFund) {
    if (row.year !== displayYear) continue;
    fundByCode.set(row.schoolCodeStd, row);
  }

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    FUND_SECURE_REP_COHORT_DIVISION[cohort],
  );
  const rows: FundSecureRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    for (const campus of campuses) {
      const balance = balByCode.get(campus.schoolCodeStd);
      const industry = indByCode.get(campus.schoolCodeStd);
      const fund = fundByCode.get(campus.schoolCodeStd);
      if (!balance && !industry && !fund) continue;
      campusHit += 1;
      counts = addCounts(counts, countsFromSources(balance, industry, fund));
    }

    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision: FUND_SECURE_REP_COHORT_DIVISION[cohort],
      campusCount: campuses.length,
      ...counts,
      fundSecureRate: roundRate1(counts.totalFunds, counts.tuitionRevenue),
      hasAlimi: campusHit > 0,
    });
  }

  return rows.sort(
    (a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko") ||
      a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

export function sumFundSecureCohortRate(rows: FundSecureRepRow[]): {
  fundSecureRate: number | null;
} {
  let totalFunds = 0;
  let tuitionRevenue = 0;
  for (const row of rows) {
    totalFunds += row.totalFunds;
    tuitionRevenue += row.tuitionRevenue;
  }
  return { fundSecureRate: roundRate1(totalFunds, tuitionRevenue) };
}

export function toFundSecureRateRows(
  rows: FundSecureRepRow[],
): FundSecureRateRow[] {
  return rows.map((row) => ({
    year: row.year,
    schoolCodeStd: row.schoolRepCode,
    schoolName: row.schoolRepName,
    schoolDivision: row.schoolDivision,
    schoolKind: row.schoolDivision,
    region: row.region,
    estb: row.estb,
    schoolFundsCarryover: row.eduCarryover,
    schoolFundsEndowment: row.eduEndowment,
    industryCarryover: row.industryCarryover,
    industryEndowment: row.industryEndowment,
    totalFunds: row.totalFunds,
    tuitionRevenue: row.tuitionRevenue,
    fundSecureRate: row.fundSecureRate ?? 0,
  }));
}
