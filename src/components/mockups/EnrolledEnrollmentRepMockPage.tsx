"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import {
  FinanceSectionTabRow,
  GlassMintTabGroup,
} from "@/components/analysis/GlassMintTabGroup";
import { RepDbDownButton } from "@/components/analysis/RepDbDownButton";
import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import { EnrolledIndicatorStatsPanel } from "@/components/analysis/IndicatorStatsTabPanels";
import { INDICATOR_STATS_TAB_HELP } from "@/lib/analysis/indicator-stats-geo";
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import {
  STUDENT_FILL_VIEW_TABS,
  studentFillRowLabel,
} from "@/lib/analysis/all-universities-cohort";
import {
  ENROLLED_REP_DB_HELP,
  ENROLLED_REP_DB_HELP_SUB,
  ENROLLED_REP_DB_HELP_TITLE,
} from "@/lib/analysis/enrolled-enrollment-rep-db-help";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import {
  FDB_PAGE_SHELL,
  FDB_SCHOOL_NAME_COL_PX,
  FDB_TABLE,
  FDB_TABLE_HEAD,
  FDB_CHARTS_SCROLL,
  FDB_TABLE_SCROLL,
  FDB_TABLE_SECTION,
} from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { ENROLLED_FILL_ADVANCED_HELP } from "@/lib/analysis/enrolled-enrollment-advanced-help";
import {
  toRepEnrolledChartRows,
  type EnrolledRepViewCohort,
  type EnrolledRepCohort,
  type EnrolledRepCompareField,
  type EnrolledRepRow,
  type EnrolledRepVerifySummary,
} from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import {
  buildEnrolledRepHref,
  buildEnrolledRepMockHref,
  type EnrolledRepMockData,
} from "@/lib/analysis/enrolled-enrollment-rep-mock-view";
import {
  getEnrolledChartFunnelProfile,
  getEnrolledChartRiskProfile,
} from "@/lib/analysis/student-fill-advanced-chart-rows";

type EnrolledChartMetric = "within" | "withinOutside";

const RATE_NOTE: Record<EnrolledRepViewCohort, string> = {
  university:
    "대학전문 표시연도 상반기·전년도 하반기 평균(한쪽만 있으면 그 값) · 정원내 = 재학생 정원내 ÷ (학생정원 − 모집정지) · 정원내외 = 재학생 계 ÷ (학생정원 − 모집정지)",
  "junior-college":
    "대학전문 표시연도 상반기·전년도 하반기 평균(한쪽만 있으면 그 값) · 정원내 = 재학생 정원내 ÷ (학생정원 − 모집정지) · 정원내외 = 재학생 계 ÷ (학생정원 − 모집정지)",
  graduate:
    "반기 구분 없음 · 원본 그대로 · 정원내(석사+박사+석박사통합) ÷ (학생정원 − 모집정지) · 정원내외 = 재학생 계 ÷ (학생정원 − 모집정지)",
  combined:
    "대학 표시연도 상반기·전년도 하반기 평균 + 대학원 원본 · 정원내 = 합산 재학생 정원내 ÷ (합산 학생정원 − 합산 모집정지) · 정원내외 = 합산 재학생 계 ÷ (합산 학생정원 − 합산 모집정지)",
  "all-universities":
    "전체대학 = 대학통합 행 + 전문대학 행 · 율은 각 행의 기존 분모(학생정원 − 모집정지)를 유지한 뒤 합산 · 규모는 대학 1만/5천명, 전문대학 4천/2천명 기준을 행별로 적용",
};

const CHART_METRIC_LABELS: Record<EnrolledChartMetric, string> = {
  within: "정원내 재학생충원율",
  withinOutside: "정원내외 재학생충원율",
};

const CHART_KPI_SUB: Record<EnrolledChartMetric, string> = {
  within: "Σ재학생(정원내) ÷ Σ(학생정원−모집정지)",
  withinOutside: "Σ재학생(계) ÷ Σ(학생정원−모집정지)",
};

const FIELD_LABEL: Record<EnrolledRepCompareField, string> = {
  studentQuota: "학생정원",
  recruitmentStop: "학생모집정지인원",
  enrolledTotal: "재학생 계",
  enrolledWithin: "재학생 정원내",
  enrolledOutside: "재학생 정원외",
  fillRateWithin: "정원내 재학생충원율",
  fillRateWithinOutside: "정원내외 재학생충원율",
};

