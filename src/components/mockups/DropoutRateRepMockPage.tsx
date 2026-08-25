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
import { DropoutIndicatorStatsPanel } from "@/components/analysis/IndicatorStatsTabPanels";
import { INDICATOR_STATS_TAB_HELP } from "@/lib/analysis/indicator-stats-geo";
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import {
  STUDENT_FILL_VIEW_TABS,
  studentFillRowLabel,
} from "@/lib/analysis/all-universities-cohort";
import { DROPOUT_ADVANCED_HELP } from "@/lib/analysis/dropout-rate-advanced-help";
import {
  DROPOUT_REP_DB_HELP,
  DROPOUT_REP_DB_HELP_SUB,
  DROPOUT_REP_DB_HELP_TITLE,
} from "@/lib/analysis/dropout-rate-rep-db-help";
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
import {
  toRepDropoutChartRows,
  type DropoutRepViewCohort,
  type DropoutRepCohort,
  type DropoutRepRow,
} from "@/lib/analysis/dropout-rate-rep-rollup";
import {
  buildDropoutRepHref,
  buildDropoutRepMockHref,
  type DropoutRepMockData,
} from "@/lib/analysis/dropout-rate-rep-mock-view";
import {
  DROPOUT_CHART_KPI_SUB,
  DROPOUT_CHART_METRIC_LABELS,
  getDropoutChartFunnelProfile,
  getDropoutChartRiskProfile,
  type DropoutChartMetric,
} from "@/lib/analysis/student-fill-advanced-chart-rows";

const RATE_NOTE: Record<DropoutRepViewCohort, string> = {
  university:
    "재적 중도탈락율 = 중도탈락 ÷ 재적학생 · 신입생 중도탈락율 = 신입생 중도탈락 ÷ 신입생",
  "junior-college":
    "재적 중도탈락율 = 중도탈락 ÷ 재적학생 · 신입생 중도탈락율 = 신입생 중도탈락 ÷ 신입생",
  graduate: "재적 중도탈락율 = 중도탈락 ÷ 재적학생 · 대학원은 신입생 중도탈락 없음",
  combined:
    "재적 = 대학+대학원 합산 후 율 계산 · 신입생 = 대학만(대학원 신입생 중도탈락 없음)",
  "all-universities":
    "전체대학 = 대학통합 행 + 전문대학 행 · 재적 율은 행별 재적학생을 합산 · 신입생 율은 대학통합(대학만)+전문대학 · 규모는 대학 1만/5천명, 전문대학 4천/2천명 기준을 행별로 적용",
};

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

function SchoolNameCell({
  row,
  cohort,
}: {
  row: DropoutRepRow;
  cohort: DropoutRepViewCohort;
}) {
  return (
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
  );
}

