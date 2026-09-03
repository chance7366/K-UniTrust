import {
  findFinanceAlimiRowForCampus,
  financeAlimiSchoolName,
} from "@/lib/analysis/finance-alimi-campus-join";
import {
  numByAccountCode,
  numByHeaderLabel,
  parseFinanceAlimiCells,
} from "@/lib/analysis/finance-alimi-header-lookup";
import type { FinancialSupportBenefitRateRow } from "@/lib/ingest/financial-support-benefit-rate-config";
import {
  groupAnalysisTargetByRep,
  normalizeSchoolCodeText,
  parseYearText,
  roundRate1,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";

export type FinSupportRepCohort = "university" | "junior-college";

export const FIN_SUPPORT_REP_COHORT_LABEL: Record<FinSupportRepCohort, string> =
  {
    university: "대학",
    "junior-college": "전문대학",
  };

export const FIN_SUPPORT_REP_COHORT_DIVISION: Record<
  FinSupportRepCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

const SUPPORT_LABEL = {
  moe: "교육부",
  scholarship: "(맞춤형국가장학금)",
  science: "과학기술정보통신부",
  employment: "고용노동부",
  trade: "산업통상부",
  health: "보건복지부",
  culture: "문화체육관광부",
  sme: "중소벤처기업부",
  agriculture: "농림축산식품부",
  other: "기타 28개부처청",
  local: "지방자치단체",
} as const;
const SUPPORT_FALLBACK = {
  moe: 6,
  scholarship: 7,
  science: 8,
  employment: 9,
  trade: 10,
  health: 11,
  culture: 12,
  sme: 13,
  agriculture: 14,
  other: 15,
  local: 16,
} as const;

export type FinSupportRepCounts = {
  ministryOfEducation: number;
  nationalScholarship: number;
  ministryOfScienceIct: number;
  ministryOfEmployment: number;
  ministryOfTrade: number;
  ministryOfHealth: number;
  ministryOfCulture: number;
  ministryOfSme: number;
  ministryOfAgriculture: number;
  otherMinistries: number;
  localGovernment: number;
  centralMinistries: number;
  centralSubtotal: number;
  totalSupport: number;
  tuitionRevenue: number;
};

export type FinSupportRepRow = FinSupportRepCounts & {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  benefitRate: number | null;
  hasAlimi: boolean;
};

export type AlimiFinancialSupport = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  ministryOfEducation: number;
  nationalScholarship: number;
  ministryOfScienceIct: number;
  ministryOfEmployment: number;
  ministryOfTrade: number;
  ministryOfHealth: number;
  ministryOfCulture: number;
  ministryOfSme: number;
  ministryOfAgriculture: number;
  otherMinistries: number;
  localGovernment: number;
};

export type AlimiEduFundTuition = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  tuitionRevenue: number;
};

export function parseAlimiFinancialSupportRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiFinancialSupport | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  const n = (label: string, fallback: number) =>
    numByHeaderLabel(cells, headers, label, fallback);
  return {
    year,
    schoolCodeStd,
    ministryOfEducation: n(SUPPORT_LABEL.moe, SUPPORT_FALLBACK.moe),
    nationalScholarship: n(SUPPORT_LABEL.scholarship, SUPPORT_FALLBACK.scholarship),
    ministryOfScienceIct: n(SUPPORT_LABEL.science, SUPPORT_FALLBACK.science),
    ministryOfEmployment: n(SUPPORT_LABEL.employment, SUPPORT_FALLBACK.employment),
    ministryOfTrade: n(SUPPORT_LABEL.trade, SUPPORT_FALLBACK.trade),
    ministryOfHealth: n(SUPPORT_LABEL.health, SUPPORT_FALLBACK.health),
    ministryOfCulture: n(SUPPORT_LABEL.culture, SUPPORT_FALLBACK.culture),
    ministryOfSme: n(SUPPORT_LABEL.sme, SUPPORT_FALLBACK.sme),
    ministryOfAgriculture: n(SUPPORT_LABEL.agriculture, SUPPORT_FALLBACK.agriculture),
    otherMinistries: n(SUPPORT_LABEL.other, SUPPORT_FALLBACK.other),
    localGovernment: n(SUPPORT_LABEL.local, SUPPORT_FALLBACK.local),
  };
}

export function parseAlimiEduFundTuitionOnlyRow(
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
    tuitionRevenue: numByAccountCode(cells, headers, "1002", 11),
  };
}

function emptyCounts(): FinSupportRepCounts {
  return {
    ministryOfEducation: 0,
    nationalScholarship: 0,
    ministryOfScienceIct: 0,
    ministryOfEmployment: 0,
    ministryOfTrade: 0,
    ministryOfHealth: 0,
    ministryOfCulture: 0,
    ministryOfSme: 0,
    ministryOfAgriculture: 0,
    otherMinistries: 0,
    localGovernment: 0,
    centralMinistries: 0,
    centralSubtotal: 0,
    totalSupport: 0,
    tuitionRevenue: 0,
  };
}

function addCounts(
  a: FinSupportRepCounts,
  b: FinSupportRepCounts,
): FinSupportRepCounts {
  return {
    ministryOfEducation: a.ministryOfEducation + b.ministryOfEducation,
    nationalScholarship: a.nationalScholarship + b.nationalScholarship,
    ministryOfScienceIct: a.ministryOfScienceIct + b.ministryOfScienceIct,
    ministryOfEmployment: a.ministryOfEmployment + b.ministryOfEmployment,
    ministryOfTrade: a.ministryOfTrade + b.ministryOfTrade,
    ministryOfHealth: a.ministryOfHealth + b.ministryOfHealth,
    ministryOfCulture: a.ministryOfCulture + b.ministryOfCulture,
    ministryOfSme: a.ministryOfSme + b.ministryOfSme,
    ministryOfAgriculture: a.ministryOfAgriculture + b.ministryOfAgriculture,
    otherMinistries: a.otherMinistries + b.otherMinistries,
    localGovernment: a.localGovernment + b.localGovernment,
    centralMinistries: a.centralMinistries + b.centralMinistries,
    centralSubtotal: a.centralSubtotal + b.centralSubtotal,
    totalSupport: a.totalSupport + b.totalSupport,
    tuitionRevenue: a.tuitionRevenue + b.tuitionRevenue,
  };
}

