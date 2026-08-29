import { matchesAdvancedChartRowFilters } from "@/lib/analysis/advanced-chart-filters";
import { studentFillSchoolKind } from "@/lib/analysis/all-universities-cohort";
import {
  isStudentFillPrivateEstb,
  isStudentFillPublicEstb,
} from "@/lib/analysis/student-fill-analysis/cohort-rules";
import {
  ANALYTICS_ZONES,
  sidoShortLabel,
  zoneForSido,
} from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import {
  SCALE_ORDER,
  scaleForChartRow,
  type EnrolledScaleLookupJson,
} from "@/lib/analysis/school-scale-trend";

export type IndicatorGeoSource = {
  year: number;
  schoolRepCode: string;
  region: string;
  schoolDivision: string;
  estb: string;
};

export type IndicatorStatsGroup<T> = {
  label: string;
  rows: T[];
};

export type IndicatorStatsChartFilters = {
  year: number;
  estb: string;
  schoolDivision: string;
  schoolKinds: string[];
};

export const INDICATOR_STATS_TAB_HELP = {
  title: "지표통계 탭",
  body: "학교구분별(전체대학일 때)·국공사립별(국공사립 탭)·규모별·권역별·지역별로 지표 원자료를 합산합니다. 율은 합산 뒤 기존 분모 규칙으로 다시 계산합니다. 국공사립별은 전체·국공립(국립·공립·국립대법인)·사립입니다. 규모는 재학생수 기준(대학 1만/5천, 전문대학 4천/2천)이며 규모를 못 정한 학교는 전체에만 포함됩니다.",
};

export const ESTB_GROUP_ORDER = ["국공립", "사립"] as const;

export function indicatorEstbGroupLabel(estb: string): "국공립" | "사립" | null {
  if (isStudentFillPrivateEstb(estb)) return "사립";
  if (isStudentFillPublicEstb(estb)) return "국공립";
  return null;
}

export function filterIndicatorGeoRows<T extends IndicatorGeoSource>(
  rows: T[],
  filters: IndicatorStatsChartFilters,
): T[] {
  return rows.filter((row) => {
    if (row.year !== filters.year) return false;
    return matchesAdvancedChartRowFilters(
      {
        year: row.year,
        estb: row.estb,
        schoolKind: studentFillSchoolKind(row.schoolDivision),
        schoolDivision: row.schoolDivision,
        region: row.region,
      },
      filters,
    );
  });
}

export function partitionIndicatorStats<T extends IndicatorGeoSource>(
  viewRows: T[],
  lookup: EnrolledScaleLookupJson,
): {
  total: IndicatorStatsGroup<T>;
  estb: IndicatorStatsGroup<T>[];
  region: IndicatorStatsGroup<T>[];
  zone: IndicatorStatsGroup<T>[];
  scale: IndicatorStatsGroup<T>[];
} {
  const total: IndicatorStatsGroup<T> = { label: "전체", rows: viewRows };

  const byEstb = new Map<string, T[]>();
  for (const row of viewRows) {
    const group = indicatorEstbGroupLabel(row.estb);
    if (!group) continue;
    const list = byEstb.get(group);
    if (list) list.push(row);
    else byEstb.set(group, [row]);
  }
  const estb: IndicatorStatsGroup<T>[] = [
    total,
    ...ESTB_GROUP_ORDER.map((label) => ({
      label,
      rows: byEstb.get(label) ?? [],
    })),
  ];

  const bySido = new Map<string, T[]>();
  for (const row of viewRows) {
    const key = sidoShortLabel(row.region);
    const list = bySido.get(key);
    if (list) list.push(row);
    else bySido.set(key, [row]);
  }
  const region: IndicatorStatsGroup<T>[] = [
    total,
    ...KOREA_SIDO_REGIONS.map((sido) => ({
      label: sido.shortLabel,
      rows: bySido.get(sido.shortLabel) ?? [],
    })),
  ];

  const byZone = new Map<string, T[]>();
  for (const row of viewRows) {
    const zone = zoneForSido(row.region);
    if (!zone) continue;
    const list = byZone.get(zone);
    if (list) list.push(row);
    else byZone.set(zone, [row]);
  }
  const zone: IndicatorStatsGroup<T>[] = [
    total,
    ...ANALYTICS_ZONES.map((z) => ({
      label: z,
      rows: byZone.get(z) ?? [],
    })),
  ];

  const byScale = new Map<string, T[]>();
  for (const row of viewRows) {
    const scale = scaleForChartRow(lookup, {
      year: row.year,
      schoolCodeStd: row.schoolRepCode,
      schoolKind: studentFillSchoolKind(row.schoolDivision),
      schoolDivision: row.schoolDivision,
    });
    if (!scale) continue;
    const list = byScale.get(scale);
    if (list) list.push(row);
    else byScale.set(scale, [row]);
  }
  const scale: IndicatorStatsGroup<T>[] = [
    total,
    ...SCALE_ORDER.map((s) => ({
      label: s,
      rows: byScale.get(s) ?? [],
    })),
  ];

  return { total, estb, region, zone, scale };
}
