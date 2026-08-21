"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Database, Layers3, TrendingUp } from "lucide-react";

import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { AnalysisYearSelector } from "@/components/analysis/competitiveness-analysis/AnalysisYearSelector";
import { Step1RawResultsPanel } from "@/components/analysis/competitiveness-analysis/panels/Step1RawResultsPanel";
import { Step2IndexResultsPanel } from "@/components/analysis/competitiveness-analysis/panels/Step2IndexResultsPanel";
import { RunAnalyticsPanel } from "@/components/analysis/competitiveness-analysis/panels/RunAnalyticsPanel";
import { Step3CompositeResultsPanel } from "@/components/analysis/competitiveness-analysis/panels/Step3CompositeResultsPanel";
import { matchesSchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";

type RunViewTab = "step1" | "step2" | "step3" | "analytics";
type RunCohortTab = "university" | "junior-college" | "compare";

function parseRunViewTab(value: string | null): RunViewTab {
  if (
    value === "step2" ||
    value === "step3" ||
    value === "step1" ||
    value === "analytics"
  ) {
    return value;
  }
  return "step1";
}

function parseRunCohortTab(
  value: string | null,
  view: RunViewTab,
): RunCohortTab {
  if (view === "analytics" && value === "compare") return "compare";
  if (value === "junior-college") return "junior-college";
  return "university";
}

function toAnalyticsCohort(
  kind: RunCohortTab,
): "univ" | "college" | "compare" {
  if (kind === "junior-college") return "college";
  if (kind === "compare") return "compare";
  return "univ";
}

export function RunPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const kindParam = searchParams.get("kind");
  const { editionsLoading, editionsLoadError, settings, settingsStale } =
    useCompetitivenessSettings();

  const [activeView, setActiveView] = useState<RunViewTab>(() =>
    parseRunViewTab(viewParam),
  );
  const [activeCohort, setActiveCohort] = useState<RunCohortTab>(() =>
    parseRunCohortTab(kindParam, parseRunViewTab(viewParam)),
  );
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    const view = parseRunViewTab(viewParam);
    setActiveView(view);
    setActiveCohort(parseRunCohortTab(kindParam, view));
  }, [viewParam, kindParam]);

  useEffect(() => {
    if (editionsLoading) {
      setContentReady(false);
      return;
    }
    const timer = window.setTimeout(() => setContentReady(true), 0);
    return () => window.clearTimeout(timer);
  }, [editionsLoading]);

  const cohortCounts = useMemo(() => {
    let university = 0;
    let juniorCollege = 0;
    for (const row of settings.targetUniversities) {
      if (matchesSchoolKindFilter(row.schoolKind, "junior-college")) {
        juniorCollege += 1;
      } else {
        university += 1;
      }
    }
    return { university, juniorCollege };
  }, [settings.targetUniversities]);

  function replaceRunQuery(view: RunViewTab, kind: RunCohortTab) {
    const nextKind =
      view !== "analytics" && kind === "compare" ? "university" : kind;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    if (nextKind === "university") {
      params.delete("kind");
    } else {
      params.set("kind", nextKind);
    }
    router.replace(
      `/analysis/competitiveness-analysis/run?${params.toString()}`,
      { scroll: false },
    );
  }

  function setView(tab: RunViewTab) {
    const nextKind =
      tab !== "analytics" && activeCohort === "compare"
        ? "university"
        : activeCohort;
    setActiveView(tab);
    setActiveCohort(nextKind);
    replaceRunQuery(tab, nextKind);
  }

  function setCohort(tab: RunCohortTab) {
    const nextKind =
      activeView !== "analytics" && tab === "compare" ? "university" : tab;
    setActiveCohort(nextKind);
    replaceRunQuery(activeView, nextKind);
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <AnalysisYearSelector variant="inline" />
      <GlassMintTabGroup
        ariaLabel="분석결과 보기"
        active={activeView}
        onChange={setView}
        items={[
          { id: "step1", label: "원지표값", icon: Database },
          { id: "step2", label: "지수·순위", icon: TrendingUp },
          { id: "step3", label: "종합지수", icon: Layers3 },
          { id: "analytics", label: "통계분석", icon: BarChart3 },
        ]}
      />
      <GlassMintTabGroup
        ariaLabel="코호트"
        active={activeCohort}
        onChange={setCohort}
        items={[
          {
            id: "university",
            label: "대학",
            count: cohortCounts.university.toLocaleString("ko-KR"),
          },
          {
            id: "junior-college",
            label: "전문대학",
            count: cohortCounts.juniorCollege.toLocaleString("ko-KR"),
          },
          ...(activeView === "analytics"
            ? [{ id: "compare" as const, label: "대학전문" }]
            : []),
        ]}
      />
    </div>
  );

  if (editionsLoadError) {
    return (
      <div
        className={`rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 ${FDB_TYPO.bodyText}`}
        role="alert"
      >
        <p className="font-semibold">분석 데이터를 불러오지 못했습니다</p>
        <p className="mt-1">{editionsLoadError}</p>
        <p className="mt-2 text-red-700">
          Cursor를 다시 연 뒤에는 터미널에서{" "}
          <code className="rounded bg-red-100 px-1">npm run dev</code>로 개발
          서버를 먼저 실행해 주세요.
        </p>
      </div>
    );
  }

  if (editionsLoading || !contentReady) {
    return (
      <div className="flex flex-col gap-3">
        {toolbar}
        <p className={`text-muted ${FDB_TYPO.bodyText}`}>
          저장된 분석결과를 불러오는 중…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {toolbar}
      {settingsStale ? (
        <p className="text-xs font-medium text-accent-orange">
          기본설정 값이 변경되었습니다. 다시 분석실행하시기 바랍니다.
        </p>
      ) : null}

      {activeView === "step1" ? <Step1RawResultsPanel /> : null}
      {activeView === "step2" ? <Step2IndexResultsPanel /> : null}
      {activeView === "step3" ? <Step3CompositeResultsPanel /> : null}
      {activeView === "analytics" ? (
        <RunAnalyticsPanel cohort={toAnalyticsCohort(activeCohort)} />
      ) : null}
    </div>
  );
}
