export type UnivMapTab = {
  id: string;
  label: string;
  description: string;
  groupId: string;
  groupLabel: string;
  /** Phase 2 전 — DB·업로드 미연동 플레이스홀더 */
  isPlaceholder?: boolean;
};

export type UnivMapMenuGroup = {
  id: string;
  label: string;
  tabs: UnivMapTab[];
};

export const UNIV_MAP_MENU_GROUPS: UnivMapMenuGroup[] = [
  {
    id: "school-overview",
    label: "학교개황",
    tabs: [
      {
        id: "school-overview",
        label: "학교개황",
        description: "대학·전문대학 학교 개황 정보",
        groupId: "school-overview",
        groupLabel: "학교개황",
      },
    ],
  },
  {
    id: "university-locations",
    label: "대학위치",
    tabs: [
      {
        id: "university-locations",
        label: "대학위치",
        description: "전국 대학 위치 지도",
        groupId: "university-locations",
        groupLabel: "대학위치",
      },
    ],
  },
  {
    id: "university-alimi",
    label: "대학알리미",
    tabs: [
      {
        id: "school-code",
        label: "학교코드",
        description: "대학별 표준 학교코드",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
      },
      {
        id: "freshman-enrollment",
        label: "신입생충원",
        description: "대학알리미 원본 · 정원내 신입생 충원",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
      },
      {
        id: "enrolled-enrollment",
        label: "재학생충원",
        description: "대학알리미 원본 · 재학생 충원",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
      },
      {
        id: "dropout-rate",
        label: "중도탈락",
        description: "대학알리미 원본 · 중도탈락 학생 현황",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
      },
      {
        id: "enrolled-students",
        label: "재적학생",
        description: "대학알리미 원본 · 재적학생 현황",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
      },
      {
        id: "avg-tuition",
        label: "평균등록금",
        description: "대학알리미 원본 · 1인당 평균 등록금",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
      },
      {
        id: "origin-school",
        label: "출신학교",
        description: "대학알리미 원본 · 신입생 출신 고등학교 유형·지역",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
      },
    ],
  },
  {
    id: "finance-alimi",
    label: "재정알리미",
    tabs: [
      {
        id: "edu-accounting",
        label: "교비회계",
        description:
          "대학재정알리미 원본 · 교비·등록금·비등록금 자금·대차·운영",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
      },
      {
        id: "corp-general",
        label: "법인일반",
        description: "대학재정알리미 원본 · 법인일반회계 자금·대차·운영",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
      },
      {
        id: "industry-accounting",
        label: "산단회계",
        description: "대학재정알리미 원본 · 산학협력단 현금·대차·운영",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
      },
      {
        id: "income-property",
        label: "수익용재산",
        description: "대학재정알리미 원본 · 학교법인 수익용 기본재산",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
      },
      {
        id: "financial-support",
        label: "재정지원",
        description: "대학재정알리미 원본 · 부처·지자체 재정지원액",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
      },
    ],
  },
  {
    id: "region-population",
    label: "지역인구",
    tabs: [
      {
        id: "regional-decline",
        label: "지역소멸",
        description: "시·도·시군구별 지역소멸 지표",
        groupId: "region-population",
        groupLabel: "지역인구",
      },
      {
        id: "school-age-population",
        label: "학령인구(시도)",
        description: "시·도별 0~20세 학령인구",
        groupId: "region-population",
        groupLabel: "지역인구",
      },
      {
        id: "school-age-population-sigungu",
        label: "학령인구(시군구)",
        description: "시·도·시군구별 0~20세 학령인구",
        groupId: "region-population",
        groupLabel: "지역인구",
      },
    ],
  },
  {
    id: "analysis-target",
    label: "분석대상",
    tabs: [
      {
        id: "analysis-target",
        label: "분석대상",
        description: "경쟁력·재정 분석 대상 학교 관리",
        groupId: "analysis-target",
        groupLabel: "분석대상",
      },
    ],
  },
];

