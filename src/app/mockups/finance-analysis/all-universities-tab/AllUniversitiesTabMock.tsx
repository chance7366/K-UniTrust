"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import { CorpTransferRatioChartDashboard } from "@/components/analysis/CorpTransferRatioChartDashboard";
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { FinancialSupportBenefitRateChartDashboard } from "@/components/analysis/FinancialSupportBenefitRateChartDashboard";
import { FundSecureRateChartDashboard } from "@/components/analysis/FundSecureRateChartDashboard";
import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import {
  FinanceSectionTabRow,
  GlassMintTabGroup,
} from "@/components/analysis/GlassMintTabGroup";
import { IncomePropertySecureRateChartDashboard } from "@/components/analysis/IncomePropertySecureRateChartDashboard";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { TuitionDependencyRateChartDashboard } from "@/components/analysis/TuitionDependencyRateChartDashboard";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import {
  FDB_CHARTS_SCROLL,
  FDB_PAGE_SHELL,
  FDB_SCHOOL_NAME_COL_PX,
  FDB_TABLE,
  FDB_TABLE_HEAD,
  FDB_TABLE_SCROLL,
  FDB_TABLE_SECTION,
} from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FRESHMAN_FILL_ADVANCED_HELP } from "@/lib/analysis/freshman-enrollment-advanced-help";
import {
  FRESHMAN_CHART_KPI_SUB,
  FRESHMAN_CHART_METRIC_LABELS,
  getFreshmanChartFunnelProfile,
  getFreshmanChartRiskProfile,
  toFreshmanAdvancedChartRows,
  type FreshmanChartMetric,
} from "@/lib/analysis/student-fill-advanced-chart-rows";

import { ALL_UNIV_METRICS } from "./types";
import type { AllUnivMockPayload } from "./load-payload";

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

function hrefFrom(payload: AllUnivMockPayload, next: Partial<{
  metric: string;
  section: "data" | "charts";
  cohort: string;
  year: number | null;
  region: string;
  q: string;
  resetFilters: boolean;
}>): string {
  const params = new URLSearchParams();
  const metric = next.metric ?? payload.metric;
  params.set("metric", metric);
  const section = next.section ?? payload.section;
  if (section === "charts") params.set("section", "charts");
  let cohort = next.cohort ?? payload.cohort;
  if (metric !== "freshman-enrollment-rate" && (cohort === "graduate" || cohort === "combined")) {
    cohort = "university";
  }
  if (cohort && cohort !== "university") params.set("cohort", cohort);
  const year = next.year !== undefined ? next.year : payload.year;
  if (year != null) params.set("year", String(year));
  const reset = next.resetFilters;
  const region = reset ? "" : (next.region ?? payload.region);
  const q = reset ? "" : (next.q ?? payload.q);
  if (region) params.set("region", region);
  if (q) params.set("q", q);
  return `/mockups/finance-analysis/all-universities-tab?${params.toString()}`;
}

