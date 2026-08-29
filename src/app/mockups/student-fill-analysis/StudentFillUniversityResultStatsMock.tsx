"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { ANALYTICS_ZONES, zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import { CHART_THEME } from "@/lib/theme/teal-glow";

import {
  FpAnalysisYearBar,
  SlimTabs,
} from "@/app/mockups/competitiveness-analysis/financial-projection/fpm-shared";

import { isStudentFillPrivateEstb } from "@/lib/analysis/student-fill-analysis/cohort-rules";

import {
  SFA_MOCK_UNIVERSITIES,
  sfaMockDetail,
  type SfaMockUniversity,
} from "./mock-data";
import { StudentFillFrame } from "./StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";
import "@/components/analysis/freshman-enrollment-alimi-table.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/financial-projection-ui-mock.css";
import "./student-fill-mock.css";

const YEARS = [2022, 2023, 2024, 2025, 2026] as const;
const SCALES = ["대규모", "중규모", "소규모"] as const;

type Stage = "freshman" | "enrolled" | "foreign";
type FreshmanMetric = "rateIn" | "outShare" | "rateAll" | "freshmanDropoutRate";
type EnrolledMetric =
  | "enrolledFillRate"
  | "enrolledFillRateIn"
  | "enrolledOutShare"
  | "leaveShare"
  | "deferShare"
  | "dropoutRate";
type ForeignMetric =
  | "foreignShare"
  | "langAbilityRate"
  | "foreignDropRate"
  | "foreignDropAllRate";
type Metric = FreshmanMetric | EnrolledMetric | ForeignMetric;

const FRESHMAN_LABELS: Record<FreshmanMetric, string> = {
  rateIn: "정원내충원율",
  outShare: "정원외비중",
  rateAll: "정원내외충원율",
  freshmanDropoutRate: "신입생탈락율",
};
const ENROLLED_LABELS: Record<EnrolledMetric, string> = {
  enrolledFillRate: "재학생충원율",
  enrolledFillRateIn: "정원내충원율",
  enrolledOutShare: "정원외비중",
  leaveShare: "휴학비중",
  deferShare: "유예비중",
  dropoutRate: "중도탈락율",
};
const FOREIGN_LABELS: Record<ForeignMetric, string> = {
  foreignShare: "재적대비비중",
  langAbilityRate: "언어능력충족율",
  foreignDropRate: "외국인탈락율",
  foreignDropAllRate: "전체외국인탈락율",
};

const DEFAULT_METRIC: Record<Stage, Metric> = {
  freshman: "rateIn",
  enrolled: "enrolledFillRate",
  foreign: "foreignShare",
};

function labelsFor(stage: Stage): Record<string, string> {
  if (stage === "freshman") return FRESHMAN_LABELS;
  if (stage === "enrolled") return ENROLLED_LABELS;
  return FOREIGN_LABELS;
}

