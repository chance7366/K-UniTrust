"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  PieChart as PieChartIcon,
  type LucideIcon,
} from "lucide-react";

import { HelpTip } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { CompositeCompetitivenessTab } from "@/components/analysis/competitiveness-analysis/CompositeCompetitivenessTab";
import { IndicatorCompetitivenessTab } from "@/components/analysis/competitiveness-analysis/IndicatorCompetitivenessTab";
import { RiskUniversitiesTab } from "@/components/analysis/competitiveness-analysis/RiskUniversitiesTab";
import { SectorCompetitivenessTab } from "@/components/analysis/competitiveness-analysis/SectorCompetitivenessTab";
import type { CompositeYearSeries } from "@/lib/competitiveness-analysis/composite-competitiveness-analytics";
import type { RunAnalyticsRow } from "@/lib/competitiveness-analysis/run-analytics";
import "./run-analytics.css";

export type RunAnalyticsCohort = "univ" | "college" | "compare";
type AnalysisView = "risk" | "composite" | "sector" | "indicator";

function SlimTabRow<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: { id: T; label: string; icon?: LucideIcon }[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex max-w-full flex-wrap gap-0.5 overflow-x-auto rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-[30px] shrink-0 items-center gap-1 rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "font-medium text-muted hover:text-foreground"
            }`}
          >
            {Icon ? (
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${
                  isActive ? "text-indigo-700" : "text-muted"
                }`}
                aria-hidden
              />
            ) : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export type RunAnalyticsDashboardProps = {
  allRows: RunAnalyticsRow[];
  prevYearRows?: RunAnalyticsRow[];
  yearSeries?: CompositeYearSeries[];
  analysisYear: number;
  cohort: RunAnalyticsCohort;
  embedded?: boolean;
};

function filterByCohort(
  rows: RunAnalyticsRow[],
  cohort: RunAnalyticsCohort,
): RunAnalyticsRow[] {
  if (cohort === "univ") return rows.filter((r) => r.type === "4년제");
  if (cohort === "college") return rows.filter((r) => r.type === "전문대");
  return rows;
}

function cohortTabLabel(cohort: RunAnalyticsCohort): string {
  if (cohort === "univ") return "대학";
  if (cohort === "college") return "전문대학";
  return "대학·전문대학";
}

const VIEW_HELP: Record<AnalysisView, { title: string; body: string }> = {
  risk: {
    title: "위험군대학 탭",
    body: "종합점수 진단등급 D·E인 대학을 지역별로 확인합니다. 17개 시·도 테이블 행을 클릭하면 해당 지역의 위험군 대학만 목록에 표시됩니다.",
  },
  composite: {
    title: "종합경쟁력 탭",
    body: "3단계 종합지수와 진단등급으로 지역·규모·분포·시계열을 봅니다. 위험군대학이 취약 대학 목록이라면, 이 탭은 집단 전체의 구조입니다.",
  },
  sector: {
    title: "부문경쟁력 탭",
    body: "종합지수를 만든 세 부문(학생충원·대학재정·법인재정) 지수를 각각 지역·규모, 분포·등급, 시계열로 봅니다.",
  },
  indicator: {
    title: "지표경쟁력 탭",
    body: "8개 적용지표 지수를 각각 지역·규모, 분포·등급, 시계열로 봅니다. 분포·등급의 점은 해당 지표 하나의 학교별 위치입니다.",
  },
};

export function RunAnalyticsDashboard({
  allRows,
  prevYearRows = [],
  yearSeries = [],
  analysisYear,
  cohort,
  embedded = true,
}: RunAnalyticsDashboardProps) {
  const [view, setView] = useState<AnalysisView>("risk");

  const baseDataset = useMemo(
    () => filterByCohort(allRows, cohort),
    [allRows, cohort],
  );
  const prevYearDataset = useMemo(
    () => filterByCohort(prevYearRows, cohort),
    [prevYearRows, cohort],
  );
  const yearSeriesCohort = useMemo(
    () =>
      yearSeries.map((point) => ({
        year: point.year,
        rows: filterByCohort(point.rows, cohort),
      })),
    [yearSeries, cohort],
  );

  const tabCohortLabel = cohortTabLabel(cohort);

  return (
    <div className={`cra-root space-y-6 ${embedded ? "cra-embedded" : ""}`}>
      <div className="flex flex-wrap items-center gap-1">
        <SlimTabRow
          ariaLabel="통계분석 보기"
          active={view}
          onChange={setView}
          tabs={[
            { id: "risk", label: "위험군대학", icon: AlertTriangle },
            { id: "composite", label: "종합경쟁력", icon: Award },
            { id: "sector", label: "부문경쟁력", icon: PieChartIcon },
            { id: "indicator", label: "지표경쟁력", icon: Activity },
          ]}
        />
        <HelpTip help={VIEW_HELP[view]} />
      </div>

      {view === "risk" ? (
        <RiskUniversitiesTab
          rows={baseDataset}
          prevRows={prevYearDataset}
          analysisYear={analysisYear}
          cohortLabel={tabCohortLabel}
        />
      ) : null}

      {view === "composite" ? (
        <CompositeCompetitivenessTab
          rows={baseDataset}
          prevRows={prevYearDataset}
          yearSeries={yearSeriesCohort}
          analysisYear={analysisYear}
          cohortLabel={tabCohortLabel}
        />
      ) : null}

      {view === "sector" ? (
        <SectorCompetitivenessTab
          rows={baseDataset}
          prevRows={prevYearDataset}
          yearSeries={yearSeriesCohort}
          analysisYear={analysisYear}
          cohortLabel={tabCohortLabel}
        />
      ) : null}

      {view === "indicator" ? (
        <IndicatorCompetitivenessTab
          rows={baseDataset}
          prevRows={prevYearDataset}
          yearSeries={yearSeriesCohort}
          analysisYear={analysisYear}
          cohortLabel={tabCohortLabel}
        />
      ) : null}
    </div>
  );
}
