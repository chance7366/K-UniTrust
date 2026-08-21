"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Database,
  Layers3,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
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

import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import {
  HelpTip,
  PanelWithHelp,
} from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SoftMintChartTooltip } from "@/components/analysis/SoftMintChartTooltip";
import { CompetitivenessShell } from "@/components/analysis/competitiveness-analysis/CompetitivenessShell";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";

import {
  DENSITY_POINTS,
  GRADE_BARS,
  QUADRANT_POINTS,
  SCALE_COMPARE,
  SCALE_TREND,
  SCORE_HISTOGRAM,
  SIDO_RANK,
  ZONE_COMPARE,
  ZONE_TREND,
} from "./mock-data";

type AnalyticsInnerTab =
  | "risk"
  | "composite"
  | "all"
  | "step1"
  | "step2"
  | "step3";
type CompositeSubTab = "geo" | "distribution" | "trend";
type MockRunCohort = "university" | "junior-college" | "compare";
type MockResultView = "step1" | "step2" | "step3" | "analytics";

const CHART = {
  mint: CHART_THEME.amber,
  blue: "#3B82F6",
  grid: CHART_THEME.grid,
  axisLabel: CHART_THEME.axisLabel,
};

const ZONE_COLORS = [
  CHART.mint,
  CHART.blue,
  CHART_THEME.violet,
  CHART_THEME.amber,
  CHART_THEME.emerald,
  CHART_THEME.rose,
] as const;

const ZONE_KEYS = [
  "수도권",
  "충청권",
  "호남권",
  "대경권",
  "동남권",
  "강원제주",
] as const;

function fmtScore(value: number): string {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
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
              tickFormatter={(v) => `${v}`}
              width={36}
            />
            <YAxis
              yAxisId="yoy"
              orientation="right"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              tickFormatter={(v) => `${v}`}
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

function CompositeGeoSection() {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PanelWithHelp
          title="6대 권역 비교"
          help={{
            title: "6대 권역 비교",
            body: "권역별 산술평균 종합지수(막대)와 전년 대비 증감(선)입니다. 대학경쟁력분석 권역은 수도권·충청권·호남권·대경권·동남권·강원제주입니다.",
          }}
        >
          <ScoreCompareChart
            data={ZONE_COMPARE}
            avgName="평균 종합지수"
          />
        </PanelWithHelp>
        <PanelWithHelp
          title="학생 규모 비교"
          help={{
            title: "학생 규모 비교",
            body: "재학생수 기준 대규모·중규모·소규모 평균 종합지수입니다. 대학 10,000/5,000 · 전문대 4,000/2,000.",
          }}
        >
          <ScoreCompareChart
            data={SCALE_COMPARE}
            avgName="평균 종합지수"
          />
        </PanelWithHelp>
      </div>
      <PanelWithHelp
        title="17개 시·도 순위"
        help={{
          title: "17개 시·도 순위",
          body: "시·도별 평균 종합지수(막대)와 전년 대비(선)를 높은 순으로 나열합니다.",
        }}
      >
        <ScoreCompareChart
          data={SIDO_RANK}
          avgName="평균 종합지수"
          xAxisAngle={-45}
          xAxisHeight={56}
          barCategoryGap="28%"
          maxBarSize={36}
        />
      </PanelWithHelp>
    </>
  );
}

