"use client";

import Link from "next/link";
import { useState } from "react";

import { DashboardPageTitle } from "@/components/analysis/DashboardPageTitle";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { UploadPanelTemplateLink } from "@/components/analysis/UploadPanelButtons";
import { FRESHMAN_ENROLLMENT_METRIC_GROUPS } from "@/lib/ingest/freshman-enrollment-config";

import { KrdsMockSidebar } from "./KrdsMockSidebar";
import {
  KRDS_MOCK_ROWS,
  KRDS_MOCK_YEARS,
  KRDS_TYPO,
  type KrdsMockRow,
} from "./krds-typography";
import { TypographySpectrumGuide } from "./TypographySpectrumGuide";
import "./freshman-enrollment-typography.css";

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

function fmtPct(n: number) {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function KrdsDataTable({ rows }: { rows: KrdsMockRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full min-w-[960px] border-collapse ${KRDS_TYPO.l9}`}>
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th
              rowSpan={2}
              className={`text-table-head !text-sm sticky left-0 z-10 border-r border-border/50 bg-surface-2 px-2.5 py-2.5 text-center ${KRDS_TYPO.l10}`}
            >
              학교코드
            </th>
            <th
              rowSpan={2}
              className={`text-table-head !text-sm border-r border-border/50 px-2.5 py-2.5 text-left ${KRDS_TYPO.l10}`}
            >
              학교명
            </th>
            <th
              rowSpan={2}
              className={`text-table-head !text-sm border-r border-border/50 px-2 py-2.5 text-center ${KRDS_TYPO.l10}`}
            >
              입학정원
            </th>
            {FRESHMAN_ENROLLMENT_METRIC_GROUPS.map((g) => (
              <th
                key={g.key}
                colSpan={g.columns.length}
                className={`text-table-head !text-sm border-r border-border/50 px-2 py-2 text-center ${KRDS_TYPO.l10} ${
                  g.key === "fillRate" ? "text-accent-orange" : ""
                }`}
              >
                {g.label}
              </th>
            ))}
          </tr>
          <tr className="border-b border-border bg-surface-2">
            {FRESHMAN_ENROLLMENT_METRIC_GROUPS.flatMap((g) =>
              g.columns.map((col) => (
                <th
                  key={`${g.key}-${col.key}`}
                  className={`text-table-head !text-sm whitespace-nowrap border-r border-border/50 px-2 py-2 text-center ${KRDS_TYPO.l10} ${
                    g.key === "fillRate" && col.key === "within"
                      ? "text-accent-orange"
                      : ""
                  }`}
                >
                  {col.label}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.code}
              className={`border-b border-border/40 ${
                i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
              }`}
            >
              <td
                className={`sticky left-0 z-[1] border-r border-border/40 bg-inherit px-2.5 py-2.5 text-center font-mono tabular-nums text-muted ${KRDS_TYPO.l9}`}
              >
                {row.code}
              </td>
              <td className={`border-r border-border/40 px-2.5 py-2.5 font-semibold ${KRDS_TYPO.l9}`}>
                {row.name}
              </td>
              <td className={`border-r border-border/40 px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmt(row.quota)}
              </td>
              <td className={`border-r border-border/40 px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmt(row.recruit.total)}
              </td>
              <td className={`border-r border-border/40 px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmt(row.recruit.within)}
              </td>
              <td className={`border-r border-border/40 px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmt(row.recruit.outside)}
              </td>
              <td className={`border-r border-border/40 px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmt(row.enrolled.total)}
              </td>
              <td className={`border-r border-border/40 px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmt(row.enrolled.within)}
              </td>
              <td className={`border-r border-border/40 px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmt(row.enrolled.outside)}
              </td>
              <td className={`px-2 py-2.5 text-right font-mono tabular-nums font-semibold text-accent-orange ${KRDS_TYPO.l9}`}>
                {fmtPct(row.fillRate.within)}
              </td>
              <td className={`px-2 py-2.5 text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {fmtPct(row.fillRate.withinOutside)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KrdsFreshmanEnrollmentPage() {
  const [section, setSection] = useState<"charts" | "data">("data");
  const displayYear = 2024;

  return (
    <div className="krds-mock-root flex min-h-screen flex-col">
      <div className="krds-mock-banner">
        <span>L1~L10 폰트 크기 목업 · 기존 색상 유지 · 실제 앱 미적용</span>
        <Link href="/analysis/finance-analysis?tab=freshman-enrollment-rate&section=data">
          현재 앱 보기 →
        </Link>
      </div>

      <div className="flex min-h-0 flex-1">
        <KrdsMockSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-end border-b border-border bg-white/80 px-6 backdrop-blur">
            <span className={KRDS_TYPO.l7}>AI Idle</span>
          </header>

          <main className="krds-mock-main flex-1 overflow-auto p-6">
            <div className="flex w-full flex-col gap-4 pb-10">
              <header className="rounded-xl border border-border bg-surface px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <DashboardPageTitle className={KRDS_TYPO.l1}>
                    신입생 충원 현황
                  </DashboardPageTitle>
                  <ExcelUploadButton />
                </div>
              </header>

              <div
                className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={section === "charts"}
                  onClick={() => setSection("charts")}
                  className={`rounded-md px-4 py-2 transition-colors ${
                    section === "charts"
                      ? `${KRDS_TYPO.l2} bg-surface text-foreground shadow-sm ring-1 ring-border`
                      : `${KRDS_TYPO.l2Inactive} hover:text-foreground`
                  }`}
                >
                  통계분석
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={section === "data"}
                  onClick={() => setSection("data")}
                  className={`rounded-md px-4 py-2 transition-colors ${
                    section === "data"
                      ? `${KRDS_TYPO.l2} bg-surface text-foreground shadow-sm ring-1 ring-border`
                      : `${KRDS_TYPO.l2Inactive} hover:text-foreground`
                  }`}
                >
                  대학별DB
                </button>
              </div>

              {section === "charts" ? (
                <section className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
                  <p className={KRDS_TYPO.l3}>통계분석 패널</p>
                  <p className={`mt-2 ${KRDS_TYPO.l8}`}>
                    목업에서는 대학별DB 탭을 기본으로 표시합니다.
                  </p>
                </section>
              ) : (
                <>
                  <section className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className={KRDS_TYPO.l3}>대학별DB</h2>
                        <p className={`mt-1 ${KRDS_TYPO.l4}`}>
                          312개 대학 · 캠퍼스별 DB · {displayYear}년
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
                          <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 ${KRDS_TYPO.l6} bg-accent/15 text-accent shadow-sm`}
                          >
                            캠퍼스별
                          </button>
                          <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 ${KRDS_TYPO.l6} text-muted hover:text-foreground`}
                          >
                            본교통합
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={KRDS_TYPO.l5}>표시 연도</span>
                          {KRDS_MOCK_YEARS.map((y) => (
                            <button
                              key={y}
                              type="button"
                              className={`rounded-md border px-2.5 py-1 transition-colors ${KRDS_TYPO.l6} ${
                                y === displayYear
                                  ? "border-accent bg-accent/15 text-accent"
                                  : "border-border bg-surface-2 text-muted hover:text-foreground"
                              }`}
                            >
                              {y}년
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-4">
                      <span className={KRDS_TYPO.l5}>설립구분 ▾</span>
                      <span className={KRDS_TYPO.l5}>학교구분 ▾</span>
                      <span className={KRDS_TYPO.l5}>학교종류 ▾</span>
                      <span className={KRDS_TYPO.l5}>지역 ▾</span>
                      <span className={`ml-auto flex items-center gap-2 ${KRDS_TYPO.l5}`}>
                        학교명
                        <input
                          type="search"
                          placeholder="검색"
                          className={`w-40 rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${KRDS_TYPO.l6}`}
                        />
                      </span>
                    </div>

                    <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/40 pt-2 ${KRDS_TYPO.l7}`}>
                      <span>
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                        본교통합 DB 생성됨
                      </span>
                      <span>
                        <span className="mr-1 text-accent-orange">○</span>
                        미생성 (학교코드·원자료 필요)
                      </span>
                    </div>
                  </section>

                  <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className={KRDS_TYPO.l5}>
                        DB 원본 down · 캠퍼스별 {KRDS_MOCK_ROWS.length}건
                      </p>
                      <UploadPanelTemplateLink href="#" download="template.xlsx" />
                    </div>
                    <KrdsDataTable rows={KRDS_MOCK_ROWS} />
                    <p className={`mt-3 border-t border-border/40 pt-2 ${KRDS_TYPO.l7}`}>
                      표시 {KRDS_MOCK_ROWS.length}건 · L9 본문 14px · L10 헤더 14px
                    </p>
                  </section>
                </>
              )}

              <TypographySpectrumGuide />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
