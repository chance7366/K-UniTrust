import { getExtinctionRiskGradeStyle } from "@/lib/analysis/regional-decline-grade";
import { BAR_RACE_FIXED_REGION_ORDER } from "@/lib/analysis/school-age-decline-analytics";
import type {
  RegionalDeclineCell,
  RegionalDeclineRow,
} from "@/lib/data/regional-decline";
import {
  REGIONAL_DECLINE_CHART_START_YEAR,
  REGIONAL_DECLINE_REGION_ORDER,
} from "@/lib/ingest/regional-decline-config";

export type RegionalDeclineSection = "dashboard" | "sido-data";

export type RegionalDeclineBarRaceEntry = {
  region: string;
  index: number;
  grade: number;
  color: string;
};

export type RegionalDeclineYearPoint = {
  year: number;
  index: number;
  grade: number;
};

export type RegionalDeclineSeries = {
  region: string;
  points: RegionalDeclineYearPoint[];
};

export type RegionalDeclineGradeGroup = {
  grade: number;
  label: string;
  color: string;
  countLabel: string;
  regions: { region: string; index: number }[];
};

export type RegionalDeclineDashboardKpi = {
  startYear: number;
  latestYear: number;
  nationalStartIndex: number;
  nationalLatestIndex: number;
  nationalChange: number;
  worstRegion: string;
  worstLatestIndex: number;
  bestRegion: string;
  bestLatestIndex: number;
};

export type RegionalDeclineDashboardModel = {
  years: number[];
  sidoSeries: RegionalDeclineSeries[];
  nationalSeries: RegionalDeclineSeries;
  kpi: RegionalDeclineDashboardKpi;
  barRaceByYear: Map<number, RegionalDeclineBarRaceEntry[]>;
  gradeGroupsLatest: RegionalDeclineGradeGroup[];
};

export const REGIONAL_DECLINE_PLAY_INTERVAL_MS = 1600;

export const REGIONAL_DECLINE_FIXED_REGION_ORDER = BAR_RACE_FIXED_REGION_ORDER;

export function fmtRegionalIndex(n: number): string {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function fmtRegionalSigned(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
}

function chartYears(rows: RegionalDeclineRow[]): number[] {
  const yearSet = new Set<number>();
  for (const row of rows) {
    for (const year of Object.keys(row.byYear).map(Number)) {
      if (year >= REGIONAL_DECLINE_CHART_START_YEAR) yearSet.add(year);
    }
  }
  return [...yearSet].sort((a, b) => a - b);
}

function readCell(
  row: RegionalDeclineRow,
  year: number,
): RegionalDeclineCell | null {
  return row.byYear[year] ?? null;
}

function buildSeries(
  row: RegionalDeclineRow,
  years: number[],
): RegionalDeclineSeries {
  return {
    region: row.region,
    points: years
      .map((year) => {
        const cell = readCell(row, year);
        if (!cell) return null;
        return { year, index: cell.index, grade: cell.grade };
      })
      .filter((point): point is RegionalDeclineYearPoint => point != null),
  };
}

export function alignRegionalBarRaceEntries(
  entries: RegionalDeclineBarRaceEntry[],
): RegionalDeclineBarRaceEntry[] {
  const byRegion = new Map(entries.map((entry) => [entry.region, entry]));

  return REGIONAL_DECLINE_FIXED_REGION_ORDER.map((region) => {
    const entry = byRegion.get(region);
    if (entry) return entry;
    return {
      region,
      index: 0,
      grade: 5,
      color: getExtinctionRiskGradeStyle(5).bg,
    };
  });
}

function buildGradeGroupsLatest(
  sidoSeries: RegionalDeclineSeries[],
  latestYear: number,
): RegionalDeclineGradeGroup[] {
  const entries = sidoSeries
    .map((series) => {
      const point = series.points.find((p) => p.year === latestYear);
      if (!point) return null;
      return { region: series.region, index: point.index, grade: point.grade };
    })
    .filter(
      (entry): entry is { region: string; index: number; grade: number } =>
        entry != null,
    );

  return [0, 1, 2, 3, 4, 5]
    .map((grade) => {
      const style = getExtinctionRiskGradeStyle(grade);
      const regions = entries.filter((entry) => entry.grade === grade);
      return {
        grade,
        label: `등급 ${style.label}`,
        color: style.bg,
        countLabel: `${regions.length}개 지역`,
        regions: regions.map((entry) => ({
          region: entry.region,
          index: entry.index,
        })),
      };
    })
    .filter((group) => group.regions.length > 0);
}

export function buildRegionalDeclineDashboardModel(
  rows: RegionalDeclineRow[],
): RegionalDeclineDashboardModel | null {
  const years = chartYears(rows);
  if (years.length === 0) return null;

  const nationalRow = rows.find((row) => row.region === "전국");
  const sidoRows = rows.filter((row) => row.region !== "전국");
  if (!nationalRow || sidoRows.length === 0) return null;

  const nationalSeries = buildSeries(nationalRow, years);
  const sidoSeries = REGIONAL_DECLINE_REGION_ORDER.filter(
    (region) => region !== "전국",
  )
    .map((region) => sidoRows.find((row) => row.region === region))
    .filter((row): row is RegionalDeclineRow => row != null)
    .map((row) => buildSeries(row, years));

  const barRaceByYear = new Map<number, RegionalDeclineBarRaceEntry[]>();
  for (const year of years) {
    const entries = alignRegionalBarRaceEntries(
      sidoSeries
        .map((series) => {
          const point = series.points.find((p) => p.year === year);
          if (!point) return null;
          return {
            region: series.region,
            index: point.index,
            grade: point.grade,
            color: getExtinctionRiskGradeStyle(point.grade).bg,
          };
        })
        .filter((entry): entry is RegionalDeclineBarRaceEntry => entry != null),
    );
    barRaceByYear.set(year, entries);
  }

  const startYear = years[0];
  const latestYear = years[years.length - 1];
  const nationalStart = readCell(nationalRow, startYear);
  const nationalLatest = readCell(nationalRow, latestYear);
  if (!nationalStart || !nationalLatest) return null;

  const latestSido = sidoSeries
    .map((series) => ({
      region: series.region,
      point: series.points.find((p) => p.year === latestYear),
    }))
    .filter(
      (item): item is { region: string; point: RegionalDeclineYearPoint } =>
        item.point != null,
    );

  if (latestSido.length === 0) return null;

  const worst = [...latestSido].sort((a, b) => a.point.index - b.point.index)[0];
  const best = [...latestSido].sort((a, b) => b.point.index - a.point.index)[0];

  return {
    years,
    sidoSeries,
    nationalSeries,
    kpi: {
      startYear,
      latestYear,
      nationalStartIndex: nationalStart.index,
      nationalLatestIndex: nationalLatest.index,
      nationalChange: nationalLatest.index - nationalStart.index,
      worstRegion: worst.region,
      worstLatestIndex: worst.point.index,
      bestRegion: best.region,
      bestLatestIndex: best.point.index,
    },
    barRaceByYear,
    gradeGroupsLatest: buildGradeGroupsLatest(sidoSeries, latestYear),
  };
}
