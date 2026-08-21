"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { SoftMintChartTooltip } from "@/components/analysis/SoftMintChartTooltip";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";

const CHART = {
  mint: CHART_THEME.amber,
  blue: "#3B82F6",
  grid: CHART_THEME.grid,
  axisLabel: CHART_THEME.axisLabel,
};

function formatTooltipPercent(value: number | string | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function GeoCompareComposedChart({
  data,
  avgRateName,
  xAxisAngle,
  xAxisHeight,
  barCategoryGap = "22%",
  maxBarSize = 42,
}: {
  data: { region: string; avgRate: number | null; yoy: number | null }[];
  avgRateName: string;
  xAxisAngle?: number;
  xAxisHeight?: number;
  barCategoryGap?: string;
  maxBarSize?: number;
}) {
  return (
    <div className="flex h-[320px] w-full flex-col">
      <div
        className="flex h-7 shrink-0 items-center justify-center gap-4"
        style={{ fontSize: CHART_TYPO.tickPx, color: CHART.axisLabel }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: CHART.mint }}
          />
          {avgRateName}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-3.5 rounded-full"
            style={{ background: CHART.blue }}
          />
          전년 대비
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            barCategoryGap={barCategoryGap}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="region"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              interval={0}
              angle={xAxisAngle}
              textAnchor={xAxisAngle != null ? "end" : "middle"}
              height={xAxisHeight}
            />
            <YAxis
              yAxisId="rate"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />
            <YAxis
              yAxisId="yoy"
              orientation="right"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              tickFormatter={(v) => `${v}%p`}
              width={36}
            />
            <SoftMintChartTooltip formatter={formatTooltipPercent} />
            <Bar
              yAxisId="rate"
              dataKey="avgRate"
              name={avgRateName}
              fill={CHART.mint}
              radius={[4, 4, 0, 0]}
              maxBarSize={maxBarSize}
            />
            <Line
              yAxisId="yoy"
              type="monotone"
              dataKey="yoy"
              name="전년 대비"
              stroke={CHART.blue}
              strokeWidth={2.5}
              connectNulls
              dot={{ r: 4, fill: CHART.blue, stroke: "#fff", strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
