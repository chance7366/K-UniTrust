"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  GraduationCap,
  Landmark,
  Wallet,
} from "lucide-react";
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
import { ANALYTICS_ZONE_STROKES } from "@/lib/analysis/korea-analytics-zones";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import {
  ANALYTICS_ZONES,
  fmtScore,
  type RunAnalyticsRow,
} from "@/lib/competitiveness-analysis/run-analytics";
import {
  COMPOSITE_GRADE_COLORS,
  COMPOSITE_GRADE_LABELS,
  COMPOSITE_GRADE_ORDER,
  type CompositeYearSeries,
  type ScoreComparePoint,
} from "@/lib/competitiveness-analysis/composite-competitiveness-analytics";
import {
  SECTOR_DEFS,
  SECTOR_ORDER,
  buildSectorDensity,
  buildSectorGradeBars,
  buildSectorHistogram,
  buildSectorKpis,
  buildSectorQuadrantPoints,
  buildSectorScaleCompare,
  buildSectorScaleTrend,
  buildSectorSidoRank,
  buildSectorZoneCompare,
  buildSectorZoneTrend,
  trendYDomain,
  type SectorId,
} from "@/lib/competitiveness-analysis/sector-competitiveness-analytics";

type SectorSubTab = "geo" | "distribution" | "trend";

const CHART = {
  mint: CHART_THEME.amber,
  blue: "#3B82F6",
  grid: CHART_THEME.grid,
  axisLabel: CHART_THEME.axisLabel,
};

const SECTOR_ICONS = {
  student: GraduationCap,
  univFinance: Landmark,
  corpFinance: Building2,
} as const;

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

function SectorQuadrantTooltip({
  active,
  payload,
  xLabel,
  yLabel,
}: {
  active?: boolean;
  payload?: {
    payload?: {
      name?: string;
      x?: number;
      y?: number;
      grade?: string | null;
    };
  }[];
  xLabel: string;
  yLabel: string;
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
        <span>{xLabel}</span>
        <strong>{fmtScore(point.x ?? Number.NaN)}</strong>
      </div>
      <div className="chart-tip-chip green">
        <span>{yLabel}</span>
        <strong>{fmtScore(point.y ?? Number.NaN)}</strong>
      </div>
    </div>
  );
}

