"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { SoftMintChartTooltip } from "@/components/analysis/SoftMintChartTooltip";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import {
  SCALE_ORDER,
  type ScaleTrendPoint,
} from "@/lib/analysis/school-scale-trend";
import { CHART_THEME } from "@/lib/theme/teal-glow";

const CHART = {
  mint: CHART_THEME.amber,
  blue: "#3B82F6",
  amber: "#F59E0B",
  grid: CHART_THEME.grid,
  axisLabel: CHART_THEME.axisLabel,
};

const SCALE_STROKES = [CHART.mint, CHART.blue, CHART.amber] as const;

function formatTooltipPercent(value: number | string | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function ScaleTrendLineChart({ data }: { data: ScaleTrendPoint[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
          />
          <SoftMintChartTooltip formatter={formatTooltipPercent} />
          <Legend
            wrapperStyle={{
              fontSize: CHART_TYPO.tickPx,
              color: CHART.axisLabel,
            }}
          />
          {SCALE_ORDER.map((scale, i) => (
            <Line
              key={scale}
              type="monotone"
              dataKey={scale}
              stroke={SCALE_STROKES[i]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
