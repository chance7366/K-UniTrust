"use client";

import { useEffect, useMemo, useState } from "react";

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { CorpTransferRatioAdvancedChartDashboard } from "@/components/analysis/CorpTransferRatioAdvancedChartDashboard";
import { EnrolledScaleLookupProvider } from "@/components/analysis/EnrolledScaleLookupContext";
import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { StudentFillRunIndicatorStats } from "@/components/analysis/student-fill-analysis/StudentFillRunIndicatorStats";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_CHARTS_SCROLL } from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { INDICATOR_STATS_TAB_HELP } from "@/lib/analysis/indicator-stats-geo";
import {
  filterHistoryByEstb,
  filterHistoryBySchoolKind,
  isMetricForStage,
  sfaRunChartFunnelProfile,
  sfaRunChartHelp,
  sfaRunChartKpiSub,
  sfaRunChartLabel,
  sfaRunChartRiskProfile,
  SFA_ENROLLED_METRIC_LABELS,
  SFA_FOREIGN_METRIC_LABELS,
  SFA_FRESHMAN_METRIC_LABELS,
  SFA_STAGE_DEFAULT_METRIC,
  toSfaRunChartRows,
  type SfaChartStage,
  type SfaEnrolledMetric,
  type SfaForeignMetric,
  type SfaFreshmanMetric,
  type SfaRunChartMetric,
  type SfaSchoolKind,
} from "@/lib/analysis/student-fill-analysis/run-chart-metrics";
import type { StudentFillEstbFilter } from "@/lib/analysis/student-fill-analysis/cohort-rules";
import { studentFillScaleLookup, type StudentFillChartHistoryYear } from "@/lib/analysis/student-fill-analysis/run-chart-rows";
import { toStudentFillStatGeoRows } from "@/lib/analysis/student-fill-analysis/run-indicator-stats";
import type { StudentFillSchoolRow } from "@/lib/analysis/student-fill-analysis/types";

export function StudentFillRunChartsDashboard({
  preferredYear,
  currentSchools,
  history: historyProp,
  stage,
  schoolKind,
  estbFilter,
}: {
  preferredYear: number | null;
  currentSchools: StudentFillSchoolRow[] | null;
  history?: StudentFillChartHistoryYear[] | null;
  stage: SfaChartStage;
  schoolKind: SfaSchoolKind;
  estbFilter: StudentFillEstbFilter;
}) {
  const [metric, setMetric] = useState<SfaRunChartMetric>(SFA_STAGE_DEFAULT_METRIC[stage]);
  const [fetchedHistory, setFetchedHistory] = useState<StudentFillChartHistoryYear[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMetricForStage(stage, metric)) {
      setMetric(SFA_STAGE_DEFAULT_METRIC[stage]);
    }
  }, [stage, metric]);

  useEffect(() => {
    if (historyProp) {
      setFetchedHistory(null);
      setError(null);
      return;
    }
    let cancelled = false;
    fetch("/api/student-fill-analysis/run?history=1")
      .then(async (res) => {
        const body = (await res.json()) as {
          history?: StudentFillChartHistoryYear[];
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "통계분석을 불러오지 못했습니다.");
        if (!cancelled) {
          setFetchedHistory(body.history ?? []);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "통계분석을 불러오지 못했습니다.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [historyProp]);

  const history = historyProp ?? fetchedHistory;

  const resolvedHistory = useMemo(() => {
    if (history && history.length) return history;
    if (preferredYear != null && currentSchools?.length) {
      return [{ year: preferredYear, schools: currentSchools }];
    }
    return history;
  }, [history, preferredYear, currentSchools]);

  const scopedHistory = useMemo(() => {
    if (!resolvedHistory) return [];
    return filterHistoryBySchoolKind(
      filterHistoryByEstb(resolvedHistory, estbFilter),
      schoolKind,
    );
  }, [resolvedHistory, schoolKind, estbFilter]);

  const activeMetric = isMetricForStage(stage, metric)
    ? metric
    : SFA_STAGE_DEFAULT_METRIC[stage];

  const chartYears = useMemo(
    () => scopedHistory.map((item) => item.year),
    [scopedHistory],
  );
  const chartRows = useMemo(
    () => toSfaRunChartRows(scopedHistory, activeMetric),
    [scopedHistory, activeMetric],
  );
  const statRows = useMemo(() => toStudentFillStatGeoRows(scopedHistory), [scopedHistory]);
  const scaleLookup = useMemo(() => studentFillScaleLookup(scopedHistory), [scopedHistory]);
  const metricToggle =
    stage === "freshman" ? (
      <ChartMetricToggle
        value={activeMetric as SfaFreshmanMetric}
        onChange={setMetric}
        labels={SFA_FRESHMAN_METRIC_LABELS}
      />
    ) : stage === "enrolled" ? (
      <ChartMetricToggle
        value={activeMetric as SfaEnrolledMetric}
        onChange={setMetric}
        labels={SFA_ENROLLED_METRIC_LABELS}
      />
    ) : (
      <ChartMetricToggle
        value={activeMetric as SfaForeignMetric}
        onChange={setMetric}
        labels={SFA_FOREIGN_METRIC_LABELS}
      />
    );

  if (error) {
    return <p className={`${FDB_TYPO.legend} text-danger`}>{error}</p>;
  }

  if (resolvedHistory == null) {
    return (
      <p className={`rounded-lg border border-border bg-surface-2 px-4 py-6 ${FDB_TYPO.bodyText}`}>
        불러오는 중…
      </p>
    );
  }

  if (!scopedHistory.length || chartYears.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className={CHART_TYPO.bodyText}>
          저장된 분석결과가 없습니다. 기본설정에서 분석실행하면 통계분석을 볼 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <div className={FDB_CHARTS_SCROLL}>
      <EnrolledScaleLookupProvider value={scaleLookup}>
        <CorpTransferRatioAdvancedChartDashboard
          key={`${stage}-${activeMetric}-${schoolKind}-${estbFilter}-${chartYears.join(",")}`}
          rows={chartRows}
          years={chartYears}
          hasData
          hideRiskTab
          initialMainTab="stats"
          defaultEstb=""
          rateLabel={sfaRunChartLabel(activeMetric)}
          kpiSub={sfaRunChartKpiSub(activeMetric)}
          riskProfile={sfaRunChartRiskProfile(activeMetric)}
          funnelProfile={sfaRunChartFunnelProfile(activeMetric)}
          helpPack={sfaRunChartHelp(activeMetric)}
          geoChartsLayout="split"
          distributionTabLayout="density-v2"
          statsTabHelp={INDICATOR_STATS_TAB_HELP}
          statsTabContent={({ year, estb, schoolDivision, schoolKinds }) => (
            <StudentFillRunIndicatorStats
              rows={statRows}
              stage={stage}
              showDivision={schoolKind === "all"}
              filters={{ year, estb, schoolDivision, schoolKinds }}
            />
          )}
          filterToolbarLeading={metricToggle}
          renderHelpButton={({ active, onClick }) => (
            <GlassHelpButton tone="blue" active={active} onClick={onClick} />
          )}
        />
      </EnrolledScaleLookupProvider>
    </div>
  );
}
