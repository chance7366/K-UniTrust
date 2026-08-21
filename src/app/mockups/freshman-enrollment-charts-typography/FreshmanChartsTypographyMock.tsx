"use client";

import Link from "next/link";

import { DashboardPageTitle } from "@/components/analysis/DashboardPageTitle";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import {
  CHARTS_FDB_TYPO,
  CHARTS_LEGACY_TYPO,
  CHARTS_TYPO_SPEC,
} from "./charts-typography-spec";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";

const MOCK_SIDO = [
  { region: "서울", avg: 98.42, schools: 42, risk: 1 },
  { region: "경기", avg: 96.18, schools: 38, risk: 2 },
  { region: "부산", avg: 91.05, schools: 18, risk: 4 },
  { region: "전북", avg: 84.33, schools: 12, risk: 6 },
];

type TypoSet = typeof CHARTS_LEGACY_TYPO | typeof CHARTS_FDB_TYPO;

function ChartsPreview({ variant }: { variant: "before" | "after" }) {
  const T = variant === "before" ? CHARTS_LEGACY_TYPO : CHARTS_FDB_TYPO;
  const isAfter = variant === "after";

  return (
    <div className="space-y-4">
      {/* L1 + upload — 공통 */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-5 py-4">
        <DashboardPageTitle className={FDB_TYPO.pageTitle}>
          신입생 충원 현황
        </DashboardPageTitle>
        <ExcelUploadButton />
      </header>

      {/* L2 — 섹션 탭 */}
      <div
        className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1"
        role="tablist"
      >
        <button
          type="button"
          className={`rounded-md bg-surface px-4 py-2 shadow-sm ring-1 ring-border ${
            isAfter
              ? `${FDB_TYPO.sectionTab} text-foreground`
              : `${FDB_TYPO.sectionTab} text-foreground`
          }`}
        >
          통계분석
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 ${
            isAfter ? FDB_TYPO.sectionTabInactive : FDB_TYPO.sectionTabInactive
          }`}
        >
          대학별DB
        </button>
      </div>

      {/* L3~L6 — 글로벌 필터 */}
      <section className="rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className={T.filterTitle}>글로벌 필터</p>
          <button
            type="button"
            className={
              variant === "before"
                ? CHARTS_LEGACY_TYPO.helpButton
                : CHART_TYPO.helpButton
            }
          >
            도움말 보기
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-3">
          <div className="flex items-center gap-2">
            <span className={T.filterLabel}>DB 보기</span>
            <button type="button" className={T.filterControlActive}>
              캠퍼스별
            </button>
            <button type="button" className={`${T.filterControl} text-muted`}>
              본교통합
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={T.filterLabel}>표시 연도</span>
            {["2023", "2024", "2025"].map((y) => (
              <button
                key={y}
                type="button"
                className={
                  y === "2025" ? T.filterControlActive : `${T.filterControl} text-muted`
                }
              >
                {y}년
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={T.filterLabel}>설립구분</span>
            <button type="button" className={T.filterControlActive}>
              사립
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards — L5/L4/L7 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 border-l-4 border-l-border/80">
          <div className="flex items-start justify-between gap-2">
            <p className={T.kpiLabel}>전국 평균 신입생충원율(정원내)</p>
            <span
              className={`rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600 ${T.kpiDelta}`}
            >
              ▲ 1.2%p
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-accent">
            92.48%
          </p>
          <p className={`mt-1.5 ${T.kpiSub}`}>
            입학정원 대비 정원내 입학자 비율
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 border-l-4 border-l-border/80">
          <p className={T.kpiLabel}>위험군 대학 수</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-rose-600">
            28개교
          </p>
          <p className={`mt-1.5 ${T.kpiSub}`}>
            80% 미만 28개 (9.0%) · 70% 미만 11개 (3.5%)
          </p>
        </div>
      </div>

      {/* L2 — 차트 서브탭 */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {["지역·권역 격차", "분포·위험군", "권역·규모 시계열"].map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`rounded-md px-4 py-2 transition-colors ${
              i === 0
                ? `${T.chartTab} bg-surface text-foreground shadow-sm ring-1 ring-border`
                : T.chartTabInactive
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* L3/L4/L9/L10 — 차트 패널 + 테이블 */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className={T.panelTitle}>17개 시·도 상세 테이블</h3>
        <p className={`mt-0.5 ${T.panelMeta}`}>정렬·클릭 필터</p>
        <div className="mt-4 overflow-x-auto">
          <table className={`w-full min-w-[480px] border-collapse ${T.tableBody}`}>
            <thead className="border-b border-border bg-surface-2">
              <tr>
                {["시·도", "평균 충원율", "대학 수", "위험군"].map((h) => (
                  <th key={h} className={`px-3 py-2 text-left ${T.tableHead}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_SIDO.map((row) => (
                <tr key={row.region} className="border-b border-border/40">
                  <td className="px-3 py-2 font-semibold">{row.region}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {row.avg.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {row.schools}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-rose-600">
                    {row.risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-2 ${T.legend}`}>
          * 위험군: 신입생충원율(정원내) 80% 미만 · 2025년 · 사립 필터 적용
        </p>
      </section>

      {/* L8 — 안내 배너 */}
      <section className="rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3">
        <p className={T.bodyText}>
          <span className="font-medium text-foreground">2025년</span> 본교통합
          DB가 없습니다. 글로벌 필터에서{" "}
          <strong className="text-foreground">캠퍼스별</strong>로 전환하거나
          대학별DB 탭에서 본교통합을 생성하세요.
        </p>
      </section>
    </div>
  );
}

function SpecTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-surface-2">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Level</th>
            <th className="px-4 py-2.5 font-semibold">요소</th>
            <th className="px-4 py-2.5 font-semibold">현행</th>
            <th className="px-4 py-2.5 font-semibold text-accent">제안 (대학별DB)</th>
            <th className="px-4 py-2.5 font-semibold">변화</th>
            <th className="px-4 py-2.5 font-semibold">적용 대상</th>
          </tr>
        </thead>
        <tbody>
          {CHARTS_TYPO_SPEC.map((row) => (
            <tr key={row.level} className="border-b border-border/40">
              <td className="px-4 py-2.5 font-bold">{row.level}</td>
              <td className="px-4 py-2.5">{row.element}</td>
              <td className="px-4 py-2.5 text-muted">
                <code className="text-xs">{row.current}</code>
              </td>
              <td className="px-4 py-2.5 font-medium text-accent">
                <code className="text-xs">{row.proposed}</code>
              </td>
              <td className="px-4 py-2.5">
                {row.change === "동일" || row.change.startsWith("동일") ? (
                  <span className="text-muted">{row.change}</span>
                ) : (
                  <span className="font-medium text-accent-orange">{row.change}</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted">{row.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
            variant === "before"
              ? "bg-slate-100 text-slate-700"
              : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          }`}
        >
          {variant === "before" ? "현행 (Before)" : "제안 — 대학별DB 스케일 (After)"}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function FreshmanChartsTypographyMock() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground antialiased">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-emerald-900">
              적용 완료 — 통계분석 타이포가 프로덕션에 반영되었습니다
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/mockups/freshman-enrollment-typography"
                className="font-bold text-emerald-700 hover:text-emerald-900"
              >
                대학별DB 타이포 목업 →
              </Link>
              <Link
                href="/analysis/finance-analysis?tab=freshman-enrollment-rate&section=charts"
                className="font-bold text-sky-700 hover:text-sky-900"
              >
                프로덕션 통계분석 →
              </Link>
            </div>
          </div>
        </div>

        <header className="rounded-xl border border-border bg-surface px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              L1~L10
            </span>
            <h1 className="text-xl font-extrabold">
              신입생충원율 · 통계분석 타이포그래피 목업
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            대학별DB에 적용된 FDB_TYPO 스케일을 통계분석(차트·KPI·필터) 화면에
            맞춰 매핑한 Before/After 비교입니다. KPI 수치(3xl)는 강조용으로
            유지합니다.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">레벨별 매핑 스펙</h2>
          <SpecTable />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <PreviewShell variant="before">
            <ChartsPreview variant="before" />
          </PreviewShell>
          <PreviewShell variant="after">
            <ChartsPreview variant="after" />
          </PreviewShell>
        </div>

        <section className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted">
          <h2 className="font-bold text-foreground">주요 변경 포인트</h2>
          <ul className="mt-2 list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-foreground">글로벌 필터·차트 패널 제목</strong>{" "}
              16px → 20px (L3)
            </li>
            <li>
              <strong className="text-foreground">필터 라벨·컨트롤</strong> 12px →
              13px / 14px (L5·L6)
            </li>
            <li>
              <strong className="text-foreground">차트 서브탭</strong> 14px → 16px
              (L2, 섹션 탭과 동일)
            </li>
            <li>
              <strong className="text-foreground">패널 부제·범례</strong> 12px →
              15px / 13px (L4·L7)
            </li>
            <li>
              <strong className="text-foreground">테이블</strong> L9/L10 — 대학별DB와
              동일 14px 유지
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
