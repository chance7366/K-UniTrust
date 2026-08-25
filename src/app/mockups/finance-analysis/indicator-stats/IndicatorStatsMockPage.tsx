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
import {
  CorpTransferIndicatorStatsPanel,
  DropoutIndicatorStatsPanel,
  EnrolledIndicatorStatsPanel,
  FinSupportIndicatorStatsPanel,
  FreshmanIndicatorStatsPanel,
  FundSecureIndicatorStatsPanel,
  IncomePropertyIndicatorStatsPanel,
  TuitionDepIndicatorStatsPanel,
} from "@/components/analysis/IndicatorStatsTabPanels";
import { TuitionDependencyRateChartDashboard } from "@/components/analysis/TuitionDependencyRateChartDashboard";
import { DROPOUT_ADVANCED_HELP } from "@/lib/analysis/dropout-rate-advanced-help";
import { ENROLLED_FILL_ADVANCED_HELP } from "@/lib/analysis/enrolled-enrollment-advanced-help";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import {
  FINANCE_ANALYSIS_MENU_GROUPS,
  type FinanceAnalysisTab,
} from "@/lib/analysis/finance-analysis-tabs";
import {
  FDB_CHARTS_SCROLL,
  FDB_PAGE_SHELL,
} from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FRESHMAN_FILL_ADVANCED_HELP } from "@/lib/analysis/freshman-enrollment-advanced-help";
import {
  TWO_SCHOOL_VIEW_TABS,
  twoSchoolViewTabCount,
  STUDENT_FILL_VIEW_TABS,
} from "@/lib/analysis/all-universities-cohort";
import { toCorpTransferRatioRows } from "@/lib/analysis/corp-transfer-ratio-rep-rollup";
import { toRepDropoutChartRows } from "@/lib/analysis/dropout-rate-rep-rollup";
import { toRepEnrolledChartRows } from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import { toFinancialSupportBenefitRateRows } from "@/lib/analysis/financial-support-benefit-rate-rep-rollup";
import { toRepFreshmanEnrollmentRowsForView } from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { toFundSecureRateRows } from "@/lib/analysis/fund-secure-rate-rep-rollup";
import { toIncomePropertyDisplayRows } from "@/lib/analysis/income-property-secure-rate-rep-rollup";
import { INDICATOR_STATS_TAB_HELP } from "@/lib/analysis/indicator-stats-geo";
import {
  DROPOUT_CHART_KPI_SUB,
  DROPOUT_CHART_METRIC_LABELS,
  FRESHMAN_CHART_KPI_SUB,
  FRESHMAN_CHART_METRIC_LABELS,
  getDropoutChartFunnelProfile,
  getDropoutChartRiskProfile,
  getEnrolledChartFunnelProfile,
  getEnrolledChartRiskProfile,
  getFreshmanChartFunnelProfile,
  getFreshmanChartRiskProfile,
  toFreshmanAdvancedChartRows,
  type DropoutChartMetric,
  type FreshmanChartMetric,
} from "@/lib/analysis/student-fill-advanced-chart-rows";
import { toTuitionDependencyRateRows } from "@/lib/analysis/tuition-dependency-rate-rep-rollup";

import type { IndicatorStatsMockPayload } from "./types";

const COMBINED_KPI_SUB: Record<FreshmanChartMetric, string> = {
  within: "Σ입학자(정원내) ÷ (Σ대학 모집 정원내 + Σ대학원 입학정원)",
  withinOutside: "Σ입학자(계) ÷ (Σ대학 모집 계 + Σ대학원 입학정원)",
};

const GRADUATE_KPI_SUB: Record<FreshmanChartMetric, string> = {
  within: "Σ입학자(정원내) ÷ Σ입학정원",
  withinOutside: "Σ입학자(계) ÷ Σ입학정원",
};

type EnrolledChartMetric = "within" | "withinOutside";

const ENROLLED_METRIC_LABELS: Record<EnrolledChartMetric, string> = {
  within: "정원내 재학생충원율",
  withinOutside: "정원내외 재학생충원율",
};

const ENROLLED_KPI_SUB: Record<EnrolledChartMetric, string> = {
  within: "Σ재학생(정원내) ÷ Σ(학생정원−모집정지)",
  withinOutside: "Σ재학생(계) ÷ Σ(학생정원−모집정지)",
};

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function buildMockHref(args: {
  tab: FinanceAnalysisTab["id"];
  year?: number | null;
  cohort?: string;
  resetFilters?: boolean;
}): string {
  const params = new URLSearchParams();
  params.set("tab", args.tab);
  params.set("section", "charts");
  if (args.year != null) params.set("year", String(args.year));
  if (args.cohort && args.cohort !== "university") {
    params.set("cohort", args.cohort);
  }
  return `/mockups/finance-analysis/indicator-stats?${params.toString()}`;
}

