import { histogramBarFill } from "@/lib/analysis/advanced-chart-risk-profile";
import { DEFAULT_CATEGORY_WEIGHTS } from "@/lib/analysis/competitiveness-indicators";
import {
  ANALYTICS_ZONES,
  type AnalyticsGrade,
  type RunAnalyticsRow,
} from "@/lib/competitiveness-analysis/run-analytics";
import {
  RISK_SIDO_ORDER,
  toSidoShortLabel,
} from "@/lib/competitiveness-analysis/risk-universities-analytics";
import { gradeFromCompositeScore } from "@/lib/competitiveness-analysis/diagnostic-grade";
import type { SchoolScaleLabel } from "@/lib/competitiveness-analysis/school-scale";
import {
  COMPOSITE_GRADE_COLORS,
  COMPOSITE_GRADE_LABELS,
  COMPOSITE_GRADE_ORDER,
  trendYDomain,
  type CompositeYearSeries,
  type ScoreComparePoint,
} from "@/lib/competitiveness-analysis/composite-competitiveness-analytics";

export type SectorId = "student" | "univFinance" | "corpFinance";

export type SectorDef = {
  id: SectorId;
  label: string;
  weightPct: number;
  scoreName: string;
  kpiSub: string;
  indicators: { label: string; weightPct: number }[];
  quadrantXLabel: string;
  quadrantYLabel: string;
};

export const SECTOR_ORDER: SectorId[] = [
  "student",
  "univFinance",
  "corpFinance",
];

export const SECTOR_DEFS: Record<SectorId, SectorDef> = {
  student: {
    id: "student",
    label: "학생충원",
    weightPct: DEFAULT_CATEGORY_WEIGHTS["student-enrollment"],
    scoreName: "학생충원 지수",
    kpiSub: "신입생·재학생·중도탈락 가중",
    indicators: [
      { label: "신입생충원율", weightPct: 40 },
      { label: "재학생충원율", weightPct: 40 },
      { label: "중도탈락율", weightPct: 20 },
    ],
    quadrantXLabel: "신입생충원 지수",
    quadrantYLabel: "재학생충원 지수",
  },
  univFinance: {
    id: "univFinance",
    label: "대학재정",
    weightPct: DEFAULT_CATEGORY_WEIGHTS["univ-finance"],
    scoreName: "대학재정 지수",
    kpiSub: "자금확보·수혜·등록금의존 가중",
    indicators: [
      { label: "자금확보율", weightPct: 30 },
      { label: "재정지원수혜율", weightPct: 30 },
      { label: "등록금의존율", weightPct: 40 },
    ],
    quadrantXLabel: "자금확보 지수",
    quadrantYLabel: "재정지원수혜 지수",
  },
  corpFinance: {
    id: "corpFinance",
    label: "법인재정",
    weightPct: DEFAULT_CATEGORY_WEIGHTS["corp-finance"],
    scoreName: "법인재정 지수",
    kpiSub: "수익용재산·전입금 가중",
    indicators: [
      { label: "수익용기본재산확보율", weightPct: 70 },
      { label: "전입금비율", weightPct: 30 },
    ],
    quadrantXLabel: "수익용기본재산 지수",
    quadrantYLabel: "전입금 지수",
  },
};

const SCALE_ORDER: SchoolScaleLabel[] = ["대규모", "중규모", "소규모"];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? null;
  return round1(sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo));
}

export function sectorScore(row: RunAnalyticsRow, sector: SectorId): number {
  switch (sector) {
    case "student":
      return row.studentSectorScore;
    case "univFinance":
      return row.univFinanceScore;
    case "corpFinance":
      return row.foundationScore;
  }
}

export function rankedSectorRows(rows: RunAnalyticsRow[]): RunAnalyticsRow[] {
  return rows.filter((row) => !row.excludedFromRanking);
}