function CompositeDistributionSection() {
  return (
    <>
      <PanelWithHelp
        title="종합지수 밀도 분포"
        subtitle="학교별 종합지수 0–100 · 중앙값 55.1 · 가중평균 56.4"
        help={{
          title: "종합지수 밀도 분포",
          body: "평균에 가려진 분포 형태를 봅니다. 왼쪽 봉우리가 크면 하위권 소규모 대학이 많고, 오른쪽 꼬리는 S·A등급 소수입니다.",
        }}
      >
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={DENSITY_POINTS}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="score"
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                label={{
                  value: "종합지수",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: CHART_TYPO.tickPx,
                  fill: CHART.axisLabel,
                }}
              />
              <YAxis
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                width={28}
              />
              <SoftMintChartTooltip formatter={formatTooltipScore} />
              <ReferenceLine
                x={56.4}
                stroke={CHART.mint}
                strokeDasharray="4 4"
              />
              <ReferenceLine
                x={55.1}
                stroke={CHART.blue}
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="density"
                name="밀도"
                stroke={CHART.mint}
                fill={CHART.mint}
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </PanelWithHelp>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PanelWithHelp
          title="진단등급 단계별 학교 수"
          subtitle="S~E 컷오프 · 2025년 대학 코호트"
          help={{
            title: "진단등급 단계별 학교 수",
            body: "종합지수 컷오프 S 77 · A 65 · B 56 · C 44 · D 30 기준입니다. 재정분석의 위험 단계 막대와 같은 역할입니다.",
          }}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={GRADE_BARS}
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
                  {GRADE_BARS.map((row) => (
                    <Cell key={row.grade} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelWithHelp>

        <PanelWithHelp
          title="종합지수 히스토그램"
          subtitle="등급 경계에 맞춘 6구간"
          help={{
            title: "종합지수 히스토그램",
            body: "진단등급 컷오프와 같은 구간으로 학교 수를 셉니다. 분포·등급 탭에서 밀도 곡선의 구간 버전입니다.",
          }}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={SCORE_HISTOGRAM}
                margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
              >
                <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                <XAxis
                  dataKey="bin"
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
                  {SCORE_HISTOGRAM.map((row) => (
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
          body: "3단계 종합점수를 만든 두 핵심 부문(학생충원 50% · 대학재정 40%)의 학교별 위치입니다. 좌하는 충원·재정이 함께 약한 위험군, 우상은 균형 우위입니다. 좌상은 재정은 되나 충원이 약한 대학, 우하는 충원은 되나 재정이 약한 대학입니다.",
        }}
      >
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
                label={{
                  value: "대학재정 지수",
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
              <Scatter
                name="대학"
                data={QUADRANT_POINTS}
                fill={CHART.blue}
                fillOpacity={0.8}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className={`mt-2 ${CHART_TYPO.legend}`}>
          좌상 재정 우위·충원 취약 · 우상 충원·재정 균형 우위 · 좌하 동반 취약 ·
          우하 충원 우위·재정 취약
        </p>
      </PanelWithHelp>
    </>
  );
}

function CompositeTrendSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <PanelWithHelp
        title="5개년 권역별 추이"
        subtitle="권역 산술평균 종합지수 · 2021–2025"
        help={{
          title: "5개년 권역별 추이",
          body: "저장된 연도별 분석결과로 권역 평균 종합지수 추이를 봅니다. 비수도권·소규모 권역의 하락이 두드러지는지 확인합니다.",
        }}
      >
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={ZONE_TREND}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              />
              <YAxis
                domain={[40, 70]}
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
              {ZONE_KEYS.map((zone, i) => (
                <Line
                  key={zone}
                  type="monotone"
                  dataKey={zone}
                  stroke={ZONE_COLORS[i]}
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
        subtitle="대규모·중규모·소규모 평균 종합지수"
        help={{
          title: "5개년 규모별 추이",
          body: "소규모 대학의 종합지수가 중·대규모보다 가파르게 내려가는지 봅니다. 규모 분류는 3단계와 같습니다.",
        }}
      >
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={SCALE_TREND}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              />
              <YAxis
                domain={[40, 75]}
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

export function CompositeCompetitivenessMock() {
  const [cohort, setCohort] = useState<MockRunCohort>("university");
  const [innerTab, setInnerTab] = useState<AnalyticsInnerTab>("composite");
  const [subTab, setSubTab] = useState<CompositeSubTab>("geo");

  const subTabs: { id: CompositeSubTab; label: string; help: string }[] = [
    {
      id: "geo",
      label: "지역·규모",
      help: "6대 권역·학생 규모·17개 시·도 순위로 종합지수 수준과 전년 대비를 비교합니다.",
    },
    {
      id: "distribution",
      label: "분포·등급",
      help: "종합지수 밀도·히스토그램·진단등급 학교 수·학생충원×대학재정 사분면으로 평균에 가려진 분포를 봅니다.",
    },
    {
      id: "trend",
      label: "시계열",
      help: "5개년 권역별·규모별 종합지수 추이입니다. 저장된 연도별 분석결과를 사용합니다.",
    },
  ];

  return (
    <CompetitivenessShell activeTab="run">
      <section className="rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3">
        <p className={`font-medium text-foreground ${CHART_TYPO.bodyText}`}>
          목업 — 프로덕션 미적용
        </p>
        <p className={`mt-1 ${CHART_TYPO.legend}`}>
          통계분석에서 위험군대학 오른쪽에 <strong>종합경쟁력</strong> 탭을 둔
          제안입니다. 재정분석의 지역·규모 / 분포·위험 / 시계열을 종합지수·진단등급
          기준으로 옮겼습니다. 숫자는 예시입니다.
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
            href="/analysis/finance-analysis?year=2024&section=charts&tab=corp-transfer-ratio"
            className="font-semibold text-accent hover:underline"
          >
            재정분석 통계분석 참고
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
              title: "종합경쟁력 탭",
              body: "3단계 종합지수와 진단등급으로 지역·규모·분포·시계열을 봅니다. 위험군대학 탭이 취약 대학 목록이라면, 이 탭은 집단 전체의 구조입니다.",
            }}
          />
        </div>

        {innerTab === "composite" && cohort !== "compare" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <KpiCard
                label="가중평균 종합점수"
                value="56.4"
                delta="▼ 1.2"
                sub="재학생수 가중 · 2025년"
                accent="mint"
              />
              <KpiCard
                label="산술평균"
                value="54.2"
                sub="학교별 평균"
              />
              <KpiCard
                label="중앙값 & IQR"
                value="55.1"
                sub="IQR( Q3−Q1 ) = 18.4"
                accent="blue"
              />
              <KpiCard
                label="위험군 대학 수"
                value="69개교"
                sub="D등급 43 · E등급 26"
                accent="rose"
              />
              <KpiCard
                label="분석 대상"
                value="202개교"
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

            {subTab === "geo" ? <CompositeGeoSection /> : null}
            {subTab === "distribution" ? (
              <CompositeDistributionSection />
            ) : null}
            {subTab === "trend" ? <CompositeTrendSection /> : null}
          </>
        ) : innerTab === "risk" ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className={CHART_TYPO.bodyText}>
              위험군대학은 이미 프로덕션에 있습니다. 이 목업은{" "}
              <strong>종합경쟁력</strong> 탭만 구성했습니다.
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
