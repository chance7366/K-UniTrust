"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useMemo, useState } from "react";

import { MOCK_OUR_UNIVERSITY_CODE } from "@/lib/competitiveness-analysis/config";
import { matchesSchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
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

export function UniversityPanel() {
  const { analysisYear, runResults, settings, lastRunAt } =
    useCompetitivenessSettings();
  const [series, setSeries] = useState<TrendPoint[]>([]);

  useEffect(() => {
    loadLocalEditionTrendSeries().then(setSeries).catch(() => {
        /* ignore */
      });
  }, [analysisYear, lastRunAt]);

  const ours = runResults?.find(
    (r) => r.schoolCodeStd === MOCK_OUR_UNIVERSITY_CODE,
  );

  const history = useMemo(() => {
    return series
      .map((point) => {
        const row = point.runResults.find(
          (r) => r.schoolCodeStd === MOCK_OUR_UNIVERSITY_CODE,
        );
        if (!row) return null;
        return {
          analysisYear: point.analysisYear,
          compositeIndex: row.compositeIndex,
          compositeRank: row.compositeRank,
          excluded: row.excludedFromRanking,
        };
      })
      .filter(Boolean) as {
      analysisYear: number;
      compositeIndex: number;
      compositeRank: number;
      excluded: boolean;
    }[];
  }, [series]);

  if (!runResults?.length) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-surface-2/50 px-5 py-12 text-center">
        <p className="text-sm font-medium">
          {analysisYear}년 분석결과가 없습니다.
        </p>
        <p className={`mt-1 ${FDB_TYPO.legend}`}>
          분석실행 메뉴에서 {analysisYear}년 3단계 분석을 실행하면 이 PC에 저장되며, 이
          화면에서 확인할 수 있습니다.
        </p>
      </section>
    );
  }

  if (!ours) {
    return (
      <section className="rounded-xl border border-border bg-surface px-5 py-8 text-center text-sm text-muted">
        우리 대학({MOCK_OUR_UNIVERSITY_CODE}) 데이터가 {analysisYear}년 결과에
        없습니다.
      </section>
    );
  }

  const schoolKindFilter = ours.schoolKind.includes("전문대")
    ? "junior-college"
    : "university";
  const peerCount = runResults.filter(
    (r) =>
      matchesSchoolKindFilter(r.schoolKind, schoolKindFilter) &&
      !r.excludedFromRanking,
  ).length;

  const percentile =
    peerCount && ours.compositeRank
      ? Math.round(((peerCount - ours.compositeRank + 1) / peerCount) * 100)
      : 0;

  const studentCells = ours.indicators.filter((c) =>
    [
      "freshman-enrollment-rate",
      "enrolled-enrollment-rate",
      "dropout-rate",
    ].includes(c.financeTabId),
  );
  const financeCells = ours.indicators.filter((c) =>
    [
      "fund-secure-rate",
      "financial-support-benefit-rate",
      "tuition-dependency-rate",
    ].includes(c.financeTabId),
  );
  const corpCells = ours.indicators.filter((c) =>
    ["income-property-secure-rate", "corp-transfer-ratio"].includes(
      c.financeTabId,
    ),
  );

  const avgIndex = (cells: typeof ours.indicators) =>
    cells.length
      ? Math.round(
          (cells.reduce((s, c) => s + c.indexScore, 0) / cells.length) * 10,
        ) / 10
      : 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-accent/40 bg-[var(--glow-panel-kpi)] p-5 shadow-[var(--glow-inset)]">
        <p className="text-xs font-medium text-accent-cyan">
          우리 대학 · {analysisYear}년 분석
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{ours.schoolName}</h2>
            <p className="mt-1 font-mono text-sm text-muted">
              {ours.schoolCodeStd}
            </p>
            {ours.absoluteLabels.length ? (
              <p className="mt-1 text-xs text-danger">
                {ours.absoluteLabels.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-accent">
                {fmt(ours.compositeIndex)}
              </p>
              <p className={FDB_TYPO.legend}>종합지수</p>
            </div>
            <div>
              {ours.excludedFromRanking || !ours.compositeRank ? (
                <p className="text-3xl font-bold text-accent-orange">—</p>
              ) : (
                <p className="text-3xl font-bold text-accent-orange">
                  {ours.compositeRank}
                  <span className="text-lg text-muted">/{peerCount}</span>
                </p>
              )}
              <p className={FDB_TYPO.legend}>전국 순위</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {ours.excludedFromRanking || !ours.compositeRank
                  ? "—"
                  : `상위 ${100 - percentile}%`}
              </p>
              <p className={FDB_TYPO.legend}>백분위</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "학생충원", score: avgIndex(studentCells) },
          { label: "대학재정", score: avgIndex(financeCells) },
          { label: "법인재정", score: avgIndex(corpCells) },
        ].map((cat) => (
          <section
            key={cat.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-[var(--glow-inset)]"
          >
            <h3 className={FDB_TYPO.sectionTab}>{cat.label}</h3>
            <p className="mt-2 text-2xl font-bold text-accent">
              {fmt(cat.score)}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(cat.score, 100)}%` }}
              />
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
        <h3 className="text-base font-semibold">지표별 현황 ({analysisYear}년)</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ours.indicators.map((cell) => (
            <div
              key={cell.financeTabId}
              className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2"
            >
              <dt className={FDB_TYPO.legend}>{cell.label}</dt>
              <dd className="mt-1 font-semibold">
                지표 {fmt(cell.rawValue)} · 지수 {fmt(cell.indexScore)} ·{" "}
                {cell.rank}위
              </dd>
              <dd className={FDB_TYPO.legend}>
                적용연도:{" "}
                {settings.indicatorYears[cell.financeTabId] ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {history.length > 1 ? (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
          <h3 className="text-base font-semibold">연도별 종합지수 추세</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="bg-surface-2 text-xs text-muted">
                <tr>
                  <th className="px-3 py-2">분석연도</th>
                  <th className="px-3 py-2 text-right">종합지수</th>
                  <th className="px-3 py-2 text-right">순위</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.analysisYear}
                    className={`border-t border-border/60 ${
                      row.analysisYear === analysisYear ? "bg-accent/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2">{row.analysisYear}년</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {fmt(row.compositeIndex)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {row.excluded || !row.compositeRank
                        ? "—"
                        : `${row.compositeRank}위`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-border bg-surface-2/50 px-5 py-6 text-center">
          <p className={FDB_TYPO.bodyText}>
            다른 분석연도 결과가 쌓이면 연도별 추세가 표시됩니다.
          </p>
        </section>
      )}
    </div>
  );
}
