import {
  findFinanceAlimiRowForCampus,
  financeAlimiSchoolName,
} from "@/lib/analysis/finance-alimi-campus-join";
import {
  numByAccountCode,
  numByHeaderLabel,
  parseFinanceAlimiCells,
} from "@/lib/analysis/finance-alimi-header-lookup";
import type { IncomePropertySecureRateDisplayRow } from "@/lib/ingest/income-property-secure-rate-config";
import {
  groupAnalysisTargetByRep,
  normalizeSchoolCodeText,
  parseYearText,
  roundRate1,
  type AnalysisTargetCampus,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";

export type IncomePropertyRepCohort = "university" | "junior-college";

export const INCOME_PROPERTY_REP_COHORT_LABEL: Record<
  IncomePropertyRepCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

export const INCOME_PROPERTY_REP_COHORT_DIVISION: Record<
  IncomePropertyRepCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
};

const PROPERTY_LABEL = {
  landAppraised: "토지_평가액",
  landIncome: "토지_순수입액",
  buildingAppraised: "건물_평가액",
  buildingIncome: "건물_순수입액",
  securitiesAppraised: "유가증권-평가액",
  securitiesIncome: "유가증권_순수입액",
  depositAppraised: "예금_평가액",
  depositIncome: "예금_순수입액",
  otherAppraised: "기타재산_평가액",
  otherIncome: "기타재산_순수입액",
  collateral: "담보차감액",
} as const;
const PROPERTY_FALLBACK = {
  landAppraised: 8,
  landIncome: 9,
  buildingAppraised: 10,
  buildingIncome: 11,
  securitiesAppraised: 12,
  securitiesIncome: 13,
  depositAppraised: 14,
  depositIncome: 15,
  otherAppraised: 16,
  otherIncome: 17,
  collateral: 18,
} as const;

export type IncomePropertyRepCounts = {
  landAppraised: number;
  landIncome: number;
  buildingAppraised: number;
  buildingIncome: number;
  securitiesAppraised: number;
  securitiesIncome: number;
  depositAppraised: number;
  depositIncome: number;
  otherAppraised: number;
  otherIncome: number;
  appraisedGross: number;
  collateralDeduction: number;
  appraisedNet: number;
  incomeTotal: number;
  tuitionRevenue: number;
};

export type IncomePropertyRepRow = IncomePropertyRepCounts & {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  campusCount: number;
  secureRate: number | null;
  revenueRate: number | null;
  hasAlimi: boolean;
};

export type AlimiIncomeProperty = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  landAppraised: number;
  landIncome: number;
  buildingAppraised: number;
  buildingIncome: number;
  securitiesAppraised: number;
  securitiesIncome: number;
  depositAppraised: number;
  depositIncome: number;
  otherAppraised: number;
  otherIncome: number;
  collateralDeduction: number;
};

export type AlimiEduFundTuition = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  tuitionRevenue: number;
};