export function AllUniversitiesTabMock({ data }: { data: AllUnivMockPayload }) {
  const router = useRouter();
  const [, startNav] = useTransition();
  const [metricToggle, setMetricToggle] = useState<FreshmanChartMetric>("within");

  const hasActiveFilter = Boolean(data.region || data.q);
  const isFreshman = data.metric === "freshman-enrollment-rate";
  const showRecruit = data.freshmanRows.some((row) => row.showRecruit);

  function navigate(next: Parameters<typeof hrefFrom>[1]) {
    startNav(() => {
      router.push(hrefFrom(data, next));
    });
  }

  const chartYears = useMemo(
    () => [...new Set(data.years)].sort((a, b) => a - b),
    [data.years],
  );

  const freshmanChartRows = useMemo(
    () => toFreshmanAdvancedChartRows(data.freshmanChartRows, metricToggle),
    [data.freshmanChartRows, metricToggle],
  );

  const kpiSub =
    data.cohort === "all-universities"
      ? metricToggle === "within"
        ? "대학통합·전문대학 각 분모 규칙을 유지한 뒤 Σ입학자(정원내) ÷ Σ분모"
        : "대학통합·전문대학 각 분모 규칙을 유지한 뒤 Σ입학자(계) ÷ Σ분모"
      : data.cohort === "combined"
        ? metricToggle === "within"
          ? "Σ입학자(정원내) ÷ (Σ대학 모집 정원내 + Σ대학원 입학정원)"
          : "Σ입학자(계) ÷ (Σ대학 모집 계 + Σ대학원 입학정원)"
        : data.cohort === "graduate"
          ? metricToggle === "within"
            ? "Σ입학자(정원내) ÷ Σ입학정원"
            : "Σ입학자(계) ÷ Σ입학정원"
          : FRESHMAN_CHART_KPI_SUB[metricToggle];

  return (
    <div className={`${FDB_PAGE_SHELL} min-h-screen bg-[var(--surface,#f4f7f5)] p-6`}>
      <DashboardEmeraldHeader
        sectionLabel="목업 · 미적용"
        title="전체대학 탭"
        subtitle="학생충원 · 대학재정 · 법인재정"
        note="프로덕션 화면은 바꾸지 않았습니다. 탭 순서와 합산 방식만 미리 보는 목업입니다."
      />

      <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
        <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
          신입생충원율은 대학 → 대학원 → 대학통합 → 전문대학 → 전체대학 순입니다.
          전체대학은 대학통합 + 전문대학입니다. 재정지표는 대학 → 전문대학 → 전체대학입니다.
        </p>
        <p className={`mt-1 ${FDB_TYPO.legend}`}>
          학교규모(대·중·소)는 대학 10,000/5,000명, 전문대학 4,000/2,000명 기준을 행별로 적용합니다.
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <p className={FDB_TYPO.toolbarLabel}>지표</p>
        <div className="flex flex-wrap gap-2">
          {ALL_UNIV_METRICS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm ${
                data.metric === item.id
                  ? "border-transparent bg-[#0f6b4c] text-white"
                  : "border-border bg-surface text-foreground hover:bg-surface-2"
              }`}
              onClick={() =>
                navigate({
                  metric: item.id,
                  cohort: "university",
                  resetFilters: true,
                })
              }
            >
              <span className="opacity-70">{item.group}</span>
              {" · "}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <DashboardEmeraldHeader
        sectionLabel="재정분석지표"
        title={data.title}
        subtitle={data.subtitle}
        note={data.note}
      />

      <div className="flex flex-wrap items-center gap-2">
        <FinanceSectionTabRow
          active={data.section}
          onChange={(section) => navigate({ section })}
        />
        <GlassMintTabGroup
          ariaLabel="코호트"
          active={data.cohort}
          onChange={(id) => navigate({ cohort: id, resetFilters: true })}
          items={data.cohortItems}
        />
      </div>

      {data.section === "charts" ? (
        <div className={FDB_CHARTS_SCROLL}>
          {isFreshman ? (
            data.freshmanChartRows.length === 0 || chartYears.length === 0 ? (
              <section className="rounded-xl border border-border bg-surface p-8 text-center">
                <p className={CHART_TYPO.bodyText}>통계분석에 쓸 데이터가 없습니다.</p>
              </section>
            ) : (
              <CorpTransferRatioAdvancedChartDashboard
                key={`${data.cohort}-${metricToggle}`}
                rows={freshmanChartRows}
                years={chartYears}
                hasData
                rateLabel={FRESHMAN_CHART_METRIC_LABELS[metricToggle]}
                kpiSub={kpiSub}
                riskProfile={getFreshmanChartRiskProfile(metricToggle)}
                funnelProfile={getFreshmanChartFunnelProfile(metricToggle)}
                helpPack={FRESHMAN_FILL_ADVANCED_HELP}
                geoChartsLayout="split"
                distributionTabLayout="density-v2"
                filterToolbarLeading={
                  <ChartMetricToggle
                    value={metricToggle}
                    onChange={setMetricToggle}
                    labels={FRESHMAN_CHART_METRIC_LABELS}
                  />
                }
                renderHelpButton={({ active, onClick }) => (
                  <GlassHelpButton tone="blue" active={active} onClick={onClick} />
                )}
              />
            )
          ) : data.metric === "tuition-dependency-rate" ? (
            <TuitionDependencyRateChartDashboard
              rows={data.tuitionChartRows}
              years={chartYears}
              hasData={data.tuitionChartRows.length > 0}
            />
          ) : data.metric === "financial-support-benefit-rate" ? (
            <FinancialSupportBenefitRateChartDashboard
              rows={data.finSupportChartRows}
              years={chartYears}
              hasData={data.finSupportChartRows.length > 0}
            />
          ) : data.metric === "corp-transfer-ratio" ? (
            <CorpTransferRatioChartDashboard
              rows={data.corpChartRows}
              years={chartYears}
              hasData={data.corpChartRows.length > 0}
            />
          ) : data.metric === "income-property-secure-rate" ? (
            <IncomePropertySecureRateChartDashboard
              rows={data.incomeChartRows}
              years={chartYears}
              hasData={data.incomeChartRows.length > 0}
            />
          ) : (
            <FundSecureRateChartDashboard
              rows={data.fundChartRows}
              years={chartYears}
              hasData={data.fundChartRows.length > 0}
            />
          )}
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-surface px-4 py-3">
            {data.hasData && data.year != null ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                <div className="flex items-center gap-2">
                  <label className={FDB_TYPO.toolbarLabel}>표시 연도</label>
                  <select
                    value={data.year}
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
                <div className="flex items-center gap-2">
                  <label className={FDB_TYPO.toolbarLabel}>지역</label>
                  <select
                    value={data.region}
                    onChange={(e) => navigate({ region: e.target.value })}
                    className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
                  >
                    <option value="">전체</option>
                    {data.regions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
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
                  value={data.q}
                  onSearch={(nextQ) => navigate({ q: nextQ })}
                  className="ml-auto shrink-0"
                />
              </div>
            ) : (
              <p className={FDB_TYPO.bodyText}>표시할 데이터가 없습니다.</p>
            )}
          </section>

          <section className={FDB_TABLE_SECTION}>
            {isFreshman ? (
              data.freshmanRows.length === 0 ? (
                <p className={FDB_TYPO.bodyText}>선택한 조건에 맞는 대학이 없습니다.</p>
              ) : (
                <FreshmanTable rows={data.freshmanRows} showRecruit={showRecruit} showSource={data.cohort === "all-universities"} />
              )
            ) : data.financeRows.length === 0 ? (
              <p className={FDB_TYPO.bodyText}>선택한 조건에 맞는 대학이 없습니다.</p>
            ) : (
              <FinanceTable
                rows={data.financeRows}
                rateLabel={data.rateLabel}
                showSource={data.cohort === "all-universities"}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function FreshmanTable({
  rows,
  showRecruit,
  showSource,
}: {
  rows: AllUnivMockPayload["freshmanRows"];
  showRecruit: boolean;
  showSource: boolean;
}) {
  const tableHeadClass = FDB_TABLE_HEAD.base;
  const extra = (showSource ? 1 : 0) + (showRecruit ? 3 : 0);
  const metricColCount = 1 + extra + 3 + 2;

  return (
    <div className={FDB_TABLE_SCROLL}>
      <table className={`w-full min-w-[880px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}>
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
            const metricCell = `${FDB_TABLE.cellMetric} border-r border-border/40 text-right font-mono ${FDB_TYPO.tableMetric}`;
            return (
              <tr
                key={`${row.sourceLabel}-${row.year}-${row.schoolRepCode}`}
                className={`border-b border-border/40 ${i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"}`}
              >
                <td
                  className={`overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE.schoolNameCol} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}
                >
                  <span className="truncate">{row.schoolRepName}</span>
                </td>
                {showSource ? (
                  <td className={`${FDB_TABLE.cell} border-r border-border/40 text-center`}>
                    {row.sourceLabel}
                  </td>
                ) : null}
                <td className={metricCell}>{fmtCount(row.admissionQuota)}</td>
                {showRecruit ? (
                  <>
                    <td className={metricCell}>{fmtCount(row.recruitTotal)}</td>
                    <td className={metricCell}>{fmtCount(row.recruitWithin)}</td>
                    <td className={metricCell}>{fmtCount(row.recruitOutside)}</td>
                  </>
                ) : null}
                <td className={metricCell}>{fmtCount(row.enrolledTotal)}</td>
                <td className={metricCell}>{fmtCount(row.enrolledWithin)}</td>
                <td className={metricCell}>{fmtCount(row.enrolledOutside)}</td>
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

function FinanceTable({
  rows,
  rateLabel,
  showSource,
}: {
  rows: AllUnivMockPayload["financeRows"];
  rateLabel: string;
  showSource: boolean;
}) {
  return (
    <div className={FDB_TABLE_SCROLL}>
      <table className={`w-full min-w-[640px] border-collapse ${FDB_TYPO.tableBody}`}>
        <thead className="sticky top-0 z-[1] bg-surface-2">
          <tr className="border-b border-border">
            {["학교명", ...(showSource ? ["구분"] : []), "지역", rateLabel].map((h) => (
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
          {rows.map((row, i) => (
            <tr
              key={`${row.sourceLabel}-${row.schoolRepCode}`}
              className={`border-b border-border/40 ${i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"}`}
            >
              <td className={`${FDB_TABLE.cell} ${FDB_TABLE_COLOR.schoolName}`}>
                {row.schoolRepName}
              </td>
              {showSource ? (
                <td className={FDB_TABLE.cell}>{row.sourceLabel}</td>
              ) : null}
              <td className={FDB_TABLE.cell}>{row.region}</td>
              <td className={`${FDB_TABLE.cell} font-mono ${FDB_TABLE_COLOR.ratePrimary}`}>
                {fmtRate(row.rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
