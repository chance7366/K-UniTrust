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
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import {
  FRESHMAN_REP_DB_HELP,
  FRESHMAN_REP_DB_HELP_SUB,
  FRESHMAN_REP_DB_HELP_TITLE,
} from "@/lib/analysis/freshman-enrollment-rep-db-help";
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
import { FRESHMAN_FILL_ADVANCED_HELP } from "@/lib/analysis/freshman-enrollment-advanced-help";
import {
  FRESHMAN_REP_COHORT_LABEL,
  toRepFreshmanEnrollmentRows,
  type FreshmanRepCohort,
  type FreshmanRepCompareField,
  type FreshmanRepRow,
  type FreshmanRepVerifySummary,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import {
  buildFreshmanRepHref,
  buildFreshmanRepMockHref,
  type FreshmanRepMockData,
} from "@/lib/analysis/freshman-enrollment-rep-mock-view";
import {
  FRESHMAN_CHART_KPI_SUB,
  FRESHMAN_CHART_METRIC_LABELS,
  getFreshmanChartFunnelProfile,
  getFreshmanChartRiskProfile,
  toFreshmanAdvancedChartRows,
  type FreshmanChartMetric,
} from "@/lib/analysis/student-fill-advanced-chart-rows";

const COHORTS: FreshmanRepCohort[] = [
  "university",
  "graduate",
  "combined",
  "junior-college",
];

const COMBINED_KPI_SUB: Record<FreshmanChartMetric, string> = {
  within: "Σ입학자(정원내) ÷ (Σ대학 모집 정원내 + Σ대학원 입학정원)",
  withinOutside: "Σ입학자(계) ÷ (Σ대학 모집 계 + Σ대학원 입학정원)",
};

const GRADUATE_KPI_SUB: Record<FreshmanChartMetric, string> = {
  within: "Σ입학자(정원내) ÷ Σ입학정원",
  withinOutside: "Σ입학자(계) ÷ Σ입학정원",
};

const FIELD_LABEL: Record<FreshmanRepCompareField, string> = {
  admissionQuota: "입학정원",
  recruitTotal: "모집인원 계",
  recruitWithin: "모집인원 정원내",
  recruitOutside: "모집인원 정원외",
  enrolledTotal: "입학자 계",
  enrolledWithin: "입학자 정원내",
  enrolledOutside: "입학자 정원외",
  fillRateWithin: "정원내 충원율",
  fillRateWithinOutside: "정원내외 충원율",
};

const RATE_NOTE: Record<FreshmanRepCohort, string> = {
  university:
    "정원내 = 입학자 정원내 ÷ 모집인원 정원내 · 정원내외 = 입학자 계 ÷ 모집인원 계",
  "junior-college":
    "정원내 = 입학자 정원내 ÷ 모집인원 정원내 · 정원내외 = 입학자 계 ÷ 모집인원 계",
  graduate:
    "모집인원 없음 · 정원내 = 입학자 정원내 ÷ 입학정원 · 정원내외 = 입학자 계 ÷ 입학정원",
  combined:
    "입학정원=대학+대학원 · 모집인원=대학전문만 · 입학자=대학+대학원 · 정원내 = 합산 입학자 정원내 ÷ (대학 모집 정원내 + 대학원 입학정원) · 정원내외 = 합산 입학자 계 ÷ (대학 모집 계 + 대학원 입학정원)",
};

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR");
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

function VerifyBanner({ verify }: { verify: FreshmanRepVerifySummary }) {
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

function VerifyMismatchTable({ verify }: { verify: FreshmanRepVerifySummary }) {
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
  rows: FreshmanRepRow[];
  cohort: FreshmanRepCohort;
  mismatchNames: Set<string>;
}) {
  const showRecruit = cohort !== "graduate";
  const tableHeadClass = FDB_TABLE_HEAD.base;
  const metricColCount = showRecruit ? 9 : 6;
  return (
    <div className={FDB_TABLE_SCROLL}>
      <table
        className={`w-full min-w-[880px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}
      >
        <colgroup>
          <col style={{ width: FDB_SCHOOL_NAME_COL_PX }} />
          {Array.from({ length: metricColCount }, (_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-[1] bg-surface-2">
          <tr className="border-b border-border bg-surface-2">
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} ${FDB_TABLE.schoolNameCol} text-left`}
            >
              학교명
            </th>
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}
            >
              입학정원
            </th>
            {showRecruit ? (
              <th
                colSpan={3}
                className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}
              >
                모집인원
              </th>
            ) : null}
            <th
              colSpan={3}
              className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}
            >
              입학자
            </th>
            <th
              colSpan={2}
              className={`${tableHeadClass} border-b border-border/50 ${FDB_TABLE.headGroup} ${FDB_TABLE_COLOR.rateGroup} text-center`}
            >
              신입생충원율
            </th>
          </tr>
          <tr className="border-b border-border bg-surface-2">
            {(showRecruit
              ? ["계", "정원내", "정원외", "계", "정원내", "정원외", "정원내", "정원내외"]
              : ["계", "정원내", "정원외", "정원내", "정원내외"]
            ).map((label, i, arr) => {
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
                key={`${row.year}-${row.schoolRepCode}-${row.schoolRepName}`}
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
                    {(cohort === "graduate" || cohort === "combined") &&
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
                <td className={metricCell}>{fmtCount(row.admissionQuota)}</td>
                {showRecruit ? (
                  <>
                    <td className={metricCell}>{fmtCount(row.recruit.total)}</td>
                    <td className={metricCell}>{fmtCount(row.recruit.within)}</td>
                    <td className={metricCell}>{fmtCount(row.recruit.outside)}</td>
                  </>
                ) : null}
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
}: {
  cohort: FreshmanRepCohort;
  rows: FreshmanRepRow[];
  years: number[];
}) {
  const [metric, setMetric] = useState<FreshmanChartMetric>("within");
  const chartYears = useMemo(
    () => [...new Set(years)].sort((a, b) => a - b),
    [years],
  );
  const chartRows = useMemo(
    () =>
      toFreshmanAdvancedChartRows(
        toRepFreshmanEnrollmentRows(rows, cohort),
        metric,
      ),
    [rows, cohort, metric],
  );
  const kpiSub =
    cohort === "combined"
      ? COMBINED_KPI_SUB[metric]
      : cohort === "graduate"
        ? GRADUATE_KPI_SUB[metric]
        : FRESHMAN_CHART_KPI_SUB[metric];

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
      rateLabel={FRESHMAN_CHART_METRIC_LABELS[metric]}
      kpiSub={kpiSub}
      riskProfile={getFreshmanChartRiskProfile(metric)}
      funnelProfile={getFreshmanChartFunnelProfile(metric)}
      helpPack={FRESHMAN_FILL_ADVANCED_HELP}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      filterToolbarLeading={
        <ChartMetricToggle
          value={metric}
          onChange={setMetric}
          labels={FRESHMAN_CHART_METRIC_LABELS}
        />
      }
      renderHelpButton={({ active, onClick }) => (
        <GlassHelpButton tone="blue" active={active} onClick={onClick} />
      )}
    />
  );
}

export function FreshmanEnrollmentRepMockPage({
  data,
  variant = "mock",
}: {
  data: FreshmanRepMockData;
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
    cohort?: FreshmanRepCohort;
    section?: "data" | "charts";
    region?: string;
    q?: string;
    resetFilters?: boolean;
  }) {
    const href = (variant === "production"
      ? buildFreshmanRepHref
      : buildFreshmanRepMockHref)({
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
        title="신입생충원율"
        note={RATE_NOTE[data.cohort]}
      />

      {variant === "mock" ? (
        <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
          <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
            프로덕션 업로드·본교통합은 그대로 둡니다. 이 화면은 분석대상
            대표학교코드로 대학알리미 원본을 합산한 목업입니다.
          </p>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            표시 연도 {data.displayYear ?? "—"}년 · 분석대상 명단{" "}
            {data.rosterYear ?? "—"}년
            {data.displayYear != null &&
            data.rosterYear != null &&
            data.displayYear !== data.rosterYear
              ? " (가장 가까운 이전 연도)"
              : ""}
            . 율은 소수 첫째 자리, 분모 0이면 공란. 통계분석 탭은 현행
            재정분석지표 신입생충원율과 같은 지역·권역 격차, 분포·위험군,
            권역·규모 시계열을 코호트별로 보여 줍니다.
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
          items={COHORTS.map((id) => ({
            id,
            label: FRESHMAN_REP_COHORT_LABEL[id],
            count: fmtCount(data.cohortCounts[id]),
          }))}
        />
        <RepDbDownButton
          variant="glass"
          href="/api/ingest/finance-analysis/freshman-enrollment-rate/rep/export"
          download="freshman_enrollment_rep_db.xlsx"
        />
      </div>

      {data.section === "charts" ? (
        <div className={FDB_CHARTS_SCROLL}>
          <CohortChartDashboard
            cohort={data.cohort}
            rows={data.chartRows}
            years={data.years}
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
            분석대상 또는 대학알리미 신입생충원 데이터가 없습니다.
          </p>
        )}
      </section>

      {dbHelpOpen ? (
        <HelpGuidePanel
          sections={FRESHMAN_REP_DB_HELP}
          onClose={() => setDbHelpOpen(false)}
          eyebrow={FRESHMAN_REP_DB_HELP_TITLE}
          title="대표학교 합산 규칙"
          description={FRESHMAN_REP_DB_HELP_SUB}
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