const METRIC_COL_COUNT = 7;

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function fmtRate(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const safeValue = !value || options.includes(value) ? value : "";
  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        <option value="">전체</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function VerifyBanner({ verify }: { verify: EnrolledRepVerifySummary }) {
  const ok =
    verify.mismatch === 0 && verify.mockOnly === 0 && verify.currentOnly === 0;
  return (
    <section
      className={`rounded-xl border px-4 py-3 ${
        ok
          ? "border-accent/30 bg-accent/5"
          : "border-accent-orange/40 bg-accent-orange/5"
      }`}
    >
      <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
        현행 본교통합 대조 · 일치 {fmtCount(verify.match)} · 불일치{" "}
        {fmtCount(verify.mismatch)} · 목업만 {fmtCount(verify.mockOnly)} ·
        본교통합만 {fmtCount(verify.currentOnly)}
      </p>
      <p className={`mt-1 ${FDB_TYPO.legend}`}>
        매칭은 학교대표 이름 우선, 보조로 대표코드. 정수 칸은 완전 일치, 율은
        현행 2자리를 1자리로 다시 반올림한 뒤 비교하고 0.1 차이는 반올림으로
        봅니다. 본교통합만 = 분석대상에 없는 현행 행(국립·교대·사이버 등).
      </p>
    </section>
  );
}

function VerifyMismatchTable({ verify }: { verify: EnrolledRepVerifySummary }) {
  const problemRows = verify.rows.filter((row) => row.status !== "match");
  if (!problemRows.length) return null;
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className={FDB_TYPO.panelTitle}>검증 상세</h2>
      <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
        불일치 행은 알리미 합과 본교통합 값을 나란히 보여 줍니다.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className={`w-full min-w-[720px] border-collapse ${FDB_TYPO.tableBody}`}>
          <thead className="border-b border-border bg-surface-2">
            <tr>
              {["학교명", "상태", "항목", "목업(알리미 합)", "본교통합"].map((h) => (
                <th
                  key={h}
                  className={`${FDB_TABLE_HEAD.base} ${FDB_TABLE.headSingle} text-left`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {problemRows.flatMap((row) => {
              if (row.status !== "mismatch") {
                return [
                  <tr
                    key={`${row.status}-${row.schoolRepName}-${row.schoolRepCode}`}
                    className="border-b border-border/40 bg-accent-orange/5"
                  >
                    <td className={`${FDB_TABLE.cell} ${FDB_TABLE_COLOR.schoolName}`}>
                      {row.schoolRepName}
                    </td>
                    <td className={FDB_TABLE.cell}>
                      {row.status === "mock-only" ? "목업만 있음" : "본교통합만 있음"}
                    </td>
                    <td className={`${FDB_TABLE.cell} text-muted`} colSpan={3}>
                      —
                    </td>
                  </tr>,
                ];
              }
              return row.mismatches.map((m, i) => (
                <tr
                  key={`${row.schoolRepName}-${m.field}-${i}`}
                  className="border-b border-border/40 bg-accent-orange/5"
                >
                  <td className={`${FDB_TABLE.cell} ${FDB_TABLE_COLOR.schoolName}`}>
                    {i === 0 ? row.schoolRepName : ""}
                  </td>
                  <td className={FDB_TABLE.cell}>불일치</td>
                  <td className={FDB_TABLE.cell}>{FIELD_LABEL[m.field]}</td>
                  <td className={`${FDB_TABLE.cell} font-mono`}>
                    {m.field.startsWith("fill") ? fmtRate(m.mock) : fmtCount(m.mock)}
                  </td>
                  <td className={`${FDB_TABLE.cell} font-mono`}>
                    {m.field.startsWith("fill")
                      ? fmtRate(m.current)
                      : fmtCount(m.current)}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DataTable({
  rows,
  cohort,
  mismatchNames,
}: {
  rows: EnrolledRepRow[];
  cohort: EnrolledRepViewCohort;
  mismatchNames: Set<string>;
}) {
  const showSource = cohort === "all-universities";
  const tableHeadClass = FDB_TABLE_HEAD.base;
  return (
    <div className={FDB_TABLE_SCROLL}>
      <table
        className={`w-full min-w-[880px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}
      >
        <colgroup>
          <col style={{ width: FDB_SCHOOL_NAME_COL_PX }} />
          {Array.from(
            { length: METRIC_COL_COUNT + (showSource ? 1 : 0) },
            (_, i) => (
              <col key={i} />
            ),
          )}
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-surface-2">
          <tr className="border-b border-border bg-surface-2">
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} ${FDB_TABLE.schoolNameCol} text-left`}
            >
              학교명
            </th>
            {showSource ? (
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}
              >
                구분
              </th>
            ) : null}
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}
            >
              학생정원
            </th>
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center leading-tight`}
            >
              학생모집정지인원
            </th>
            <th
              colSpan={3}
              className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}
            >
              재학생
            </th>
            <th
              colSpan={2}
              className={`${tableHeadClass} border-b border-border/50 ${FDB_TABLE.headGroup} ${FDB_TABLE_COLOR.rateGroup} text-center`}
            >
              재학생충원율
            </th>
          </tr>
          <tr className="border-b border-border bg-surface-2">
            {["계", "정원내", "정원외", "정원내", "정원내외"].map((label, i, arr) => {
              const isRate = i >= arr.length - 2;
              return (
                <th
                  key={`${label}-${i}`}
                  className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center ${
                    isRate && i === arr.length - 2
                      ? FDB_TABLE_COLOR.ratePrimary
                      : isRate
                        ? FDB_TABLE_COLOR.rateSecondary
                        : ""
                  }`}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const mismatch = mismatchNames.has(row.schoolRepName);
            const metricCell = `${FDB_TABLE.cellMetric} border-r border-border/40 text-right font-mono ${FDB_TYPO.tableMetric}`;
            return (
              <tr
                key={`${row.year}-${row.schoolRepCode}-${row.schoolDivision}-${row.schoolRepName}`}
                className={`border-b border-border/40 ${
                  mismatch
                    ? "bg-accent-orange/10"
                    : i % 2 === 0
                      ? "bg-surface"
                      : "bg-surface-2/30"
                }`}
              >
                <td
                  className={`overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE.schoolNameCol} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}
                >
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <span className="truncate">{row.schoolRepName}</span>
                    {cohort !== "graduate" && row.campusCount > 1 ? (
                      <span
                        className={`shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-normal text-accent ${FDB_TYPO.legend}`}
                      >
                        {row.campusCount}개
                      </span>
                    ) : null}
                    {(cohort === "graduate" ||
                      cohort === "combined" ||
                      cohort === "all-universities") &&
                    row.gradProgramCount > 1 ? (
                      <span
                        className={`shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-normal text-accent ${FDB_TYPO.legend}`}
                      >
                        과정 {row.gradProgramCount}
                      </span>
                    ) : null}
                    {!row.hasAlimi ? (
                      <span
                        className={`shrink-0 rounded bg-accent-orange/10 px-1.5 py-0.5 font-normal text-accent-orange ${FDB_TYPO.legend}`}
                      >
                        알리미 없음
                      </span>
                    ) : null}
                  </span>
                </td>
                {showSource ? (
                  <td
                    className={`${FDB_TABLE.cell} border-r border-border/40 text-center`}
                  >
                    {studentFillRowLabel(row.schoolDivision)}
                  </td>
                ) : null}
                <td className={metricCell}>{fmtCount(row.studentQuota)}</td>
                <td className={metricCell}>{fmtCount(row.recruitmentStop)}</td>
                <td className={metricCell}>{fmtCount(row.enrolled.total)}</td>
                <td className={metricCell}>{fmtCount(row.enrolled.within)}</td>
                <td className={metricCell}>{fmtCount(row.enrolled.outside)}</td>
                <td className={`${metricCell} ${FDB_TABLE_COLOR.ratePrimary}`}>
                  {fmtRate(row.fillRateWithin)}
                </td>
                <td className={`${metricCell} ${FDB_TABLE_COLOR.rateSecondary}`}>
                  {fmtRate(row.fillRateWithinOutside)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CohortChartDashboard({
  cohort,
  rows,
  years,
  rowsByCohort,
}: {
  cohort: EnrolledRepViewCohort;
  rows: EnrolledRepRow[];
  years: number[];
  rowsByCohort?: Record<EnrolledRepCohort, EnrolledRepRow[]>;
}) {
  const [metric, setMetric] = useState<EnrolledChartMetric>("within");
  const chartYears = useMemo(
    () => [...new Set(years)].sort((a, b) => a - b),
    [years],
  );
  const chartRows = useMemo(
    () => toRepEnrolledChartRows(rows, metric),
    [rows, metric],
  );

  if (!rows.length || chartYears.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className={CHART_TYPO.bodyText}>통계분석에 쓸 데이터가 없습니다.</p>
      </section>
    );
  }

  return (
    <CorpTransferRatioAdvancedChartDashboard
      key={`${cohort}-${metric}`}
      rows={chartRows}
      years={chartYears}
      hasData
      initialMainTab="stats"
      rateLabel={CHART_METRIC_LABELS[metric]}
      kpiSub={CHART_KPI_SUB[metric]}
      riskProfile={getEnrolledChartRiskProfile(
        metric === "withinOutside" ? "total" : "within",
      )}
      funnelProfile={getEnrolledChartFunnelProfile(
        metric === "withinOutside" ? "total" : "within",
      )}
      helpPack={ENROLLED_FILL_ADVANCED_HELP}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      statsTabHelp={INDICATOR_STATS_TAB_HELP}
      statsTabContent={({ year, estb, schoolDivision, schoolKinds }) => (
        <EnrolledIndicatorStatsPanel
          rows={rows}
          cohort={cohort}
          rowsByCohort={rowsByCohort}
          filters={{ year, estb, schoolDivision, schoolKinds }}
        />
      )}
      filterToolbarLeading={
        <ChartMetricToggle
          value={metric}
          onChange={setMetric}
          labels={CHART_METRIC_LABELS}
        />
      }
      renderHelpButton={({ active, onClick }) => (
        <GlassHelpButton tone="blue" active={active} onClick={onClick} />
      )}
    />
  );
}

export function EnrolledEnrollmentRepMockPage({
  data,
  variant = "mock",
}: {
  data: EnrolledRepMockData;
  variant?: "mock" | "production";
}) {
  const router = useRouter();
  const [, startNav] = useTransition();
  const [dbHelpOpen, setDbHelpOpen] = useState(false);
  const mismatchNames = useMemo(
    () =>
      new Set(
        (data.verify?.rows ?? [])
          .filter((row) => row.status === "mismatch")
          .map((row) => row.schoolRepName),
      ),
    [data.verify],
  );

  const hasActiveFilter = Boolean(data.filters.region || data.filters.q);

  function navigate(next: {
    year?: number | null;
    cohort?: EnrolledRepViewCohort;
    section?: "data" | "charts";
    region?: string;
    q?: string;
    resetFilters?: boolean;
  }) {
    const href = (variant === "production"
      ? buildEnrolledRepHref
      : buildEnrolledRepMockHref)({
      year: next.year ?? data.displayYear,
      cohort: next.cohort ?? data.cohort,
      section: next.section ?? data.section,
      region: next.resetFilters ? "" : (next.region ?? data.filters.region),
      q: next.resetFilters ? "" : (next.q ?? data.filters.q),
      resetFilters: next.resetFilters,
    });
    startNav(() => {
      router.push(href);
    });
  }

  return (
    <div className={FDB_PAGE_SHELL}>
      <DashboardEmeraldHeader
        sectionLabel={variant === "production" ? "재정분석" : "목업 · 미적용"}
        subtitle="분석대상 대표학교 + 대학알리미 합산"
        title="재학생충원율"
        note={RATE_NOTE[data.cohort]}
      />

      {variant === "mock" ? (
        <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
          <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
            프로덕션 업로드·본교통합은 그대로 둡니다. 이 화면은 분석대상
            대표학교코드로 대학알리미 재학생충원 원본을 합산한 목업입니다.
          </p>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            표시 연도 {data.displayYear ?? "—"}년 · 분석대상 명단{" "}
            {data.rosterYear ?? "—"}년
            {data.displayYear != null &&
            data.rosterYear != null &&
            data.displayYear !== data.rosterYear
              ? " (가장 가까운 이전 연도)"
              : ""}
            . 대학·전문대학은 표시연도 상반기·전년도 하반기 평균(한쪽만 있으면
            그 값), 대학원은 원본. 율은 그 값으로 소수 첫째 자리, 분모 0이면
            공란.
          </p>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <FinanceSectionTabRow
          active={data.section}
          onChange={(section) => navigate({ section })}
        />
        <GlassMintTabGroup
          ariaLabel="코호트"
          active={data.cohort}
          onChange={(id) => navigate({ cohort: id, resetFilters: true })}
          items={STUDENT_FILL_VIEW_TABS.map((tab) => ({
            id: tab.id,
            label: tab.label,
            count: fmtCount(data.cohortCounts[tab.id]),
          }))}
        />
        <RepDbDownButton
          variant="glass"
          href="/api/ingest/finance-analysis/enrolled-enrollment-rate/rep/export"
          download="enrolled_enrollment_rep_db.xlsx"
        />
      </div>

      {data.section === "charts" ? (
        <div className={FDB_CHARTS_SCROLL}>
          <CohortChartDashboard
            cohort={data.cohort}
            rows={data.chartRows}
            years={data.years}
            rowsByCohort={data.chartRowsByCohort}
          />
        </div>
      ) : (
        <>
          {variant === "mock" && data.verify ? (
            <VerifyBanner verify={data.verify} />
          ) : null}

          <section className="rounded-xl border border-border bg-surface px-4 py-3">
            {data.hasData && data.displayYear != null ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                <div className="flex items-center gap-2">
                  <label className={FDB_TYPO.toolbarLabel}>표시 연도</label>
                  <select
                    value={data.displayYear}
                    onChange={(e) =>
                      navigate({
                        year: Number(e.target.value),
                        resetFilters: true,
                      })
                    }
                    className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
                  >
                    {data.years.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </div>
                <FilterSelect
                  label="지역"
                  value={data.filters.region}
                  options={data.filterOptions.regions}
                  onChange={(region) => navigate({ region })}
                />
                {hasActiveFilter ? (
                  <button
                    type="button"
                    onClick={() => navigate({ resetFilters: true })}
                    className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 hover:text-foreground ${FDB_TYPO.toolbarControl} text-muted`}
                  >
                    필터 초기화
                  </button>
                ) : null}
                <SchoolNameSearchInput
                  value={data.filters.q}
                  onSearch={(q) => navigate({ q })}
                  className="ml-auto shrink-0"
                />
                <GlassHelpButton
                  size="sm"
                  active={dbHelpOpen}
                  onClick={() => setDbHelpOpen((open) => !open)}
                />
              </div>
            ) : (
              <p className={FDB_TYPO.bodyText}>
                분석대상 또는 대학알리미 재학생충원 데이터가 없습니다.
              </p>
            )}
          </section>

          {dbHelpOpen ? (
            <HelpGuidePanel
              sections={ENROLLED_REP_DB_HELP}
              onClose={() => setDbHelpOpen(false)}
              eyebrow={ENROLLED_REP_DB_HELP_TITLE}
              title="대표학교 합산 규칙"
              description={ENROLLED_REP_DB_HELP_SUB}
            />
          ) : null}

          <section className={FDB_TABLE_SECTION}>
            {!data.hasData || data.displayYear == null ? (
              <p className={FDB_TYPO.bodyText}>표시할 데이터가 없습니다.</p>
            ) : data.rows.length === 0 ? (
              <p className={FDB_TYPO.bodyText}>
                {hasActiveFilter
                  ? `선택한 조건에 맞는 대학이 없습니다. (${data.displayYear}년 · 필터 적용)`
                  : `선택한 연도(${data.displayYear}년)에 해당하는 데이터가 없습니다.`}
              </p>
            ) : (
              <DataTable
                rows={data.rows}
                cohort={data.cohort}
                mismatchNames={mismatchNames}
              />
            )}
          </section>

          {variant === "mock" && data.verify ? (
            <VerifyMismatchTable verify={data.verify} />
          ) : null}
        </>
      )}
    </div>
  );
}