function fmtPct(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function clampPct(n: number) {
  return round1(Math.min(140, Math.max(0.2, n)));
}

function baseRates(univ: SfaMockUniversity) {
  const d = sfaMockDetail(univ);
  return {
    rateIn: d.rateIn,
    outShare: univ.outShare,
    rateAll: univ.rateAll,
    freshmanDropoutRate: d.freshmanDropoutRate,
    enrolledFillRate: d.enrolledFillRate,
    enrolledFillRateIn: d.enrolledFillRateIn,
    enrolledOutShare: d.enrolledOutShare,
    leaveShare: round1((d.leaveCount / d.rosterTotal) * 100),
    deferShare: round1((d.deferCount / d.rosterTotal) * 100),
    dropoutRate: d.dropoutRate,
    foreignShare: d.foreignShare,
    langAbilityRate: d.langAbilityRate,
    foreignDropRate: univ.foreignDrop,
    foreignDropAllRate: d.foreignDropAllRate,
  } satisfies Record<Metric, number>;
}

function yearDrift(metric: Metric, year: number) {
  const t = (year - 2026) / 4;
  const worseHigh =
    metric === "outShare" ||
    metric === "freshmanDropoutRate" ||
    metric === "enrolledOutShare" ||
    metric === "leaveShare" ||
    metric === "deferShare" ||
    metric === "dropoutRate" ||
    metric === "foreignDropRate" ||
    metric === "foreignDropAllRate";
  return worseHigh ? -t * 0.7 : t * 1.1;
}

function schoolSeries(univ: SfaMockUniversity, metric: Metric) {
  const base = baseRates(univ)[metric];
  return YEARS.map((year) => ({
    year,
    school: clampPct(base + yearDrift(metric, year)),
    zone: clampPct(base + yearDrift(metric, year) + 1.4),
    scale: clampPct(base + yearDrift(metric, year) + 0.6),
    estb: clampPct(base + yearDrift(metric, year) + 0.95),
    nation: clampPct(base + yearDrift(metric, year) + 2.1),
  }));
}

function peerValue(school: number, key: string, spread: number) {
  const wobble = ((hash(key) % 17) - 8) * (spread / 8);
  return clampPct(school + wobble);
}

function SchoolVsGroupChart({
  data,
  schoolName,
  metricLabel,
  highlight,
  xAngle,
}: {
  data: { name: string; group: number; school: number }[];
  schoolName: string;
  metricLabel: string;
  highlight?: string;
  xAngle?: number;
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} barCategoryGap="18%" margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
          <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART_THEME.axisLabel }}
            interval={0}
            angle={xAngle}
            textAnchor={xAngle != null ? "end" : "middle"}
            height={xAngle != null ? 56 : 28}
          />
          <YAxis
            tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART_THEME.axisLabel }}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            formatter={(value, name) => [
              typeof value === "number" ? fmtPct(value) : String(value ?? "—"),
              String(name),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="group"
            name={`${metricLabel} 집단평균`}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          >
            {data.map((row) => (
              <Cell
                key={row.name}
                fill={row.name === highlight ? "#0d9488" : CHART_THEME.amber}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="school"
            name={schoolName}
            stroke="#2563eb"
            strokeWidth={2.4}
            dot={{ r: 4, fill: "#2563eb", stroke: "#fff", strokeWidth: 1.4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StudentFillUniversityResultStatsMock() {
  const [year, setYear] = useState(2026);
  const [schoolCode, setSchoolCode] = useState(SFA_MOCK_UNIVERSITIES[0]!.schoolCodeStd);
  const [estb, setEstb] = useState<"public" | "private" | "all">("all");
  const [stage, setStage] = useState<Stage>("freshman");
  const [metric, setMetric] = useState<Metric>("rateIn");

  const univ = SFA_MOCK_UNIVERSITIES.find((row) => row.schoolCodeStd === schoolCode) ?? SFA_MOCK_UNIVERSITIES[0]!;
  const zone = zoneForSido(univ.region) ?? "수도권";
  const scale =
    schoolScaleFromEnrolled(
      univ.enrolledTotal,
      univ.schoolDivision === "전문대학" ? "전문대" : "4년제",
    ) ?? "중규모";
  const estbPeerLabel = isStudentFillPrivateEstb(univ.estb) ? "사립" : "국공립";

  const stageLabels = labelsFor(stage);
  const activeMetric = Object.prototype.hasOwnProperty.call(stageLabels, metric)
    ? metric
    : DEFAULT_METRIC[stage];
  const metricLabel = stageLabels[activeMetric] ?? activeMetric;

  const tableRows = useMemo(() => {
    return (Object.keys(stageLabels) as Metric[]).map((key) => {
      const series = schoolSeries(univ, key);
      const latest = series[series.length - 1]!;
      return {
        key,
        label: stageLabels[key]!,
        years: series.map((row) => row.school),
        zone: latest.zone,
        scale: latest.scale,
        estb: latest.estb,
        nation: latest.nation,
      };
    });
  }, [stageLabels, univ]);

  const trend = useMemo(() => schoolSeries(univ, activeMetric), [univ, activeMetric]);
  const latestSchool = trend[trend.length - 1]!.school;

  const zoneData = useMemo(
    () =>
      ANALYTICS_ZONES.map((name) => ({
        name,
        group: peerValue(latestSchool, `${activeMetric}-${name}`, 4.2),
        school: latestSchool,
      })),
    [activeMetric, latestSchool],
  );
  const scaleData = useMemo(
    () =>
      SCALES.map((name) => ({
        name,
        group: peerValue(latestSchool, `${activeMetric}-scale-${name}`, 2.6),
        school: latestSchool,
      })),
    [activeMetric, latestSchool],
  );
  const sidoData = useMemo(
    () =>
      [...KOREA_SIDO_REGIONS]
        .map((sido) => ({
          name: sido.shortLabel,
          group: peerValue(latestSchool, `${activeMetric}-sido-${sido.id}`, 5.4),
          school: latestSchool,
        }))
        .sort((a, b) => b.group - a.group),
    [activeMetric, latestSchool],
  );

  return (
    <StudentFillFrame activeLabel="대학별분석 · 분석결과 통계">
      <div className="flex flex-col gap-4 pb-10">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석 · 목업"
          title="대학별분석 · 분석결과"
          subtitle="분석결과의 신입생충원·재학생충원·외국인 지표를 5개년 표와 권역·규모·시도 비교로 보는 시안"
          note="프로덕션 미적용 · 가천대 등 목업 수치 · 막대는 집단평균, 선은 선택 대학"
        />

        <FpAnalysisYearBar
          analysisYear={year}
          availableYears={[...YEARS].reverse()}
          settlementYear={year - 1}
          endYear={year}
          hasRun
          showYearMeta={false}
          showAddYear={false}
          onAddYear={() => undefined}
          onChange={setYear}
          afterStatus={
            <GlassMintTabGroup
              ariaLabel="설립구분"
              active={estb}
              onChange={setEstb}
              items={[
                { id: "public", label: "국공립" },
                { id: "private", label: "사립" },
                { id: "all", label: "국공사립" },
              ]}
            />
          }
        />

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <label className={FDB_TYPO.toolbarLabel} htmlFor="sfa-univ-pick">
            대학
          </label>
          <select
            id="sfa-univ-pick"
            value={schoolCode}
            onChange={(event) => setSchoolCode(event.target.value)}
            className={`h-[30px] min-w-[200px] rounded-md border border-border bg-surface-2 px-2.5 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
          >
            {SFA_MOCK_UNIVERSITIES.map((row) => (
              <option key={row.schoolCodeStd} value={row.schoolCodeStd}>
                {row.schoolName} · {row.region}
              </option>
            ))}
          </select>
          <span className={FDB_TYPO.legend}>
            {univ.schoolDivision} · {univ.estb} · {zone} · {scale} · 재학생 {univ.enrolledTotal.toLocaleString("ko-KR")}명
          </span>
        </div>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
          <div className="fpm-univ-tab-stack">
            <div className="fpm-univ-tab-row">
              <span className="fpm-univ-tab-label">조회</span>
              <SlimTabs
                ariaLabel="대학별분석 탭"
                active="result"
                onChange={() => undefined}
                tabs={[
                  { id: "result", label: "분석결과" },
                  { id: "diagnosis", label: "진단(목업 제외)" },
                  { id: "action", label: "대응과제(목업 제외)" },
                ]}
              />
            </div>
          </div>

          <GlassMintTabGroup
            ariaLabel="분석결과 단계"
            active={stage}
            onChange={(next) => {
              setStage(next);
              setMetric(DEFAULT_METRIC[next]);
            }}
            items={[
              { id: "freshman", label: "신입생충원" },
              { id: "enrolled", label: "재학생충원" },
              { id: "foreign", label: "외국인" },
            ]}
          />

          {stage === "freshman" ? (
            <ChartMetricToggle
              value={activeMetric as FreshmanMetric}
              onChange={setMetric}
              labels={FRESHMAN_LABELS}
            />
          ) : stage === "enrolled" ? (
            <ChartMetricToggle
              value={activeMetric as EnrolledMetric}
              onChange={setMetric}
              labels={ENROLLED_LABELS}
            />
          ) : (
            <ChartMetricToggle
              value={activeMetric as ForeignMetric}
              onChange={setMetric}
              labels={FOREIGN_LABELS}
            />
          )}

          <div>
            <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>5개년 지표 · {univ.schoolName}</h3>
            <p className={`${FDB_TYPO.legend} mb-2`}>
              행은 분석결과 해당 단계의 지표입니다. 선택 지표는 강조합니다. {zone}·{scale}·{estbPeerLabel}·전국은 2026년 가중평균 시안입니다.
            </p>
            <div className="feam-table-wrap mt-3 overflow-auto rounded-lg border border-border/60">
              <table className={`w-full min-w-[820px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}>
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th
                      className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} text-left last:border-r-0`}
                    >
                      지표
                    </th>
                    {YEARS.map((y) => (
                      <th
                        key={y}
                        className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} pr-[5ch] text-right last:border-r-0`}
                      >
                        {y}년
                      </th>
                    ))}
                    <th
                      className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} pr-[5ch] text-right last:border-r-0`}
                    >
                      {zone}
                    </th>
                    <th
                      className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} pr-[5ch] text-right last:border-r-0`}
                    >
                      {scale}
                    </th>
                    <th
                      className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} pr-[5ch] text-right last:border-r-0`}
                    >
                      {estbPeerLabel}
                    </th>
                    <th
                      className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} pr-[5ch] text-right last:border-r-0`}
                    >
                      전국
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => {
                    const on = row.key === activeMetric;
                    const even = i % 2 === 0;
                    const cell = `whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} last:border-r-0`;
                    const num = `${cell} pr-[5ch] text-right font-mono tabular-nums`;
                    return (
                      <tr
                        key={row.key}
                        className={`border-b border-border/40 ${
                          on ? "bg-accent/10" : even ? "bg-surface" : "bg-surface-2/30"
                        }`}
                      >
                        <td className={`${cell} ${FDB_TABLE_COLOR.schoolName}`}>{row.label}</td>
                        {row.years.map((v, yi) => (
                          <td key={YEARS[yi]} className={`${num} ${FDB_TABLE_COLOR.ratePrimary}`}>
                            {fmtPct(v)}
                          </td>
                        ))}
                        <td className={num}>{fmtPct(row.zone)}</td>
                        <td className={num}>{fmtPct(row.scale)}</td>
                        <td className={num}>{fmtPct(row.estb)}</td>
                        <td className={num}>{fmtPct(row.nation)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>시계열 · {metricLabel}</h3>
            <p className={`${FDB_TYPO.legend} mb-2`}>
              선택 대학과 규모·권역·설립구분·전국 평균. 분석연도 {year}년 기준 시안입니다.
            </p>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
                  <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART_THEME.axisLabel }}
                  />
                  <YAxis
                    tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART_THEME.axisLabel }}
                    tickFormatter={(v) => `${v}%`}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      typeof value === "number" ? fmtPct(value) : String(value ?? "—"),
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="school"
                    name={univ.schoolName}
                    stroke="#2563eb"
                    strokeWidth={2.6}
                    dot={{ r: 4, fill: "#2563eb", stroke: "#fff", strokeWidth: 1.4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scale"
                    name={`${scale} 평균`}
                    stroke="#d97706"
                    strokeWidth={1.8}
                    dot={{ r: 3.5, fill: "#d97706", stroke: "#fff", strokeWidth: 1.2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="zone"
                    name={`${zone} 평균`}
                    stroke="#0d9488"
                    strokeWidth={1.8}
                    dot={{ r: 3.5, fill: "#0d9488", stroke: "#fff", strokeWidth: 1.2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="estb"
                    name={`${estbPeerLabel} 평균`}
                    stroke="#7c3aed"
                    strokeWidth={1.8}
                    dot={{ r: 3.5, fill: "#7c3aed", stroke: "#fff", strokeWidth: 1.2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nation"
                    name="전국 평균"
                    stroke="#64748b"
                    strokeWidth={1.6}
                    strokeDasharray="5 4"
                    dot={{ r: 3.5, fill: "#64748b", stroke: "#fff", strokeWidth: 1.2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>5극 3특 권역</h3>
              <p className={`${FDB_TYPO.legend} mb-2`}>
                막대 권역 평균 · 선 {univ.schoolName}({zone}). {metricLabel}
              </p>
              <SchoolVsGroupChart
                data={zoneData}
                schoolName={univ.schoolName}
                metricLabel={metricLabel}
                highlight={zone}
              />
            </div>
            <div className="rounded-lg border border-border p-3">
              <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>학생규모 비교</h3>
              <p className={`${FDB_TYPO.legend} mb-2`}>
                막대 규모 평균 · 선 {univ.schoolName}({scale}). {metricLabel}
              </p>
              <SchoolVsGroupChart
                data={scaleData}
                schoolName={univ.schoolName}
                metricLabel={metricLabel}
                highlight={scale}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>시도순위</h3>
            <p className={`${FDB_TYPO.legend} mb-2`}>
              막대 시·도 평균 · 선 {univ.schoolName}({univ.region}). {metricLabel}
            </p>
            <SchoolVsGroupChart
              data={sidoData}
              schoolName={univ.schoolName}
              metricLabel={metricLabel}
              highlight={univ.region}
              xAngle={-28}
            />
          </div>
        </section>
      </div>
    </StudentFillFrame>
  );
}
