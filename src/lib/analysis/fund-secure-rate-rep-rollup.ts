import {
  findFinanceAlimiRowForCampus,
  financeAlimiSchoolName,
} from "@/lib/analysis/finance-alimi-campus-join";
import {
  numByAccountCode,
  parseFinanceAlimiCells,
} from "@/lib/analysis/finance-alimi-header-lookup";
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

const EDU_BALANCE_CODE = {
  currentAssets: "1001",
  principalFund: "1110",
  discretionaryFund: "1025",
  currentLiabilities: "1050",
  shortTermBorrowings: "1051",
} as const;
const EDU_BALANCE_FALLBACK = {
  currentAssets: 9,
  principalFund: 37,
  discretionaryFund: 44,
  currentLiabilities: 80,
  shortTermBorrowings: 81,
} as const;

const INDUSTRY_BALANCE_CODE = {
  currentAssets: "2003",
  longTermDeposits: "2022",
  longTermInvestments: "2023",
  currentLiabilities: "2055",
} as const;
const INDUSTRY_BALANCE_FALLBACK = {
  currentAssets: 10,
  longTermDeposits: 29,
  longTermInvestments: 30,
  currentLiabilities: 62,
} as const;

const EDU_FUND_CODE = { tuitionRevenue: "1002" } as const;
const EDU_FUND_FALLBACK = { tuitionRevenue: 11 } as const;

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
  schoolName: string;
  currentAssets: number;
  currentLiabilities: number;
  shortTermBorrowings: number;
  principalFund: number;
  discretionaryFund: number;
};

export type AlimiIndustryBalance = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
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

function num(
  cells: string[],
  headers: string[],
  code: string,
  fallback: number,
): number {
  return numByAccountCode(cells, headers, code, fallback);
}

export function parseAlimiEduBalanceRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiEduBalance | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: financeAlimiSchoolName(raw),
    currentAssets: num(cells, headers, EDU_BALANCE_CODE.currentAssets, EDU_BALANCE_FALLBACK.currentAssets),
    currentLiabilities: num(cells, headers, EDU_BALANCE_CODE.currentLiabilities, EDU_BALANCE_FALLBACK.currentLiabilities),
    shortTermBorrowings: num(cells, headers, EDU_BALANCE_CODE.shortTermBorrowings, EDU_BALANCE_FALLBACK.shortTermBorrowings),
    principalFund: num(cells, headers, EDU_BALANCE_CODE.principalFund, EDU_BALANCE_FALLBACK.principalFund),
    discretionaryFund: num(cells, headers, EDU_BALANCE_CODE.discretionaryFund, EDU_BALANCE_FALLBACK.discretionaryFund),
  };
}

export function parseAlimiIndustryBalanceRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiIndustryBalance | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    schoolName: financeAlimiSchoolName(raw),
    currentAssets: num(cells, headers, INDUSTRY_BALANCE_CODE.currentAssets, INDUSTRY_BALANCE_FALLBACK.currentAssets),
    currentLiabilities: num(cells, headers, INDUSTRY_BALANCE_CODE.currentLiabilities, INDUSTRY_BALANCE_FALLBACK.currentLiabilities),
    longTermDeposits: num(cells, headers, INDUSTRY_BALANCE_CODE.longTermDeposits, INDUSTRY_BALANCE_FALLBACK.longTermDeposits),
    longTermInvestments: num(cells, headers, INDUSTRY_BALANCE_CODE.longTermInvestments, INDUSTRY_BALANCE_FALLBACK.longTermInvestments),
  };
}

export function parseAlimiEduFundRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiEduFund | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  return {
    year,
    schoolCodeStd,
    tuitionRevenue: num(cells, headers, EDU_FUND_CODE.tuitionRevenue, EDU_FUND_FALLBACK.tuitionRevenue),
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
  const balYear = eduBalance.filter((row) => row.year === displayYear);
  const indYear = industryBalance.filter((row) => row.year === displayYear);
  const fundYear = eduFund.filter((row) => row.year === displayYear);

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    FUND_SECURE_REP_COHORT_DIVISION[cohort],
  );
  const rows: FundSecureRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    const usedBal = new Set<(typeof balYear)[number]>();
    const usedInd = new Set<(typeof indYear)[number]>();
    const usedFund = new Set<(typeof fundYear)[number]>();
    for (const campus of campuses) {
      const balance = findFinanceAlimiRowForCampus(campus, balYear, usedBal);
      const industry = findFinanceAlimiRowForCampus(campus, indYear, usedInd);
      const fund = findFinanceAlimiRowForCampus(campus, fundYear, usedFund);
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
