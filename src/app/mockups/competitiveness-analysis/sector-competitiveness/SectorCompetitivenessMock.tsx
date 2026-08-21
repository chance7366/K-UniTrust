"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  Database,
  GraduationCap,
  Landmark,
  Layers3,
  PieChart,
  TrendingUp,
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
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { DensityQuartileLegend } from "@/components/analysis/DensityQuartileGuides";
import { ScoreDensityChart } from "@/components/analysis/competitiveness-analysis/ScoreDensityChart";
import {
  HelpTip,
  PanelWithHelp,
} from "@/components/analysis/FundSecureRateAdvancedHelp";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { SoftMintChartTooltip } from "@/components/analysis/SoftMintChartTooltip";
import { CompetitivenessShell } from "@/components/analysis/competitiveness-analysis/CompetitivenessShell";
import { ANALYTICS_ZONES, ANALYTICS_ZONE_STROKES } from "@/lib/analysis/korea-analytics-zones";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  COMPOSITE_GRADE_COLORS,
  COMPOSITE_GRADE_LABELS,
  COMPOSITE_GRADE_ORDER,
} from "@/lib/competitiveness-analysis/composite-competitiveness-analytics";
import { CHART_THEME } from "@/lib/theme/teal-glow";

import {
  SECTOR_MOCKS,
  SECTOR_ORDER,
  type SectorId,
  type SectorMock,
} from "./mock-data";

type AnalyticsInnerTab =
  | "risk"
  | "composite"
  | "sector"
  | "all"
  | "step1"
  | "step2"
  | "step3";
type SectorSubTab = "geo" | "distribution" | "trend";
type MockRunCohort = "university" | "junior-college" | "compare";
type MockResultView = "step1" | "step2" | "step3" | "analytics";

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

