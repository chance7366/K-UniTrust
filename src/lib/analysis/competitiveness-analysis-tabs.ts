import {
  FINANCIAL_PROJECTION_BASE,
  isFinancialProjectionPath as isFinancialProjectionPathImpl,
} from "@/lib/analysis/financial-projection-tabs";

export type CompetitivenessAnalysisTab = {
  id: string;
  label: string;
  description: string;
  groupId: string;
  groupLabel: string;
};

export type CompetitivenessAnalysisMenuGroup = {
  id: string;
  label: string;
  tabs: CompetitivenessAnalysisTab[];
};

/** 프로덕션 base 경로 */
export const COMPETITIVENESS_ANALYSIS_BASE =
  "/analysis/competitiveness-analysis";

export const COMPETITIVENESS_ANALYSIS_MENU_GROUPS: CompetitivenessAnalysisMenuGroup[] =
  [
    {
      id: "settings",
      label: "기본설정",
      tabs: [
        {
          id: "settings",
          label: "기본설정",
          description: "대상대학·적용지표·가중치·분석방법과 지침·절대지표 설정",
          groupId: "settings",
          groupLabel: "기본설정",
        },
      ],
    },
    {
      id: "run",
      label: "분석결과",
      tabs: [
        {
          id: "run",
          label: "분석결과",
          description: "원지표·지수·종합지수·통계분석 결과 확인",
          groupId: "run",
          groupLabel: "분석결과",
        },
      ],
    },
    {
      id: "university",
      label: "대학별경쟁력",
      tabs: [
        {
          id: "university",
          label: "대학별경쟁력",
          description: "대학별 지표·분석·추세 종합 뷰",
          groupId: "university",
          groupLabel: "대학별경쟁력",
        },
      ],
    },
  ];

export const COMPETITIVENESS_ANALYSIS_TABS =
  COMPETITIVENESS_ANALYSIS_MENU_GROUPS.flatMap((g) => g.tabs);

const TAB_PATH: Record<string, string> = {
  settings: "settings",
  run: "run",
  trend: "trend",
  university: "university",
};

export function getCompetitivenessAnalysisTabHref(tabId: string) {
  const segment = TAB_PATH[tabId] ?? "settings";
  return `${COMPETITIVENESS_ANALYSIS_BASE}/${segment}`;
}

export const FINANCIAL_PROJECTION_HREF = FINANCIAL_PROJECTION_BASE;

export function isFinancialProjectionPath(pathname: string) {
  return isFinancialProjectionPathImpl(pathname);
}

export function isCompetitivenessAnalysisPath(pathname: string) {
  return (
    pathname.startsWith(COMPETITIVENESS_ANALYSIS_BASE) &&
    !isFinancialProjectionPath(pathname)
  );
}

export function getCompetitivenessAnalysisActiveTabId(pathname: string) {
  if (pathname.endsWith("/run")) return "run";
  if (pathname.endsWith("/trend")) return "trend";
  if (pathname.endsWith("/university")) return "university";
  return "settings";
}
