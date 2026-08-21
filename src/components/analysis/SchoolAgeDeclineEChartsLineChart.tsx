"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";

import {
  SUDOGWON_REGIONS,
  type LineChartRegionFilter,
  type RegionIndexSeries,
} from "@/lib/analysis/school-age-decline-analytics";

type SchoolAgeDeclineEChartsLineChartProps = {
  sidoSeries: RegionIndexSeries[];
  nationalSeries: RegionIndexSeries;
  filter: LineChartRegionFilter;
};

export function SchoolAgeDeclineEChartsLineChart({
  sidoSeries,
  nationalSeries,
  filter,
}: SchoolAgeDeclineEChartsLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const xLabels = useMemo(
    () => nationalSeries.points.map((point) => String(point.year)),
    [nationalSeries.points],
  );

  const filteredSeries = useMemo(() => {
    if (filter === "SUDOGWON") {
      return sidoSeries.filter((series) =>
        (SUDOGWON_REGIONS as readonly string[]).includes(series.region),
      );
    }
    if (filter === "NON_SUDOGWON") {
      return sidoSeries.filter(
        (series) =>
          !(SUDOGWON_REGIONS as readonly string[]).includes(series.region),
      );
    }
    return sidoSeries;
  }, [filter, sidoSeries]);

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

    const regionLines = filteredSeries.map((series) => ({
      name: series.region,
      type: "line" as const,
      smooth: true,
      showSymbol: false,
      data: series.points.map((point) => Number(point.index.toFixed(1))),
      lineStyle: { width: 1.5, opacity: 0.6 },
    }));

    const nationalLine = {
      name: "전국 평균",
      type: "line" as const,
      smooth: true,
      showSymbol: true,
      symbolSize: 6,
      data: nationalSeries.points.map((point) =>
        Number(point.index.toFixed(1)),
      ),
      lineStyle: { width: 3.5, color: "#f43f5e", type: "dashed" as const },
      itemStyle: { color: "#f43f5e" },
      z: 10,
    };

    const option: EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#0f172a",
        borderColor: "#334155",
        textStyle: { color: "#f8fafc", fontSize: 11 },
      },
      grid: { top: 30, bottom: 40, left: 45, right: 25 },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLabel: { fontSize: 10, color: "#94a3b8" },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: 30,
        max: 130,
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      },
      series: [nationalLine, ...regionLines],
    };

    chart.setOption(option, true);
  }, [filteredSeries, nationalSeries, xLabels]);

  return <div ref={containerRef} className="mt-3 h-[360px] w-full" />;
}
