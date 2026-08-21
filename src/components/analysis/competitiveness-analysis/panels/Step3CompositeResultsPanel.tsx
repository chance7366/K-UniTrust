"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Step3CompositeResultsTable } from "@/components/analysis/competitiveness-analysis/Step3CompositeResultsTable";
import { RUN_NO_RESULTS_MESSAGE } from "@/components/analysis/competitiveness-analysis/RunStatusBanner";
import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import type { TargetUniversityRow } from "@/lib/competitiveness-analysis/config";
import { buildRunAnalyticsRows } from "@/lib/competitiveness-analysis/run-analytics";
import {
  type SchoolKindFilter,
} from "@/lib/competitiveness-analysis/step1-indicators";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";

function parseSchoolKindFilter(value: string | null): SchoolKindFilter {
  return value === "junior-college" ? "junior-college" : "university";
}

export function Step3CompositeResultsPanel() {
  const searchParams = useSearchParams();
  const kindParam = searchParams.get("kind");

  const {
    analysisYear,
    settings,
    runResults,
    step1RawResults,
    lastRunAt,
    runError,
    weightsValid,
  } = useCompetitivenessSettings();

  const [schoolKindFilter, setSchoolKindFilter] = useState<SchoolKindFilter>(
    () => parseSchoolKindFilter(kindParam),
  );
  const [liveTargets, setLiveTargets] = useState<TargetUniversityRow[] | null>(
    null,
  );

  const indicators = useMemo(() => getCompetitivenessIndicators(), []);

  useEffect(() => {
    setSchoolKindFilter(parseSchoolKindFilter(kindParam));
  }, [kindParam]);

  useEffect(() => {
    let cancelled = false;
    void fetch(
      `/api/competitiveness-analysis/target-universities?year=${analysisYear}&source=live`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { rows?: TargetUniversityRow[] } | null) => {
        if (!cancelled && body?.rows?.length) {
          setLiveTargets(body.rows);
        }
      })
      .catch(() => {
        /* 저장 설정 플래그로 표시 */
      });
    return () => {
      cancelled = true;
    };
  }, [analysisYear]);

  const allAnalyticsRows = useMemo(() => {
    if (!runResults?.length) return [];
    const settingsForRows =
      liveTargets?.length
        ? { ...settings, targetUniversities: liveTargets }
        : settings;
    return buildRunAnalyticsRows(
      runResults,
      settingsForRows,
      indicators,
      step1RawResults,
    );
  }, [runResults, settings, liveTargets, indicators, step1RawResults]);

  const filteredRows = useMemo(() => {
    const kind = schoolKindFilter === "junior-college" ? "전문대" : "4년제";
    return allAnalyticsRows
      .filter((row) => row.type === kind)
      .sort((a, b) => {
        if (a.excludedFromRanking !== b.excludedFromRanking) {
          return a.excludedFromRanking ? 1 : -1;
        }
        return (a.rank || 999) - (b.rank || 999);
      });
  }, [allAnalyticsRows, schoolKindFilter]);

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {!weightsValid ? (
        <p className={`mb-3 ${FDB_TYPO.legend} text-danger`}>
          기본설정에서 가중치 합(카테고리 100%, 카테고리별 지표 100%)을 맞춘 뒤
          실행하세요.
        </p>
      ) : null}
      {runError ? (
        <p className={`mb-3 ${FDB_TYPO.legend} text-danger`}>{runError}</p>
      ) : null}

      {!runResults?.length ? (
        <p className={`rounded-lg border border-dashed border-border bg-surface-2 px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
          {RUN_NO_RESULTS_MESSAGE}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredRows.length ? (
            <Step3CompositeResultsTable
              rows={filteredRows}
              analysisYear={analysisYear}
              schoolKindFilter={schoolKindFilter}
              lastRunAt={lastRunAt}
              categoryWeights={{
                "student-enrollment":
                  settings.categoryWeights["student-enrollment"] ?? 0,
                "univ-finance": settings.categoryWeights["univ-finance"] ?? 0,
                "corp-finance": settings.categoryWeights["corp-finance"] ?? 0,
              }}
            />
          ) : (
            <p className={`rounded-lg border border-dashed border-border bg-surface-2 px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
              해당 학교종류 대상대학이 없습니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