function countsFromSources(
  support: AlimiFinancialSupport | undefined,
  fund: AlimiEduFundTuition | undefined,
): FinSupportRepCounts {
  const ministryOfEducation = support?.ministryOfEducation ?? 0;
  const nationalScholarship = support?.nationalScholarship ?? 0;
  const ministryOfScienceIct = support?.ministryOfScienceIct ?? 0;
  const ministryOfEmployment = support?.ministryOfEmployment ?? 0;
  const ministryOfTrade = support?.ministryOfTrade ?? 0;
  const ministryOfHealth = support?.ministryOfHealth ?? 0;
  const ministryOfCulture = support?.ministryOfCulture ?? 0;
  const ministryOfSme = support?.ministryOfSme ?? 0;
  const ministryOfAgriculture = support?.ministryOfAgriculture ?? 0;
  const otherMinistries = support?.otherMinistries ?? 0;
  const localGovernment = support?.localGovernment ?? 0;
  const centralMinistries =
    ministryOfEducation +
    ministryOfScienceIct +
    ministryOfEmployment +
    ministryOfTrade +
    ministryOfHealth +
    ministryOfCulture +
    ministryOfSme +
    ministryOfAgriculture +
    otherMinistries;
  const centralSubtotal = centralMinistries - nationalScholarship;
  return {
    ministryOfEducation,
    nationalScholarship,
    ministryOfScienceIct,
    ministryOfEmployment,
    ministryOfTrade,
    ministryOfHealth,
    ministryOfCulture,
    ministryOfSme,
    ministryOfAgriculture,
    otherMinistries,
    localGovernment,
    centralMinistries,
    centralSubtotal,
    totalSupport: centralSubtotal + localGovernment,
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

/** 지원액(원) ÷ 등록금수입(천원→원) */
function benefitRateOf(counts: FinSupportRepCounts): number | null {
  return roundRate1(counts.totalSupport, counts.tuitionRevenue * 1000);
}

export function buildFinSupportRepRows(args: {
  cohort: FinSupportRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  support: AlimiFinancialSupport[];
  eduFund: AlimiEduFundTuition[];
}): FinSupportRepRow[] {
  const { cohort, displayYear, roster, support, eduFund } = args;
  const supportYear = support.filter((row) => row.year === displayYear);
  const fundYear = eduFund.filter((row) => row.year === displayYear);

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    FIN_SUPPORT_REP_COHORT_DIVISION[cohort],
  );
  const rows: FinSupportRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    const usedSupport = new Set<(typeof supportYear)[number]>();
    const usedFund = new Set<(typeof fundYear)[number]>();
    for (const campus of campuses) {
      const supportRow = findFinanceAlimiRowForCampus(
        campus,
        supportYear,
        usedSupport,
      );
      const fund = findFinanceAlimiRowForCampus(campus, fundYear, usedFund);
      if (!supportRow && !fund) continue;
      campusHit += 1;
      counts = addCounts(counts, countsFromSources(supportRow, fund));
    }

    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision: FIN_SUPPORT_REP_COHORT_DIVISION[cohort],
      campusCount: campuses.length,
      ...counts,
      benefitRate: benefitRateOf(counts),
      hasAlimi: campusHit > 0,
    });
  }

  return rows.sort(
    (a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko") ||
      a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

export function sumFinSupportCohortRate(rows: FinSupportRepRow[]): {
  benefitRate: number | null;
} {
  let totalSupport = 0;
  let tuitionRevenue = 0;
  for (const row of rows) {
    totalSupport += row.totalSupport;
    tuitionRevenue += row.tuitionRevenue;
  }
  return {
    benefitRate: roundRate1(totalSupport, tuitionRevenue * 1000),
  };
}

/** 재정지원 원 → 백만원, 정수 반올림 */
export function wonToMillion1(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n / 1_000_000);
}

/** 교비 등록금수입 천원 → 백만원, 정수 반올림 */
export function cheonToMillion1(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n / 1000);
}

export function toFinancialSupportBenefitRateRows(
  rows: FinSupportRepRow[],
): FinancialSupportBenefitRateRow[] {
  return rows.map((row) => ({
    year: row.year,
    schoolCodeStd: row.schoolRepCode,
    schoolName: row.schoolRepName,
    schoolDivision: row.schoolDivision,
    schoolKind: row.schoolDivision,
    region: row.region,
    estb: row.estb,
    campusCount: row.campusCount,
    ministryOfEducation: row.ministryOfEducation,
    nationalScholarship: row.nationalScholarship,
    ministryOfScienceIct: row.ministryOfScienceIct,
    ministryOfEmployment: row.ministryOfEmployment,
    ministryOfTrade: row.ministryOfTrade,
    ministryOfHealth: row.ministryOfHealth,
    ministryOfCulture: row.ministryOfCulture,
    ministryOfSme: row.ministryOfSme,
    ministryOfAgriculture: row.ministryOfAgriculture,
    otherMinistries: row.otherMinistries,
    localGovernment: row.localGovernment,
    totalSupport: row.totalSupport,
    tuitionRevenue: (row.tuitionRevenue * 1000) / 100_000_000,
    benefitRate: row.benefitRate ?? 0,
  }));
}