function FreshmanChart({ payload }: { payload: Extract<IndicatorStatsMockPayload, { tab: "freshman-enrollment-rate" }> }) {
  const data = payload.freshman;
  const { cohort, chartRows: rows, years } = data;
  const [metric, setMetric] = useState<FreshmanChartMetric>("within");
  const chartYears = useMemo(
    () => [...new Set(years)].sort((a, b) => a - b),
    [years],
  );
  const chartRows = useMemo(
    () =>
      toFreshmanAdvancedChartRows(
        toRepFreshmanEnrollmentRowsForView(rows, cohort),
        metric,
      ),
    [rows, cohort, metric],
  );
  const kpiSub =
    cohort === "all-universities"
      ? metric === "within"
        ? "대학통합·전문대학 각 분모 규칙을 유지한 뒤 Σ입학자(정원내) ÷ Σ분모"
        : "대학통합·전문대학 각 분모 규칙을 유지한 뒤 Σ입학자(계) ÷ Σ분모"
      : cohort === "combined"
        ? COMBINED_KPI_SUB[metric]
        : cohort === "graduate"
          ? GRADUATE_KPI_SUB[metric]
          : FRESHMAN_CHART_KPI_SUB[metric];
  if (!rows.length || chartYears.length === 0) {
    return <EmptyCharts />;
  }
  return (
    <CorpTransferRatioAdvancedChartDashboard
      key={`${cohort}-${metric}`}
      rows={chartRows}
      years={chartYears}
      hasData
      initialMainTab="stats"
      rateLabel={FRESHMAN_CHART_METRIC_LABELS[metric]}
      kpiSub={kpiSub}
      riskProfile={getFreshmanChartRiskProfile(metric)}
      funnelProfile={getFreshmanChartFunnelProfile(metric)}
      helpPack={FRESHMAN_FILL_ADVANCED_HELP}
      geoChartsLayout="split"
      distributionTabLayout="density-v2"
      statsTabHelp={INDICATOR_STATS_TAB_HELP}
      statsTabContent={({ year, estb, schoolDivision, schoolKinds }) => (
        <FreshmanIndicatorStatsPanel
          rows={rows}
          cohort={cohort}
          rowsByCohort={data.chartRowsByCohort}
          filters={{ year, estb, schoolDivision, schoolKinds }}
        />
      )}
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

function EnrolledChart({ payload }: { payload: Extract<IndicatorStatsMockPayload, { tab: "enrolled-enrollment-rate" }> }) {
  const data = payload.enrolled;
  const [metric, setMetric] = useState<EnrolledChartMetric>("within");
  const chartYears = useMemo(
    () => [...new Set(data.years)].sort((a, b) => a - b),
    [data.years],
  );
  const chartRows = useMemo(
    () => toRepEnrolledChartRows(data.chartRows, metric),
    [data.chartRows, metric],
  );
  if (!data.chartRows.length || chartYears.length === 0) return <EmptyCharts />;
  return (
    <CorpTransferRatioAdvancedChartDashboard
      key={`${data.cohort}-${metric}`}
      rows={chartRows}
      years={chartYears}
      hasData
      initialMainTab="stats"
      rateLabel={ENROLLED_METRIC_LABELS[metric]}
      kpiSub={ENROLLED_KPI_SUB[metric]}
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
          rows={data.chartRows}
          cohort={data.cohort}
          rowsByCohort={data.chartRowsByCohort}
          filters={{ year, estb, schoolDivision, schoolKinds }}
        />
      )}
      filterToolbarLeading={
        <ChartMetricToggle
          value={metric}
          onChange={setMetric}
          labels={ENROLLED_METRIC_LABELS}
        />
      }
      renderHelpButton={({ active, onClick }) => (
        <GlassHelpButton tone="blue" active={active} onClick={onClick} />
      )}
    />
  );
}

