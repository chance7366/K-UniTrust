export type DashboardValueFormat =
  | "percent"
  | "currency"
  | "thousand-won"
  | "number";

export type FinanceAnalysisDataKind = "univ" | "region-sido" | "population";

export type FinanceAnalysisTab = {
  id: string;
  label: string;
  description: string;
  groupId: string;
  groupLabel: string;
  dataKind: FinanceAnalysisDataKind;
  valueFormat: DashboardValueFormat;
};

export type FinanceAnalysisMenuGroup = {
  id: string;
  label: string;
  tabs: FinanceAnalysisTab[];
};

/** 사이드바 재정분석지표 메뉴 (비율·지표 분석) */
export const FINANCE_ANALYSIS_MENU_GROUPS: FinanceAnalysisMenuGroup[] = [
  {
    id: "student-enrollment",
    label: "학생충원",
    tabs: [
      {
        id: "freshman-enrollment-rate",
        label: "신입생충원율",
        description: "정원내 신입생 충원율",
        groupId: "student-enrollment",
        groupLabel: "학생충원",
        dataKind: "univ",
        valueFormat: "percent",
      },
      {
        id: "enrolled-enrollment-rate",
        label: "재학생충원율",
        description: "재학생 충원율",
        groupId: "student-enrollment",
        groupLabel: "학생충원",
        dataKind: "univ",
        valueFormat: "percent",
      },
      {
        id: "dropout-rate",
        label: "중도탈락율",
        description: "중도탈락율",
        groupId: "student-enrollment",
        groupLabel: "학생충원",
        dataKind: "univ",
        valueFormat: "percent",
      },
    ],
  },
  {
    id: "univ-finance",
    label: "대학재정",
    tabs: [
      {
        id: "fund-secure-rate",
        label: "자금확보율",
        description: "자금 확보율",
        groupId: "univ-finance",
        groupLabel: "대학재정",
        dataKind: "univ",
        valueFormat: "percent",
      },
      {
        id: "financial-support-benefit-rate",
        label: "재정지원수혜율",
        description: "재정지원 수혜율",
        groupId: "univ-finance",
        groupLabel: "대학재정",
        dataKind: "univ",
        valueFormat: "percent",
      },
      {
        id: "tuition-dependency-rate",
        label: "등록금의존율",
        description: "등록금 의존율",
        groupId: "univ-finance",
        groupLabel: "대학재정",
        dataKind: "univ",
        valueFormat: "percent",
      },
    ],
  },
  {
    id: "corp-finance",
    label: "법인재정",
    tabs: [
      {
        id: "income-property-secure-rate",
        label: "수익용재산확보율",
        description: "수익용 재산 확보율",
        groupId: "corp-finance",
        groupLabel: "법인재정",
        dataKind: "univ",
        valueFormat: "percent",
      },
      {
        id: "corp-transfer-ratio",
        label: "법인전입금비율",
        description: "법인 전입금 비율",
        groupId: "corp-finance",
        groupLabel: "법인재정",
        dataKind: "univ",
        valueFormat: "percent",
      },
    ],
  },
];

/** 경쟁력분석 지표 설정용 (재정분석지표 메뉴와 동일 구조) */
export const FINANCE_ANALYSIS_INDICATOR_GROUPS: FinanceAnalysisMenuGroup[] =
  FINANCE_ANALYSIS_MENU_GROUPS;

export const FINANCE_ANALYSIS_TABS: FinanceAnalysisTab[] =
  FINANCE_ANALYSIS_MENU_GROUPS.flatMap((g) => g.tabs);

export const FINANCE_ANALYSIS_BASE = "/analysis/finance-analysis";

export type FinanceAnalysisRegionRow = {
  sido: string;
  valuesByYear: Record<string, number | null>;
  avg: number | null;
};

export const FINANCE_ANALYSIS_DEFAULT_YEARS = [
  2021, 2022, 2023, 2024, 2025,
] as const;

export function getFinanceAnalysisTabHref(tabId: string) {
  return `${FINANCE_ANALYSIS_BASE}?tab=${tabId}`;
}

export function getFinanceAnalysisTab(tabId: string): FinanceAnalysisTab {
  return (
    FINANCE_ANALYSIS_TABS.find((t) => t.id === tabId) ??
    FINANCE_ANALYSIS_TABS[0]
  );
}

export function isFinanceAnalysisPath(pathname: string) {
  return pathname.startsWith(FINANCE_ANALYSIS_BASE);
}

export function getFinanceAnalysisActiveTabId(
  _pathname: string,
  tabFromQuery: string | null,
) {
  if (
    tabFromQuery &&
    FINANCE_ANALYSIS_TABS.some((t) => t.id === tabFromQuery)
  ) {
    return tabFromQuery;
  }
  return FINANCE_ANALYSIS_TABS[0]?.id ?? "freshman-enrollment-rate";
}

/** @deprecated use FINANCE_ANALYSIS_DEFAULT_YEARS */
export const FINANCE_ANALYSIS_MOCK_YEARS = FINANCE_ANALYSIS_DEFAULT_YEARS;
