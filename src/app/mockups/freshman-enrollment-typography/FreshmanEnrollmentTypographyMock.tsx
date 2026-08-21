"use client";

import Link from "next/link";

import { DashboardPageTitle } from "@/components/analysis/DashboardPageTitle";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import {
  KRDS_MOCK_ROWS,
  KRDS_TYPO,
} from "./krds-typography";
import { KRDS_TYPO_SPEC, LEGACY_TYPO_SPEC } from "./typography-spec";
import "./freshman-enrollment-typography.css";

function TypoScaleTable({ variant }: { variant: "before" | "after" }) {
  const spec = variant === "before" ? LEGACY_TYPO_SPEC : KRDS_TYPO_SPEC;

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
          <th className="px-3 py-2">Level</th>
          <th className="px-3 py-2">크기</th>
          <th className="px-3 py-2">적용 대상</th>
        </tr>
      </thead>
      <tbody>
        {spec.map((row) => (
          <tr key={row.level} className="fet-spec-row border-b border-slate-100">
            <td className="px-3 py-2 font-bold text-slate-800">{row.level}</td>
            <td className="px-3 py-2">
              <code>{row.size}</code>
            </td>
            <td className="px-3 py-2">{row.target}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LegacyTablePreview() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="fet-legacy-table w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-2 py-2">학교코드</th>
            <th className="px-2 py-2">학교명</th>
            <th className="px-2 py-2">입학정원</th>
            <th className="px-2 py-2 text-orange-500">충원율(정원내)</th>
          </tr>
        </thead>
        <tbody>
          {KRDS_MOCK_ROWS.map((row) => (
            <tr key={row.code} className="text-muted">
              <td className={`px-2 py-2 text-center font-mono ${FDB_TYPO.tableBody}`}>
                {row.code}
              </td>
              <td className={`px-2 py-2 ${FDB_TYPO.tableEmphasis}`}>{row.name}</td>
              <td className={`px-2 py-2 text-right font-mono ${FDB_TYPO.tableBody}`}>
                {row.quota.toLocaleString("ko-KR")}
              </td>
              <td
                className={`px-2 py-2 text-right font-mono font-semibold text-orange-500 ${FDB_TYPO.tableBody}`}
              >
                {row.fillRate.within.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KrdsTablePreview() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="fet-krds-table w-full border-collapse">
        <thead className="bg-surface-2">
          <tr>
            <th className={`text-table-head !text-sm text-left ${KRDS_TYPO.l10}`}>학교코드</th>
            <th className={`text-table-head !text-sm text-left ${KRDS_TYPO.l10}`}>학교명</th>
            <th className={`text-table-head !text-sm text-right ${KRDS_TYPO.l10}`}>입학정원</th>
            <th className={`text-table-head !text-sm text-right text-accent-orange ${KRDS_TYPO.l10}`}>
              충원율(정원내)
            </th>
          </tr>
        </thead>
        <tbody>
          {KRDS_MOCK_ROWS.map((row) => (
            <tr key={row.code}>
              <td className={`text-center font-mono tabular-nums text-muted ${KRDS_TYPO.l9}`}>
                {row.code}
              </td>
              <td className={`font-semibold ${KRDS_TYPO.l9}`}>{row.name}</td>
              <td className={`text-right font-mono tabular-nums ${KRDS_TYPO.l9}`}>
                {row.quota.toLocaleString("ko-KR")}
              </td>
              <td
                className={`text-right font-mono tabular-nums font-semibold text-accent-orange ${KRDS_TYPO.l9}`}
              >
                {row.fillRate.within.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PagePreview({ variant }: { variant: "before" | "after" }) {
  const isAfter = variant === "after";

  return (
    <div className="fet-preview-shell space-y-4">
      {/* L1 + upload */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-5 py-4">
        {isAfter ? (
          <DashboardPageTitle className={KRDS_TYPO.l1}>신입생 충원 현황</DashboardPageTitle>
        ) : (
          <DashboardPageTitle>신입생 충원 현황</DashboardPageTitle>
        )}
        <ExcelUploadButton />
      </header>

      {/* L3 tabs */}
      <div
        className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1"
        role="tablist"
      >
        <button
          type="button"
          className={`rounded-md px-4 py-2 ${
            isAfter ? KRDS_TYPO.l2Inactive : FDB_TYPO.sectionTabInactive
          }`}
        >
          통계분석
        </button>
        <button
          type="button"
          className={`rounded-md bg-surface px-4 py-2 shadow-sm ring-1 ring-border ${
            isAfter
              ? `${KRDS_TYPO.l2} text-foreground`
              : `${FDB_TYPO.sectionTab} text-foreground`
          }`}
        >
          대학별DB
        </button>
      </div>

      {/* Panel toolbar + table */}
      <section className="rounded-xl border border-border bg-surface px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {isAfter ? (
              <>
                <h2 className={KRDS_TYPO.l3}>대학별DB</h2>
                <p className={`mt-1 ${KRDS_TYPO.l4}`}>
                  312개 대학 · 캠퍼스별 DB · 2024년
                </p>
              </>
            ) : (
              <>
                <h2 className={FDB_TYPO.panelTitle}>대학별DB</h2>
                <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
                  312개 대학 · 캠퍼스별 DB · 2024년
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={isAfter ? KRDS_TYPO.l5 : FDB_TYPO.toolbarLabel}>
              표시 연도
            </span>
            {["2022", "2023", "2024"].map((y) => (
              <button
                key={y}
                type="button"
                className={`rounded-md border px-2.5 py-1 ${
                  y === "2024"
                    ? isAfter
                      ? `border-accent bg-accent/15 text-accent ${KRDS_TYPO.l6}`
                      : "border-accent bg-accent/15 text-accent text-xs font-medium"
                    : isAfter
                      ? `border-border bg-surface-2 text-muted ${KRDS_TYPO.l6}`
                      : `${FDB_TYPO.toolbarControl} border-border bg-surface-2 text-muted`
                }`}
              >
                {y}년
              </button>
            ))}
          </div>
        </div>

        <div
          className={`mt-3 flex flex-wrap gap-3 border-t border-border/40 pt-3 ${
            isAfter ? KRDS_TYPO.l7 : FDB_TYPO.legend
          }`}
        >
          <span>설립구분 ▾</span>
          <span>학교구분 ▾</span>
          <span>학교종류 ▾</span>
          <span className="ml-auto">학교명 검색</span>
        </div>

        <div className="mt-4">
          {isAfter ? <KrdsTablePreview /> : <LegacyTablePreview />}
        </div>
      </section>
    </div>
  );
}

function PreviewShell({
  variant,
  children,
}: {
  variant: "before" | "after";
  children: React.ReactNode;
}) {
  return (
    <div className="fet-panel overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <span className={`fet-badge ${variant}`}>
          {variant === "before" ? "현행 10단계 (Before)" : "KRDS 5단계 (After)"}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function FreshmanEnrollmentTypographyCompare() {
  return (
    <div className="fet-root p-6 antialiased">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-amber-900">
              목업 전용 — KRDS 5단계 타이포그래피 리팩터 (실제 앱 미적용)
            </p>
            <Link
              href="/mockups/freshman-enrollment-typography"
              className="font-bold text-emerald-700 hover:text-emerald-900"
            >
              KRDS 전체 페이지 목업 →
            </Link>
          </div>
        </div>

        <header className="fet-panel px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              KRDS Typography
            </span>
            <h1 className="text-xl font-extrabold text-slate-900">
              신입생충원율 타이포그래피 목업
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            10단계(L1~L10) → 5단계(L1~L5) 통합 · 와이드 모니터 가독성 개선
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="fet-panel p-5">
            <h2 className="mb-3 text-sm font-bold text-slate-800">현행 스케일</h2>
            <TypoScaleTable variant="before" />
          </section>
          <section className="fet-panel p-5">
            <h2 className="mb-3 text-sm font-bold text-emerald-800">제안 스케일 (KRDS)</h2>
            <TypoScaleTable variant="after" />
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <PreviewShell variant="before">
            <PagePreview variant="before" />
          </PreviewShell>
          <PreviewShell variant="after">
            <PagePreview variant="after" />
          </PreviewShell>
        </div>

        <section className="fet-panel space-y-3 px-5 py-4 text-sm text-slate-600">
          <h2 className="font-bold text-slate-900">변경 요약</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-slate-900">L1</strong> 페이지 제목 20px →{" "}
              <strong>26px</strong>
            </li>
            <li>
              <strong className="text-slate-900">L2</strong> 패널 제목·탭·부제를{" "}
              <strong>20px / 16px</strong>로 재배치
            </li>
            <li>
              <strong className="text-slate-900">L4</strong> 테이블·컨트롤 통합{" "}
              <strong>14px</strong> (헤더 bold, 셀 medium)
            </li>
            <li>
              <strong className="text-slate-900">L5</strong> 라벨·범례{" "}
              <strong>13px</strong> slate-500
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
