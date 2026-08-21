import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

/** 재정분석 통계분석(차트) 화면 타이포 — 대학별DB FDB_TYPO 스케일 */
export const CHART_TYPO = {
  /** L3 — 글로벌 필터·차트 패널 제목 20px */
  filterTitle: `${FDB_TYPO.panelTitle} text-accent-cyan`,
  /** L5 — 필터·KPI 라벨 13px */
  filterLabel: FDB_TYPO.toolbarLabel,
  /** L6 — 필터 컨트롤·도움말 버튼 14px */
  toolbarControl: FDB_TYPO.toolbarControl,
  helpButton: `${FDB_TYPO.toolbarControl} rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted`,
  filterControl: `${FDB_TYPO.toolbarControl} rounded-md border border-border bg-surface-2 px-2.5 py-1`,
  filterControlActive: `${FDB_TYPO.toolbarControl} rounded-md border border-accent bg-accent/15 px-2.5 py-1 text-accent`,
  /** L2 — 차트 서브탭 16px */
  sectionTab: FDB_TYPO.sectionTab,
  sectionTabInactive: FDB_TYPO.sectionTabInactive,
  chartTab: FDB_TYPO.sectionTab,
  chartTabInactive: FDB_TYPO.sectionTabInactive,
  /** L3 — 패널 제목 20px */
  panelTitle: FDB_TYPO.panelTitle,
  /** L4 — 패널 부제·KPI 보조 15px */
  panelMeta: FDB_TYPO.panelMeta,
  /** L8 — 본문 안내·Empty State 15px */
  bodyText: FDB_TYPO.bodyText,
  /** L7 — 범례·보조·배지 13px */
  legend: FDB_TYPO.legend,
  /** Recharts 축 눈금·차트 범례 (11 → 12) */
  tickPx: 12,
  /** L9 — 테이블 본문 14px */
  tableBody: FDB_TYPO.tableBody,
  /** L10 — 테이블 헤더 14px */
  tableHead: `text-table-head ${FDB_TYPO.tableHead} font-medium`,
  /** L5 — KPI 카드 라벨 */
  kpiLabel: `${FDB_TYPO.toolbarLabel} text-muted`,
  /** L4/L7 — KPI 보조 설명 */
  kpiSub: `${FDB_TYPO.legend} text-muted`,
  /** L7 — KPI 증감 배지 */
  kpiDelta: `${FDB_TYPO.legend} font-semibold`,
} as const;

/** 통계분석 권역·시도 분할 차트 — X축 높이를 맞추기 위한 공통 레이아웃 */
export const GEO_SPLIT_CHART = {
  height: 480,
  margin: { top: 8, right: 16, bottom: 8, left: 8 },
  xAxisHeight: 64,
  legendRowClass: "flex h-7 shrink-0 items-center justify-center gap-4",
  panelClass: "lg:row-span-2 lg:grid lg:grid-rows-subgrid",
  gridClass:
    "grid gap-4 lg:grid-cols-[minmax(360px,450px)_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:items-stretch",
} as const;

/** 분포 탭 — 단계별(좁게) + 히스토그램(넓게), X축 높이 정렬 */
export const RISK_HISTOGRAM_SPLIT = {
  gridClass:
    "grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:items-start",
  /** 기존 ~160px 플롯 대비 약 30% 확대. 아래 여백은 X축 높이만 사용 */
  height: 280,
  heightClass: "h-[280px] w-full min-h-0",
  margin: { top: 8, right: 10, bottom: 2, left: 4 },
  xAxisHeight: 46,
  xAxisAngle: -28,
  yAxisWidth: 36,
} as const;
