import { histogramBarFill } from "@/lib/analysis/advanced-chart-risk-profile";
import { DIAGNOSTIC_GRADE_CUTOFFS } from "@/lib/competitiveness-analysis/diagnostic-grade";
import {
  ANALYTICS_ZONES,
  type AnalyticsGrade,
  type RunAnalyticsRow,
} from "@/lib/competitiveness-analysis/run-analytics";
import {
  RISK_SIDO_ORDER,
  arithmeticMeanScore,
  toSidoShortLabel,
} from "@/lib/competitiveness-analysis/risk-universities-analytics";
import type { SchoolScaleLabel } from "@/lib/competitiveness-analysis/school-scale";

export type ScoreComparePoint = {
  region: string;
  avgRate: number | null;
  yoy: number | null;
  schoolCount: number;
};

export type CompositeYearSeries = {
  year: number;
  rows: RunAnalyticsRow[];
};

export const COMPOSITE_GRADE_COLORS: Record<AnalyticsGrade, string> = {
  S: "#4F46E5",
  A: "#10B981",
  B: "#3B82F6",
  C: "#F59E0B",
  D: "#EC4899",
  E: "#EF4444",
};

export const COMPOSITE_GRADE_ORDER: AnalyticsGrade[] = [
  "S",
  "A",
  "B",
  "C",
  "D",
  "E",
];

export const COMPOSITE_GRADE_LABELS: Record<AnalyticsGrade, string> = {
  S: `S (${DIAGNOSTIC_GRADE_CUTOFFS.S}+)`,
  A: `A (${DIAGNOSTIC_GRADE_CUTOFFS.A}+)`,
  B: `B (${DIAGNOSTIC_GRADE_CUTOFFS.B}+)`,
  C: `C (${DIAGNOSTIC_GRADE_CUTOFFS.C}+)`,
  D: `D (${DIAGNOSTIC_GRADE_CUTOFFS.D}+)`,
  E: `E (<${DIAGNOSTIC_GRADE_CUTOFFS.D})`,
};

const SCALE_ORDER: SchoolScaleLabel[] = ["대규모", "중규모", "소규모"];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function yoyOfMeans(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): number | null {
  const curr = arithmeticMeanScore(current);
  const prev = arithmeticMeanScore(previous);
  if (curr == null || prev == null) return null;
  return round1(curr - prev);
}

function comparePoint(
  region: string,
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): ScoreComparePoint {
  return {
    region,
    avgRate: arithmeticMeanScore(current),
    yoy: yoyOfMeans(current, previous),
    schoolCount: current.length,
  };
}

export function rankedAnalyticsRows(rows: RunAnalyticsRow[]): RunAnalyticsRow[] {
  return rows.filter((row) => !row.excludedFromRanking);
}

export function buildZoneCompare(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): ScoreComparePoint[] {
  const zones: string[] = [...ANALYTICS_ZONES];
  if (
    current.some((row) => row.zone === "기타") ||
    previous.some((row) => row.zone === "기타")
  ) {
    zones.push("기타");
  }
  return zones
    .map((zone) =>
      comparePoint(
        zone,
        current.filter((row) => row.zone === zone),
        previous.filter((row) => row.zone === zone),
      ),
    )
    .filter((row) => row.schoolCount > 0);
}

export function buildScaleCompare(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): ScoreComparePoint[] {
  return SCALE_ORDER.map((scale) =>
    comparePoint(
      scale,
      current.filter((row) => row.scale === scale),
      previous.filter((row) => row.scale === scale),
    ),
  ).filter((row) => row.schoolCount > 0);
}

export function buildSidoRank(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): ScoreComparePoint[] {
  const known = new Set<string>(RISK_SIDO_ORDER);
  const points = RISK_SIDO_ORDER.map((region) =>
    comparePoint(
      region,
      current.filter((row) => toSidoShortLabel(row.province) === region),
      previous.filter((row) => toSidoShortLabel(row.province) === region),
    ),
  ).filter((row) => row.schoolCount > 0);

  const otherCurrent = current.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  const otherPrevious = previous.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  if (otherCurrent.length) {
    points.push(comparePoint("기타", otherCurrent, otherPrevious));
  }

  return [...points].sort((a, b) => (b.avgRate ?? -1) - (a.avgRate ?? -1));
}

