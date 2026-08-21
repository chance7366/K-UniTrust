"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useMemo, useState } from "react";

import { MOCK_OUR_UNIVERSITY_CODE } from "@/lib/competitiveness-analysis/config";
import type { UniversityRunResult } from "@/lib/competitiveness-analysis/types";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";
import { loadLocalEditionTrendSeries } from "@/lib/competitiveness-analysis/user-workspace";

type TrendPoint = {
  analysisYear: number;
  lastRunAt: string | null;
  runResults: UniversityRunResult[];
};

function fmt(v: number) {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function avgComposite(results: UniversityRunResult[]): number {
  const ranked = results.filter((r) => !r.excludedFromRanking && r.compositeRank);
  if (!ranked.length) return 0;
  return (
    Math.round(
      (ranked.reduce((s, r) => s + r.compositeIndex, 0) / ranked.length) * 10,
    ) / 10
  );
}

export function TrendPanel() {
  const { analysisYear, lastRunAt } = useCompetitivenessSettings();
  const [series, setSeries] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadLocalEditionTrendSeries()
      .then((series) => {
        setSeries(series);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "추세 데이터를 불러오지 못했습니다.",
        );
      })
      .finally(() => setLoading(false));
  }, [analysisYear, lastRunAt]);

  const oursSeries = useMemo(() => {
    return series.map((point) => {
      const ours = point.runResults.find(
        (r) => r.schoolCodeStd === MOCK_OUR_UNIVERSITY_CODE,
      );
      return {
        analysisYear: point.analysisYear,
        compositeIndex: ours?.compositeIndex ?? null,
        compositeRank: ours?.compositeRank ?? null,
        excluded: ours?.excludedFromRanking ?? false,
        peerAvg: avgComposite(point.runResults),
      };
    });
  }, [series]);

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-surface px-5 py-12 text-center text-sm text-muted">
        이 PC에서 연도별 분석결과를 불러오는 중…
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-danger/40 bg-surface px-5 py-8 text-center text-sm text-danger">
        {error}
      </section>
    );
  }

  if (!series.length) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-surface-2/50 px-5 py-12 text-center">
        <p className="text-sm font-medium">저장된 분석결과가 없습니다.</p>
        <p className={`mt-1 ${FDB_TYPO.legend}`}>
          분석실행 메뉴에서 연도별로 3단계 분석을 실행하면 이 PC에 저장되며, 이 화면에서
          추세를 확인할 수 있습니다.
        </p>
      </section>
    );
  }

  const maxIndex = Math.max(
    ...oursSeries.map((p) => p.compositeIndex ?? 0),
    ...oursSeries.map((p) => p.peerAvg),
    1,
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
        <h2 className="text-base font-semibold">종합지수 추세 (우리 대학 vs 전체 평균)</h2>
        <p className={`mt-1 ${FDB_TYPO.legend}`}>
          DB에 저장된 {series.length}개 분석연도 · 현재 선택 {analysisYear}년
        </p>
        <div className="mt-6 flex h-48 items-end justify-around gap-2 rounded-lg bg-surface-2 px-4 pb-3 pt-4">
          {oursSeries.map((point) => {
            const h = point.compositeIndex
              ? (point.compositeIndex / maxIndex) * 100
              : 4;
            const avgH = (point.peerAvg / maxIndex) * 100;
            return (
              <div
                key={point.analysisYear}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex h-36 w-full items-end justify-center gap-1">
                  <div
                    title={`전체 평균 ${fmt(point.peerAvg)}`}
                    className="w-3 rounded-t bg-muted/40"
                    style={{ height: `${avgH}%` }}
                  />
                  <div
                    title={
                      point.compositeIndex != null
                        ? `우리 대학 ${fmt(point.compositeIndex)}`
                        : "데이터 없음"
                    }
                    className="w-5 rounded-t bg-accent"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted">
                  {point.analysisYear}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[10px] text-muted">
          ■ 우리 대학 종합지수 · ░ 동종 포함 전체 평균
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
        <h2 className="text-base font-semibold">연도별 순위 변동</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2">분석연도</th>
                <th className="px-3 py-2 text-right">종합지수</th>
                <th className="px-3 py-2 text-right">순위</th>
                <th className="px-3 py-2 text-right">전체 평균</th>
              </tr>
            </thead>
            <tbody>
              {oursSeries.map((point) => (
                <tr
                  key={point.analysisYear}
                  className={`border-t border-border/60 ${
                    point.analysisYear === analysisYear ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium">{point.analysisYear}년</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {point.compositeIndex != null ? fmt(point.compositeIndex) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {point.excluded || !point.compositeRank
                      ? "—"
                      : `${point.compositeRank}위`}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-muted">
                    {fmt(point.peerAvg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
