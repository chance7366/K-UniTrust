"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";

import type { RegionalDeclineSeries } from "@/lib/analysis/regional-decline-dashboard-analytics";
import {
  SUDOGWON_REGIONS,
  type LineChartRegionFilter,
} from "@/lib/analysis/school-age-decline-analytics";

type RegionalDeclineEChartsLineChartProps = {
  years: number[];
  sidoSeries: RegionalDeclineSeries[];
  nationalSeries: RegionalDeclineSeries;
  filter: LineChartRegionFilter;
};

export function RegionalDeclineEChartsLineChart({
  years,
  sidoSeries,
  nationalSeries,
  filter,
}: RegionalDeclineEChartsLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const xLabels = useMemo(
    () => years.map((year) => String(year)),
    [years],
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
      data: years.map((year) => {
        const point = series.points.find((p) => p.year === year);
        return point ? Number(point.index.toFixed(1)) : null;
      }),
      lineStyle: { width: 1.5, opacity: 0.6 },
    }));

    const nationalLine = {
      name: "전국",
      type: "line" as const,
      smooth: true,
      showSymbol: true,
      symbolSize: 6,
      data: years.map((year) => {
        const point = nationalSeries.points.find((p) => p.year === year);
        return point ? Number(point.index.toFixed(1)) : null;
      }),
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
        min: 0,
        max: 160,
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      },
      series: [nationalLine, ...regionLines],
    };

    chart.setOption(option, true);
  }, [filteredSeries, nationalSeries, xLabels, years]);

  return <div ref={containerRef} className="mt-3 h-[360px] w-full" />;
}
