import { FRESHMAN_ENROLLMENT_METRIC_GROUPS } from "@/lib/ingest/freshman-enrollment-config";

/**
 * L1~L10 단계별 타이포그래피 (신입생충원율 대학별DB 목업)
 * — 색상·굵기는 프로덕션 FDB_TYPO 기준, 크기만 L1~L10 신규 스펙 적용
 */
export const KRDS_TYPO = {
  /** L1 페이지 제목 26px (구 text-xl) — 색상은 DashboardPageTitle */
  l1: "text-[26px] font-extrabold tracking-wide",
  /** L2 섹션 탭 16px (구 text-sm) */
  l2: "text-base font-semibold",
  l2Inactive: "text-base font-medium text-muted",
  /** L3 패널 제목 20px (구 text-base) */
  l3: "text-xl font-bold text-foreground",
  /** L4 패널 부제 15px (구 text-sm) */
  l4: "text-[15px] text-muted",
  /** L5 툴바 라벨 13px (구 text-xs) */
  l5: "text-[13px] font-semibold text-muted",
  /** L6 툴바 컨트롤 14px (구 text-xs) */
  l6: "text-sm font-medium",
  /** L7 범례·보조 13px (구 text-xs) */
  l7: "text-[13px] text-muted",
  /** L8 본문 안내 15px (구 text-sm) */
  l8: "text-[15px] text-muted",
  /** L9 테이블 본문 14px (구 text-xs) */
  l9: "text-sm",
  /** L10 테이블 헤더 14px (구 13px) — 색상은 text-table-head */
  l10: "text-sm font-medium",
} as const;

export type KrdsMockRow = {
  code: string;
  name: string;
  quota: number;
  recruit: { total: number; within: number; outside: number };
  enrolled: { total: number; within: number; outside: number };
  fillRate: { within: number; withinOutside: number };
};

export const KRDS_MOCK_ROWS: KrdsMockRow[] = [
  {
    code: "10000001",
    name: "○○대학교",
    quota: 1200,
    recruit: { total: 1180, within: 1150, outside: 30 },
    enrolled: { total: 1175, within: 1148, outside: 27 },
    fillRate: { within: 99.83, withinOutside: 99.58 },
  },
  {
    code: "10000002",
    name: "△△대학교",
    quota: 850,
    recruit: { total: 820, within: 800, outside: 20 },
    enrolled: { total: 741, within: 728, outside: 13 },
    fillRate: { within: 91.0, withinOutside: 90.37 },
  },
  {
    code: "10000003",
    name: "□□전문대학",
    quota: 420,
    recruit: { total: 430, within: 425, outside: 5 },
    enrolled: { total: 429, within: 424, outside: 5 },
    fillRate: { within: 100.95, withinOutside: 99.77 },
  },
  {
    code: "10000004",
    name: "◇◇대학교",
    quota: 960,
    recruit: { total: 940, within: 920, outside: 20 },
    enrolled: { total: 912, within: 895, outside: 17 },
    fillRate: { within: 97.28, withinOutside: 97.02 },
  },
  {
    code: "10000005",
    name: "☆☆대학교",
    quota: 640,
    recruit: { total: 610, within: 590, outside: 20 },
    enrolled: { total: 578, within: 562, outside: 16 },
    fillRate: { within: 95.25, withinOutside: 94.75 },
  },
];

export const KRDS_MOCK_YEARS = [2021, 2022, 2023, 2024, 2025] as const;

export { FRESHMAN_ENROLLMENT_METRIC_GROUPS };
