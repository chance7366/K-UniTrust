"use client";

import {
  DensityQuartileMarks,
  DensityQuartilePlotLabels,
} from "@/components/analysis/DensityQuartileGuides";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import { fmtScore } from "@/lib/competitiveness-analysis/run-analytics";

const CHART = {
  mint: CHART_THEME.amber,
  grid: CHART_THEME.grid,
};

function scaleScoreX(score: number) {
  const pad = 8;
  return pad + (score / 100) * (100 - pad * 2);
}

function scaleCountY(count: number, yMax: number) {
  const base = 82;
  const top = 12;
  return base - (count / Math.max(yMax, 1)) * (base - top);
}

function buildDensityAreaPath(
  points: { score: number; density: number }[],
  yMax: number,
): string {
  if (!points.length) return "";
  const baseline = 82;
  const topLine = points
    .map((point, index) => {
      const x = scaleScoreX(point.score);
      const y = scaleCountY(point.density, yMax);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const last = points[points.length - 1]!;
  const first = points[0]!;
  return `${topLine} L ${scaleScoreX(last.score)} ${baseline} L ${scaleScoreX(first.score)} ${baseline} Z`;
}

export function ScoreDensityChart({
  points,
  q1,
  median,
  q3,
  mean,
  axisLabel,
}: {
  points: { score: number; density: number }[];
  q1: number;
  median: number;
  q3: number;
  mean: number;
  axisLabel: string;
}) {
  const yMax = Math.max(...points.map((point) => point.density), 1);
  const yStep = yMax <= 8 ? 2 : yMax <= 20 ? 5 : 10;
  const yTicks: number[] = [];
  for (let value = 0; value <= yMax; value += yStep) {
    yTicks.push(Math.round(value));
  }
  if (yTicks[yTicks.length - 1] !== Math.round(yMax)) {
    yTicks.push(Math.round(yMax));
  }
  const xTicks = [0, 20, 40, 60, 80, 100];
  const baselinePct = 82;
  const q1X = scaleScoreX(q1);
  const medianX = scaleScoreX(median);
  const q3X = scaleScoreX(q3);
  const meanX = scaleScoreX(mean);

  return (
    <div className="relative h-[360px] w-full rounded-lg border border-border/60 bg-surface-2/20 p-2">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${axisLabel} 밀도 분포`}
      >
        {yTicks.map((value) => {
          const y = scaleCountY(value, yMax);
          return (
            <line
              key={`y-${value}`}
              x1="8"
              y1={y}
              x2="96"
              y2={y}
              stroke={CHART.grid}
              strokeDasharray="1 2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {xTicks.map((value) => {
          const x = scaleScoreX(value);
          return (
            <line
              key={`x-${value}`}
              x1={x}
              y1="12"
              x2={x}
              y2="82"
              stroke={CHART.grid}
              strokeDasharray="1 2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <path
          d={buildDensityAreaPath(points, yMax)}
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
        <DensityQuartileMarks
          q1X={q1X}
          medianX={medianX}
          q3X={q3X}
          meanX={meanX}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 p-3">
        {yTicks.map((value) => {
          const y = scaleCountY(value, yMax);
          return (
            <span
              key={`y-label-${value}`}
              className="absolute font-mono text-[11px] text-muted"
              style={{ top: `${y}%`, left: "0.25%", transform: "translateY(-50%)" }}
            >
              {value}
            </span>
          );
        })}
        {xTicks.map((value) => {
          const x = scaleScoreX(value);
          return (
            <span
              key={`x-label-${value}`}
              className="absolute font-mono text-[11px] leading-none text-muted"
              style={{
                left: `${x}%`,
                top: `${baselinePct + 1.5}%`,
                transform: "translateX(-50%)",
              }}
            >
              {value}
            </span>
          );
        })}
        <p className={`absolute left-3 top-2 ${FDB_TYPO.legend} font-medium text-muted`}>
          ▲ 학교 수
        </p>
        <DensityQuartilePlotLabels
          q1X={q1X}
          medianX={medianX}
          q3X={q3X}
          meanX={meanX}
          q1={q1}
          median={median}
          q3={q3}
          mean={mean}
          formatPct={(value) => `${fmtScore(value)}점`}
        />
        <p
          className="absolute text-[12px] text-muted"
          style={{
            left: "50%",
            top: `${baselinePct + 6}%`,
            transform: "translateX(-50%)",
          }}
        >
          {axisLabel}
        </p>
      </div>
    </div>
  );
}