export function sectorGrade(
  row: RunAnalyticsRow,
  sector: SectorId,
): AnalyticsGrade | null {
  if (row.excludedFromRanking) return null;
  return gradeFromCompositeScore(sectorScore(row, sector));
}

export function isSectorRiskRow(
  row: RunAnalyticsRow,
  sector: SectorId,
): boolean {
  const grade = sectorGrade(row, sector);
  return grade === "D" || grade === "E";
}

export function weightedMeanSectorScore(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): number | null {
  if (!rows.length) return null;
  let weightedNum = 0;
  let weightedDen = 0;
  let plainSum = 0;
  for (const row of rows) {
    const score = sectorScore(row, sector);
    plainSum += score;
    const weight = row.enrolledTotal;
    if (weight != null && weight > 0) {
      weightedNum += score * weight;
      weightedDen += weight;
    }
  }
  if (weightedDen > 0) return round1(weightedNum / weightedDen);
  return round1(plainSum / rows.length);
}

export function arithmeticMeanSectorScore(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): number | null {
  if (!rows.length) return null;
  const sum = rows.reduce((acc, row) => acc + sectorScore(row, sector), 0);
  return round1(sum / rows.length);
}

export function medianSectorScore(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): number | null {
  return percentile(
    rows.map((row) => sectorScore(row, sector)).sort((a, b) => a - b),
    0.5,
  );
}

export function q1SectorScore(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): number | null {
  return percentile(
    rows.map((row) => sectorScore(row, sector)).sort((a, b) => a - b),
    0.25,
  );
}

export function q3SectorScore(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): number | null {
  return percentile(
    rows.map((row) => sectorScore(row, sector)).sort((a, b) => a - b),
    0.75,
  );
}

export function iqrSectorScore(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): number | null {
  const q1 = q1SectorScore(rows, sector);
  const q3 = q3SectorScore(rows, sector);
  if (q1 == null || q3 == null) return null;
  return round1(q3 - q1);
}

function yoyOfMeans(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  sector: SectorId,
): number | null {
  const curr = arithmeticMeanSectorScore(current, sector);
  const prev = arithmeticMeanSectorScore(previous, sector);
  if (curr == null || prev == null) return null;
  return round1(curr - prev);
}

function comparePoint(
  region: string,
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  sector: SectorId,
): ScoreComparePoint {
  return {
    region,
    avgRate: arithmeticMeanSectorScore(current, sector),
    yoy: yoyOfMeans(current, previous, sector),
    schoolCount: current.length,
  };
}

export function buildSectorKpis(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  sector: SectorId,
) {
  const ranked = rankedSectorRows(current);
  const avg = weightedMeanSectorScore(ranked, sector);
  const prevAvg = weightedMeanSectorScore(rankedSectorRows(previous), sector);
  const eCount = ranked.filter(
    (row) => sectorGrade(row, sector) === "E",
  ).length;
  const dCount = ranked.filter(
    (row) => sectorGrade(row, sector) === "D",
  ).length;
  return {
    weighted: avg,
    yoy: avg != null && prevAvg != null ? round1(avg - prevAvg) : null,
    mean: arithmeticMeanSectorScore(ranked, sector),
    median: medianSectorScore(ranked, sector),
    iqr: iqrSectorScore(ranked, sector),
    q1: q1SectorScore(ranked, sector),
    q3: q3SectorScore(ranked, sector),
    riskD: dCount,
    riskE: eCount,
    schoolCount: ranked.length,
  };
}

export function buildSectorZoneCompare(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  sector: SectorId,
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
        sector,
      ),
    )
    .filter((row) => row.schoolCount > 0);
}

export function buildSectorScaleCompare(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  sector: SectorId,
): ScoreComparePoint[] {
  return SCALE_ORDER.map((scale) =>
    comparePoint(
      scale,
      current.filter((row) => row.scale === scale),
      previous.filter((row) => row.scale === scale),
      sector,
    ),
  ).filter((row) => row.schoolCount > 0);
}

