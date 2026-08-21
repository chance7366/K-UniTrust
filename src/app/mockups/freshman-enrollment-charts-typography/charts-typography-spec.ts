import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";

/** @deprecated 목업 compare용 — 구 통계분석 타이포 */
export const CHARTS_LEGACY_TYPO = {
  filterTitle: "text-xs font-medium text-accent-cyan",
  filterLabel: "text-xs text-muted",
  filterControl:
    "text-xs font-medium rounded-md border border-border bg-surface-2 px-2.5 py-1",
  filterControlActive:
    "text-xs font-medium rounded-md border border-accent bg-accent/15 px-2.5 py-1 text-accent",
  helpButton:
    "text-xs font-medium rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted",
  kpiLabel: "text-sm font-medium text-muted",
  kpiSub: "text-xs text-muted",
  kpiDelta: "text-[11px] font-semibold",
  chartTab: "text-sm font-medium",
  chartTabInactive: "text-sm font-medium text-muted",
  panelTitle: "text-base font-semibold",
  panelMeta: "text-xs text-muted",
  bodyText: "text-sm text-muted",
  tableBody: "text-sm",
  tableHead: "text-table-head text-sm font-medium",
  legend: "text-[10px] text-muted",
} as const;

/** 통계분석 화면 — 프로덕션 CHART_TYPO (대학별DB FDB_TYPO 스케일) */
export const CHARTS_FDB_TYPO = CHART_TYPO;

export const CHARTS_TYPO_SPEC = [
  {
    level: "L1",
    element: "페이지 제목",
    current: "26px",
    proposed: "26px",
    change: "동일 (이미 적용)",
    target: "신입생 충원 현황",
  },
  {
    level: "L2",
    element: "섹션·차트 탭",
    current: "탭 16px · 차트 서브탭 14px",
    proposed: "16px",
    change: "서브탭 14→16",
    target: "통계분석/대학별DB · 지역·권역/분포·위험군/시계열",
  },
  {
    level: "L3",
    element: "패널·필터 제목",
    current: "16px",
    proposed: "20px",
    change: "+4px",
    target: "글로벌 필터 · 차트 패널 제목",
  },
  {
    level: "L4",
    element: "패널 부제·KPI 보조",
    current: "12px",
    proposed: "15px",
    change: "+3px",
    target: "차트 부제 · IQR·연도 요약",
  },
  {
    level: "L5",
    element: "툴바·KPI 라벨",
    current: "12~14px",
    proposed: "13px",
    change: "통일",
    target: "표시 연도·설립구분 · KPI 카드 라벨",
  },
  {
    level: "L6",
    element: "툴바 컨트롤",
    current: "12px",
    proposed: "14px",
    change: "+2px",
    target: "연도·필터·DB보기·도움말 버튼",
  },
  {
    level: "L7",
    element: "범례·보조",
    current: "10~12px",
    proposed: "13px",
    change: "+1~3px",
    target: "차트 범례 · KPI 증감 배지 · 테이블 푸터",
  },
  {
    level: "L8",
    element: "본문 안내",
    current: "14px",
    proposed: "15px",
    change: "+1px",
    target: "Empty State · 경고 배너",
  },
  {
    level: "L9",
    element: "테이블 본문",
    current: "14px",
    proposed: "14px",
    change: "동일",
    target: "시·도 상세 · 위험군 목록",
  },
  {
    level: "L10",
    element: "테이블 헤더",
    current: "14px",
    proposed: "14px",
    change: "동일",
    target: "지역·평균·위험군 컬럼 헤더",
  },
] as const;
