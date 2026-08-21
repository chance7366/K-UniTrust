import type { SchoolAgePopulationRow } from "@/lib/data/school-age-population";
import {
  SCHOOL_AGE_BASELINE_AGE,
  SCHOOL_AGE_FAR_AGE,
  SCHOOL_AGE_FUTURE_AGES,
  SCHOOL_AGE_POPULATION_REGION_ORDER,
  buildSchoolAgeAdmissionTimeline,
  schoolAgeKey,
  type SchoolAgeAdmissionSlot,
  type SchoolAgeAge,
  type SchoolAgeAgeKey,
} from "@/lib/ingest/school-age-population-config";

export type SchoolAgePopulationSection = "dashboard" | "sido-data";

export type DeclineTableValueMode = "index" | "count";

export type RiskMatrixEntry = {
  region: string;
  index: number;
  count: number;
  changePct: number;
  isHighRisk: boolean;
  color: string;
};

export type RegionIndexPoint = {
  year: number;
  age: SchoolAgeAge;
  ageLabel: string;
  axisLabel: string;
  count: number;
  index: number;
};

export type RegionIndexSeries = {
  region: string;
  regionCode: string;
  baselineCount: number;
  points: RegionIndexPoint[];
};

export type BarRaceEntry = {
  region: string;
  index: number;
  count: number;
  color: string;
};

export type DeclineDashboardKpi = {
  baselineAge: number;
  baselineAdmissionYear: number;
  farAge: number;
  farAdmissionYear: number;
  nationalBaselineCount: number;
  nationalFarCount: number;
  nationalFarIndex: number;
  nationalFarChangePct: number;
  worstRegion: string;
  worstRegionFarIndex: number;
  worstRegionFarChangePct: number;
  bestRegion: string;
  bestRegionFarIndex: number;
  bestRegionFarChangePct: number;
};

export type RiskTierId = "high" | "mid" | "low";

export type RiskTierGroup = {
  id: RiskTierId;
  title: string;
  countLabel: string;
  regions: { region: string; index: number }[];
};

export type LineChartRegionFilter = "ALL" | "SUDOGWON" | "NON_SUDOGWON";

export type DeclineDashboardModel = {
  displayYear: number;
  timeline: SchoolAgeAdmissionSlot[];
  sidoSeries: RegionIndexSeries[];
  nationalSeries: RegionIndexSeries;
  kpi: DeclineDashboardKpi;
  barRaceByYear: Map<number, BarRaceEntry[]>;
  lineChartRows: Array<Record<string, number | string>>;
  riskMatrixFar: RiskMatrixEntry[];
  riskTierGroupsFar: RiskTierGroup[];
};

export const SUDOGWON_REGIONS = ["서울", "경기", "인천"] as const;

export const REGION_DISPLAY_NAMES: Record<string, string> = {
  전북: "전라북도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  충북: "충청북도",
  충남: "충청남도",
  강원: "강원특별자치도",
  제주: "제주특별자치도",
  세종: "세종특별자치시",
};

export const BAR_RACE_FIXED_REGION_ORDER = SCHOOL_AGE_POPULATION_REGION_ORDER.filter(
  (region) => region !== "전국",
);

export const BAR_RACE_PLAY_INTERVAL_MS = 1600;

export const BAR_RACE_COLOR_LEGEND = [
  { label: "≥95%", color: "#22C55E" },
  { label: "85~94.9%", color: "#EAB308" },
  { label: "75~84.9%", color: "#F97316" },
  { label: "<75%", color: "#EF4444" },
] as const;

export function getRegionDisplayName(region: string): string {
  return REGION_DISPLAY_NAMES[region] ?? region;
}

/** ≥95 녹색 · ≥85 노랑 · ≥75 주황 · <75 빨강 */
export function barRaceBarColor(index: number): string {
  if (index >= 95) return "#22C55E";
  if (index >= 85) return "#EAB308";
  if (index >= 75) return "#F97316";
  return "#EF4444";
}

