"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import {
  getStudentFillFunnelProfile,
  getStudentFillRiskProfile,
  STUDENT_FILL_CHART_KPI_SUB,
  STUDENT_FILL_CHART_RATE_LABEL,
} from "@/lib/analysis/student-fill-advanced-chart-rows";
import { DROPOUT_ADVANCED_HELP } from "@/lib/analysis/dropout-rate-advanced-help";
import { ENROLLED_FILL_ADVANCED_HELP } from "@/lib/analysis/enrolled-enrollment-advanced-help";
import { FRESHMAN_FILL_ADVANCED_HELP } from "@/lib/analysis/freshman-enrollment-advanced-help";
import type { AdvancedChartHelpPack } from "@/lib/analysis/advanced-chart-help";

import {
  countMockSchools,
  STUDENT_FILL_MOCK_ROWS,
  STUDENT_FILL_MOCK_YEARS,
  type StudentFillViewMode,
} from "./mock-data";
import {
  STUDENT_FILL_MOCK_META,
  type StudentFillMockMetric,
} from "./profiles";

const HELP_BY_METRIC: Record<StudentFillMockMetric, AdvancedChartHelpPack> = {
  freshman: FRESHMAN_FILL_ADVANCED_HELP,
  enrolled: ENROLLED_FILL_ADVANCED_HELP,
  dropout: DROPOUT_ADVANCED_HELP,
};

const NAV: { id: StudentFillMockMetric; href: string }[] = [
  { id: "freshman", href: "/mockups/student-fill-advanced/freshman" },
  { id: "enrolled", href: "/mockups/student-fill-advanced/enrolled" },
  { id: "dropout", href: "/mockups/student-fill-advanced/dropout" },
];

export function StudentFillAdvancedMockShell({
  metric,
}: {
  metric: StudentFillMockMetric;
}) {
  const pathname = usePathname();
  const meta = STUDENT_FILL_MOCK_META[metric];
  const [viewMode, setViewMode] = useState<StudentFillViewMode>("campus");
  const latestYear = STUDENT_FILL_MOCK_YEARS.at(-1) ?? 2025;

  const rows = useMemo(
    () => STUDENT_FILL_MOCK_ROWS[metric][viewMode],
    [metric, viewMode],
  );

  const campusCount = countMockSchools(metric, "campus", latestYear);
  const consolidatedCount = countMockSchools(
    metric,
    "consolidated",
    latestYear,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-accent-orange/30 bg-accent-orange/5 px-4 py-2 text-xs text-muted">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2">
          <span>
            ✦ 학생충원 통계분석 신버전 목업 · 프로덕션에도 동일 구조 적용됨
          </span>
          <Link
            href={`/analysis/finance-analysis?tab=${
              metric === "freshman"
                ? "freshman-enrollment-rate"
                : metric === "enrolled"
                  ? "enrolled-enrollment-rate"
                  : "dropout-rate"
            }&section=charts`}
            className="font-medium text-accent hover:underline"
          >
            프로덕션 메뉴 보기 →
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5">
        <header className="rounded-xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium text-accent-cyan">
            대학재정분석 / 학생충원
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted">{meta.description}</p>
          <p className="mt-3 text-xs text-muted">
            {latestYear}년 · 캠퍼스별 {campusCount.toLocaleString("ko-KR")}개 ·
            본교통합 {consolidatedCount.toLocaleString("ko-KR")}개 · DB 보기는
            글로벌 필터에서 전환
          </p>
        </header>

        <nav
          className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1"
          aria-label="목업 메뉴"
        >
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {STUDENT_FILL_MOCK_META[item.id].title}
              </Link>
            );
          })}
        </nav>

        <CorpTransferRatioAdvancedChartDashboard
          key={`${metric}-${viewMode}`}
          rows={rows}
          years={STUDENT_FILL_MOCK_YEARS}
          hasData
          showMockupNotice
          rateLabel={STUDENT_FILL_CHART_RATE_LABEL[metric]}
          kpiSub={STUDENT_FILL_CHART_KPI_SUB[metric]}
          riskProfile={getStudentFillRiskProfile(metric)}
          funnelProfile={getStudentFillFunnelProfile(metric)}
          helpPack={HELP_BY_METRIC[metric]}
          mockupNoticeLines={[
            ...meta.noticeLines,
            "DB 보기(캠퍼스별/본교통합)는 글로벌 필터에 배치되어 있습니다.",
          ]}
          geoChartsLayout="split"
          distributionTabLayout="density-v2"
          dbViewMode={viewMode}
          onDbViewModeChange={setViewMode}
        />
      </div>
    </div>
  );
}

export function StudentFillAdvancedHub(): ReactNode {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs font-medium text-accent-cyan">목업 · 프로덕션 적용됨</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          학생충원 통계분석 신버전
        </h1>
        <p className="mt-2 text-sm text-muted">
          글로벌 필터의 캠퍼스별/본교통합 토글 · 자금확보율형 지역 split · 분포
          density-v2 구조입니다.
        </p>
        <ul className="mt-8 space-y-3">
          {NAV.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-accent/50"
              >
                <span>
                  <span className="block font-semibold text-foreground">
                    {STUDENT_FILL_MOCK_META[item.id].title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {STUDENT_FILL_MOCK_META[item.id].description}
                  </span>
                </span>
                <span className="text-accent">보기 →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
