import { ANALYTICS_ZONES } from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import type { SchoolScaleLabel } from "@/lib/competitiveness-analysis/school-scale";

import {
  SETTLEMENT_COHORT_LABEL,
  type SettlementCohort,
  type SettlementIncomeKey,
  type SettlementIncomeReportData,
  type SettlementSchoolYear,
  type SettlementYoyCell,
} from "./settlement-income-types";

export const SCALE_ORDER: SchoolScaleLabel[] = ["대규모", "중규모", "소규모"];

export function yoyPct(prior: number, next: number): number | null {
  if (!Number.isFinite(prior) || prior === 0) return null;
  if (!Number.isFinite(next)) return null;
  return Math.round(((next - prior) / prior) * 1000) / 10;
}

export function schoolsOf(
  data: SettlementIncomeReportData,
  year: number,
  cohort?: SettlementCohort,
): SettlementSchoolYear[] {
  return data.schools.filter(
    (row) => row.year === year && (cohort == null || row.cohort === cohort),
  );
}

export function sumMetric(
  rows: SettlementSchoolYear[],
  metric: SettlementIncomeKey,
): number {
  return rows.reduce((acc, row) => acc + row.amounts[metric], 0);
}

export function yoyByGroup(
  data: SettlementIncomeReportData,
  metric: SettlementIncomeKey,
  groupOf: (row: SettlementSchoolYear) => string | null,
  labels: readonly string[],
  cohort?: SettlementCohort,
): SettlementYoyCell[] {
  const prior = schoolsOf(data, data.priorYear, cohort);
  const current = schoolsOf(data, data.settlementYear, cohort);
  const priorMap = new Map(prior.map((row) => [row.schoolRepCode, row]));
  const currentMap = new Map(current.map((row) => [row.schoolRepCode, row]));

  return labels.map((label) => {
    const priorG = prior.filter((row) => groupOf(row) === label);
    const currentG = current.filter((row) => groupOf(row) === label);
    let pairedPrior = 0;
    let pairedYear = 0;
    let pairedN = 0;
    for (const row of currentG) {
      const prev = priorMap.get(row.schoolRepCode);
      if (!prev || groupOf(prev) !== label) continue;
      pairedN += 1;
      pairedPrior += prev.amounts[metric];
      pairedYear += row.amounts[metric];
    }
    return {
      label,
      priorSum: sumMetric(priorG, metric),
      yearSum: sumMetric(currentG, metric),
      priorN: priorG.length,
      yearN: currentG.length,
      pairedN,
      pairedPrior,
      pairedYear,
      yoyPct: yoyPct(pairedPrior, pairedYear),
    };
  }).filter((cell) => cell.priorN + cell.yearN + cell.pairedN > 0);
}

export function yoyCohorts(
  data: SettlementIncomeReportData,
  metric: SettlementIncomeKey,
): SettlementYoyCell[] {
  return yoyByGroup(
    data,
    metric,
    (row) => SETTLEMENT_COHORT_LABEL[row.cohort],
    ["대학", "전문대학"],
  );
}

export function yoyZones(
  data: SettlementIncomeReportData,
  metric: SettlementIncomeKey,
  cohort?: SettlementCohort,
): SettlementYoyCell[] {
  return yoyByGroup(data, metric, (row) => row.zone, ANALYTICS_ZONES, cohort);
}

export function yoySido(
  data: SettlementIncomeReportData,
  metric: SettlementIncomeKey,
  cohort?: SettlementCohort,
): SettlementYoyCell[] {
  return yoyByGroup(
    data,
    metric,
    (row) => row.sido,
    KOREA_SIDO_REGIONS.map((r) => r.shortLabel),
    cohort,
  );
}

export function yoyScale(
  data: SettlementIncomeReportData,
  metric: SettlementIncomeKey,
  cohort?: SettlementCohort,
): SettlementYoyCell[] {
  return yoyByGroup(data, metric, (row) => row.scale, SCALE_ORDER, cohort);
}

export function trendByCohort(
  data: SettlementIncomeReportData,
  metric: SettlementIncomeKey,
): { year: number; university: number; junior: number }[] {
  return data.trendYears.map((year) => ({
    year,
    university: sumMetric(schoolsOf(data, year, "university"), metric),
    junior: sumMetric(schoolsOf(data, year, "junior-college"), metric),
  }));
}

export function matchCountTable(data: SettlementIncomeReportData): {
  label: string;
  prior: number;
  year: number;
}[] {
  return [
    {
      label: "대학(일반·산업)",
      prior: schoolsOf(data, data.priorYear, "university").length,
      year: schoolsOf(data, data.settlementYear, "university").length,
    },
    {
      label: "전문대학",
      prior: schoolsOf(data, data.priorYear, "junior-college").length,
      year: schoolsOf(data, data.settlementYear, "junior-college").length,
    },
  ];
}
