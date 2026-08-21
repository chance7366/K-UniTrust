"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { DensityQuartileLegend } from "@/components/analysis/DensityQuartileGuides";
import {
  HelpTip,
  PanelWithHelp,
} from "@/components/analysis/FundSecureRateAdvancedHelp";
import { ScoreDensityChart } from "@/components/analysis/competitiveness-analysis/ScoreDensityChart";
import { SoftMintChartTooltip } from "@/components/analysis/SoftMintChartTooltip";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import { fmtScore, type RunAnalyticsRow } from "@/lib/competitiveness-analysis/run-analytics";
import {
  ANALYTICS_ZONES,
} from "@/lib/competitiveness-analysis/run-analytics";
import { ANALYTICS_ZONE_STROKES } from "@/lib/analysis/korea-analytics-zones";
import {
  arithmeticMeanScore,
  buildRiskTotalRow,
  iqrScore,
  medianScore,
  q1Score,
  q3Score,
  weightedMeanScore,
} from "@/lib/competitiveness-analysis/risk-universities-analytics";
import {
  COMPOSITE_GRADE_COLORS,
  COMPOSITE_GRADE_LABELS,
  COMPOSITE_GRADE_ORDER,
  buildGradeBars,
  buildQuadrantPoints,
  buildScaleCompare,
  buildScaleTrend,
  buildScoreDensity,
  buildScoreHistogram,
  buildSidoRank,
  buildZoneCompare,
  buildZoneTrend,
  trendYDomain,
  type CompositeYearSeries,
  type ScoreComparePoint,
} from "@/lib/competitiveness-analysis/composite-competitiveness-analytics";

type CompositeSubTab = "geo" | "distribution" | "trend";

const CHART = {
  mint: CHART_THEME.amber,
  blue: "#3B82F6",
  grid: CHART_THEME.grid,
  axisLabel: CHART_THEME.axisLabel,
};

const ZONE_COLORS = ANALYTICS_ZONE_STROKES;

const SCALE_TREND_SERIES = [
  { key: "대규모", stroke: CHART.mint },
  { key: "중규모", stroke: CHART.blue },
  { key: "소규모", stroke: CHART_THEME.rose },
] as const;

function fmtYoy(value: number | null): string {
  if (value == null) return "—";
  if (value === 0) return "0.0";
  return `${value > 0 ? "▲" : "▼"} ${Math.abs(value).toFixed(1)}`;
}

function QuadrantScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: {
    payload?: {
      name?: string;
      student?: number;
      finance?: number;
      grade?: string | null;
    };
  }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point?.name) return null;
  return (
    <div className="chart-tip-stack">
      <div className="chart-tip-chip orange">
        <span>{point.grade ? `${point.grade}등급` : "대학"}</span>
        <strong>{point.name}</strong>
      </div>
      <div className="chart-tip-chip blue">
        <span>학생충원 지수</span>
        <strong>{fmtScore(point.student ?? Number.NaN)}</strong>
      </div>
      <div className="chart-tip-chip green">
        <span>대학재정 지수</span>
        <strong>{fmtScore(point.finance ?? Number.NaN)}</strong>
      </div>
    </div>
  );
}

function formatTooltipScore(value: number | string | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return fmtScore(n);
}

