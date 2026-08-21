"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { SoftMintChartTooltip } from "@/components/analysis/SoftMintChartTooltip";
import {
  HelpTip,
  PanelWithHelp,
} from "@/components/analysis/FundSecureRateAdvancedHelp";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";

const CHART = {
  mint: CHART_THEME.amber,
  blue: "#3B82F6",
  grid: CHART_THEME.grid,
  axisLabel: CHART_THEME.axisLabel,
};

const ZONE_DATA = [
  { label: "수도권", avgRate: 98.6, yoy: 0.3, schoolCount: 86 },
  { label: "충청권", avgRate: 95.1, yoy: -0.6, schoolCount: 41 },
  { label: "강원권", avgRate: 88.4, yoy: -1.8, schoolCount: 18 },
  { label: "경상권", avgRate: 93.2, yoy: -0.4, schoolCount: 72 },
  { label: "전라권", avgRate: 90.7, yoy: -1.2, schoolCount: 47 },
];

const SCALE_DATA = [
  { label: "대규모", avgRate: 99.2, yoy: 0.4, schoolCount: 73 },
  { label: "중규모", avgRate: 96.8, yoy: -0.8, schoolCount: 99 },
  { label: "소규모", avgRate: 91.4, yoy: -2.1, schoolCount: 102 },
];

const SIDO_DATA = [
  { region: "서울", avgRate: 99.1, yoy: 0.2, schoolCount: 38, median: 99.4, riskCount: 2 },
  { region: "세종", avgRate: 98.4, yoy: 0.5, schoolCount: 2, median: 98.4, riskCount: 0 },
  { region: "인천", avgRate: 97.8, yoy: 0.1, schoolCount: 8, median: 98.0, riskCount: 1 },
  { region: "경기", avgRate: 97.2, yoy: 0.4, schoolCount: 40, median: 97.6, riskCount: 3 },
  { region: "대전", avgRate: 96.5, yoy: -0.3, schoolCount: 12, median: 96.8, riskCount: 1 },
  { region: "충남", avgRate: 95.0, yoy: -0.7, schoolCount: 16, median: 95.4, riskCount: 2 },
  { region: "대구", avgRate: 94.8, yoy: -0.2, schoolCount: 11, median: 95.1, riskCount: 2 },
  { region: "울산", avgRate: 94.1, yoy: 0.1, schoolCount: 3, median: 94.1, riskCount: 0 },
  { region: "부산", avgRate: 93.6, yoy: -0.5, schoolCount: 18, median: 94.0, riskCount: 3 },
  { region: "충북", avgRate: 93.2, yoy: -0.8, schoolCount: 11, median: 93.5, riskCount: 2 },
  { region: "광주", avgRate: 92.4, yoy: -0.9, schoolCount: 14, median: 92.8, riskCount: 3 },
  { region: "경남", avgRate: 91.8, yoy: -0.6, schoolCount: 20, median: 92.2, riskCount: 4 },
  { region: "전북", avgRate: 90.6, yoy: -1.1, schoolCount: 13, median: 91.0, riskCount: 4 },
  { region: "경북", avgRate: 90.1, yoy: -0.4, schoolCount: 20, median: 90.5, riskCount: 5 },
  { region: "전남", avgRate: 89.2, yoy: -1.4, schoolCount: 16, median: 89.8, riskCount: 5 },
  { region: "강원", avgRate: 88.4, yoy: -1.8, schoolCount: 18, median: 88.9, riskCount: 6 },
  { region: "제주", avgRate: 87.9, yoy: -1.6, schoolCount: 4, median: 88.2, riskCount: 1 },
];

const RISK_SCHOOLS = [
  { name: "한려대학교", region: "전남", enrolled: 186, recruit: 240, rate: 77.5, tier: "고위험" },
  { name: "신경대학교", region: "경기", enrolled: 312, recruit: 390, rate: 80.0, tier: "위험" },
  { name: "경남도립거창대학", region: "경남", enrolled: 428, recruit: 520, rate: 82.3, tier: "위험" },
  { name: "고구려대학교", region: "전남", enrolled: 251, recruit: 300, rate: 83.7, tier: "위험" },
  { name: "강원관광대학교", region: "강원", enrolled: 198, recruit: 230, rate: 86.1, tier: "위험" },
  { name: "송곡대학교", region: "강원", enrolled: 441, recruit: 510, rate: 86.5, tier: "위험" },
];

