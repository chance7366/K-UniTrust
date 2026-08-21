"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";

export function RunStatusBanner() {
  const { analysisYear, editions, settingsStale } =
    useCompetitivenessSettings();

  const meta = editions.find((e) => e.analysisYear === analysisYear);
  const hasResults = meta?.hasRunResults ?? false;

  return (
    <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>
          <span className="text-muted">분석연도 </span>
          <span className="font-semibold text-accent">{analysisYear}년</span>
        </span>
        <span
          className={
            hasResults ? "font-medium text-accent-cyan" : "text-muted"
          }
        >
          {hasResults ? "분석결과 있음" : "분석결과 없음"}
        </span>
      </div>
      {settingsStale ? (
        <p className="mt-2 text-xs font-medium text-accent-orange">
          기본설정 값이 변경되었습니다. 다시 분석실행하시기 바랍니다.
        </p>
      ) : null}
    </div>
  );
}

export const RUN_NO_RESULTS_MESSAGE =
  "분석결과가 없습니다. 대학경쟁력분석/기본설정 값을 설정 후 단계별 분석실행을 시작하세요.";
