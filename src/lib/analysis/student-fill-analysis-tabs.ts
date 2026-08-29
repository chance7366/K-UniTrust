export type StudentFillAnalysisTab = {
  id: string;
  label: string;
  description: string;
  groupId: string;
  groupLabel: string;
};

export type StudentFillAnalysisMenuGroup = {
  id: string;
  label: string;
  tabs: StudentFillAnalysisTab[];
};

export const STUDENT_FILL_ANALYSIS_BASE = "/analysis/student-fill-analysis";

/** 목업 전용 경로. 프로덕션과 화면은 공유한다. */
export const STUDENT_FILL_ANALYSIS_MOCK_BASE =
  "/mockups/student-fill-analysis";

export const STUDENT_FILL_ANALYSIS_MENU_GROUPS: StudentFillAnalysisMenuGroup[] =
  [
    {
      id: "settings",
      label: "기본설정",
      tabs: [
        {
          id: "settings",
          label: "기본설정",
          description: "대상·외국인 범위·연도 시차·분석실행",
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
          description: "학부 충원 구조 요약 (Phase 2는 신입생 탭)",
          groupId: "run",
          groupLabel: "분석결과",
        },
      ],
    },
    {
      id: "university",
      label: "대학별분석",
      tabs: [
        {
          id: "university",
          label: "대학별분석",
          description: "개별대학 시계열 진단",
          groupId: "university",
          groupLabel: "대학별분석",
        },
      ],
    },
  ];

const TAB_PATH: Record<string, string> = {
  settings: "settings",
  run: "run",
  university: "university",
};

export function getStudentFillAnalysisTabHref(tabId: string) {
  const segment = TAB_PATH[tabId] ?? "settings";
  return `${STUDENT_FILL_ANALYSIS_BASE}/${segment}`;
}

export function getStudentFillAnalysisMockHref(tabId: string) {
  const segment = TAB_PATH[tabId] ?? "settings";
  return `${STUDENT_FILL_ANALYSIS_MOCK_BASE}/${segment}`;
}

export function isStudentFillAnalysisPath(pathname: string) {
  return (
    pathname === STUDENT_FILL_ANALYSIS_BASE ||
    pathname.startsWith(`${STUDENT_FILL_ANALYSIS_BASE}/`)
  );
}

export function isStudentFillAnalysisMockPath(pathname: string) {
  return (
    pathname === STUDENT_FILL_ANALYSIS_MOCK_BASE ||
    pathname.startsWith(`${STUDENT_FILL_ANALYSIS_MOCK_BASE}/`)
  );
}

export function getStudentFillAnalysisActiveTabId(pathname: string) {
  if (pathname.endsWith("/run")) return "run";
  if (pathname.endsWith("/university")) return "university";
  return "settings";
}

export function getStudentFillAnalysisMockActiveTabId(pathname: string) {
  if (pathname.includes("/comprehensive-report") || pathname.endsWith("/run")) {
    return "run";
  }
  if (pathname.includes("/university")) return "university";
  return getStudentFillAnalysisActiveTabId(pathname);
}

export function sourceYearForAnalysisYear(
  analysisYear: number,
  source:
    | "freshman"
    | "enrolled"
    | "enrolled-students"
    | "foreign"
    | "dropout"
    | "foreign-dropout",
): number {
  if (source === "dropout" || source === "foreign-dropout") {
    return analysisYear - 1;
  }
  return analysisYear;
}
