/**
 * 재정분석 대학별DB 표 — 셀·헤더 패딩 (목업 제안 · 전 메뉴 통일용)
 * 신입생충원율 py-2.5(~41px) 대비 약 80% → py-1.5(~32px)
 */
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

export const FDB_TABLE = {
  cell: "px-2 py-1.5",
  cellSticky: "px-2 py-1.5",
  cellMetric: "px-2 py-1.5",
  headRowSpan: "px-2 py-1.5",
  headGroup: "px-2 py-1",
  headSub: "px-2 py-1",
  headSingle: "px-2 py-1.5",
  /** 학교명 — 신입생충원율 내용 너비(150px)의 1.5배. 재학생충원율과 동일 */
  schoolNameCol: "w-[225px] min-w-[225px] max-w-[225px] whitespace-nowrap",
} as const;

export const FDB_SCHOOL_NAME_COL_PX = 225;

/** 대학별DB 페이지 — 표 스크롤을 화면 하단에 고정 */
export const FDB_PAGE_SHELL =
  "flex min-h-0 w-full flex-1 flex-col gap-4";
export const FDB_TABLE_SECTION =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface p-5";
export const FDB_TABLE_SCROLL = "min-h-0 flex-1 overflow-auto";
export const FDB_CHARTS_SCROLL = "min-h-0 flex-1 overflow-auto";

export const FDB_TABLE_HEAD = {
  base: `text-table-head ${FDB_TYPO.tableHead}`,
  rowSpan: `text-table-head ${FDB_TYPO.tableHead} align-middle border-b-0 border-r border-border/50`,
} as const;

/** 현재 프로덕션에서 혼재된 패딩 (감사·비교용) */
export const FDB_TABLE_CURRENT_AUDIT = [
  { menu: "신입생충원율", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "재학생충원율", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "중도탈락율", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "등록금의존율", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "재정지원수혜율", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "기금확보율", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "법인전환율", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "학교개황", head: "py-2.5", body: "py-2", estRow: "~36px" },
  { menu: "학교코드", head: "py-1", body: "py-1", estRow: "~28px" },
  { menu: "출신지역", head: "py-2 / py-2.5", body: "py-2.5", estRow: "~41px" },
  { menu: "학령인구(시도)", head: "py-2 / py-3", body: "py-2.5", estRow: "~41px" },
] as const;