export function buildSectorSidoRank(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  sector: SectorId,
): ScoreComparePoint[] {
  const known = new Set<string>(RISK_SIDO_ORDER);
  const points = RISK_SIDO_ORDER.map((region) =>
    comparePoint(
      region,
      current.filter((row) => toSidoShortLabel(row.province) === region),
      previous.filter((row) => toSidoShortLabel(row.province) === region),
      sector,
    ),
  ).filter((row) => row.schoolCount > 0);

  const otherCurrent = current.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  const otherPrevious = previous.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  if (otherCurrent.length) {
    points.push(comparePoint("기타", otherCurrent, otherPrevious, sector));
  }

  return [...points].sort((a, b) => (b.avgRate ?? -1) - (a.avgRate ?? -1));
}

export function buildSectorGradeBars(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): { grade: AnalyticsGrade; label: string; count: number; fill: string }[] {
  const ranked = rankedSectorRows(rows);
  return COMPOSITE_GRADE_ORDER.map((grade) => ({
    grade,
    label: COMPOSITE_GRADE_LABELS[grade],
    count: ranked.filter((row) => sectorGrade(row, sector) === grade).length,
    fill: COMPOSITE_GRADE_COLORS[grade],
  }));
}

export function buildSectorHistogram(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): { bin: string; count: number; fill: string }[] {
  const ranked = rankedSectorRows(rows);
  const bins: { bin: string; match: (score: number) => boolean }[] = [
    { bin: "0–20", match: (s) => s < 20 },
    { bin: "20–40", match: (s) => s >= 20 && s < 40 },
    { bin: "40–60", match: (s) => s >= 40 && s < 60 },
    { bin: "60–80", match: (s) => s >= 60 && s < 80 },
    { bin: "80–100", match: (s) => s >= 80 },
  ];
  return bins.map((bin, index) => ({
    bin: bin.bin,
    count: ranked.filter((row) => bin.match(sectorScore(row, sector))).length,
    fill: histogramBarFill(index, bins.length, "below"),
  }));
}

export function buildSectorDensity(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): { score: number; density: number }[] {
  const scores = rankedSectorRows(rows).map((row) => sectorScore(row, sector));
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

function quadrantAxes(
  row: RunAnalyticsRow,
  sector: SectorId,
): { x: number | null; y: number | null } {
  switch (sector) {
    case "student":
      return { x: row.freshmanIndex, y: row.enrolledIndex };
    case "univFinance":
      return { x: row.fundIndex, y: row.benefitIndex };
    case "corpFinance":
      return { x: row.propertyIndex, y: row.transferIndex };
  }
}

export function buildSectorQuadrantPoints(
  rows: RunAnalyticsRow[],
  sector: SectorId,
): {
  name: string;
  x: number;
  y: number;
  grade: AnalyticsGrade | null;
}[] {
  return rankedSectorRows(rows).flatMap((row) => {
    const axes = quadrantAxes(row, sector);
    if (axes.x == null || axes.y == null) return [];
    return [
      {
        name: row.name,
        x: axes.x,
        y: axes.y,
        grade: sectorGrade(row, sector),
      },
    ];
  });
}

export function buildSectorZoneTrend(
  series: CompositeYearSeries[],
  sector: SectorId,
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
        row[zone] = arithmeticMeanSectorScore(
          point.rows.filter((item) => item.zone === zone),
          sector,
        );
      }
      return row;
    });
}

export function buildSectorScaleTrend(
  series: CompositeYearSeries[],
  sector: SectorId,
): Record<string, string | number | null>[] {
  return series
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((point) => {
      const row: Record<string, string | number | null> = {
        year: String(point.year),
      };
      for (const scale of SCALE_ORDER) {
        row[scale] = arithmeticMeanSectorScore(
          point.rows.filter((item) => item.scale === scale),
          sector,
        );
      }
      return row;
    });
}

export { trendYDomain };