function DataTable({
  rows,
  cohort,
}: {
  rows: DropoutRepRow[];
  cohort: DropoutRepViewCohort;
}) {
  const tableHeadClass = FDB_TABLE_HEAD.base;
  const metricCell = `${FDB_TABLE.cellMetric} border-r border-border/40 text-right font-mono ${FDB_TYPO.tableMetric}`;
  const isGraduate = cohort === "graduate";
  const showSource = cohort === "all-universities";
  const metricCount = (isGraduate ? 3 : 6) + (showSource ? 1 : 0);
  const sourceHead = showSource ? (
    <th
      rowSpan={isGraduate ? 1 : 2}
      className={`${FDB_TABLE_HEAD.rowSpan} ${isGraduate ? FDB_TABLE.headSingle : FDB_TABLE.headRowSpan} text-center`}
    >
      구분
    </th>
  ) : null;

  return (
    <div className={FDB_TABLE_SCROLL}>
      <table
        className={`w-full min-w-[880px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}
      >
        <colgroup>
          <col style={{ width: FDB_SCHOOL_NAME_COL_PX }} />
          {Array.from({ length: metricCount }, (_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        {isGraduate ? (
          <thead className="sticky top-0 z-[1] bg-surface-2">
            <tr className="border-b border-border bg-surface-2">
              <th
                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headSingle} ${FDB_TABLE.schoolNameCol} text-left`}
              >
                학교명
              </th>
              {sourceHead}
              <th
                className={`${tableHeadClass} ${FDB_TABLE.headSingle} text-center`}
              >
                재적학생
              </th>
              <th
                className={`${tableHeadClass} ${FDB_TABLE.headSingle} text-center`}
              >
                중도탈락
              </th>
              <th
                className={`${tableHeadClass} ${FDB_TABLE.headSingle} ${FDB_TABLE_COLOR.ratePrimary} text-center`}
              >
                중도탈락비율
              </th>
            </tr>
          </thead>
        ) : (
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} ${FDB_TABLE.schoolNameCol} text-left`}
              >
                학교명
              </th>
              {sourceHead}
              <th
                colSpan={3}
                className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}
              >
                재적학생
              </th>
              <th
                colSpan={3}
                className={`${tableHeadClass} border-b border-border/50 ${FDB_TABLE.headGroup} ${FDB_TABLE_COLOR.rateGroup} text-center`}
              >
                신입생
              </th>
            </tr>
            <tr className="border-b border-border bg-surface-2">
              {["재적학생", "중도탈락", "중도탈락비율", "신입생", "중도탈락", "중도탈락비율"].map(
                (label, i) => {
                  const isRate = i === 2 || i === 5;
                  return (
                    <th
                      key={`${label}-${i}`}
                      className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center ${
                        isRate
                          ? i === 2
                            ? FDB_TABLE_COLOR.ratePrimary
                            : FDB_TABLE_COLOR.rateSecondary
                          : ""
                      }`}
                    >
                      {label}
                    </th>
                  );
                },
              )}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.year}-${row.schoolRepCode}-${row.schoolDivision}-${row.schoolRepName}`}
              className={`border-b border-border/40 ${
                i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
              }`}
            >
              <SchoolNameCell row={row} cohort={cohort} />
              {showSource ? (
                <td
                  className={`${FDB_TABLE.cell} border-r border-border/40 text-center`}
                >
                  {studentFillRowLabel(row.schoolDivision)}
                </td>
              ) : null}
              <td className={metricCell}>{fmtCount(row.enrolled.students)}</td>
              <td className={metricCell}>{fmtCount(row.enrolled.dropouts)}</td>
              <td className={`${metricCell} ${FDB_TABLE_COLOR.ratePrimary}`}>
                {fmtRate(row.enrolled.rate)}
              </td>
              {isGraduate ? null : (
                <>
                  <td className={metricCell}>{fmtCount(row.freshman.students)}</td>
                  <td className={metricCell}>{fmtCount(row.freshman.dropouts)}</td>
                  <td className={`${metricCell} ${FDB_TABLE_COLOR.rateSecondary}`}>
                    {fmtRate(row.freshman.rate)}
                  </td>
                </>
              )}
            </tr>
          ))}
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
  cohort: DropoutRepViewCohort;
  rows: DropoutRepRow[];
  years: number[];
  rowsByCohort?: Record<DropoutRepCohort, DropoutRepRow[]>;
}) {
  const [metric, setMetric] = useState<DropoutChartMetric>("enrolled");
  const chartYears = useMemo(
    () => [...new Set(years)].sort((a, b) => a - b),
    [years],
  );
  const activeMetric = cohort === "graduate" ? "enrolled" : metric;
  const chartRows = useMemo(
    () => toRepDropoutChartRows(rows, activeMetric),
    [rows, activeMetric],
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
      key={`${cohort}-${activeMetric}`}
      rows={chartRows}
      years={chartYears}
      hasData
      initialMainTab="stats"
      rateLabel={DROPOUT_CHART_METRIC_LABELS[activeMetric]}
      kpiSub={DROPOUT_CHART_KPI_SUB[activeMetric]}
      riskProfile={getDropoutChartRiskProfile(activeMetric)}
      funnelProfile={getDropoutChartFunnelProfile(activeMetric)}
      helpPack={DROPOUT_ADVANCED_HELP}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      statsTabHelp={INDICATOR_STATS_TAB_HELP}
      statsTabContent={({ year, estb, schoolDivision, schoolKinds }) => (
        <DropoutIndicatorStatsPanel
          rows={rows}
          cohort={cohort}
          rowsByCohort={rowsByCohort}
          filters={{ year, estb, schoolDivision, schoolKinds }}
        />
      )}
      filterToolbarLeading={
        cohort === "graduate" ? undefined : (
          <ChartMetricToggle
            value={metric}
            onChange={setMetric}
            labels={DROPOUT_CHART_METRIC_LABELS}
          />
        )
      }
      renderHelpButton={({ active, onClick }) => (
        <GlassHelpButton tone="blue" active={active} onClick={onClick} />
      )}
    />
  );
}

export function DropoutRateRepMockPage({
  data,
  variant = "mock",
}: {
  data: DropoutRepMockData;
  variant?: "mock" | "production";
}) {
  const router = useRouter();
  const [, startNav] = useTransition();
  const [dbHelpOpen, setDbHelpOpen] = useState(false);
  const hasActiveFilter = Boolean(data.filters.region || data.filters.q);

  function navigate(next: {
    year?: number | null;
    cohort?: DropoutRepViewCohort;
    section?: "data" | "charts";
    region?: string;
    q?: string;
    resetFilters?: boolean;
  }) {
    const href = (variant === "production"
      ? buildDropoutRepHref
      : buildDropoutRepMockHref)({
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
        title="중도탈락율"
        note={RATE_NOTE[data.cohort]}
      />

      {variant === "mock" ? (
        <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
          <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
            프로덕션 업로드·본교통합은 그대로 둡니다. 이 화면은 분석대상
            대표학교코드로 대학알리미 중도탈락 원본을 합산한 목업입니다.
          </p>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            표시 연도 {data.displayYear ?? "—"}년 · 분석대상 명단{" "}
            {data.rosterYear ?? "—"}년
            {data.displayYear != null &&
            data.rosterYear != null &&
            data.displayYear !== data.rosterYear
              ? " (가장 가까운 이전 연도)"
              : ""}
            . 율은 소수 첫째 자리, 분모 0이면 공란.
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
          href="/api/ingest/finance-analysis/dropout-rate/rep/export"
          download="dropout_rate_rep_db.xlsx"
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
                분석대상 또는 대학알리미 중도탈락 데이터가 없습니다.
              </p>
            )}
          </section>

          {dbHelpOpen ? (
            <HelpGuidePanel
              sections={DROPOUT_REP_DB_HELP}
              onClose={() => setDbHelpOpen(false)}
              eyebrow={DROPOUT_REP_DB_HELP_TITLE}
              title="대표학교 합산 규칙"
              description={DROPOUT_REP_DB_HELP_SUB}
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
              <DataTable rows={data.rows} cohort={data.cohort} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