export function alignBarRaceEntries(entries: BarRaceEntry[]): BarRaceEntry[] {
  const byRegion = new Map(entries.map((entry) => [entry.region, entry]));

  return BAR_RACE_FIXED_REGION_ORDER.map((region) => {
    const entry = byRegion.get(region);
    if (entry) {
      return { ...entry, color: barRaceBarColor(entry.index) };
    }
    return {
      region,
      index: 0,
      count: 0,
      color: barRaceBarColor(0),
    };
  });
}

export function tableCellColorClass(index: number): string {
  if (index < 75) return "text-red-400 font-bold";
  if (index < 85) return "text-orange-400";
  if (index < 95) return "text-amber-400";
  return "text-emerald-400";
}

export function calcSchoolAgeIndex(count: number, baselineCount: number): number {
  if (!baselineCount) return 0;
  return (count / baselineCount) * 100;
}

/** 0세(최원년) 지수 분포에 맞춘 위험 구간 */
export function buildRiskTierGroupsFar(
  entries: RiskMatrixEntry[],
): RiskTierGroup[] {
  const high = entries.filter((entry) => entry.index < 45);
  const mid = entries.filter(
    (entry) => entry.index >= 45 && entry.index < 52,
  );
  const low = entries.filter((entry) => entry.index >= 52);

  return [
    {
      id: "high",
      title: "고위험군 (지수 45 미만)",
      countLabel: `${high.length}개 지역`,
      regions: high.map((entry) => ({
        region: entry.region,
        index: entry.index,
      })),
    },
    {
      id: "mid",
      title: "중위험군 (지수 45 ~ 52 미만)",
      countLabel: `${mid.length}개 지역`,
      regions: mid.map((entry) => ({
        region: entry.region,
        index: entry.index,
      })),
    },
    {
      id: "low",
      title: "상대적 완화군 (지수 52 이상)",
      countLabel: `${low.length}개 지역`,
      regions: low.map((entry) => ({
        region: entry.region,
        index: entry.index,
      })),
    },
  ];
}

type AgeCounts = Record<SchoolAgeAgeKey, number>;

function readFutureAgeCounts(
  row: SchoolAgePopulationRow,
  displayYear: number,
): AgeCounts | null {
  const cell = row.byYear[displayYear];
  if (!cell) return null;

  const counts = {} as AgeCounts;
  for (const age of SCHOOL_AGE_FUTURE_AGES) {
    const value = cell.ages[schoolAgeKey(age)];
    if (value == null) return null;
    counts[schoolAgeKey(age)] = value;
  }
  return counts;
}

function buildNationalAgeCounts(
  rows: SchoolAgePopulationRow[],
  displayYear: number,
): AgeCounts | null {
  const national = rows.find((row) => row.region === "전국");
  const fromNational = national
    ? readFutureAgeCounts(national, displayYear)
    : null;
  if (fromNational) return fromNational;

  const sidoRows = rows.filter((row) => row.region !== "전국");
  const counts = {} as AgeCounts;
  for (const age of SCHOOL_AGE_FUTURE_AGES) {
    let sum = 0;
    for (const row of sidoRows) {
      const value = row.byYear[displayYear]?.ages[schoolAgeKey(age)];
      if (value == null) return null;
      sum += value;
    }
    counts[schoolAgeKey(age)] = sum;
  }
  return counts;
}

function buildRegionIndexSeriesFromCounts(
  region: string,
  regionCode: string,
  counts: AgeCounts,
  timeline: SchoolAgeAdmissionSlot[],
): RegionIndexSeries {
  const baselineCount = counts[schoolAgeKey(SCHOOL_AGE_BASELINE_AGE)];
  const points = timeline.map((slot) => {
    const count = counts[schoolAgeKey(slot.age)];
    return {
      year: slot.year,
      age: slot.age,
      ageLabel: slot.ageLabel,
      axisLabel: slot.axisLabel,
      count,
      index: calcSchoolAgeIndex(count, baselineCount),
    };
  });

  return {
    region,
    regionCode,
    baselineCount,
    points,
  };
}

