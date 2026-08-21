"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  gradeBadgeClass,
  MOCK_JUNIOR_COLLEGE_DATA,
  MOCK_UNIVERSITY_DATA,
  REGIONS,
  type Grade,
  type UniversityAnalyticsRow,
} from "./mock-data";
import "./run-analytics.css";

type Cohort = "univ" | "college" | "compare";
type AnalysisView = "all" | "step1" | "step2" | "step3";

const GRADE_COLORS: Record<Grade, string> = {
  S: "#4F46E5",
  A: "#10B981",
  B: "#3B82F6",
  C: "#F59E0B",
  D: "#EC4899",
  E: "#EF4444",
};

const GRADES: Grade[] = ["S", "A", "B", "C", "D", "E"];
const ROWS_PER_PAGE = 10;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

function filterRows(
  rows: UniversityAnalyticsRow[],
  region: string,
  search: string,
): UniversityAnalyticsRow[] {
  let data = rows;
  if (region !== "ALL") {
    data = data.filter((d) => d.region === region);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    data = data.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q),
    );
  }
  return data;
}

function buildRegionBarData(data: UniversityAnalyticsRow[]) {
  return REGIONS.map((region) => {
    const regData = data.filter((d) => d.region === region);
    const avg =
      regData.length === 0
        ? 0
        : regData.reduce((acc, cur) => acc + cur.totalScore, 0) /
          regData.length;
    return {
      region,
      avg: Math.round(avg * 100) / 100,
      count: regData.length,
    };
  });
}

function buildGradeDonutData(data: UniversityAnalyticsRow[]) {
  return GRADES.map((grade) => ({
    grade,
    label: `${grade}등급`,
    count: data.filter((d) => d.grade === grade).length,
  })).filter((d) => d.count > 0);
}

function buildScatterData(data: UniversityAnalyticsRow[]) {
  return data.map((d) => ({
    x: d.dropRate,
    y: d.totalScore,
    name: d.name,
    z: 1,
  }));
}

function buildRadarData(data: UniversityAnalyticsRow[]) {
  if (data.length === 0) {
    return [{ subject: "학생충원 (50%)", value: 0, fullMark: 100 }];
  }
  const avgStudent =
    data.reduce((acc, c) => acc + c.studentSectorScore, 0) / data.length;
  const avgFinance =
    data.reduce((acc, c) => acc + c.univFinanceScore, 0) / data.length;
  const avgFound =
    data.reduce((acc, c) => acc + c.foundationScore, 0) / data.length;
  return [
    { subject: "학생충원 (50%)", value: Math.round(avgStudent * 10) / 10, fullMark: 100 },
    { subject: "대학재정 (40%)", value: Math.round(avgFinance * 10) / 10, fullMark: 100 },
    { subject: "법인재정 (10%)", value: Math.round(avgFound * 10) / 10, fullMark: 100 },
  ];
}

