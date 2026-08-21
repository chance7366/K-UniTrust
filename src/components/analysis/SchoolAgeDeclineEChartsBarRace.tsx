"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";

import {
  alignBarRaceEntries,
  BAR_RACE_COLOR_LEGEND,
  BAR_RACE_FIXED_REGION_ORDER,
  barRaceBarColor,
  fmtIndex,
  type BarRaceEntry,
} from "@/lib/analysis/school-age-decline-analytics";

type SchoolAgeDeclineEChartsBarRaceProps = {
  entries: BarRaceEntry[];
};

export function SchoolAgeDeclineEChartsBarRace({
  entries,
}: SchoolAgeDeclineEChartsBarRaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const aligned = useMemo(() => alignBarRaceEntries(entries), [entries]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    chartRef.current = echarts.init(container, "dark");
    const resizeObserver = new ResizeObserver(() => chartRef.current?.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const values = aligned.map((entry) => entry.index);

    const option: EChartsOption = {
      backgroundColor: "transparent",
      grid: { top: 12, bottom: 30, left: 80, right: 90 },
      xAxis: {
        type: "value",
        min: 30,
        max: 130,
        axisLabel: { formatter: "{value}" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: [...BAR_RACE_FIXED_REGION_ORDER],
        axisLabel: { fontSize: 12, fontWeight: "bold" },
        animationDuration: 0,
        animationDurationUpdate: 0,
      },
      series: [
        {
          name: "학령인구 지수",
          type: "bar",
          data: values.map((value) => ({
            value,
            itemStyle: {
              color: barRaceBarColor(value),
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: (params) => {
              const value = typeof params.value === "number" ? params.value : 0;
              return `${fmtIndex(value)} %`;
            },
            color: "#e2e8f0",
            fontWeight: "bold",
          },
        },
      ],
      animationDuration: 0,
      animationDurationUpdate: 1400,
      animationEasing: "cubicInOut",
      animationEasingUpdate: "cubicInOut",
    };

    chart.setOption(option);
  }, [aligned]);

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-3 text-[11px] text-muted">
        {BAR_RACE_COLOR_LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div ref={containerRef} className="h-[480px] w-full" />
    </div>
  );
}