export function buildGradeBars(rows: RunAnalyticsRow[]): {
  grade: AnalyticsGrade;
  label: string;
  count: number;
  fill: string;
}[] {
  const ranked = rankedAnalyticsRows(rows);
  return COMPOSITE_GRADE_ORDER.map((grade) => ({
    grade,
    label: COMPOSITE_GRADE_LABELS[grade],
    count: ranked.filter((row) => row.grade === grade).length,
    fill: COMPOSITE_GRADE_COLORS[grade],
  }));
}

export function buildScoreHistogram(rows: RunAnalyticsRow[]): {
  bin: string;
  count: number;
  fill: string;
}[] {
  const ranked = rankedAnalyticsRows(rows);
  const bins: { bin: string; match: (score: number) => boolean }[] = [
    { bin: "0–20", match: (s) => s < 20 },
    { bin: "20–40", match: (s) => s >= 20 && s < 40 },
    { bin: "40–60", match: (s) => s >= 40 && s < 60 },
    { bin: "60–80", match: (s) => s >= 60 && s < 80 },
    { bin: "80–100", match: (s) => s >= 80 },
  ];
  return bins.map((bin, index) => ({
    bin: bin.bin,
    count: ranked.filter((row) => bin.match(row.totalScore)).length,
    fill: histogramBarFill(index, bins.length, "below"),
  }));
}

export function buildScoreDensity(rows: RunAnalyticsRow[]): {
  score: number;
  density: number;
}[] {
  const scores = rankedAnalyticsRows(rows).map((row) => row.totalScore);
  const points: { score: number; density: number }[] = [];
  for (let score = 5; score <= 95; score += 5) {
    const lo = score - 2.5;
    const hi = score + 2.5;
    points.push({
      score,
      density: scores.filter((value) => value >= lo && value < hi).length,
    });
  }
  return points;
}

export function buildQuadrantPoints(rows: RunAnalyticsRow[]): {
  name: string;
  student: number;
  finance: number;
  grade: AnalyticsGrade | null;
}[] {
  return rankedAnalyticsRows(rows).map((row) => ({
    name: row.name,
    student: row.studentSectorScore,
    finance: row.univFinanceScore,
    grade: row.grade,
  }));
}

export function buildZoneTrend(
  series: CompositeYearSeries[],
): Record<string, string | number | null>[] {
  const zones: string[] = [...ANALYTICS_ZONES];
  if (series.some((point) => point.rows.some((row) => row.zone === "기타"))) {
    zones.push("기타");
  }
  return series
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((point) => {
      const row: Record<string, string | number | null> = {
        year: String(point.year),
      };
      for (const zone of zones) {
        row[zone] = arithmeticMeanScore(
          point.rows.filter((item) => item.zone === zone),
        );
      }
      return row;
    });
}

export function buildScaleTrend(
  series: CompositeYearSeries[],
): Record<string, string | number | null>[] {
  return series
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((point) => {
      const row: Record<string, string | number | null> = {
        year: String(point.year),
      };
      for (const scale of SCALE_ORDER) {
        row[scale] = arithmeticMeanScore(
          point.rows.filter((item) => item.scale === scale),
        );
      }
      return row;
    });
}

export function trendYDomain(
  rows: Record<string, string | number | null>[],
  keys: string[],
): [number, number] {
  const values = rows.flatMap((row) =>
    keys
      .map((key) => row[key])
      .filter((value): value is number => typeof value === "number"),
  );
  if (!values.length) return [0, 100];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(4, (max - min) * 0.12);
  return [Math.max(0, Math.floor(min - pad)), Math.min(100, Math.ceil(max + pad))];
}
