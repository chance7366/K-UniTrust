"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import {
  FinanceSectionTabRow,
  GlassMintTabGroup,
} from "@/components/analysis/GlassMintTabGroup";
import { RepDbDownButton } from "@/components/analysis/RepDbDownButton";
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { CorpTransferRatioChartDashboard } from "@/components/analysis/CorpTransferRatioChartDashboard";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import {
  CORP_TRANSFER_REP_DB_HELP,
  CORP_TRANSFER_REP_DB_HELP_SUB,
  CORP_TRANSFER_REP_DB_HELP_TITLE,
} from "@/lib/analysis/corp-transfer-ratio-rep-db-help";
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
  CORP_TRANSFER_REP_COHORT_LABEL,
  toCorpTransferRatioRows,
  type CorpTransferRepCohort,
  type CorpTransferRepRow,
} from "@/lib/analysis/corp-transfer-ratio-rep-rollup";
import {
  buildCorpTransferRepHref,
  buildCorpTransferRepMockHref,
  type CorpTransferRepMockData,
} from "@/lib/analysis/corp-transfer-ratio-rep-mock-view";

const COHORTS: CorpTransferRepCohort[] = ["university", "junior-college"];

const RATE_NOTE =
  "전입금합계 = 경상비 + 법정부담 + 자산 · 전입금비율 = 전입금합계 ÷ 등록금수입";

const METRIC_COL_COUNT = 6;

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function toMillionWon(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n / 1000);
}

function fmtMillionWon(n: number | null | undefined): string {
  const v = toMillionWon(n);
  if (v == null) return "—";
  return v.toLocaleString("ko-KR");
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

function DataTable({ rows }: { rows: CorpTransferRepRow[] }) {
  const tableHeadClass = FDB_TABLE_HEAD.base;
  const metricCell = `${FDB_TABLE.cellMetric} border-r border-border/40 text-right font-mono ${FDB_TYPO.tableMetric}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 justify-end">
        <span className={FDB_TYPO.legend}>(단위 : 백만원)</span>
      </div>
      <div className={FDB_TABLE_SCROLL}>
        <table
          className={`w-full min-w-[880px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}
        >
          <colgroup>
            <col style={{ width: FDB_SCHOOL_NAME_COL_PX }} />
            {Array.from({ length: METRIC_COL_COUNT }, (_, i) => (
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
                colSpan={4}
                className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}
              >
                전입금
              </th>
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}
              >
                등록금수입
              </th>
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} ${FDB_TABLE_COLOR.ratePrimary} text-center`}
              >
                전입금비율
              </th>
            </tr>
            <tr className="border-b border-border bg-surface-2">
              {["경상비", "법정부담", "자산", "전입금합계"].map((label) => (
                <th
                  key={label}
                  className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.year}-${row.schoolRepCode}-${row.schoolRepName}`}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
              >
                <td
                  className={`overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE.schoolNameCol} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}
                >
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <span className="truncate">{row.schoolRepName}</span>
                    {row.campusCount > 1 ? (
                      <span
                        className={`shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-normal text-accent ${FDB_TYPO.legend}`}
                      >
                        {row.campusCount}개
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
                <td className={metricCell}>
                  {fmtMillionWon(row.ordinaryExpenseTransfer)}
                </td>
                <td className={metricCell}>
                  {fmtMillionWon(row.legalObligationTransfer)}
                </td>
                <td className={metricCell}>
                  {fmtMillionWon(row.assetTransfer)}
                </td>
                <td className={metricCell}>
                  {fmtMillionWon(row.totalTransfer)}
                </td>
                <td className={metricCell}>
                  {fmtMillionWon(row.tuitionRevenue)}
                </td>
                <td className={`${metricCell} ${FDB_TABLE_COLOR.ratePrimary}`}>
                  {fmtRate(row.transferRatio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CorpTransferRatioRepMockPage({
  data,
  variant = "mock",
}: {
  data: CorpTransferRepMockData;
  variant?: "mock" | "production";
}) {
  const router = useRouter();
  const [, startNav] = useTransition();
  const [dbHelpOpen, setDbHelpOpen] = useState(false);
  const hasActiveFilter = Boolean(data.filters.region || data.filters.q);

  function navigate(next: {
    year?: number | null;
    cohort?: CorpTransferRepCohort;
    section?: "data" | "charts";
    region?: string;
    q?: string;
    resetFilters?: boolean;
  }) {
    const href = (variant === "production"
      ? buildCorpTransferRepHref
      : buildCorpTransferRepMockHref)({
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
        subtitle="분석대상 대표학교 + 재정알리미 합산"
        title="법인전입금비율"
        note={RATE_NOTE}
      />

      {variant === "mock" ? (
        <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
          <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
            프로덕션 업로드·본교통합은 그대로 둡니다. 이 화면은 분석대상
            대표학교코드로 재정알리미 교비자금(수입) 원본을 합산한 목업입니다.
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
          items={COHORTS.map((id) => ({
            id,
            label: CORP_TRANSFER_REP_COHORT_LABEL[id],
            count: fmtCount(data.cohortCounts[id]),
          }))}
        />
        <RepDbDownButton
          variant="glass"
          href="/api/ingest/finance-analysis/corp-transfer-ratio/rep/export"
          download="corp_transfer_ratio_rep_db.xlsx"
        />
      </div>

      {data.section === "charts" ? (
        <div className={FDB_CHARTS_SCROLL}>
          <CorpTransferRatioChartDashboard
            rows={toCorpTransferRatioRows(data.chartRows)}
            years={data.years}
            hasData={data.chartRows.length > 0}
            renderHelpButton={({ active, onClick }) => (
              <GlassHelpButton tone="blue" active={active} onClick={onClick} />
            )}
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
                분석대상 또는 재정알리미 교비자금 데이터가 없습니다.
              </p>
            )}
          </section>

          {dbHelpOpen ? (
            <HelpGuidePanel
              sections={CORP_TRANSFER_REP_DB_HELP}
              onClose={() => setDbHelpOpen(false)}
              eyebrow={CORP_TRANSFER_REP_DB_HELP_TITLE}
              title="대표학교 합산 규칙"
              description={CORP_TRANSFER_REP_DB_HELP_SUB}
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
              <DataTable rows={data.rows} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
