/** 재정분석 대학별DB 화면 타이포그래피 (신입생충원율 기준) */
export const FDB_TYPO = {
  /** L1 — 페이지 제목 (DashboardPageTitle) 26px */
  pageTitle: "!text-[26px] font-extrabold",
  /** L2 — 통계분석 / 대학별DB 탭 16px */
  sectionTab: "text-base font-semibold",
  sectionTabInactive: "text-base font-medium text-muted",
  /** L3 — 패널 제목 (대학별DB) 20px */
  panelTitle: "text-xl font-bold text-foreground",
  /** L4 — 패널 부제·건수 요약 15px */
  panelMeta: "text-[15px] text-muted",
  /** L5 — 툴바 라벨 (표시 연도, 필터) 13px */
  toolbarLabel: "text-[13px] font-semibold text-accent-cyan",
  /** L6 — 툴바 컨트롤 (버튼·셀렉트) 14px */
  toolbarControl: "text-sm font-medium",
  /** L7 — 범례·보조 안내 13px */
  legend: "text-[13px] text-muted",
  /** L8 — 본문 안내·빈 상태 15px */
  bodyText: "text-[15px] text-muted",
  /** L9 — 테이블 본문 14px */
  tableBody: "text-sm",
  /** 학교명 우측 수치 셀 13px */
  tableMetric: "!text-[13px]",
  /** 학교코드 등 코드형 셀 12px */
  tableCode: "text-xs",
  /** L10 — 테이블 헤더 14px (text-table-head와 함께) */
  tableHead: "!text-sm",
  /** 테이블 강조 셀 (학교명) */
  tableEmphasis: "text-sm font-semibold",
} as const;