export const UNIV_MAP_TABS: UnivMapTab[] = UNIV_MAP_MENU_GROUPS.flatMap(
  (g) => g.tabs,
);

/** 재정분석지표 등 구 URL → 대학현황 tab id */
export const UNIV_MAP_LEGACY_TAB_ALIASES: Record<string, string> = {
  "origin-region": "origin-school",
  "edu-fund": "edu-accounting",
  "edu-fund-expense": "edu-accounting",
  "edu-balance": "edu-accounting",
  "edu-operation": "edu-accounting",
  "tuition-fund": "edu-accounting",
  "tuition-fund-expense": "edu-accounting",
  "tuition-balance": "edu-accounting",
  "tuition-operation": "edu-accounting",
  "non-tuition-fund": "edu-accounting",
  "non-tuition-fund-expense": "edu-accounting",
  "non-tuition-balance": "edu-accounting",
  "non-tuition-operation": "edu-accounting",
  "industry-fund": "industry-accounting",
  "industry-cash": "industry-accounting",
  "industry-balance": "industry-accounting",
  "industry-operation": "industry-accounting",
};

/** finance-analysis ?tab= → univ-map ?tab= 리다이렉트 (대학현황 전용 지표만) */
export const FINANCE_TO_UNIV_MAP_TAB: Record<string, string> = {
  "origin-region": "origin-school",
  "regional-decline": "regional-decline",
  "school-age-population": "school-age-population",
  "school-code": "school-code",
};

/** 대학현황 구 URL(충원율 지표 id) → 재정분석지표. 대학알리미 원본 메뉴와 구분 */
export const UNIV_MAP_TO_FINANCE_TAB: Record<string, string> = {
  "freshman-enrollment-rate": "freshman-enrollment-rate",
  "enrolled-enrollment-rate": "enrolled-enrollment-rate",
};

export const UNIV_MAP_BASE = "/analysis/univ-map";

export function getUnivMapTabHref(tabId: string) {
  return `${UNIV_MAP_BASE}?tab=${tabId}`;
}

export function isUnivMapPath(pathname: string) {
  return pathname.startsWith(UNIV_MAP_BASE);
}

export function normalizeUnivMapTabId(tabId: string | null | undefined) {
  if (!tabId) return UNIV_MAP_TABS[0]?.id ?? "school-overview";
  const aliased = UNIV_MAP_LEGACY_TAB_ALIASES[tabId] ?? tabId;
  if (UNIV_MAP_TABS.some((t) => t.id === aliased)) return aliased;
  return UNIV_MAP_TABS[0]?.id ?? "school-overview";
}

export function getUnivMapActiveTabId(
  pathname: string,
  tabFromQuery: string | null,
) {
  if (isUnivMapPath(pathname)) {
    return normalizeUnivMapTabId(tabFromQuery);
  }
  return normalizeUnivMapTabId(tabFromQuery);
}

export function getUnivMapTab(tabId: string): UnivMapTab {
  const normalized = normalizeUnivMapTabId(tabId);
  return UNIV_MAP_TABS.find((t) => t.id === normalized) ?? UNIV_MAP_TABS[0];
}

export function buildUnivMapRedirectUrl(
  tabId: string,
  searchParams: Record<string, string | undefined>,
): string | null {
  const mapped = FINANCE_TO_UNIV_MAP_TAB[tabId];
  if (!mapped) return null;

  const qs = new URLSearchParams();
  qs.set("tab", normalizeUnivMapTabId(mapped));
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "tab" || value == null) continue;
    qs.set(key, value);
  }
  return `${UNIV_MAP_BASE}?${qs.toString()}`;
}

export function buildFinanceAnalysisRedirectUrl(
  tabId: string,
  searchParams: Record<string, string | undefined>,
): string | null {
  const mapped = UNIV_MAP_TO_FINANCE_TAB[tabId];
  if (!mapped) return null;

  const qs = new URLSearchParams();
  qs.set("tab", mapped);
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "tab" || value == null) continue;
    qs.set(key, value);
  }
  return `/analysis/finance-analysis?${qs.toString()}`;
}
