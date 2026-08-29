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

import { ChartMetricToggle } from "@/components/analysis/ChartMetricToggle";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import { studentFillEstbGroupLabel } from "@/lib/analysis/student-fill-analysis/peer-aggregates";
import type {
  StudentFillPeerMetricKey,
  StudentFillPeerPayload,
  StudentFillPeerRates,
} from "@/lib/analysis/student-fill-analysis/peer-aggregates";
import type { StudentFillSchoolRow } from "@/lib/analysis/student-fill-analysis/types";

import "@/components/analysis/freshman-enrollment-alimi-table.css";

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
type StageMetric = FreshmanMetric | EnrolledMetric | ForeignMetric;

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

const DEFAULT_METRIC: Record<Stage, StageMetric> = {
  freshman: "rateIn",
  enrolled: "enrolledFillRate",
  foreign: "foreignShare",
};

function labelsFor(stage: Stage): Record<string, string> {
  if (stage === "freshman") return FRESHMAN_LABELS;
  if (stage === "enrolled") return ENROLLED_LABELS;
  return FOREIGN_LABELS;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function rateOf(
  rates: StudentFillPeerRates | null | undefined,
  key: StudentFillPeerMetricKey,
): number | null {
  if (!rates) return null;
  const value = rates[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function SchoolVsGroupChart({
  data,
  schoolName,
  metricLabel,
  highlight,
  xAngle,
}: {
  data: { name: string; group: number | null; school: number | null }[];
  schoolName: string;
  metricLabel: string;
  highlight?: string | null;
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
          <Bar dataKey="group" name={`${metricLabel} 집단평균`} radius={[4, 4, 0, 0]} maxBarSize={36}>
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
            connectNulls
            dot={{ r: 4, fill: "#2563eb", stroke: "#fff", strokeWidth: 1.4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StudentFillUniversityResultPane({
  school,
  peer,
}: {
  school: StudentFillSchoolRow;
  peer: StudentFillPeerPayload | null;
}) {
  const [stage, setStage] = useState<Stage>("freshman");
  const [metric, setMetric] = useState<StageMetric>("rateIn");
  const stageLabels = labelsFor(stage);
  const activeMetric = (
    Object.prototype.hasOwnProperty.call(stageLabels, metric) ? metric : DEFAULT_METRIC[stage]
  ) as StudentFillPeerMetricKey;
  const metricLabel = stageLabels[activeMetric] ?? activeMetric;
  const zoneLabel = school.zone ?? peer?.slices.zone?.label ?? "권역";
  const scaleLabel = school.scale ?? peer?.slices.scale?.label ?? "규모";
  const estbLabel = studentFillEstbGroupLabel(school.estb);
  const years = useMemo(() => (peer?.trend ?? []).map((row) => row.year), [peer]);

  const tableRows = useMemo(() => {
    const keys = Object.keys(stageLabels) as StudentFillPeerMetricKey[];
    return keys.map((key) => ({
      key,
      label: stageLabels[key]!,
      years: (peer?.trend ?? []).map((row) => rateOf(row.school, key)),
      zone: rateOf(peer?.slices.zone ?? undefined, key),
      scale: rateOf(peer?.slices.scale ?? undefined, key),
      estb: rateOf(peer?.slices.estb ?? undefined, key),
      nation: rateOf(peer?.slices.nationwide ?? undefined, key),
    }));
  }, [peer, stageLabels]);

  const trend = useMemo(
    () =>
      (peer?.trend ?? []).map((row) => ({
        year: row.year,
        school: rateOf(row.school, activeMetric),
        scale: rateOf(row.scale, activeMetric),
        zone: rateOf(row.zone, activeMetric),
        estb: rateOf(row.estb, activeMetric),
        nation: rateOf(row.nationwide, activeMetric),
      })),
    [peer, activeMetric],
  );

  const latestSchool = rateOf(
    peer?.trend?.[peer.trend.length - 1]?.school,
    activeMetric,
  ) ?? school[activeMetric];

  const zoneData = useMemo(
    () =>
      (peer?.compare.zones ?? []).map((row) => ({
        name: row.label,
        group: rateOf(row.rates, activeMetric),
        school: latestSchool,
      })),
    [peer, activeMetric, latestSchool],
  );
  const scaleData = useMemo(
    () =>
      (peer?.compare.scales ?? []).map((row) => ({
        name: row.label,
        group: rateOf(row.rates, activeMetric),
        school: latestSchool,
      })),
    [peer, activeMetric, latestSchool],
  );
  const sidoData = useMemo(
    () =>
      [...(peer?.compare.sidos ?? [])]
        .map((row) => ({
          name: row.label,
          group: rateOf(row.rates, activeMetric),
          school: latestSchool,
        }))
        .sort((a, b) => (b.group ?? -1) - (a.group ?? -1)),
    [peer, activeMetric, latestSchool],
  );

  if (!peer) {
    return <p className={FDB_TYPO.bodyText}>비교 집단을 불러오는 중이거나 자료가 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
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
        <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>5개년 지표 · {school.schoolName}</h3>
        <p className={`${FDB_TYPO.legend} mb-2`}>
          행은 분석결과 해당 단계의 지표입니다. 선택 지표는 강조합니다. {zoneLabel}·{scaleLabel}·{estbLabel}·전국은
          최근 연도 동종 가중평균입니다.
        </p>
        <div className="feam-table-wrap mt-3 overflow-auto rounded-lg border border-border/60">
          <table className={`w-full min-w-[820px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}>
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["지표", ...years.map((y) => `${y}년`), zoneLabel, scaleLabel, estbLabel, "전국"].map((h) => (
                  <th
                    key={h}
                    className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} ${
                      h === "지표" ? "text-left" : "pr-[5ch] text-right"
                    } last:border-r-0`}
                  >
                    {h}
                  </th>
                ))}
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
                      <td key={`${row.key}-${years[yi]}`} className={`${num} ${FDB_TABLE_COLOR.ratePrimary}`}>
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
          선택 대학과 {scaleLabel}·{zoneLabel}·{estbLabel}·전국 평균입니다.
        </p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="4 4" />
              <XAxis dataKey="year" tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART_THEME.axisLabel }} />
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
                name={school.schoolName}
                stroke="#2563eb"
                strokeWidth={2.6}
                connectNulls
                dot={{ r: 4, fill: "#2563eb", stroke: "#fff", strokeWidth: 1.4 }}
              />
              <Line
                type="monotone"
                dataKey="scale"
                name={`${scaleLabel} 평균`}
                stroke="#d97706"
                strokeWidth={1.8}
                connectNulls
                dot={{ r: 3.5, fill: "#d97706", stroke: "#fff", strokeWidth: 1.2 }}
              />
              <Line
                type="monotone"
                dataKey="zone"
                name={`${zoneLabel} 평균`}
                stroke="#0d9488"
                strokeWidth={1.8}
                connectNulls
                dot={{ r: 3.5, fill: "#0d9488", stroke: "#fff", strokeWidth: 1.2 }}
              />
              <Line
                type="monotone"
                dataKey="estb"
                name={`${estbLabel} 평균`}
                stroke="#7c3aed"
                strokeWidth={1.8}
                connectNulls
                dot={{ r: 3.5, fill: "#7c3aed", stroke: "#fff", strokeWidth: 1.2 }}
              />
              <Line
                type="monotone"
                dataKey="nation"
                name="전국 평균"
                stroke="#64748b"
                strokeWidth={1.6}
                strokeDasharray="5 4"
                connectNulls
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
            막대 권역 평균 · 선 {school.schoolName}({zoneLabel}). {metricLabel}
          </p>
          <SchoolVsGroupChart
            data={zoneData}
            schoolName={school.schoolName}
            metricLabel={metricLabel}
            highlight={school.zone}
          />
        </div>
        <div className="rounded-lg border border-border p-3">
          <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>학생규모 비교</h3>
          <p className={`${FDB_TYPO.legend} mb-2`}>
            막대 규모 평균 · 선 {school.schoolName}({scaleLabel}). {metricLabel}
          </p>
          <SchoolVsGroupChart
            data={scaleData}
            schoolName={school.schoolName}
            metricLabel={metricLabel}
            highlight={school.scale}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <h3 className={`${CHART_TYPO.panelTitle} mb-1`}>시도순위</h3>
        <p className={`${FDB_TYPO.legend} mb-2`}>
          막대 시·도 평균 · 선 {school.schoolName}({school.region}). {metricLabel}
        </p>
        <SchoolVsGroupChart
          data={sidoData}
          schoolName={school.schoolName}
          metricLabel={metricLabel}
          highlight={school.region}
          xAngle={-28}
        />
      </div>
    </div>
  );
}