function KpiCard({
  label,
  value,
  sub,
  delta,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string | null;
  accent?: "mint" | "amber" | "rose" | "blue";
}) {
  const valueClass =
    accent === "mint"
      ? "text-accent"
      : accent === "amber"
        ? "text-accent-orange"
        : accent === "rose"
          ? "text-rose-600"
          : accent === "blue"
            ? "text-sky-600"
            : "text-foreground";
  const deltaPositive = delta?.startsWith("▲");

  return (
    <div className="rounded-xl border border-border bg-surface p-5 border-l-4 border-l-border/80">
      <div className="flex items-start justify-between gap-2">
        <p className={CHART_TYPO.kpiLabel}>{label}</p>
        {delta ? (
          <span
            className={`rounded-full px-2 py-0.5 ${CHART_TYPO.kpiDelta} ${
              deltaPositive
                ? "bg-emerald-500/15 text-emerald-600"
                : delta.startsWith("▼")
                  ? "bg-rose-500/15 text-rose-600"
                  : "bg-surface-2 text-muted"
            }`}
          >
            {delta}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${valueClass}`}>
        {value}
      </p>
      {sub ? <p className={`mt-1.5 ${CHART_TYPO.kpiSub}`}>{sub}</p> : null}
    </div>
  );
}

function ScoreCompareChart({
  data,
  avgName,
  xAxisAngle,
  xAxisHeight,
  barCategoryGap = "22%",
  maxBarSize = 42,
}: {
  data: ScoreComparePoint[];
  avgName: string;
  xAxisAngle?: number;
  xAxisHeight?: number;
  barCategoryGap?: string;
  maxBarSize?: number;
}) {
  if (!data.length) {
    return <p className={CHART_TYPO.bodyText}>표시할 데이터가 없습니다.</p>;
  }
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
          {avgName}
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
              yAxisId="score"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              width={36}
            />
            <YAxis
              yAxisId="yoy"
              orientation="right"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              width={36}
            />
            <SoftMintChartTooltip formatter={formatTooltipScore} />
            <Bar
              yAxisId="score"
              dataKey="avgRate"
              name={avgName}
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
              dot={{ r: 4, fill: CHART.blue, stroke: "#fff", strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CompositeCompetitivenessTab({
  rows,
  prevRows,
  yearSeries,
  analysisYear,
  cohortLabel,
}: {
  rows: RunAnalyticsRow[];
  prevRows: RunAnalyticsRow[];
  yearSeries: CompositeYearSeries[];
  analysisYear: number;
  cohortLabel: string;
}) {
  const [subTab, setSubTab] = useState<CompositeSubTab>("geo");

  const total = useMemo(
    () => buildRiskTotalRow(rows, prevRows),
    [rows, prevRows],
  );
  const iqr = useMemo(() => iqrScore(rows), [rows]);
  const eCount = rows.filter(
    (row) => !row.excludedFromRanking && row.grade === "E",
  ).length;
  const dCount = Math.max(0, total.riskCount - eCount);
  const meanScore = arithmeticMeanScore(rows);

  const zoneCompare = useMemo(
    () => buildZoneCompare(rows, prevRows),
    [rows, prevRows],
  );
  const scaleCompare = useMemo(
    () => buildScaleCompare(rows, prevRows),
    [rows, prevRows],
  );
  const sidoRank = useMemo(
    () => buildSidoRank(rows, prevRows),
    [rows, prevRows],
  );
  const gradeBars = useMemo(() => buildGradeBars(rows), [rows]);
  const histogram = useMemo(() => buildScoreHistogram(rows), [rows]);
  const density = useMemo(() => buildScoreDensity(rows), [rows]);
  const densityGuides = useMemo(() => {
    const ranked = rows.filter((row) => !row.excludedFromRanking);
    return {
      q1: q1Score(ranked),
      median: medianScore(ranked),
      q3: q3Score(ranked),
      mean: weightedMeanScore(ranked),
    };
  }, [rows]);
  const quadrant = useMemo(() => buildQuadrantPoints(rows), [rows]);
  const mergedSeries = useMemo(() => {
    const byYear = new Map<number, RunAnalyticsRow[]>();
    for (const point of yearSeries) byYear.set(point.year, point.rows);
    byYear.set(analysisYear, rows);
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, seriesRows]) => ({ year, rows: seriesRows }));
  }, [yearSeries, analysisYear, rows]);
  const zoneTrend = useMemo(() => buildZoneTrend(mergedSeries), [mergedSeries]);
  const scaleTrend = useMemo(
    () => buildScaleTrend(mergedSeries),
    [mergedSeries],
  );
  const zoneKeys = useMemo(() => {
    const keys: string[] = [...ANALYTICS_ZONES];
    if (zoneTrend.some((row) => row["기타"] != null)) keys.push("기타");
    return keys;
  }, [zoneTrend]);
  const zoneDomain = useMemo(
    () => trendYDomain(zoneTrend, zoneKeys),
    [zoneTrend, zoneKeys],
  );
  const scaleDomain = useMemo(
    () => trendYDomain(scaleTrend, ["대규모", "중규모", "소규모"]),
    [scaleTrend],
  );
  const yearRangeLabel =
    mergedSeries.length > 1
      ? `${mergedSeries[0]!.year}–${mergedSeries[mergedSeries.length - 1]!.year}`
      : `${analysisYear}`;

  const subTabs: { id: CompositeSubTab; label: string; help: string }[] = [
    {
      id: "geo",
      label: "지역·규모",
      help: "5극 3특 권역·학생 규모·17개 시·도 순위로 종합지수 수준과 전년 대비를 비교합니다. 막대는 학교별 산술평균입니다.",
    },
    {
      id: "distribution",
      label: "분포·등급",
      help: "종합지수 밀도·히스토그램·진단등급 학교 수·학생충원×대학재정 사분면으로 평균에 가려진 분포를 봅니다.",
    },
    {
      id: "trend",
      label: "시계열",
      help: "저장된 연도별 분석결과로 권역별·규모별 종합지수 추이를 봅니다.",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="가중평균 종합점수"
          value={total.avgScore == null ? "—" : fmtScore(total.avgScore)}
          delta={fmtYoy(total.yoy)}
          sub={`재학생수 가중 · ${analysisYear}년`}
          accent="mint"
        />
        <KpiCard
          label="산술평균"
          value={meanScore == null ? "—" : fmtScore(meanScore)}
          sub="학교별 평균"
        />
        <KpiCard
          label="중앙값 & IQR"
          value={total.median == null ? "—" : fmtScore(total.median)}
          sub={iqr == null ? undefined : `IQR( Q3−Q1 ) = ${fmtScore(iqr)}`}
          accent="blue"
        />
        <KpiCard
          label="위험군 대학 수"
          value={`${total.riskCount.toLocaleString("ko-KR")}개교`}
          sub={`D등급 ${dCount} · E등급 ${eCount}`}
          accent="rose"
        />
        <KpiCard
          label="분석 대상"
          value={`${total.schoolCount.toLocaleString("ko-KR")}개교`}
          sub={`${analysisYear}년 · ${cohortLabel}`}
          accent="amber"
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {subTabs.map((tab) => (
          <span key={tab.id} className="inline-flex items-center">
            <button
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`rounded-md px-4 py-2 transition-colors ${
                subTab === tab.id
                  ? `${CHART_TYPO.sectionTab} bg-surface text-foreground shadow-sm ring-1 ring-border`
                  : `${CHART_TYPO.sectionTabInactive} hover:text-foreground`
              }`}
            >
              {tab.label}
            </button>
            <HelpTip
              help={{ title: tab.label, body: tab.help }}
              className="mr-1"
            />
          </span>
        ))}
      </div>

      {subTab === "geo" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <PanelWithHelp
              title="5극 3특 권역 비교"
              help={{
                title: "5극 3특 권역 비교",
                body: "권역별 산술평균 종합지수(막대)와 전년 대비 증감(선)입니다. 권역은 수도권·충청권·동남권·대경권·서남권·강원권·전북권·제주권입니다.",
              }}
            >
              <ScoreCompareChart
                data={zoneCompare}
                avgName="평균 종합지수"
                xAxisAngle={-20}
                xAxisHeight={48}
                barCategoryGap="18%"
                maxBarSize={32}
              />
            </PanelWithHelp>
            <PanelWithHelp
              title="학생 규모 비교"
              help={{
                title: "학생 규모 비교",
                body: "재학생수 기준 대규모·중규모·소규모 평균 종합지수입니다. 대학 10,000/5,000 · 전문대 4,000/2,000.",
              }}
            >
              <ScoreCompareChart data={scaleCompare} avgName="평균 종합지수" />
            </PanelWithHelp>
          </div>
          <PanelWithHelp
            title="17개 시·도 순위"
            help={{
              title: "17개 시·도 순위",
              body: "시·도별 산술평균 종합지수(막대)와 전년 대비(선)를 높은 순으로 나열합니다.",
            }}
          >
            <ScoreCompareChart
              data={sidoRank}
              avgName="평균 종합지수"
              xAxisAngle={-45}
              xAxisHeight={56}
              barCategoryGap="28%"
              maxBarSize={36}
            />
          </PanelWithHelp>
        </>
      ) : null}

      {subTab === "distribution" ? (
        <>
          <PanelWithHelp
            title="종합지수 밀도 분포"
            subtitle="학교별 종합지수 0–100 — 하위 25%·중앙값·상위 25%·평균"
            help={{
              title: "종합지수 밀도 분포",
              body: "5점 구간 학교 수입니다. 하위 25%·중앙값·상위 25%·가중평균 위치를 재정분석 밀도분포와 같이 표시합니다.",
            }}
          >
            {densityGuides.q1 != null &&
            densityGuides.median != null &&
            densityGuides.q3 != null &&
            densityGuides.mean != null ? (
              <div className="flex flex-col gap-3">
                <DensityQuartileLegend
                  q1={densityGuides.q1}
                  median={densityGuides.median}
                  q3={densityGuides.q3}
                  mean={densityGuides.mean}
                  formatPct={(value) => `${fmtScore(value)}점`}
                />
                <ScoreDensityChart
                  points={density}
                  q1={densityGuides.q1}
                  median={densityGuides.median}
                  q3={densityGuides.q3}
                  mean={densityGuides.mean}
                  axisLabel="종합지수"
                />
              </div>
            ) : (
              <p className={CHART_TYPO.bodyText}>표시할 분포 데이터가 없습니다.</p>
            )}
          </PanelWithHelp>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <PanelWithHelp
              title="진단등급 단계별 학교 수"
              subtitle={`S~E 컷오프 · ${analysisYear}년 ${cohortLabel}`}
              help={{
                title: "진단등급 단계별 학교 수",
                body: "종합지수 컷오프 S 77 · A 65 · B 56 · C 44 · D 30 기준입니다. 재정분석의 위험 단계 막대와 같은 역할입니다.",
              }}
            >
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gradeBars}
                    margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
                  >
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      width={28}
                    />
                    <SoftMintChartTooltip />
                    <Bar dataKey="count" name="학교 수" radius={[4, 4, 0, 0]}>
                      {gradeBars.map((row) => (
                        <Cell key={row.grade} fill={row.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PanelWithHelp>
            <PanelWithHelp
              title="종합지수 히스토그램"
              subtitle="0–100점 5구간 · 20점 간격"
              help={{
                title: "종합지수 히스토그램",
                body: "종합지수 0–100점을 20점 간격 5구간(0–20, 20–40, 40–60, 60–80, 80–100)으로 나눈 학교 수입니다. 진단등급 막대와는 구간이 다릅니다.",
              }}
            >
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={histogram}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="bin"
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      width={28}
                    />
                    <SoftMintChartTooltip />
                    <Bar dataKey="count" name="학교 수" radius={[4, 4, 0, 0]}>
                      {histogram.map((row) => (
                        <Cell key={row.bin} fill={row.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PanelWithHelp>
          </div>

          <PanelWithHelp
            title="종합지수 사분면 — 학생충원 × 대학재정"
            subtitle="축 교차는 지수 50점 · 좌하=동반 취약 · 우상=균형 우위"
            help={{
              title: "종합지수 사분면",
              body: "한 점이 한 대학입니다. 가로축은 학생충원 지수, 세로축은 대학재정 지수입니다. 점 색은 종합지수 진단등급(S~E)입니다. 마우스를 올리면 대학명이 표시됩니다.",
            }}
          >
            <div
              className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1"
              style={{ fontSize: CHART_TYPO.tickPx, color: CHART.axisLabel }}
            >
              {COMPOSITE_GRADE_ORDER.map((grade) => (
                <span key={grade} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: COMPOSITE_GRADE_COLORS[grade] }}
                  />
                  {COMPOSITE_GRADE_LABELS[grade]}
                </span>
              ))}
            </div>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                  <XAxis
                    type="number"
                    dataKey="student"
                    name="학생충원"
                    domain={[0, 100]}
                    tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                    label={{
                      value: "학생충원 지수",
                      position: "insideBottom",
                      offset: -4,
                      fontSize: CHART_TYPO.tickPx,
                      fill: CHART.axisLabel,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="finance"
                    name="대학재정"
                    domain={[0, 100]}
                    tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                    width={40}
                    label={{
                      value: "대학재정 지수",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: CHART_TYPO.tickPx,
                      fill: CHART.axisLabel,
                    }}
                  />
                  <ZAxis range={[40, 40]} />
                  <ReferenceLine x={50} stroke="#94A3B8" strokeDasharray="4 4" />
                  <ReferenceLine y={50} stroke="#94A3B8" strokeDasharray="4 4" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={<QuadrantScatterTooltip />}
                  />
                  {COMPOSITE_GRADE_ORDER.map((grade) => (
                    <Scatter
                      key={grade}
                      name={`${grade}등급`}
                      data={quadrant.filter((point) => point.grade === grade)}
                      fill={COMPOSITE_GRADE_COLORS[grade]}
                      fillOpacity={0.8}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className={`mt-2 ${CHART_TYPO.legend}`}>
              좌상 재정 우위·충원 취약 · 우상 충원·재정 균형 우위 · 좌하 동반 취약 ·
              우하 충원 우위·재정 취약
            </p>
          </PanelWithHelp>
        </>
      ) : null}

      {subTab === "trend" ? (
        mergedSeries.length < 2 ? (
          <p className={CHART_TYPO.bodyText}>
            시계열을 보려면 다른 분석연도의 분석결과가 저장되어 있어야 합니다.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <PanelWithHelp
              title="권역별 추이"
              subtitle={`5극 3특 권역 산술평균 종합지수 · ${yearRangeLabel}`}
              help={{
                title: "권역별 추이",
                body: "저장된 연도별 분석결과로 5극 3특 권역 평균 종합지수 추이를 봅니다.",
              }}
            >
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={zoneTrend}
                    margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                    />
                    <YAxis
                      domain={zoneDomain}
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      width={36}
                    />
                    <SoftMintChartTooltip formatter={formatTooltipScore} />
                    <Legend
                      itemSorter={null}
                      wrapperStyle={{
                        fontSize: CHART_TYPO.tickPx,
                        color: CHART.axisLabel,
                      }}
                    />
                    {zoneKeys.map((zone, i) => (
                      <Line
                        key={zone}
                        type="monotone"
                        dataKey={zone}
                        stroke={ZONE_COLORS[i % ZONE_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PanelWithHelp>
            <PanelWithHelp
              title="규모별 추이"
              subtitle={`대규모·중규모·소규모 평균 종합지수 · ${yearRangeLabel}`}
              help={{
                title: "규모별 추이",
                body: "소규모 대학의 종합지수가 중·대규모보다 가파르게 내려가는지 봅니다. 규모 분류는 3단계와 같습니다.",
              }}
            >
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={scaleTrend}
                    margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                    />
                    <YAxis
                      domain={scaleDomain}
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      width={36}
                    />
                    <SoftMintChartTooltip formatter={formatTooltipScore} />
                    <Legend
                      itemSorter={null}
                      wrapperStyle={{
                        fontSize: CHART_TYPO.tickPx,
                        color: CHART.axisLabel,
                      }}
                    />
                    {SCALE_TREND_SERIES.map((series) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        stroke={series.stroke}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PanelWithHelp>
          </div>
        )
      ) : null}
    </div>
  );
}
