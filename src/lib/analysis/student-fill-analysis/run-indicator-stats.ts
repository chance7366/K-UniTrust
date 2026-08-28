import { splitTwoSchoolByDivision } from "@/lib/analysis/all-universities-cohort";
import {
  partitionIndicatorStats,
  type IndicatorGeoSource,
} from "@/lib/analysis/indicator-stats-geo";
import type {
  IndicatorStatsBundle,
  IndicatorStatsColumn,
  IndicatorStatsNumericRow,
} from "@/lib/analysis/indicator-stats";
import type { EnrolledScaleLookupJson } from "@/lib/analysis/school-scale-trend";

import { weightedPeerRates } from "./peer-aggregates";
import type { SfaChartStage } from "./run-chart-metrics";
import type { StudentFillChartHistoryYear } from "./run-chart-rows";
import type { StudentFillSchoolRow } from "./types";

export type StudentFillStatGeoRow = StudentFillSchoolRow &
  IndicatorGeoSource & { year: number; schoolRepCode: string };

export const SFA_FRESHMAN_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "recruitTotal", label: "계", group: "모집인원", format: "int" },
  { id: "recruitWithin", label: "정원내", group: "모집인원", format: "int" },
  { id: "recruitOutside", label: "정원외", group: "모집인원", format: "int" },
  { id: "admitTotal", label: "계", group: "입학자", format: "int" },
  { id: "admitWithin", label: "정원내", group: "입학자", format: "int" },
  { id: "admitOutside", label: "정원외", group: "입학자", format: "int" },
  { id: "rateIn", label: "정원내충원율", format: "rate", rateTone: "secondary" },
  { id: "rateAll", label: "정원내외충원율", format: "rate", rateTone: "primary" },
  { id: "outShare", label: "정원외비중", format: "rate" },
  { id: "freshmanDropoutCount", label: "신입생탈락", format: "int" },
  { id: "freshmanDropoutRate", label: "신입생탈락율", format: "rate" },
];

export const SFA_ENROLLED_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "studentQuota", label: "학생정원", format: "int" },
  { id: "enrolledFill", label: "재학생", format: "int" },
  { id: "enrolledFillRate", label: "재학생충원율", format: "rate", rateTone: "primary" },
  { id: "enrolledFillRateIn", label: "정원내충원율", format: "rate" },
  { id: "enrolledOutside", label: "정원외재학생", format: "int" },
  { id: "enrolledOutShare", label: "정원외비중", format: "rate" },
  { id: "dropoutCount", label: "중도탈락", format: "int" },
  { id: "dropoutRate", label: "중도탈락율", format: "rate", rateTone: "secondary" },
];

export const SFA_FOREIGN_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "foreignDegree", label: "학위외국인", format: "int" },
  { id: "enrolledTotal", label: "재학생수", format: "int" },
  { id: "foreignShare", label: "재적대비비중", format: "rate", rateTone: "primary" },
  { id: "langAbilityRate", label: "언어능력충족율", format: "rate" },
  { id: "foreignDropCount", label: "외국인탈락", format: "int" },
  { id: "foreignDropRate", label: "외국인탈락율", format: "rate", rateTone: "secondary" },
  { id: "foreignDropAllCount", label: "전체외국인탈락", format: "int" },
  { id: "foreignDropAllRate", label: "전체외국인탈락율", format: "rate" },
];

export function sfaStageStatsColumns(stage: SfaChartStage): IndicatorStatsColumn[] {
  if (stage === "freshman") return SFA_FRESHMAN_STATS_COLUMNS;
  if (stage === "enrolled") return SFA_ENROLLED_STATS_COLUMNS;
  return SFA_FOREIGN_STATS_COLUMNS;
}

export function toStudentFillStatGeoRows(
  history: StudentFillChartHistoryYear[],
): StudentFillStatGeoRow[] {
  return history.flatMap(({ year, schools }) =>
    schools.map((row) => ({
      ...row,
      year,
      schoolRepCode: row.schoolCodeStd,
    })),
  );
}

function sum(rows: StudentFillSchoolRow[], pick: (row: StudentFillSchoolRow) => number | null | undefined) {
  let total = 0;
  for (const row of rows) {
    const v = pick(row);
    if (v == null || !Number.isFinite(v)) continue;
    total += v;
  }
  return total;
}

function stageAgg(label: string, rows: StudentFillSchoolRow[]): IndicatorStatsNumericRow {
  const rates = weightedPeerRates(rows);
  return {
    label,
    schoolCount: rows.length,
    values: {
      recruitWithin: sum(rows, (r) => r.recruitWithin),
      admitWithin: sum(rows, (r) => r.admitWithin),
      recruitOutside: sum(rows, (r) => r.recruitOutside),
      admitOutside: sum(rows, (r) => r.admitOutside),
      recruitTotal: sum(rows, (r) => r.recruitTotal),
      admitTotal: sum(rows, (r) => r.admitTotal),
      freshmanDropoutCount: sum(rows, (r) => r.freshmanDropoutCount),
      studentQuota: sum(rows, (r) => r.studentQuota),
      enrolledFill: sum(rows, (r) => r.enrolledFill),
      enrolledOutside: sum(rows, (r) => r.enrolledOutside),
      dropoutCount: sum(rows, (r) => r.dropoutCount),
      foreignDegree: sum(rows, (r) => r.foreignDegree),
      enrolledTotal: sum(rows, (r) => r.enrolledTotal),
      foreignDropCount: sum(rows, (r) => r.foreignDropCount),
      foreignDropAllCount: sum(rows, (r) => r.foreignDropAllCount),
      rateIn: rates.rateIn,
      rateAll: rates.rateAll,
      outShare: rates.outShare,
      freshmanDropoutRate: rates.freshmanDropoutRate,
      enrolledFillRate: rates.enrolledFillRate,
      enrolledFillRateIn: rates.enrolledFillRateIn,
      enrolledOutShare: rates.enrolledOutShare,
      dropoutRate: rates.dropoutRate,
      foreignShare: rates.foreignShare,
      langAbilityRate: rates.langAbilityRate,
      foreignDropRate: rates.foreignDropRate,
      foreignDropAllRate: (() => {
        const num = sum(rows, (r) => r.foreignDropAllCount);
        const den = sum(rows, (r) => r.foreignDropAllEnrolled);
        if (den <= 0) return null;
        return Math.round((num / den) * 1000) / 10;
      })(),
    },
  };
}

export function buildStudentFillRunIndicatorStats(args: {
  viewRows: StudentFillStatGeoRow[];
  lookup: EnrolledScaleLookupJson;
  showDivision: boolean;
}): IndicatorStatsBundle {
  const parts = partitionIndicatorStats(args.viewRows, args.lookup);
  const map = (groups: { label: string; rows: StudentFillStatGeoRow[] }[]) =>
    groups.map((g) => stageAgg(g.label, g.rows));
  let division: IndicatorStatsNumericRow[] | null = null;
  if (args.showDivision) {
    const split = splitTwoSchoolByDivision(args.viewRows);
    division = [
      stageAgg("전체", args.viewRows),
      stageAgg("대학", split.university),
      stageAgg("전문대학", split["junior-college"]),
    ];
  }
  return {
    division,
    scale: map(parts.scale),
    zone: map(parts.zone),
    region: map(parts.region),
  };
}