function fmtScore(value: number): string {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtYoy(value: number): string {
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
  data: { region: string; avgRate: number | null; yoy: number | null }[];
  avgName: string;
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

function SectorGeoSection({ sector }: { sector: SectorMock }) {
  return (
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
            data={sector.zoneCompare}
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
            data={sector.scaleCompare}
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
          data={sector.sidoRank}
          avgName={`평균 ${sector.scoreName}`}
          xAxisAngle={-45}
          xAxisHeight={56}
          barCategoryGap="28%"
          maxBarSize={36}
        />
      </PanelWithHelp>
    </>
  );
}

function SectorDistributionSection({ sector }: { sector: SectorMock }) {
  return (
    <>
      <PanelWithHelp
        title={`${sector.scoreName} 밀도 분포`}
        subtitle={`학교별 ${sector.scoreName} 0–100 — 하위 25%·중앙값·상위 25%·평균`}
        help={{
          title: `${sector.scoreName} 밀도 분포`,
          body: "부문 지수 분포입니다. 하위 25%·중앙값·상위 25%·가중평균 위치를 종합경쟁력 탭과 같이 표시합니다.",
        }}
      >
        <div className="flex flex-col gap-3">
          <DensityQuartileLegend
            q1={sector.q1}
            median={sector.median}
            q3={sector.q3}
            mean={sector.weighted}
            formatPct={(value) => `${fmtScore(value)}점`}
          />
          <ScoreDensityChart
            points={sector.density}
            q1={sector.q1}
            median={sector.median}
            q3={sector.q3}
            mean={sector.weighted}
            axisLabel={sector.scoreName}
          />
        </div>
      </PanelWithHelp>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PanelWithHelp
          title="부문 진단등급 단계별 학교 수"
          subtitle="종합과 동일 컷오프를 부문 지수에 적용한 제안"
          help={{
            title: "부문 진단등급",
            body: "종합지수 컷오프 S 77 · A 65 · B 56 · C 44 · D 30를 해당 부문 지수에 그대로 적용한 목업입니다. 적용 시 부문 전용 컷오프를 둘지 결정할 수 있습니다.",
          }}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sector.gradeBars}
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
                  {sector.gradeBars.map((row) => (
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
            body: "부문 지수 0–100점을 20점 간격 5구간으로 나눈 학교 수입니다. 종합경쟁력 탭과 같은 구간입니다.",
          }}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sector.histogram}
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
                  {sector.histogram.map((row) => (
                    <Cell key={row.bin} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelWithHelp>
      </div>

      <PanelWithHelp
        title={`${sector.label} 사분면 — ${sector.quadrantX} × ${sector.quadrantY}`}
        subtitle="축 교차는 지수 50점 · 한 점이 한 대학"
        help={{
          title: `${sector.label} 사분면`,
          body: `해당 부문을 구성하는 두 지표 지수의 학교별 위치입니다. 점 색은 부문 지수에 종합 컷오프를 적용한 등급(S~E)입니다.`,
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
                dataKey="x"
                name={sector.quadrantX}
                domain={[0, 100]}
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                label={{
                  value: sector.quadrantX,
                  position: "insideBottom",
                  offset: -4,
                  fontSize: CHART_TYPO.tickPx,
                  fill: CHART.axisLabel,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={sector.quadrantY}
                domain={[0, 100]}
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                label={{
                  value: sector.quadrantY,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: CHART_TYPO.tickPx,
                  fill: CHART.axisLabel,
                }}
              />
              <ZAxis range={[50, 50]} />
              <ReferenceLine x={50} stroke="#94A3B8" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="#94A3B8" strokeDasharray="4 4" />
              <SoftMintChartTooltip formatter={formatTooltipScore} />
              {COMPOSITE_GRADE_ORDER.map((grade) => (
                <Scatter
                  key={grade}
                  name={grade}
                  data={sector.quadrant.filter((p) => p.grade === grade)}
                  fill={COMPOSITE_GRADE_COLORS[grade]}
                  fillOpacity={0.85}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className={`mt-2 ${CHART_TYPO.legend}`}>
          마우스를 올리면 대학명이 표시됩니다. 숫자는 예시입니다.
        </p>
      </PanelWithHelp>
    </>
  );
}

function SectorTrendSection({ sector }: { sector: SectorMock }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <PanelWithHelp
        title="5개년 권역별 추이"
        subtitle={`권역 산술평균 ${sector.scoreName} · 2021–2025`}
        help={{
          title: "5개년 권역별 추이",
          body: `저장된 연도별 분석결과로 권역 평균 ${sector.scoreName} 추이를 봅니다.`,
        }}
      >
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sector.zoneTrend}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              />
              <YAxis
                domain={[35, 75]}
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                width={36}
              />
              <SoftMintChartTooltip formatter={formatTooltipScore} />
              <Legend
                wrapperStyle={{
                  fontSize: CHART_TYPO.tickPx,
                  color: CHART.axisLabel,
                }}
              />
              {ANALYTICS_ZONES.map((zone, i) => (
                <Line
                  key={zone}
                  type="monotone"
                  dataKey={zone}
                  stroke={ANALYTICS_ZONE_STROKES[i]}
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
        title="5개년 규모별 추이"
        subtitle={`대규모·중규모·소규모 평균 ${sector.scoreName}`}
        help={{
          title: "5개년 규모별 추이",
          body: `소규모 대학의 ${sector.scoreName}가 중·대규모보다 가파르게 내려가는지 봅니다. 규모 분류는 3단계와 같습니다.`,
        }}
      >
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sector.scaleTrend}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              />
              <YAxis
                domain={[35, 80]}
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
              <Line
                type="monotone"
                dataKey="대규모"
                stroke={CHART.mint}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="중규모"
                stroke={CHART.blue}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="소규모"
                stroke={CHART_THEME.rose}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </PanelWithHelp>
    </div>
  );
}

export function SectorCompetitivenessMock() {
  const [cohort, setCohort] = useState<MockRunCohort>("university");
  const [innerTab, setInnerTab] = useState<AnalyticsInnerTab>("sector");
  const [sectorId, setSectorId] = useState<SectorId>("student");
  const [subTab, setSubTab] = useState<SectorSubTab>("geo");

  const sector = SECTOR_MOCKS[sectorId];

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
    <CompetitivenessShell activeTab="run">
      <section className="rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3">
        <p className={`font-medium text-foreground ${CHART_TYPO.bodyText}`}>
          목업 — 프로덕션 미적용
        </p>
        <p className={`mt-1 ${CHART_TYPO.legend}`}>
          통계분석에서 종합경쟁력 오른쪽에 <strong>부문경쟁력</strong> 탭을 둔
          제안입니다. 2단계 부문 지수(학생충원 50% · 대학재정 40% · 법인재정 10%)로
          지역·규모 / 분포·등급 / 시계열을 각각 봅니다. 숫자는 예시입니다.
        </p>
        <p className={`mt-2 ${CHART_TYPO.legend}`}>
          <Link
            href="/analysis/competitiveness-analysis/run?view=analytics"
            className="font-semibold text-accent hover:underline"
          >
            현재 통계분석
          </Link>
          {" · "}
          <Link
            href="/mockups/competitiveness-analysis/composite-competitiveness"
            className="font-semibold text-accent hover:underline"
          >
            종합경쟁력 목업
          </Link>
        </p>
      </section>

      <div className="mt-3 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex h-[30px] items-center rounded-md border border-border bg-surface px-2.5 ${FDB_TYPO.toolbarControl}`}
          >
            분석연도 2025
          </span>
          <GlassMintTabGroup<MockResultView>
            ariaLabel="분석결과 보기"
            active="analytics"
            onChange={() => undefined}
            items={[
              { id: "step1", label: "원지표값", icon: Database },
              { id: "step2", label: "지수·순위", icon: TrendingUp },
              { id: "step3", label: "종합지수", icon: Layers3 },
              { id: "analytics", label: "통계분석", icon: BarChart3 },
            ]}
          />
          <GlassMintTabGroup<MockRunCohort>
            ariaLabel="코호트"
            active={cohort}
            onChange={setCohort}
            items={[
              { id: "university", label: "대학", count: "202" },
              { id: "junior-college", label: "전문대학", count: "128" },
              { id: "compare", label: "대학전문" },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex max-w-full flex-wrap gap-0.5 overflow-x-auto rounded-md border border-border bg-surface-2 p-0.5"
            role="tablist"
            aria-label="통계분석 보기"
          >
            {(
              [
                { id: "risk", label: "위험군대학", icon: AlertTriangle },
                { id: "composite", label: "종합경쟁력", icon: Award },
                { id: "sector", label: "부문경쟁력", icon: PieChart },
                { id: "all", label: "통합 파이프라인 분석", icon: BarChart3 },
                { id: "step1", label: "1단계", icon: Database },
                { id: "step2", label: "2단계", icon: TrendingUp },
                { id: "step3", label: "3단계", icon: Layers3 },
              ] as const
            ).map((tab) => {
              const isActive = innerTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setInnerTab(tab.id)}
                  className={`inline-flex h-[30px] shrink-0 items-center gap-1 rounded px-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                      : "font-medium text-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-indigo-700" : "text-muted"
                    }`}
                    aria-hidden
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <HelpTip
            help={{
              title: "부문경쟁력 탭",
              body: "종합지수를 만든 세 부문(학생충원·대학재정·법인재정) 지수를 각각 지역·규모, 분포·등급, 시계열로 봅니다. 종합경쟁력 탭이 한 점수를 보는 자리라면, 이 탭은 부문별 구조입니다.",
            }}
          />
        </div>

        {innerTab === "sector" && cohort !== "compare" ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex max-w-full flex-wrap gap-0.5 overflow-x-auto rounded-md border border-border bg-surface-2 p-0.5"
                role="tablist"
                aria-label="부문"
              >
                {SECTOR_ORDER.map((id) => {
                  const item = SECTOR_MOCKS[id];
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
                      <span className="text-xs text-muted">
                        {item.weightPct}%
                      </span>
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
                value={fmtScore(sector.weighted)}
                delta={fmtYoy(sector.yoy)}
                sub={`재학생수 가중 · 2025년`}
                accent="mint"
              />
              <KpiCard
                label="산술평균"
                value={fmtScore(sector.mean)}
                sub="학교별 평균"
              />
              <KpiCard
                label="중앙값 & IQR"
                value={fmtScore(sector.median)}
                sub={`IQR( Q3−Q1 ) = ${fmtScore(sector.iqr)}`}
                accent="blue"
              />
              <KpiCard
                label="부문 위험군"
                value={`${(sector.riskD + sector.riskE).toLocaleString("ko-KR")}개교`}
                sub={`D등급 ${sector.riskD} · E등급 ${sector.riskE}`}
                accent="rose"
              />
              <KpiCard
                label="분석 대상"
                value={`${sector.schoolCount.toLocaleString("ko-KR")}개교`}
                sub="2025년 · 대학"
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

            {subTab === "geo" ? <SectorGeoSection sector={sector} /> : null}
            {subTab === "distribution" ? (
              <SectorDistributionSection sector={sector} />
            ) : null}
            {subTab === "trend" ? <SectorTrendSection sector={sector} /> : null}
          </>
        ) : innerTab === "composite" ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className={CHART_TYPO.bodyText}>
              종합경쟁력은 이미 프로덕션에 있습니다. 이 목업은{" "}
              <strong>부문경쟁력</strong> 탭만 구성했습니다.
            </p>
          </section>
        ) : innerTab === "risk" ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className={CHART_TYPO.bodyText}>
              위험군대학은 이미 프로덕션에 있습니다. 이 목업은{" "}
              <strong>부문경쟁력</strong> 탭만 구성했습니다.
            </p>
          </section>
        ) : cohort === "compare" ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className={CHART_TYPO.bodyText}>
              대학vs전문 비교는 이 목업에 넣지 않았습니다.
            </p>
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className={CHART_TYPO.bodyText}>
              통합 파이프라인·1·2·3단계는 현재 통계분석 화면과 같습니다.
            </p>
          </section>
        )}
      </div>
    </CompetitivenessShell>
  );
}
