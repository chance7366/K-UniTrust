"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useMemo } from "react";

import {
  buildTuitionDependencyRateDensity,
  type TuitionDependencyRateDensityStats,
} from "@/lib/analysis/tuition-dependency-rate-density-chart";
import { fmtPct } from "@/lib/analysis/tuition-dependency-rate-advanced-analytics";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import {
  DENSITY_GUIDE,
  DensityQuartileLegend,
  DensityQuartileMarks,
  DensityQuartilePlotLabels,
} from "@/components/analysis/DensityQuartileGuides";

const CHART = {
  mint: CHART_THEME.amber,
  rose: "#F43F5E",
  grid: CHART_THEME.grid,
};

type Props = {
  rates: number[];
  weightedMean?: number | null;
  cohortTopCutoffs?: { top15: string; top7: string } | null;
};

function scaleX(rate: number, stats: TuitionDependencyRateDensityStats) {
  const pad = 8;
  const span = stats.displayXMax - stats.displayXMin || 1;
  return pad + ((rate - stats.displayXMin) / span) * (100 - pad * 2);
}

function scaleY(count: number, stats: TuitionDependencyRateDensityStats) {
  const base = 82;
  const top = 12;
  return base - (count / stats.yMax) * (base - top);
}

function buildAreaPath(stats: TuitionDependencyRateDensityStats): string {
  const baseline = 82;
  if (!stats.points.length) return "";

  const topLine = stats.points
    .map((p, i) => {
      const x = scaleX(p.rate, stats);
      const y = scaleY(p.count, stats);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const last = stats.points[stats.points.length - 1];
  const first = stats.points[0];
  const xEnd = scaleX(last.rate, stats);
  const xStart = scaleX(first.rate, stats);

  return `${topLine} L ${xEnd} ${baseline} L ${xStart} ${baseline} Z`;
}

export function TuitionDependencyRateDensityDistributionChart({
  rates,
  weightedMean,
  cohortTopCutoffs,
}: Props) {
  const stats = useMemo(() => {
    const built = buildTuitionDependencyRateDensity(rates);
    if (!built) return null;
    if (weightedMean != null && Number.isFinite(weightedMean)) {
      return { ...built, mean: weightedMean };
    }
    return built;
  }, [rates, weightedMean]);

  if (!stats) {
    return <p className="text-sm text-muted">표시할 분포 데이터가 없습니다.</p>;
  }

  const yTicks = useMemo(() => {
    const step = stats.yMax <= 8 ? 2 : stats.yMax <= 20 ? 5 : 10;
    const ticks: number[] = [];
    for (let v = 0; v <= stats.yMax; v += step) ticks.push(Math.round(v));
    if (ticks[ticks.length - 1] !== Math.round(stats.yMax)) {
      ticks.push(Math.round(stats.yMax));
    }
    return ticks;
  }, [stats.yMax]);

  const xTicks = stats.xTicks;
  const baselinePct = 82;

  const meanX = scaleX(stats.mean, stats);
  const medianX = scaleX(stats.median, stats);
  const q1X = scaleX(stats.q1, stats);
  const q3X = scaleX(stats.q3, stats);
  const highRiskRegionStart = scaleX(70, stats);

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-3 ${cohortTopCutoffs ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-4"}`}>
        <div className="rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2">
          <p className={FDB_TYPO.legend}>분석 대상</p>
          <p className="font-mono text-lg font-semibold text-foreground">
            {stats.schoolCount.toLocaleString("ko-KR")}개교
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2">
          <p className={FDB_TYPO.legend}>중앙값 (Median)</p>
          <p className="font-mono text-lg font-semibold" style={{ color: DENSITY_GUIDE.median }}>
            {fmtPct(stats.median)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2">
          <p className={FDB_TYPO.legend}>평균 (가중)</p>
          <p className="font-mono text-lg font-semibold" style={{ color: DENSITY_GUIDE.mean }}>
            {fmtPct(stats.mean)}
          </p>
        </div>
        {cohortTopCutoffs ? (
          <>
            <div className="rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2">
              <p className={FDB_TYPO.legend}>동종 상위 15% 선</p>
              <p className="font-mono text-lg font-semibold" style={{ color: DENSITY_GUIDE.q3 }}>
                {cohortTopCutoffs.top15}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2">
              <p className={FDB_TYPO.legend}>동종 상위 7% 선</p>
              <p className="font-mono text-lg font-semibold" style={{ color: DENSITY_GUIDE.q3 }}>
                {cohortTopCutoffs.top7}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border/60 bg-surface-2/40 px-3 py-2">
            <p className={FDB_TYPO.legend}>70%+ (고의존)</p>
            <p className="font-mono text-lg font-semibold text-rose-600">
              {stats.highDependencyCount.toLocaleString("ko-KR")}개교
            </p>
          </div>
        )}
      </div>

      <DensityQuartileLegend
        q1={stats.q1}
        median={stats.median}
        q3={stats.q3}
        mean={stats.mean}
        formatPct={fmtPct}
      />

      <div className="relative h-[360px] w-full rounded-lg border border-border/60 bg-surface-2/20 p-2">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="등록금의존율 밀도 분포 차트"
        >
          {yTicks.map((val) => {
            const y = scaleY(val, stats);
            return (
              <g key={`y-${val}`}>
                <line
                  x1="8"
                  y1={y}
                  x2="96"
                  y2={y}
                  stroke={CHART.grid}
                  strokeDasharray="1 2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {xTicks.map((val) => {
            const x = scaleX(val, stats);
            return (
              <g key={`x-${val}`}>
                <line
                  x1={x}
                  y1="12"
                  x2={x}
                  y2="82"
                  stroke={CHART.grid}
                  strokeDasharray="1 2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          <path
            d={buildAreaPath(stats)}
            fill={`${CHART.mint}44`}
            stroke={CHART.mint}
            strokeWidth="0.35"
            vectorEffect="non-scaling-stroke"
          />

          <line
            x1="8"
            y1="82"
            x2="96"
            y2="82"
            stroke={CHART.grid}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          <rect
            x={highRiskRegionStart}
            y="12"
            width={96 - highRiskRegionStart}
            height="70"
            fill={`${CHART.rose}11`}
          />

          <DensityQuartileMarks q1X={q1X} medianX={medianX} q3X={q3X} meanX={meanX} />
        </svg>

        <div className="pointer-events-none absolute inset-0 p-3">
          {yTicks.map((val) => {
            const y = scaleY(val, stats);
            return (
              <span
                key={`y-label-${val}`}
                className="absolute font-mono text-[11px] text-white"
                style={{ top: `${y}%`, left: "0.25%", transform: "translateY(-50%)" }}
              >
                {val}
              </span>
            );
          })}
          {xTicks.map((val) => {
            const x = scaleX(val, stats);
            return (
              <span
                key={`x-label-${val}`}
                className="absolute font-mono text-[11px] leading-none text-white"
                style={{
                  left: `${x}%`,
                  top: `${baselinePct + 1.5}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {val}%
              </span>
            );
          })}
          {stats.rawMax > stats.displayXMax ? (
            <span
              className="absolute text-[10px] text-muted"
              style={{ right: "2%", top: `${baselinePct + 1.5}%` }}
            >
              (최대 {stats.rawMax}%)
            </span>
          ) : null}
          <p className={`absolute left-3 top-2 ${FDB_TYPO.legend} font-medium text-muted` }>
            ▲ 대학/그룹 수
          </p>
          <DensityQuartilePlotLabels
            q1X={q1X}
            medianX={medianX}
            q3X={q3X}
            meanX={meanX}
            q1={stats.q1}
            median={stats.median}
            q3={stats.q3}
            mean={stats.mean}
            formatPct={fmtPct}
          />
          <p
            className="absolute text-[11px] text-muted"
            style={{ left: "50%", top: `${baselinePct + 6}%`, transform: "translateX(-50%)" }}
          >
            등록금의존율 (%)
          </p>
        </div>
      </div>

      <p className={FDB_TYPO.legend}>
        Y=대학/그룹 수, X=등록금의존율(%) — 표시 구간 {stats.displayXMin}%~
        {stats.displayXMax}%
        {stats.rawMax > stats.displayXMax
          ? ` (일부 극단값 ${stats.rawMax}%는 우측 꼬리에 합산)`
          : ""}
        . ≥50% {stats.above50Count.toLocaleString("ko-KR")}개교.
      </p>
    </div>
  );
}
