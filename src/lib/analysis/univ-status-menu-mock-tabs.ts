export type UnivStatusMenuTab = {
  id: string;
  label: string;
  description: string;
  groupId: string;
  groupLabel: string;
  /** 목업에서 실제 화면 연결 방식 */
  contentKind:
    | "univ-map"
    | "finance-analysis"
    | "placeholder";
  /** contentKind가 univ-map / finance-analysis일 때 원본 tab id */
  sourceTabId?: string;
  /** 신규 화면 여부 (UI만 목업) */
  isNewScreen?: boolean;
};

export type UnivStatusMenuGroup = {
  id: string;
  label: string;
  tabs: UnivStatusMenuTab[];
};

export const UNIV_STATUS_MENU_GROUPS: UnivStatusMenuGroup[] = [
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
        contentKind: "univ-map",
        sourceTabId: "school-overview",
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
        contentKind: "univ-map",
        sourceTabId: "university-locations",
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
        description: "대학별 표준 학교코드 (대학알리미)",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
        contentKind: "univ-map",
        sourceTabId: "school-code",
      },
      {
        id: "freshman-enrollment",
        label: "신입생충원",
        description: "정원내 신입생 충원율",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
        contentKind: "finance-analysis",
        sourceTabId: "freshman-enrollment-rate",
      },
      {
        id: "enrolled-enrollment",
        label: "재학생충원",
        description: "재학생 충원율",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
        contentKind: "finance-analysis",
        sourceTabId: "enrolled-enrollment-rate",
      },
      {
        id: "dropout-rate",
        label: "중도탈락",
        description: "중도탈락율",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
        contentKind: "finance-analysis",
        sourceTabId: "dropout-rate",
      },
      {
        id: "enrolled-students",
        label: "재적학생",
        description: "재적학생 수 (대학알리미)",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
        contentKind: "placeholder",
        isNewScreen: true,
      },
      {
        id: "avg-tuition",
        label: "평균등록금",
        description: "1인당 평균 등록금 (대학알리미)",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
        contentKind: "placeholder",
        isNewScreen: true,
      },
      {
        id: "origin-school",
        label: "출신학교",
        description: "출신학교 지역정보별 입학자수 및 비율",
        groupId: "university-alimi",
        groupLabel: "대학알리미",
        contentKind: "finance-analysis",
        sourceTabId: "origin-region",
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
        description: "대학재정알리미 원본 · 교비회계 자금·대차·운영",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
        contentKind: "univ-map",
        sourceTabId: "edu-accounting",
        isNewScreen: true,
      },
      {
        id: "corp-general",
        label: "법인일반",
        description: "대학재정알리미 원본 · 법인일반회계 자금·대차·운영",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
        contentKind: "univ-map",
        sourceTabId: "corp-general",
        isNewScreen: true,
      },
      {
        id: "industry-accounting",
        label: "산단회계",
        description: "대학재정알리미 원본 · 산학협력단 현금·대차·운영",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
        contentKind: "univ-map",
        sourceTabId: "industry-accounting",
        isNewScreen: true,
      },
      {
        id: "income-property",
        label: "수익용재산",
        description: "대학재정알리미 원본 · 학교법인 수익용 기본재산",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
        contentKind: "univ-map",
        sourceTabId: "income-property",
        isNewScreen: true,
      },
      {
        id: "financial-support",
        label: "재정지원",
        description: "대학재정알리미 원본 · 부처·지자체 재정지원액",
        groupId: "finance-alimi",
        groupLabel: "재정알리미",
        contentKind: "univ-map",
        sourceTabId: "financial-support",
        isNewScreen: true,
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
        description: "시·도별 지역소멸 지표",
        groupId: "region-population",
        groupLabel: "지역인구",
        contentKind: "finance-analysis",
        sourceTabId: "regional-decline",
      },
      {
        id: "school-age-population",
        label: "학령인구(시도)",
        description: "시·도별 0~20세 학령인구",
        groupId: "region-population",
        groupLabel: "지역인구",
        contentKind: "finance-analysis",
        sourceTabId: "school-age-population",
      },
      {
        id: "school-age-population-sigungu",
        label: "학령인구(시군구)",
        description: "시·도·시군구별 0~20세 학령인구",
        groupId: "region-population",
        groupLabel: "지역인구",
        contentKind: "univ-map",
        sourceTabId: "school-age-population-sigungu",
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
        contentKind: "placeholder",
        isNewScreen: true,
      },
    ],
  },
];

export const UNIV_STATUS_MENU_TABS: UnivStatusMenuTab[] =
  UNIV_STATUS_MENU_GROUPS.flatMap((g) => g.tabs);

export const UNIV_STATUS_MENU_MOCK_BASE = "/mockups/univ-status-menu";

export function getUnivStatusMenuTabHref(tabId: string) {
  return `${UNIV_STATUS_MENU_MOCK_BASE}?tab=${tabId}`;
}

export function getUnivStatusMenuTab(tabId: string): UnivStatusMenuTab {
  return (
    UNIV_STATUS_MENU_TABS.find((t) => t.id === tabId) ??
    UNIV_STATUS_MENU_TABS[0]
  );
}

export function isUnivStatusMenuMockPath(pathname: string) {
  return pathname.startsWith(UNIV_STATUS_MENU_MOCK_BASE);
}

export function getUnivStatusMenuActiveTabId(tabFromQuery: string | null) {
  if (
    tabFromQuery &&
    UNIV_STATUS_MENU_TABS.some((t) => t.id === tabFromQuery)
  ) {
    return tabFromQuery;
  }
  return UNIV_STATUS_MENU_TABS[0]?.id ?? "school-overview";
}