function exportCsv(rows: UniversityAnalyticsRow[], cohortLabel: string) {
  const header = [
    "종합순위",
    "대학명",
    "유형",
    "권역",
    "신입생충원율(Step1)",
    "재학생충원율(Step1)",
    "중도탈락률(Step1)",
    "재정확보율(Step1)",
    "학생충원지수(Step2)",
    "대학재정지수(Step2)",
    "법인재정지수(Step2)",
    "종합점수(Step3)",
    "진단등급(제안)",
  ];
  const lines = rows.map((d) =>
    [
      d.rank,
      d.name,
      d.type,
      d.region,
      d.freshRate,
      d.enrolledRate,
      d.dropRate,
      d.fundRate,
      d.studentSectorScore,
      d.univFinanceScore,
      d.foundationScore,
      d.totalScore,
      d.grade,
    ].join(","),
  );
  const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `competitiveness_analytics_${cohortLabel}_mock.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; payload?: { name?: string; count?: number } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-slate-800">{label ?? p?.payload?.name}</p>
      <p className="text-indigo-600">
        {typeof p?.value === "number" ? p.value.toFixed(2) : p?.value}
        {p?.name ? ` · ${p.name}` : ""}
      </p>
      {p?.payload?.count != null ? (
        <p className="text-slate-500">{p.payload.count}개교</p>
      ) : null}
    </div>
  );
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; x: number; y: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]!.payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-slate-800">{pt.name}</p>
      <p className="text-rose-600">중도탈락률 {pt.x}%</p>
      <p className="text-indigo-600">종합지수 {pt.y}점</p>
    </div>
  );
}

export default function RunAnalyticsDashboard() {
  const [cohort, setCohort] = useState<Cohort>("univ");
  const [view, setView] = useState<AnalysisView>("all");
  const [region, setRegion] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const baseDataset = useMemo(() => {
    if (cohort === "univ") return MOCK_UNIVERSITY_DATA;
    if (cohort === "college") return MOCK_JUNIOR_COLLEGE_DATA;
    return [...MOCK_UNIVERSITY_DATA, ...MOCK_JUNIOR_COLLEGE_DATA];
  }, [cohort]);

  const filtered = useMemo(
    () => filterRows(baseDataset, region, search),
    [baseDataset, region, search],
  );

  const kpis = useMemo(() => {
    const scores = filtered.map((d) => d.totalScore);
    const avg =
      scores.length === 0
        ? 0
        : scores.reduce((a, b) => a + b, 0) / scores.length;
    const med = median(scores);
    const topTier = filtered.filter((d) => d.grade === "S" || d.grade === "A");
    const risk = filtered.filter((d) => d.grade === "E");
    return {
      count: filtered.length,
      avg: Math.round(avg * 100) / 100,
      median: Math.round(med * 100) / 100,
      topTierCount: topTier.length,
      topTierRatio:
        filtered.length === 0
          ? 0
          : Math.round((topTier.length / filtered.length) * 1000) / 10,
      riskCount: risk.length,
      riskRatio:
        filtered.length === 0
          ? 0
          : Math.round((risk.length / filtered.length) * 1000) / 10,
    };
  }, [filtered]);

  const regionBarData = useMemo(() => buildRegionBarData(filtered), [filtered]);
  const gradeDonutData = useMemo(() => buildGradeDonutData(filtered), [filtered]);
  const scatterData = useMemo(() => buildScatterData(filtered), [filtered]);
  const radarData = useMemo(() => buildRadarData(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * ROWS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ROWS_PER_PAGE);

  const cohortLabel =
    cohort === "univ"
      ? "사립 일반대학"
      : cohort === "college"
        ? "사립 전문대학"
        : "대학 vs 전문대 비교";

  const highlightClass =
    view === "step1"
      ? "cra-highlight-step1"
      : view === "step2"
        ? "cra-highlight-step2"
        : view === "step3"
          ? "cra-highlight-step3"
          : "";

  function onCohortChange(next: Cohort) {
    setCohort(next);
    setPage(1);
  }

  function onRegionChange(next: string) {
    setRegion(next);
    setPage(1);
  }

  function onSearchChange(next: string) {
    setSearch(next);
    setPage(1);
  }

  const pageNumbers: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= safePage - 1 && p <= safePage + 1)) {
      pageNumbers.push(p);
    }
  }

  return (
    <div className="cra-root antialiased">
      {/* Mock banner */}
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
          <p className="font-semibold text-amber-900">
            목업 전용 — Gemini HTML 참조 통계분석 대시보드 (실제 분석 데이터 미연동)
          </p>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
              S~E 등급: 제안안
            </span>
            <Link
              href="/analysis/competitiveness-analysis/run"
              className="font-bold text-indigo-600 hover:text-indigo-800"
            >
              현재 분석실행 화면 →
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-lg text-white shadow-md shadow-indigo-500/20">
              📊
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  대학 경쟁력 통합 통계분석 대시보드
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600">
                  1·2·3단계 파이프라인 연동
                </span>
              </div>
              <p className="text-xs text-slate-500">
                원지표(Step 1) → 지수·순위(Step 2) → 종합 경쟁력(Step 3) 입체 분석
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-slate-100 p-1.5 md:self-auto">
            {(
              [
                ["univ", `사립 일반대학 (${MOCK_UNIVERSITY_DATA.length}개교)`],
                ["college", `사립 전문대학 (${MOCK_JUNIOR_COLLEGE_DATA.length}개교)`],
                ["compare", "대학 vs 전문대 비교"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onCohortChange(key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs transition-all ${
                  cohort === key
                    ? "bg-white font-bold text-indigo-600 shadow-sm"
                    : "font-medium text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-7xl space-y-6 px-6">
        {/* View + region */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {(
              [
                ["all", "통합 파이프라인 분석"],
                ["step1", "1단계: 원지표 수치"],
                ["step2", "2단계: 지수화 & 지표 순위"],
                ["step3", "3단계: 종합지수 & 등급"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs transition-all ${
                  view === key
                    ? "bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/20"
                    : "font-medium text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              권역 필터:
            </span>
            <select
              value={region}
              onChange={(e) => onRegionChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">전국 전체</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="cra-tactile-card space-y-1 rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-400">분석 대상 집단</span>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900">
                {kpis.count}{" "}
                <span className="text-xs font-medium text-slate-500">개교</span>
              </div>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">
                {cohortLabel}
              </span>
            </div>
            <p className="pt-1 text-[11px] text-slate-400">
              본/분교 원천 데이터 합산 완료 (목업)
            </p>
          </div>

          <div className="cra-tactile-card space-y-1 rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-400">3단계 종합 지수 평균</span>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-indigo-600">
                {kpis.avg}{" "}
                <span className="text-xs font-medium text-slate-500">점</span>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                중앙값 {kpis.median}
              </span>
            </div>
            <p className="pt-1 text-[11px] text-slate-400">
              상/하한선(P₁₀/P₉₀) 선형 보간 적용
            </p>
          </div>

          <div className="cra-tactile-card space-y-1 rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-400">최우수 등급 (S/A 등급)</span>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-emerald-600">
                {kpis.topTierCount}{" "}
                <span className="text-xs font-medium text-slate-500">개교</span>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                {kpis.topTierRatio}%
              </span>
            </div>
            <p className="pt-1 text-[11px] text-slate-400">
              종합지수 상위 등급군 (제안 등급체계)
            </p>
          </div>

          <div className="cra-tactile-card space-y-1 rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-400">
              고위험 진단군 (E 등급 / P10 이하)
            </span>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-rose-600">
                {kpis.riskCount}{" "}
                <span className="text-xs font-medium text-slate-500">개교</span>
              </div>
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                {kpis.riskRatio}%
              </span>
            </div>
            <p className="pt-1 text-[11px] text-slate-400">
              충원율 급락 및 재정의존 위험군
            </p>
          </div>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="cra-tactile-card space-y-4 rounded-3xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  📍 권역별 종합 경쟁력 지수(Step 3) 평균
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  권역별 평균 점수와 상위/하위 대학 간 점수 격차 비교
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                5대 권역 + 강원제주
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="region"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[30, 100]}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="avg" name="평균 종합지수" radius={[10, 10, 0, 0]} fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cra-tactile-card space-y-4 rounded-3xl p-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                🍩 진단 등급 비율 (Step 3)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                S등급(최우수) ~ E등급(고위험) · 제안안
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDonutData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {gradeDonutData.map((entry) => (
                      <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-[11px] text-slate-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="cra-tactile-card space-y-4 rounded-3xl p-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                ⚡ 중도탈락률(Step 1) vs 종합지수(Step 3) 위험 사분면
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                원지표의 이탈 위험이 종합 지수에 미치는 연관성 분석
              </p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="중도탈락률"
                    unit="%"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    label={{
                      value: "Step 1 중도탈락률 (%)",
                      position: "insideBottom",
                      offset: -4,
                      style: { fontSize: 11, fill: "#94A3B8" },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="종합지수"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    label={{
                      value: "Step 3 종합지수 (점)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: "#94A3B8" },
                    }}
                  />
                  <ZAxis range={[40, 40]} />
                  <Tooltip content={<ScatterTooltip />} />
                  <Scatter data={scatterData} fill="#EF4444" fillOpacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cra-tactile-card space-y-4 rounded-3xl p-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                🎯 3개 평가 부문별 평균 지수 환산 균형 (Step 2)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                학생충원(50%) vs 대학재정(40%) vs 법인재정(10%)
              </p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: "#64748B" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                  />
                  <Radar
                    name="집단 평균"
                    dataKey="value"
                    stroke="#4F46E5"
                    fill="#6366F1"
                    fillOpacity={0.25}
                  />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Compare mode summary when both cohorts */}
        {cohort === "compare" ? (
          <div className="cra-tactile-card rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-700">대학 vs 전문대 비교 요약 (목업)</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "사립 일반대학", data: filterRows(MOCK_UNIVERSITY_DATA, region, search) },
                {
                  label: "사립 전문대학",
                  data: filterRows(MOCK_JUNIOR_COLLEGE_DATA, region, search),
                },
              ].map(({ label, data }) => {
                const avg =
                  data.length === 0
                    ? 0
                    : data.reduce((a, d) => a + d.totalScore, 0) / data.length;
                return (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <p className="text-[11px] font-bold text-slate-500">{label}</p>
                    <p className="text-lg font-black text-indigo-600">
                      {Math.round(avg * 100) / 100}점{" "}
                      <span className="text-xs font-medium text-slate-500">
                        ({data.length}개교)
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Matrix table */}
        <div className={`cra-tactile-card overflow-hidden rounded-3xl ${highlightClass}`}>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-6 md:flex-row md:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                📋 대학별 1·2·3단계 상세 분석 결과 데이터 테이블
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                원지표 수치부터 지수 환산 점수, 최종 종합 순위 및 등급까지 한눈에 확인
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="대학명 또는 권역 검색..."
                className="w-64 rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => exportCsv(filtered, cohort)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-100"
              >
                CSV 다운로드
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-100/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="p-3.5 pl-6">종합순위</th>
                  <th className="p-3.5">대학명</th>
                  {cohort === "compare" ? <th className="p-3.5">유형</th> : null}
                  <th className="p-3.5">권역</th>
                  <th className="cra-col-step1 p-3.5 text-right">신입생충원(Step 1)</th>
                  <th className="cra-col-step1 p-3.5 text-right">재학생충원(Step 1)</th>
                  <th className="cra-col-step1 p-3.5 text-right">중도탈락률(Step 1)</th>
                  <th className="cra-col-step2 p-3.5 text-right">학생충원지수(Step 2)</th>
                  <th className="cra-col-step2 p-3.5 text-right">대학재정지수(Step 2)</th>
                  <th className="cra-col-step2 p-3.5 text-right">법인재정지수(Step 2)</th>
                  <th className="cra-col-step3 p-3.5 text-right font-bold text-slate-900">
                    종합점수(Step 3)
                  </th>
                  <th className="p-3.5 pr-6 text-center">진단 등급</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginated.map((d) => (
                  <tr key={`${d.type}-${d.id}`} className="transition-colors hover:bg-indigo-50/30">
                    <td className="p-3.5 pl-6 font-mono font-bold text-indigo-600">{d.rank}</td>
                    <td className="p-3.5 font-bold text-slate-900">{d.name}</td>
                    {cohort === "compare" ? (
                      <td className="p-3.5 text-slate-600">{d.type}</td>
                    ) : null}
                    <td className="p-3.5 text-slate-600">{d.region}</td>
                    <td className="cra-col-step1 p-3.5 text-right font-mono">{d.freshRate}%</td>
                    <td className="cra-col-step1 p-3.5 text-right font-mono">
                      {d.enrolledRate}%
                    </td>
                    <td className="cra-col-step1 p-3.5 text-right font-mono text-rose-600">
                      {d.dropRate}%
                    </td>
                    <td className="cra-col-step2 p-3.5 text-right font-mono">
                      {d.studentSectorScore}
                    </td>
                    <td className="cra-col-step2 p-3.5 text-right font-mono">
                      {d.univFinanceScore}
                    </td>
                    <td className="cra-col-step2 p-3.5 text-right font-mono">
                      {d.foundationScore}
                    </td>
                    <td className="cra-col-step3 p-3.5 text-right font-mono text-sm font-bold text-indigo-600">
                      {d.totalScore}
                    </td>
                    <td className="p-3.5 pr-6 text-center">
                      <span className={gradeBadgeClass(d.grade)}>{d.grade}등급</span>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={cohort === "compare" ? 12 : 11}
                      className="p-8 text-center text-slate-400"
                    >
                      검색/필터 조건에 맞는 데이터가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 p-4 text-xs text-slate-500">
            <span>
              총 {filtered.length}개 대학 중 {filtered.length === 0 ? 0 : startIdx + 1}-
              {Math.min(startIdx + ROWS_PER_PAGE, filtered.length)} 행 표시 중
            </span>
            <div className="flex items-center gap-1">
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    p === safePage
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