function DropoutChart({ payload }: { payload: Extract<IndicatorStatsMockPayload, { tab: "dropout-rate" }> }) {
  const data = payload.dropout;
  const [metric, setMetric] = useState<DropoutChartMetric>("enrolled");
  const chartYears = useMemo(
    () => [...new Set(data.years)].sort((a, b) => a - b),
    [data.years],
  );
  const activeMetric = data.cohort === "graduate" ? "enrolled" : metric;
  const chartRows = useMemo(
    () => toRepDropoutChartRows(data.chartRows, activeMetric),
    [data.chartRows, activeMetric],
  );
  if (!data.chartRows.length || chartYears.length === 0) return <EmptyCharts />;
  return (
    <CorpTransferRatioAdvancedChartDashboard
      key={`${data.cohort}-${activeMetric}`}
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
          rows={data.chartRows}
          cohort={data.cohort}
          rowsByCohort={data.chartRowsByCohort}
          filters={{ year, estb, schoolDivision, schoolKinds }}
        />
      )}
      filterToolbarLeading={
        data.cohort === "graduate" ? undefined : (
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

function EmptyCharts() {
  return (
    <section className="rounded-xl border border-border bg-surface p-8 text-center">
      <p className={CHART_TYPO.bodyText}>통계분석에 쓸 데이터가 없습니다.</p>
    </section>
  );
}

function helpBtn() {
  return ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <GlassHelpButton tone="blue" active={active} onClick={onClick} />
  );
}

function ChartBody({ payload }: { payload: IndicatorStatsMockPayload }) {
  if (payload.tab === "freshman-enrollment-rate") {
    return <FreshmanChart payload={payload} />;
  }
  if (payload.tab === "enrolled-enrollment-rate") {
    return <EnrolledChart payload={payload} />;
  }
  if (payload.tab === "dropout-rate") {
    return <DropoutChart payload={payload} />;
  }
  if (payload.tab === "fund-secure-rate") {
    const { fund } = payload;
    return (
      <FundSecureRateChartDashboard
        rows={toFundSecureRateRows(fund.chartRows)}
        years={fund.years}
        hasData={fund.chartRows.length > 0}
        initialMainTab="stats"
        statsTabHelp={INDICATOR_STATS_TAB_HELP}
        statsTabContent={(filters) => (
          <FundSecureIndicatorStatsPanel
            rows={fund.chartRows}
            cohort={fund.cohort}
            filters={filters}
          />
        )}
      />
    );
  }
  if (payload.tab === "financial-support-benefit-rate") {
    const { finSupport } = payload;
    return (
      <FinancialSupportBenefitRateChartDashboard
        rows={toFinancialSupportBenefitRateRows(finSupport.chartRows)}
        years={finSupport.years}
        hasData={finSupport.chartRows.length > 0}
        initialMainTab="stats"
        statsTabHelp={INDICATOR_STATS_TAB_HELP}
        statsTabContent={(filters) => (
          <FinSupportIndicatorStatsPanel
            rows={finSupport.chartRows}
            cohort={finSupport.cohort}
            filters={filters}
          />
        )}
      />
    );
  }
  if (payload.tab === "tuition-dependency-rate") {
    const { tuition } = payload;
    return (
      <TuitionDependencyRateChartDashboard
        rows={toTuitionDependencyRateRows(tuition.chartRows)}
        years={tuition.years}
        hasData={tuition.chartRows.length > 0}
        initialMainTab="stats"
        statsTabHelp={INDICATOR_STATS_TAB_HELP}
        statsTabContent={(filters) => (
          <TuitionDepIndicatorStatsPanel
            rows={tuition.chartRows}
            cohort={tuition.cohort}
            filters={filters}
          />
        )}
      />
    );
  }
  if (payload.tab === "corp-transfer-ratio") {
    const { corp } = payload;
    return (
      <CorpTransferRatioChartDashboard
        rows={toCorpTransferRatioRows(corp.chartRows)}
        years={corp.years}
        hasData={corp.chartRows.length > 0}
        initialMainTab="stats"
        statsTabHelp={INDICATOR_STATS_TAB_HELP}
        statsTabContent={(filters) => (
          <CorpTransferIndicatorStatsPanel
            rows={corp.chartRows}
            cohort={corp.cohort}
            filters={filters}
          />
        )}
        renderHelpButton={helpBtn()}
      />
    );
  }
  const { income } = payload;
  return (
    <IncomePropertySecureRateChartDashboard
      rows={toIncomePropertyDisplayRows(income.chartRows)}
      years={income.years}
      hasData={income.chartRows.length > 0}
      initialMainTab="stats"
      statsTabHelp={INDICATOR_STATS_TAB_HELP}
      statsTabContent={(filters) => (
        <IncomePropertyIndicatorStatsPanel
          rows={income.chartRows}
          cohort={income.cohort}
          filters={filters}
        />
      )}
      renderHelpButton={helpBtn()}
    />
  );
}

function currentMeta(payload: IndicatorStatsMockPayload): {
  title: string;
  year: number | null;
  cohort: string;
  cohortItems: { id: string; label: string; count: string }[];
} {
  if (payload.tab === "freshman-enrollment-rate") {
    const d = payload.freshman;
    return {
      title: "신입생충원율",
      year: d.displayYear,
      cohort: d.cohort,
      cohortItems: STUDENT_FILL_VIEW_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: fmtCount(d.cohortCounts[tab.id]),
      })),
    };
  }
  if (payload.tab === "enrolled-enrollment-rate") {
    const d = payload.enrolled;
    return {
      title: "재학생충원율",
      year: d.displayYear,
      cohort: d.cohort,
      cohortItems: STUDENT_FILL_VIEW_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: fmtCount(d.cohortCounts[tab.id]),
      })),
    };
  }
  if (payload.tab === "dropout-rate") {
    const d = payload.dropout;
    return {
      title: "중도탈락율",
      year: d.displayYear,
      cohort: d.cohort,
      cohortItems: STUDENT_FILL_VIEW_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: fmtCount(d.cohortCounts[tab.id]),
      })),
    };
  }
  const finance =
    payload.tab === "fund-secure-rate"
      ? payload.fund
      : payload.tab === "financial-support-benefit-rate"
        ? payload.finSupport
        : payload.tab === "tuition-dependency-rate"
          ? payload.tuition
          : payload.tab === "corp-transfer-ratio"
            ? payload.corp
            : payload.income;
  const title =
    payload.tab === "fund-secure-rate"
      ? "자금확보율"
      : payload.tab === "financial-support-benefit-rate"
        ? "재정지원수혜율"
        : payload.tab === "tuition-dependency-rate"
          ? "등록금의존율"
          : payload.tab === "corp-transfer-ratio"
            ? "법인전입금비율"
            : "수익용재산확보율";
  return {
    title,
    year: finance.displayYear,
    cohort: finance.cohort,
    cohortItems: TWO_SCHOOL_VIEW_TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count: fmtCount(twoSchoolViewTabCount(finance.cohortCounts, tab.id)),
    })),
  };
}