export function buildDeclineDashboardModelFromRows(
  rows: SchoolAgePopulationRow[],
  displayYear: number,
): DeclineDashboardModel | null {
  const nationalCounts = buildNationalAgeCounts(rows, displayYear);
  if (!nationalCounts) return null;

  const timeline = buildSchoolAgeAdmissionTimeline(displayYear);
  const nationalSeries = buildRegionIndexSeriesFromCounts(
    "전국",
    "0",
    nationalCounts,
    timeline,
  );

  const sidoSeries = rows
    .filter((row) => row.region !== "전국")
    .map((row) => {
      const counts = readFutureAgeCounts(row, displayYear);
      if (!counts) return null;
      return buildRegionIndexSeriesFromCounts(
        row.region,
        row.regionCode,
        counts,
        timeline,
      );
    })
    .filter((series): series is RegionIndexSeries => series != null);

  if (sidoSeries.length === 0) return null;

  const barRaceByYear = new Map<number, BarRaceEntry[]>();
  for (const slot of timeline) {
    const entries = alignBarRaceEntries(
      sidoSeries.map((series) => {
        const point = series.points.find((p) => p.year === slot.year)!;
        return {
          region: series.region,
          index: point.index,
          count: point.count,
          color: barRaceBarColor(point.index),
        };
      }),
    );
    barRaceByYear.set(slot.year, entries);
  }

  const lineChartRows = timeline.map((slot) => {
    const nationalPoint = nationalSeries.points.find((p) => p.year === slot.year)!;
    const row: Record<string, number | string> = {
      year: slot.year,
      axisLabel: slot.axisLabel,
      nationalAvg: nationalPoint.index,
    };
    for (const series of sidoSeries) {
      const point = series.points.find((p) => p.year === slot.year)!;
      row[series.region] = point.index;
    }
    return row;
  });

  const farYear = timeline[timeline.length - 1]!.year;
  const nationalFar = nationalSeries.points.find((p) => p.year === farYear)!;
  const worst = [...sidoSeries]
    .map((series) => ({
      region: series.region,
      point: series.points.find((p) => p.year === farYear)!,
    }))
    .sort((a, b) => a.point.index - b.point.index)[0];

  const best = [...sidoSeries]
    .map((series) => ({
      region: series.region,
      point: series.points.find((p) => p.year === farYear)!,
    }))
    .sort((a, b) => b.point.index - a.point.index)[0];

  const kpi: DeclineDashboardKpi = {
    baselineAge: SCHOOL_AGE_BASELINE_AGE,
    baselineAdmissionYear: timeline[0]!.year,
    farAge: SCHOOL_AGE_FAR_AGE,
    farAdmissionYear: farYear,
    nationalBaselineCount: nationalCounts[schoolAgeKey(SCHOOL_AGE_BASELINE_AGE)],
    nationalFarCount: nationalFar.count,
    nationalFarIndex: nationalFar.index,
    nationalFarChangePct: nationalFar.index - 100,
    worstRegion: worst.region,
    worstRegionFarIndex: worst.point.index,
    worstRegionFarChangePct: worst.point.index - 100,
    bestRegion: best.region,
    bestRegionFarIndex: best.point.index,
    bestRegionFarChangePct: best.point.index - 100,
  };

  const riskMatrixFar = sidoSeries
    .map((series) => {
      const point = series.points.find((p) => p.year === farYear)!;
      return {
        region: series.region,
        index: point.index,
        count: point.count,
        changePct: point.index - 100,
        isHighRisk: point.index < 45,
        color: barRaceBarColor(point.index),
      };
    })
    .sort((a, b) => a.index - b.index);

  return {
    displayYear,
    timeline,
    sidoSeries,
    nationalSeries,
    kpi,
    barRaceByYear,
    lineChartRows,
    riskMatrixFar,
    riskTierGroupsFar: buildRiskTierGroupsFar(riskMatrixFar),
  };
}

export function fmtIndex(n: number): string {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function fmtCount(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function fmtSignedPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}
