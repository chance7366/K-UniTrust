import { FINANCE_ANALYSIS_INDICATOR_GROUPS } from "@/lib/analysis/finance-analysis-tabs";

/** 경쟁력 분석에 사용하는 재정분석지표 카테고리 — 메뉴 추가 시 자동 반영 */
export const COMPETITIVENESS_FINANCE_GROUP_IDS = [
  "student-enrollment",
  "univ-finance",
  "corp-finance",
] as const;

export type CompetitivenessFinanceGroupId =
  (typeof COMPETITIVENESS_FINANCE_GROUP_IDS)[number];

export type CompetitivenessIndicatorDef = {
  /** 재정분석지표 탭 id (finance-analysis ?tab=) */
  financeTabId: string;
  label: string;
  categoryId: CompetitivenessFinanceGroupId;
  categoryLabel: string;
  defaultWeightPct: number;
  defaultYearLabel: string;
};

export const DEFAULT_CATEGORY_WEIGHTS: Record<
  CompetitivenessFinanceGroupId,
  number
> = {
  "student-enrollment": 50,
  "univ-finance": 40,
  "corp-finance": 10,
};

const DEFAULT_INDICATOR_WEIGHTS: Record<string, number> = {
  "freshman-enrollment-rate": 40,
  "enrolled-enrollment-rate": 40,
  "dropout-rate": 20,
  "fund-secure-rate": 30,
  "financial-support-benefit-rate": 30,
  "tuition-dependency-rate": 40,
  "income-property-secure-rate": 70,
  "corp-transfer-ratio": 30,
};

const DEFAULT_YEAR_BY_TAB: Record<string, string> = {
  "freshman-enrollment-rate": "2025년",
  "enrolled-enrollment-rate": "2025년",
  "dropout-rate": "2024년",
  "fund-secure-rate": "2025년",
  "financial-support-benefit-rate": "2025년",
  "tuition-dependency-rate": "2025년",
  "income-property-secure-rate": "2025년",
  "corp-transfer-ratio": "2025년",
};

/** 재정분석지표 메뉴 구조에서 경쟁력 적용 지표 목록 생성 */
export function getCompetitivenessIndicators(): CompetitivenessIndicatorDef[] {
  const out: CompetitivenessIndicatorDef[] = [];

  for (const group of FINANCE_ANALYSIS_INDICATOR_GROUPS) {
    if (
      !COMPETITIVENESS_FINANCE_GROUP_IDS.includes(
        group.id as CompetitivenessFinanceGroupId,
      )
    ) {
      continue;
    }
    for (const tab of group.tabs) {
      out.push({
        financeTabId: tab.id,
        label: tab.label,
        categoryId: group.id as CompetitivenessFinanceGroupId,
        categoryLabel: group.label,
        defaultWeightPct: DEFAULT_INDICATOR_WEIGHTS[tab.id] ?? 10,
        defaultYearLabel: DEFAULT_YEAR_BY_TAB[tab.id] ?? "2025년",
      });
    }
  }

  return out;
}

export function getCompetitivenessCategories(): {
  id: CompetitivenessFinanceGroupId;
  label: string;
}[] {
  return FINANCE_ANALYSIS_INDICATOR_GROUPS.filter((g) =>
    COMPETITIVENESS_FINANCE_GROUP_IDS.includes(
      g.id as CompetitivenessFinanceGroupId,
    ),
  ).map((g) => ({
    id: g.id as CompetitivenessFinanceGroupId,
    label: g.label,
  }));
}

/** 재정분석 DB 연도 옵션 */
export function buildIndicatorYearOptions(
  financeTabId: string,
  availableYears: number[],
): string[] {
  const years = [...availableYears].sort((a, b) => b - a);
  if (!years.length) {
    return [DEFAULT_YEAR_BY_TAB[financeTabId] ?? "2025년"];
  }

  return years.map((y) => `${y}년`);
}

export const FINANCE_TAB_CSV_KEY: Record<string, string> = {
  "freshman-enrollment-rate": "financeAnalysisFreshmanEnrollmentRep",
  "enrolled-enrollment-rate": "financeAnalysisEnrolledEnrollmentRep",
  "dropout-rate": "financeAnalysisDropoutRateRep",
  "fund-secure-rate": "financeAnalysisFundSecureRateRep",
  "financial-support-benefit-rate":
    "financeAnalysisFinancialSupportBenefitRateRep",
  "tuition-dependency-rate": "financeAnalysisTuitionDependencyRateRep",
  "income-property-secure-rate": "financeAnalysisIncomePropertySecureRateRep",
  "corp-transfer-ratio": "financeAnalysisCorpTransferRatioRep",
};

export const TARGET_UNIVERSITY_TEMPLATE_HEADER = [
  "학교코드",
  "학교명",
  "설립구분",
  "학교구분",
  "학교종류",
  "지역",
  "경영위기대학",
  "미인증대학",
  "임시이사",
] as const;

/** @deprecated build-analysis-guidelines.ts — 기본설정·분석정책에서 자동 생성 */
export const DEFAULT_ANALYSIS_GUIDELINES = "(기본설정 > 분석방법 · 지침 탭에서 자동 생성됩니다)";