export function IndicatorStatsMockPage({
  payload,
}: {
  payload: IndicatorStatsMockPayload;
}) {
  const router = useRouter();
  const [, startNav] = useTransition();
  const meta = currentMeta(payload);

  function go(next: { tab?: FinanceAnalysisTab["id"]; cohort?: string }) {
    startNav(() => {
      router.push(
        buildMockHref({
          tab: next.tab ?? payload.tab,
          year: meta.year,
          cohort: next.cohort ?? meta.cohort,
        }),
      );
    });
  }

  return (
    <div className={FDB_PAGE_SHELL}>
      <DashboardEmeraldHeader
        sectionLabel="목업"
        subtitle="재정분석지표 · 통계분석"
        title="지표통계 탭"
        note="상단 KPI 박스 아래 탭: 지표통계 → 위험군대학 → 지역·규모 → 분포·위험 → 시계열."
      />

      <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
        <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
          아래 지표를 바꾸면 같은 배치(요약 박스 → 탭 → 표)로 8개 메뉴를 미리
          볼 수 있습니다. 프로덕션 재정분석지표 통계분석에도 동일하게 적용됩니다.
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <p className={FDB_TYPO.toolbarLabel}>지표</p>
        <div className="flex flex-wrap gap-2">
          {FINANCE_ANALYSIS_MENU_GROUPS.flatMap((group) =>
            group.tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  payload.tab === item.id
                    ? "border-transparent bg-[#0f6b4c] text-white"
                    : "border-border bg-surface text-foreground hover:bg-surface-2"
                }`}
                onClick={() => go({ tab: item.id, cohort: "university" })}
              >
                <span className="opacity-70">{group.label}</span>
                {" · "}
                {item.label}
              </button>
            )),
          )}
        </div>
      </div>

      <DashboardEmeraldHeader
        sectionLabel="재정분석지표"
        title={meta.title}
        subtitle="통계분석 · 지표통계"
        note="학교구분별은 전체대학 탭에서만 표시됩니다."
      />

      <div className="flex flex-wrap items-center gap-2">
        <FinanceSectionTabRow active="charts" onChange={() => undefined} />
        <GlassMintTabGroup
          ariaLabel="코호트"
          active={meta.cohort}
          onChange={(id) => go({ cohort: id })}
          items={meta.cohortItems}
        />
      </div>

      <div className={FDB_CHARTS_SCROLL}>
        <ChartBody payload={payload} />
      </div>
    </div>
  );
}
