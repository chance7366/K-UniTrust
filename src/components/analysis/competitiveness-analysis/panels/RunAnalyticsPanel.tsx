"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useMemo, useState } from "react";

import { RunAnalyticsDashboard } from "@/components/analysis/competitiveness-analysis/RunAnalyticsDashboard";
import { RUN_NO_RESULTS_MESSAGE } from "@/components/analysis/competitiveness-analysis/RunStatusBanner";
import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import type { CompositeYearSeries } from "@/lib/competitiveness-analysis/composite-competitiveness-analytics";
import {
  buildRunAnalyticsRows,
  type RunAnalyticsRow,
} from "@/lib/competitiveness-analysis/run-analytics";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";
import { loadLocalEditionTrendSeries } from "@/lib/competitiveness-analysis/user-workspace";
import type {
  CompetitivenessSettings,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";

type TrendEditionPoint = {
  analysisYear: number;
  runResults: UniversityRunResult[];
  settings: CompetitivenessSettings;
  step1RawResults: UniversityRawResult[] | null;
};

type TrendResponse = {
  series?: TrendEditionPoint[];
  error?: string;
};

export function RunAnalyticsPanel({
  cohort,
}: {
  cohort: "univ" | "college" | "compare";
}) {
  const { analysisYear, settings, runResults, step1RawResults, lastRunAt } =
    useCompetitivenessSettings();

  const indicators = useMemo(() => getCompetitivenessIndicators(), []);
  const [yearSeries, setYearSeries] = useState<CompositeYearSeries[]>([]);

  const allRows = useMemo(() => {
    if (!runResults?.length) return [];
    return buildRunAnalyticsRows(
      runResults,
      settings,
      indicators,
      step1RawResults,
    );
  }, [runResults, settings, indicators, step1RawResults]);

  useEffect(() => {
    let cancelled = false;
    loadLocalEditionTrendSeries()
      .then((series) => {
        if (cancelled) return;
        setYearSeries(
          series.map((point) => ({
            year: point.analysisYear,
            rows: buildRunAnalyticsRows(
              point.runResults,
              point.settings,
              indicators,
              point.step1RawResults,
            ),
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setYearSeries([]);
      });

    return () => {
      cancelled = true;
    };
  }, [analysisYear, lastRunAt, indicators]);

  const prevYearRows = useMemo<RunAnalyticsRow[]>(
    () => yearSeries.find((point) => point.year === analysisYear - 1)?.rows ?? [],
    [yearSeries, analysisYear],
  );

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {!runResults?.length ? (
        <p className={`rounded-lg border border-dashed border-border bg-surface-2 px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
          {RUN_NO_RESULTS_MESSAGE}
        </p>
      ) : (
        <RunAnalyticsDashboard
          allRows={allRows}
          prevYearRows={prevYearRows}
          yearSeries={yearSeries}
          analysisYear={analysisYear}
          cohort={cohort}
          embedded
        />
      )}
    </section>
  );
}
