export const ALL_UNIV_METRICS = [
  {
    id: "freshman-enrollment-rate",
    group: "학생충원",
    label: "신입생충원율",
  },
  { id: "fund-secure-rate", group: "대학재정", label: "자금확보율" },
  {
    id: "financial-support-benefit-rate",
    group: "대학재정",
    label: "재정지원수혜율",
  },
  { id: "tuition-dependency-rate", group: "대학재정", label: "등록금의존율" },
  {
    id: "income-property-secure-rate",
    group: "법인재정",
    label: "수익용재산확보율",
  },
  { id: "corp-transfer-ratio", group: "법인재정", label: "법인전입금비율" },
] as const;

export type AllUnivMetricId = (typeof ALL_UNIV_METRICS)[number]["id"];

export type AllUnivSection = "data" | "charts";

export type FreshmanCohortId =
  | "university"
  | "graduate"
  | "combined"
  | "junior-college"
  | "all-universities";

export type FinanceCohortId =
  | "university"
  | "junior-college"
  | "all-universities";

export type CohortTabItem = {
  id: string;
  label: string;
  count: string;
};

export type FinanceTableRow = {
  schoolRepName: string;
  schoolRepCode: string;
  schoolDivision: string;
  region: string;
  sourceLabel: "대학" | "전문대학";
  rate: number | null;
};

export type FreshmanTableRow = {
  year: number;
  schoolRepCode: string;
  schoolRepName: string;
  schoolDivision: string;
  region: string;
  sourceLabel: "대학통합" | "전문대학" | "대학" | "대학원";
  campusCount: number;
  gradProgramCount: number;
  admissionQuota: number;
  recruitTotal: number;
  recruitWithin: number;
  recruitOutside: number;
  enrolledTotal: number;
  enrolledWithin: number;
  enrolledOutside: number;
  fillRateWithin: number | null;
  fillRateWithinOutside: number | null;
  hasAlimi: boolean;
  showRecruit: boolean;
};