export function parseAlimiIncomePropertyRow(
  raw: Record<string, string>,
  headers: string[] = [],
): AlimiIncomeProperty | null {
  const year = parseYearText(raw.year_text ?? "");
  const schoolCodeStd = normalizeSchoolCodeText(raw.school_code_std ?? "");
  if (!year || !schoolCodeStd) return null;
  const cells = parseFinanceAlimiCells(raw.cells_json);
  const n = (label: string, fallback: number) =>
    numByHeaderLabel(cells, headers, label, fallback);
  return {
    year,
    schoolCodeStd,
    schoolName: financeAlimiSchoolName(raw),
    landAppraised: n(PROPERTY_LABEL.landAppraised, PROPERTY_FALLBACK.landAppraised),
    landIncome: n(PROPERTY_LABEL.landIncome, PROPERTY_FALLBACK.landIncome),
    buildingAppraised: n(PROPERTY_LABEL.buildingAppraised, PROPERTY_FALLBACK.buildingAppraised),
    buildingIncome: n(PROPERTY_LABEL.buildingIncome, PROPERTY_FALLBACK.buildingIncome),
    securitiesAppraised: n(PROPERTY_LABEL.securitiesAppraised, PROPERTY_FALLBACK.securitiesAppraised),
    securitiesIncome: n(PROPERTY_LABEL.securitiesIncome, PROPERTY_FALLBACK.securitiesIncome),
    depositAppraised: n(PROPERTY_LABEL.depositAppraised, PROPERTY_FALLBACK.depositAppraised),
    depositIncome: n(PROPERTY_LABEL.depositIncome, PROPERTY_FALLBACK.depositIncome),
    otherAppraised: n(PROPERTY_LABEL.otherAppraised, PROPERTY_FALLBACK.otherAppraised),
    otherIncome: n(PROPERTY_LABEL.otherIncome, PROPERTY_FALLBACK.otherIncome),
    collateralDeduction: n(PROPERTY_LABEL.collateral, PROPERTY_FALLBACK.collateral),
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

function emptyCounts(): IncomePropertyRepCounts {
  return {
    landAppraised: 0,
    landIncome: 0,
    buildingAppraised: 0,
    buildingIncome: 0,
    securitiesAppraised: 0,
    securitiesIncome: 0,
    depositAppraised: 0,
    depositIncome: 0,
    otherAppraised: 0,
    otherIncome: 0,
    appraisedGross: 0,
    collateralDeduction: 0,
    appraisedNet: 0,
    incomeTotal: 0,
    tuitionRevenue: 0,
  };
}

function addCounts(
  a: IncomePropertyRepCounts,
  b: IncomePropertyRepCounts,
): IncomePropertyRepCounts {
  return {
    landAppraised: a.landAppraised + b.landAppraised,
    landIncome: a.landIncome + b.landIncome,
    buildingAppraised: a.buildingAppraised + b.buildingAppraised,
    buildingIncome: a.buildingIncome + b.buildingIncome,
    securitiesAppraised: a.securitiesAppraised + b.securitiesAppraised,
    securitiesIncome: a.securitiesIncome + b.securitiesIncome,
    depositAppraised: a.depositAppraised + b.depositAppraised,
    depositIncome: a.depositIncome + b.depositIncome,
    otherAppraised: a.otherAppraised + b.otherAppraised,
    otherIncome: a.otherIncome + b.otherIncome,
    appraisedGross: a.appraisedGross + b.appraisedGross,
    collateralDeduction: a.collateralDeduction + b.collateralDeduction,
    appraisedNet: a.appraisedNet + b.appraisedNet,
    incomeTotal: a.incomeTotal + b.incomeTotal,
    tuitionRevenue: a.tuitionRevenue + b.tuitionRevenue,
  };
}

function countsFromSources(
  property: AlimiIncomeProperty | undefined,
  fund: AlimiEduFundTuition | undefined,
): IncomePropertyRepCounts {
  const landAppraised = property?.landAppraised ?? 0;
  const landIncome = property?.landIncome ?? 0;
  const buildingAppraised = property?.buildingAppraised ?? 0;
  const buildingIncome = property?.buildingIncome ?? 0;
  const securitiesAppraised = property?.securitiesAppraised ?? 0;
  const securitiesIncome = property?.securitiesIncome ?? 0;
  const depositAppraised = property?.depositAppraised ?? 0;
  const depositIncome = property?.depositIncome ?? 0;
  const otherAppraised = property?.otherAppraised ?? 0;
  const otherIncome = property?.otherIncome ?? 0;
  const collateralDeduction = property?.collateralDeduction ?? 0;
  const appraisedGross =
    landAppraised +
    buildingAppraised +
    securitiesAppraised +
    depositAppraised +
    otherAppraised;
  const incomeTotal =
    landIncome +
    buildingIncome +
    securitiesIncome +
    depositIncome +
    otherIncome;
  return {
    landAppraised,
    landIncome,
    buildingAppraised,
    buildingIncome,
    securitiesAppraised,
    securitiesIncome,
    depositAppraised,
    depositIncome,
    otherAppraised,
    otherIncome,
    appraisedGross,
    collateralDeduction,
    appraisedNet: appraisedGross - collateralDeduction,
    incomeTotal,
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

/** 확보율 분모: 표시 연도(수익용재산)의 전년도 교비 등록금수입 */
export function priorTuitionYear(surveyYear: number): number {
  return surveyYear - 1;
}

export function buildIncomePropertyRepRows(args: {
  cohort: IncomePropertyRepCohort;
  displayYear: number;
  roster: AnalysisTargetCampus[];
  property: AlimiIncomeProperty[];
  eduFund: AlimiEduFundTuition[];
}): IncomePropertyRepRow[] {
  const { cohort, displayYear, roster, property, eduFund } = args;
  const tuitionYear = priorTuitionYear(displayYear);
  const propertyYear = property.filter((row) => row.year === displayYear);
  const fundYear = eduFund.filter((row) => row.year === tuitionYear);

  const targetGroups = groupAnalysisTargetByRep(
    roster,
    INCOME_PROPERTY_REP_COHORT_DIVISION[cohort],
  );
  const rows: IncomePropertyRepRow[] = [];

  for (const [repCode, campuses] of targetGroups) {
    const primary = pickPrimaryCampus(campuses);
    let counts = emptyCounts();
    let campusHit = 0;
    const usedProperty = new Set<(typeof propertyYear)[number]>();
    const usedFund = new Set<(typeof fundYear)[number]>();
    for (const campus of campuses) {
      const propertyRow = findFinanceAlimiRowForCampus(
        campus,
        propertyYear,
        usedProperty,
      );
      const fund = findFinanceAlimiRowForCampus(campus, fundYear, usedFund);
      if (!propertyRow && !fund) continue;
      campusHit += 1;
      counts = addCounts(counts, countsFromSources(propertyRow, fund));
    }

    rows.push({
      year: displayYear,
      schoolRepCode: repCode,
      schoolRepName: primary.schoolRepName,
      estb: primary.estb,
      region: primary.region,
      schoolDivision: INCOME_PROPERTY_REP_COHORT_DIVISION[cohort],
      campusCount: campuses.length,
      ...counts,
      secureRate: roundRate1(counts.appraisedNet, counts.tuitionRevenue),
      revenueRate: roundRate1(counts.incomeTotal, counts.appraisedGross),
      hasAlimi: campusHit > 0,
    });
  }

  return rows.sort(
    (a, b) =>
      a.schoolRepName.localeCompare(b.schoolRepName, "ko") ||
      a.schoolRepCode.localeCompare(b.schoolRepCode, "ko"),
  );
}

export function sumIncomePropertyCohortRate(rows: IncomePropertyRepRow[]): {
  secureRate: number | null;
  revenueRate: number | null;
} {
  let appraisedNet = 0;
  let appraisedGross = 0;
  let incomeTotal = 0;
  let tuitionRevenue = 0;
  for (const row of rows) {
    appraisedNet += row.appraisedNet;
    appraisedGross += row.appraisedGross;
    incomeTotal += row.incomeTotal;
    tuitionRevenue += row.tuitionRevenue;
  }
  return {
    secureRate: roundRate1(appraisedNet, tuitionRevenue),
    revenueRate: roundRate1(incomeTotal, appraisedGross),
  };
}

/** 천원 → 백만원, 정수 반올림 */
export function cheonToMillion1(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n / 1000);
}

export function toIncomePropertyDisplayRows(
  rows: IncomePropertyRepRow[],
): IncomePropertySecureRateDisplayRow[] {
  return rows.map((row) => ({
    year: row.year,
    schoolCodeStd: row.schoolRepCode,
    schoolName: row.schoolRepName,
    corpName: "",
    schoolDivision: row.schoolDivision,
    schoolKind: row.schoolDivision,
    region: row.region,
    estb: row.estb,
    schoolStatus: "",
    landAppraised: row.landAppraised,
    landNetIncome: row.landIncome,
    buildingAppraised: row.buildingAppraised,
    buildingNetIncome: row.buildingIncome,
    securitiesAppraised: row.securitiesAppraised,
    securitiesNetIncome: row.securitiesIncome,
    depositAppraised: row.depositAppraised,
    depositNetIncome: row.depositIncome,
    otherAppraised: row.otherAppraised,
    otherNetIncome: row.otherIncome,
    collateralDeduction: row.collateralDeduction,
    totalAppraised: row.appraisedGross,
    totalNetIncome: row.incomeTotal,
    tuitionRevenue: row.tuitionRevenue,
    tuitionRevenueMillion: cheonToMillion1(row.tuitionRevenue),
    propertySecureRate: row.secureRate,
    revenueRate: row.revenueRate,
  }));
}
