export type FinancialProjectionTab = {
  id: string;
  label: string;
  description: string;
  groupId: string;
  groupLabel: string;
};

export type FinancialProjectionMenuGroup = {
  id: string;
  label: string;
  tabs: FinancialProjectionTab[];
};

export const FINANCIAL_PROJECTION_BASE = "/analysis/financial-projection";

export type FinancialProjectionMenuId =
  | "settings"
  | "scenario"
  | "execute"
  | "university";

export type FinancialProjectionSettingsTab =
  | "target"
  | "baseline"
  | "scenario";

export const FINANCIAL_PROJECTION_MENU_GROUPS: FinancialProjectionMenuGroup[] =
  [
    {
      id: "settings",
      label: "기본설정",
      tabs: [
        {
          id: "settings",
          label: "기본설정",
          description: "분석연도별 대상대학·기초자료 생성·시나리오",
          groupId: "settings",
          groupLabel: "기본설정",
        },
      ],
    },
    {
      id: "execute",
      label: "분석결과",
      tabs: [
        {
          id: "execute",
          label: "분석결과",
          description: "시나리오 탭에서 실행한 재정추계 결과 조회",
          groupId: "execute",
          groupLabel: "분석결과",
        },
      ],
    },
    {
      id: "university",
      label: "대학별추계",
      tabs: [
        {
          id: "university",
          label: "대학별추계",
          description: "해당 분석연도 실행 후 개별대학 추계 조회",
          groupId: "university",
          groupLabel: "대학별추계",
        },
      ],
    },
  ];

const TAB_PATH: Record<Exclude<FinancialProjectionMenuId, "scenario">, string> =
  {
    settings: "settings",
    execute: "run",
    university: "university",
  };

export function isFpSettingsTab(
  value: string | null | undefined,
): value is FinancialProjectionSettingsTab {
  return (
    value === "target" ||
    value === "baseline" ||
    value === "scenario"
  );
}

/** 구 거시·CPI 탭(`tab=macro`)은 시나리오로 연결합니다. */
export function parseFpSettingsTab(
  value: string | null | undefined,
): FinancialProjectionSettingsTab {
  if (value === "macro") return "scenario";
  return isFpSettingsTab(value) ? value : "target";
}

export function getFinancialProjectionTabHref(
  tabId: string,
  analysisYear?: number,
) {
  const qs = new URLSearchParams();
  if (analysisYear != null) qs.set("year", String(analysisYear));

  if (tabId === "scenario") {
    qs.set("tab", "scenario");
    const q = qs.toString();
    return `${FINANCIAL_PROJECTION_BASE}/settings${q ? `?${q}` : ""}`;
  }

  const id = (tabId in TAB_PATH
    ? tabId
    : "settings") as Exclude<FinancialProjectionMenuId, "scenario">;
  const path = `${FINANCIAL_PROJECTION_BASE}/${TAB_PATH[id]}`;
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

export function isFinancialProjectionPath(pathname: string) {
  return (
    pathname === FINANCIAL_PROJECTION_BASE ||
    pathname.startsWith(`${FINANCIAL_PROJECTION_BASE}/`) ||
    pathname === "/analysis/competitiveness-analysis/trend" ||
    pathname.startsWith("/analysis/competitiveness-analysis/trend/")
  );
}

export function getFinancialProjectionActiveTabId(
  pathname: string,
): FinancialProjectionMenuId {
  if (pathname.endsWith("/run")) return "execute";
  if (pathname.endsWith("/university")) return "university";
  return "settings";
}