export function SectorCompetitivenessTab({
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
  const [sectorId, setSectorId] = useState<SectorId>("student");
  const [subTab, setSubTab] = useState<SectorSubTab>("geo");
  const sector = SECTOR_DEFS[sectorId];

  const kpis = useMemo(
    () => buildSectorKpis(rows, prevRows, sectorId),
    [rows, prevRows, sectorId],
  );
  const zoneCompare = useMemo(
    () => buildSectorZoneCompare(rows, prevRows, sectorId),
    [rows, prevRows, sectorId],
  );
  const scaleCompare = useMemo(
    () => buildSectorScaleCompare(rows, prevRows, sectorId),
    [rows, prevRows, sectorId],
  );
  const sidoRank = useMemo(
    () => buildSectorSidoRank(rows, prevRows, sectorId),
    [rows, prevRows, sectorId],
  );
  const gradeBars = useMemo(
    () => buildSectorGradeBars(rows, sectorId),
    [rows, sectorId],
  );
  const histogram = useMemo(
    () => buildSectorHistogram(rows, sectorId),
    [rows, sectorId],
  );
  const density = useMemo(
    () => buildSectorDensity(rows, sectorId),
    [rows, sectorId],
  );
  const quadrant = useMemo(
    () => buildSectorQuadrantPoints(rows, sectorId),
    [rows, sectorId],
  );
  const mergedSeries = useMemo(() => {
    const byYear = new Map<number, RunAnalyticsRow[]>();
    for (const point of yearSeries) byYear.set(point.year, point.rows);
    byYear.set(analysisYear, rows);
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, seriesRows]) => ({ year, rows: seriesRows }));
  }, [yearSeries, analysisYear, rows]);
  const zoneTrend = useMemo(
    () => buildSectorZoneTrend(mergedSeries, sectorId),
    [mergedSeries, sectorId],
  );
  const scaleTrend = useMemo(
    () => buildSectorScaleTrend(mergedSeries, sectorId),
    [mergedSeries, sectorId],
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

  const subTabs: { id: SectorSubTab; label: string; help: string }[] = [
    {
      id: "geo",
      label: "지역·규모",
      help: `5극 3특 권역·학생 규모·17개 시·도 순위로 ${sector.scoreName} 수준과 전년 대비를 비교합니다. 막대는 학교별 산술평균입니다.`,
    },
    {
      id: "distribution",
      label: "분포·등급",
      help: `${sector.scoreName} 밀도·히스토그램·부문 진단등급·구성 지표 사분면으로 평균에 가려진 분포를 봅니다.`,
    },
    {
      id: "trend",
      label: "시계열",
      help: `저장된 연도별 분석결과로 권역별·규모별 ${sector.scoreName} 추이를 봅니다.`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex max-w-full flex-wrap gap-0.5 overflow-x-auto rounded-md border border-border bg-surface-2 p-0.5"
          role="tablist"
          aria-label="부문"
        >
          {SECTOR_ORDER.map((id) => {
            const item = SECTOR_DEFS[id];
            const Icon = SECTOR_ICONS[id];
            const isActive = sectorId === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSectorId(id)}
                className={`inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded px-3 text-sm transition-colors ${
                  isActive
                    ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                    : "font-medium text-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {item.label}
                <span className="text-xs text-muted">{item.weightPct}%</span>
              </button>
            );
          })}
        </div>
        <span className={`inline-flex items-center gap-1 ${CHART_TYPO.legend}`}>
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          {sector.indicators
            .map((ind) => `${ind.label} ${ind.weightPct}%`)
            .join(" · ")}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={`가중평균 ${sector.scoreName}`}
          value={kpis.weighted == null ? "—" : fmtScore(kpis.weighted)}
          delta={fmtYoy(kpis.yoy)}
          sub={`재학생수 가중 · ${analysisYear}년`}
          accent="mint"
        />
        <KpiCard
          label="산술평균"
          value={kpis.mean == null ? "—" : fmtScore(kpis.mean)}
          sub="학교별 평균"
        />
        <KpiCard
          label="중앙값 & IQR"
          value={kpis.median == null ? "—" : fmtScore(kpis.median)}
          sub={kpis.iqr == null ? undefined : `IQR( Q3−Q1 ) = ${fmtScore(kpis.iqr)}`}
          accent="blue"
        />
        <KpiCard
          label="부문 위험군"
          value={`${(kpis.riskD + kpis.riskE).toLocaleString("ko-KR")}개교`}
          sub={`D등급 ${kpis.riskD} · E등급 ${kpis.riskE}`}
          accent="rose"
        />
        <KpiCard
          label="분석 대상"
          value={`${kpis.schoolCount.toLocaleString("ko-KR")}개교`}
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
                body: `권역별 산술평균 ${sector.scoreName}(막대)와 전년 대비 증감(선)입니다. 권역은 수도권·충청권·동남권·대경권·서남권·강원권·전북권·제주권입니다.`,
              }}
            >
              <ScoreCompareChart
                data={zoneCompare}
                avgName={`평균 ${sector.scoreName}`}
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
                body: `재학생수 기준 대규모·중규모·소규모 평균 ${sector.scoreName}입니다. 대학 10,000/5,000 · 전문대 4,000/2,000.`,
              }}
            >
              <ScoreCompareChart
                data={scaleCompare}
                avgName={`평균 ${sector.scoreName}`}
              />
            </PanelWithHelp>
          </div>
          <PanelWithHelp
            title="17개 시·도 순위"
            help={{
              title: "17개 시·도 순위",
              body: `시·도별 산술평균 ${sector.scoreName}(막대)와 전년 대비(선)를 높은 순으로 나열합니다.`,
            }}
          >
            <ScoreCompareChart
              data={sidoRank}
              avgName={`평균 ${sector.scoreName}`}
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
            title={`${sector.scoreName} 밀도 분포`}
            subtitle={`학교별 ${sector.scoreName} 0–100 — 하위 25%·중앙값·상위 25%·평균`}
            help={{
              title: `${sector.scoreName} 밀도 분포`,
              body: "5점 구간 학교 수입니다. 하위 25%·중앙값·상위 25%·가중평균 위치를 선과 숫자로 표시합니다.",
            }}
          >
            {kpis.q1 != null &&
            kpis.median != null &&
            kpis.q3 != null &&
            kpis.weighted != null ? (
              <div className="flex flex-col gap-3">
                <DensityQuartileLegend
                  q1={kpis.q1}
                  median={kpis.median}
                  q3={kpis.q3}
                  mean={kpis.weighted}
                  formatPct={(value) => `${fmtScore(value)}점`}
                />
                <ScoreDensityChart
                  points={density}
                  q1={kpis.q1}
                  median={kpis.median}
                  q3={kpis.q3}
                  mean={kpis.weighted}
                  axisLabel={sector.scoreName}
                />
              </div>
            ) : (
              <p className={CHART_TYPO.bodyText}>표시할 분포 데이터가 없습니다.</p>
            )}
          </PanelWithHelp>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <PanelWithHelp
              title="부문 진단등급 단계별 학교 수"
              subtitle={`종합과 동일 컷오프를 ${sector.scoreName}에 적용 · ${analysisYear}년 ${cohortLabel}`}
              help={{
                title: "부문 진단등급",
                body: "종합지수 컷오프 S 77 · A 65 · B 56 · C 44 · D 30를 해당 부문 지수에 적용합니다.",
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
              title={`${sector.scoreName} 히스토그램`}
              subtitle="0–100점 5구간 · 20점 간격"
              help={{
                title: `${sector.scoreName} 히스토그램`,
                body: "부문 지수 0–100점을 20점 간격 5구간으로 나눈 학교 수입니다.",
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
            title={`${sector.label} 사분면 — ${sector.quadrantXLabel} × ${sector.quadrantYLabel}`}
            subtitle="축 교차는 지수 50점 · 한 점이 한 대학"
            help={{
              title: `${sector.label} 사분면`,
              body: "한 점이 한 대학입니다. 점 색은 부문 지수에 종합 컷오프를 적용한 등급(S~E)입니다. 마우스를 올리면 대학명이 표시됩니다.",
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
              {quadrant.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={sector.quadrantXLabel}
                      domain={[0, 100]}
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      label={{
                        value: sector.quadrantXLabel,
                        position: "insideBottom",
                        offset: -4,
                        fontSize: CHART_TYPO.tickPx,
                        fill: CHART.axisLabel,
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={sector.quadrantYLabel}
                      domain={[0, 100]}
                      tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                      width={40}
                      label={{
                        value: sector.quadrantYLabel,
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
                      content={
                        <SectorQuadrantTooltip
                          xLabel={sector.quadrantXLabel}
                          yLabel={sector.quadrantYLabel}
                        />
                      }
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
              ) : (
                <p className={CHART_TYPO.bodyText}>표시할 사분면 데이터가 없습니다.</p>
              )}
            </div>
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
              subtitle={`5극 3특 권역 산술평균 ${sector.scoreName} · ${yearRangeLabel}`}
              help={{
                title: "권역별 추이",
                body: `저장된 연도별 분석결과로 5극 3특 권역 평균 ${sector.scoreName} 추이를 봅니다.`,
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
                        stroke={ANALYTICS_ZONE_STROKES[i % ANALYTICS_ZONE_STROKES.length]}
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
              subtitle={`대규모·중규모·소규모 평균 ${sector.scoreName} · ${yearRangeLabel}`}
              help={{
                title: "규모별 추이",
                body: `소규모 대학의 ${sector.scoreName}가 중·대규모보다 가파르게 내려가는지 봅니다. 규모 분류는 3단계와 같습니다.`,
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
