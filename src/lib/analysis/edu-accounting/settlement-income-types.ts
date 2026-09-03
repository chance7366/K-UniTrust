import type { AnalyticsZone } from "@/lib/analysis/korea-analytics-zones";
import type { SchoolScaleLabel } from "@/lib/competitiveness-analysis/school-scale";

export type SettlementCohort = "university" | "junior-college";

export const SETTLEMENT_COHORT_LABEL: Record<SettlementCohort, string> = {
  university: "대학",
  "junior-college": "전문대학",
};

export type SettlementIncomeKey =
  | "totalIncome"
  | "operating"
  | "assetLiability"
  | "carryover"
  | "tuitionAndFees"
  | "tuition"
  | "undergradFee"
  | "gradFee"
  | "transferGift"
  | "transfer"
  | "donation"
  | "grant"
  | "ancillary"
  | "otherEdu";

export const SETTLEMENT_INCOME_KEYS: SettlementIncomeKey[] = [
  "totalIncome",
  "operating",
  "assetLiability",
  "carryover",
  "tuitionAndFees",
  "tuition",
  "undergradFee",
  "gradFee",
  "transferGift",
  "transfer",
  "donation",
  "grant",
  "ancillary",
  "otherEdu",
];

export const SETTLEMENT_INCOME_LABEL: Record<SettlementIncomeKey, string> = {
  totalIncome: "자금수입총계[1135]",
  operating: "운영수입[1086]",
  assetLiability: "자산및부채수입[1126]",
  carryover: "미사용전기이월자금[1127]",
  tuitionAndFees: "등록금및수강료수입[1001]",
  tuition: "등록금수입[1002]",
  undergradFee: "학부생수업료[1008]",
  gradFee: "대학원생수업료[1009]",
  transferGift: "전입및기부수입[1013]",
  transfer: "전입금수입[1014]",
  donation: "기부금수입[1035]",
  grant: "국고보조금수입[1048]",
  ancillary: "교육부대수입[1060]",
  otherEdu: "교육외수입[1071]",
};

export type SettlementIncomeAmounts = Record<SettlementIncomeKey, number>;

export type SettlementSchoolYear = {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  cohort: SettlementCohort;
  estb: string;
  region: string;
  sido: string;
  zone: AnalyticsZone | null;
  scale: SchoolScaleLabel | null;
  enrolledA: number | null;
  campusCount: number;
  matchBy: "code" | "name";
  amounts: SettlementIncomeAmounts;
};

export type SettlementMatchStats = {
  fundRows: number;
  matchedRows: number;
  unmatchedRows: number;
  matchedByCode: number;
  matchedByName: number;
  schools: number;
  schoolsWithScale: number;
};

export type SettlementYoyCell = {
  label: string;
  priorSum: number;
  yearSum: number;
  priorN: number;
  yearN: number;
  pairedN: number;
  pairedPrior: number;
  pairedYear: number;
  yoyPct: number | null;
};

export type SettlementIncomeReportData = {
  settlementYear: number;
  priorYear: number;
  trendYears: number[];
  generatedAt: string;
  matchByYear: Record<number, SettlementMatchStats>;
  schools: SettlementSchoolYear[];
  warnings: string[];
};