function fmtPct(v: number): string {
  return `${v.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function fmtYoy(v: number): string {
  if (v === 0) return "0.0%p";
  return `${v > 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(1)}%p`;
}

function formatTooltipPercent(value: number | string | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function CompareChart({
  data,
}: {
  data: { label: string; avgRate: number; yoy: number }[];
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
          평균 정원내 신입생충원율
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
            barCategoryGap="22%"
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              interval={0}
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
              name="평균 정원내 신입생충원율"
              fill={CHART.mint}
              radius={[4, 4, 0, 0]}
              maxBarSize={42}
            />
            <Line
              yAxisId="yoy"
              type="monotone"
              dataKey="yoy"
              name="전년 대비"
              stroke={CHART.blue}
              strokeWidth={2.5}
              dot={{ r: 4, fill: CHART.blue, stroke: "#fff", strokeWidth: 1.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FinanceGeoScaleCompareMock() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <section className="rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3">
        <p className={`font-medium text-foreground ${CHART_TYPO.bodyText}`}>
          목업 — 프로덕션 미적용
        </p>
        <p className={`mt-1 ${CHART_TYPO.legend}`}>
          지역·권역 격차 탭 배치 제안입니다. 위 두 칸은 5대 권역 비교와 학생 규모
          비교(대규모·중규모·소규모)이고, 17개 시·도 순위는 그 아래 전폭입니다.
          규모 분류는 권역·규모 시계열 탭과 같습니다. 재학생(A) 계·소계, 대학
          10,000/5,000 · 전문대 4,000/2,000.
        </p>
        <p className={`mt-2 ${CHART_TYPO.legend}`}>
          <Link
            href="/analysis/finance-analysis?year=2025&section=charts&tab=freshman-enrollment-rate"
            className="font-semibold text-accent hover:underline"
          >
            현재 프로덕션 화면
          </Link>
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "전국 평균 정원내 신입생충원율", value: "95.8%", delta: "▼ 0.6%p", sub: "Σ입학자(정원내) ÷ Σ모집인원(정원내)" },
          { label: "중앙값 & IQR", value: "96.4%", sub: "IQR( Q3−Q1 ) = 8.2%p" },
          { label: "위험군 대학 수", value: "41개교", sub: "동종 하위 15% · 고위험 하위 7%" },
          { label: "분석 대상", value: "264개교", sub: "2025년 · 사립" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-surface p-5 border-l-4 border-l-border/80"
          >
            <p className={CHART_TYPO.kpiLabel}>{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {kpi.value}
            </p>
            {"delta" in kpi && kpi.delta ? (
              <p className={`mt-1.5 ${CHART_TYPO.kpiDelta} text-rose-600`}>
                {kpi.delta}
              </p>
            ) : null}
            <p className={`mt-1.5 ${CHART_TYPO.kpiSub}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {[
          { id: "geo", label: "지역·권역 격차", on: true },
          { id: "distribution", label: "분포·위험군", on: false },
          { id: "pipeline", label: "권역·규모 시계열", on: false },
        ].map((tab) => (
          <span key={tab.id} className="inline-flex items-center">
            <button
              type="button"
              className={`rounded-md px-4 py-2 ${
                tab.on
                  ? `${CHART_TYPO.sectionTab} bg-surface text-foreground shadow-sm ring-1 ring-border`
                  : CHART_TYPO.sectionTabInactive
              }`}
            >
              {tab.label}
            </button>
            <HelpTip
              help={{
                title: tab.label,
                body:
                  tab.id === "geo"
                    ? "5대 권역과 학생 규모(대규모·중규모·소규모), 17개 시·도를 비교합니다."
                    : "목업에서는 이 탭을 열지 않습니다.",
              }}
              className="mr-1"
            />
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PanelWithHelp
          title="5대 권역 비교"
          subtitle="5대 권역 평균 정원내 신입생충원율 · 전년 대비"
          help={{
            title: "5대 권역 비교",
            body: "권역별 가중 평균 정원내 신입생충원율(막대)과 전년 대비 증감(%p, 선)입니다.",
          }}
        >
          <CompareChart data={ZONE_DATA} />
        </PanelWithHelp>
        <PanelWithHelp
          title="학생 규모 비교"
          subtitle="대규모·중규모·소규모 평균 정원내 신입생충원율 · 전년 대비"
          help={{
            title: "학생 규모 비교",
            body: "재학생수는 대학알리미 재적학생 재학생(A) 계·소계를 대표학교코드로 합산합니다. 대학은 10,000명 이상 대규모·5,000명 이상 중규모, 전문대학은 4,000명 이상 대규모·2,000명 이상 중규모입니다. 권역·규모 시계열 탭과 같은 분류입니다.",
          }}
        >
          <CompareChart data={SCALE_DATA} />
        </PanelWithHelp>
      </div>

      <PanelWithHelp
        title="17개 시·도 순위"
        help={{
          title: "17개 시·도 순위",
          body: "시·도별 평균 정원내 신입생충원율을 내림차순으로 나열합니다.",
        }}
      >
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={SIDO_DATA}
              margin={{ top: 8, right: 10, bottom: 2, left: 4 }}
              barCategoryGap="28%"
            >
              <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="region"
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={56}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                width={36}
                tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              />
              <SoftMintChartTooltip formatter={formatTooltipPercent} />
              <Bar
                dataKey="avgRate"
                name="평균 정원내 신입생충원율"
                fill={CHART.mint}
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PanelWithHelp>

      <PanelWithHelp
        title="17개 시·도 상세 테이블"
        help={{
          title: "17개 시·도 상세 테이블",
          body: "시·도별 학교 수, 평균·중앙값, 전년 대비, 위험군 학교 수입니다.",
        }}
      >
        <div className="overflow-x-auto">
          <table
            className={`w-full table-fixed border-collapse ${CHART_TYPO.tableBody}`}
          >
            <colgroup>
              <col className="w-1/6" />
              <col className="w-1/6" />
              <col className="w-1/6" />
              <col className="w-1/6" />
              <col className="w-1/6" />
              <col className="w-1/6" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-surface-2 text-center">
                <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>지역</th>
                <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>학교 수</th>
                <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>
                  평균 정원내 신입생충원율
                </th>
                <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>전년 대비</th>
                <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>중앙값</th>
                <th className={`px-3 py-2 text-rose-600 ${CHART_TYPO.tableHead}`}>
                  위험군
                </th>
              </tr>
            </thead>
            <tbody>
              {SIDO_DATA.map((row) => (
                <tr key={row.region} className="border-b border-border/40">
                  <td className="px-3 py-2 text-center font-bold text-accent">
                    {row.region}
                  </td>
                  <td className="px-3 py-2 text-center font-mono">
                    {row.schoolCount}
                  </td>
                  <td className="px-3 py-2 text-center font-mono font-semibold text-accent">
                    {fmtPct(row.avgRate)}
                  </td>
                  <td
                    className={`px-3 py-2 text-center font-mono ${
                      row.yoy >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {fmtYoy(row.yoy)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono">
                    {fmtPct(row.median)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-rose-600">
                    {row.riskCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelWithHelp>

      <PanelWithHelp
        title="위험군 대학 목록"
        help={{
          title: "위험군 대학 목록",
          body: "동종 하위 15% 위험군입니다. 목업은 예시 6개교만 보여 줍니다.",
        }}
      >
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table
            className={`w-full min-w-[720px] border-collapse ${CHART_TYPO.tableBody}`}
          >
            <thead className="bg-surface-2">
              <tr className="border-b border-border">
                <th className={`px-2 py-2 text-left ${CHART_TYPO.tableHead}`}>
                  학교명
                </th>
                <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                  지역
                </th>
                <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                  입학자(정원내)
                </th>
                <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                  모집인원(정원내)
                </th>
                <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                  정원내 신입생충원율
                </th>
                <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                  구분
                </th>
              </tr>
            </thead>
            <tbody>
              {RISK_SCHOOLS.map((row) => (
                <tr key={row.name} className="border-b border-border/30">
                  <td className="px-2 py-1.5 font-bold text-accent">{row.name}</td>
                  <td className="px-2 py-1.5 text-center">{row.region}</td>
                  <td className="px-2 py-1.5 text-center font-mono text-muted">
                    {row.enrolled.toLocaleString("ko-KR")}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono text-muted">
                    {row.recruit.toLocaleString("ko-KR")}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-center font-mono font-semibold ${
                      row.tier === "고위험" ? "text-rose-600" : "text-accent-orange"
                    }`}
                  >
                    {fmtPct(row.rate)}
                  </td>
                  <td className="px-2 py-1.5 text-center">{row.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelWithHelp>
    </div>
  );
}
