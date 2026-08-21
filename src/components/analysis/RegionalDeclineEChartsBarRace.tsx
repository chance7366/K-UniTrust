"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";

import {
  alignRegionalBarRaceEntries,
  fmtRegionalIndex,
  REGIONAL_DECLINE_FIXED_REGION_ORDER,
  type RegionalDeclineBarRaceEntry,
} from "@/lib/analysis/regional-decline-dashboard-analytics";
import {
  EXTINCTION_RISK_GRADE_LEGEND,
  getExtinctionRiskGradeStyle,
} from "@/lib/analysis/regional-decline-grade";

type RegionalDeclineEChartsBarRaceProps = {
  entries: RegionalDeclineBarRaceEntry[];
};

export function RegionalDeclineEChartsBarRace({
  entries,
}: RegionalDeclineEChartsBarRaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const aligned = useMemo(
    () => alignRegionalBarRaceEntries(entries),
    [entries],
  );

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

    const option: EChartsOption = {
      backgroundColor: "transparent",
      grid: { top: 12, bottom: 30, left: 80, right: 90 },
      xAxis: {
        type: "value",
        min: 0,
        max: 160,
        axisLabel: { formatter: "{value}" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: [...REGIONAL_DECLINE_FIXED_REGION_ORDER],
        axisLabel: { fontSize: 12, fontWeight: "bold" },
        animationDuration: 0,
        animationDurationUpdate: 0,
      },
      series: [
        {
          name: "소멸위험지수",
          type: "bar",
          data: aligned.map((entry) => ({
            value: entry.index,
            itemStyle: {
              color: entry.color,
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: (params) => {
              const value = typeof params.value === "number" ? params.value : 0;
              return fmtRegionalIndex(value);
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
        {EXTINCTION_RISK_GRADE_LEGEND.map((grade) => {
          const style = getExtinctionRiskGradeStyle(grade);
          return (
            <span key={grade} className="inline-flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: style.bg }}
              />
              등급 {style.label}
            </span>
          );
        })}
      </div>
      <div ref={containerRef} className="h-[480px] w-full" />
    </div>
  );
}
