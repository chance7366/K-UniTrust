import { histogramBarFill } from "@/lib/analysis/advanced-chart-risk-profile";
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

export type IndicatorId =
  | "freshman"
  | "enrolled"
  | "dropout"
  | "fund"
  | "benefit"
  | "tuition"
  | "property"
  | "transfer";

export type IndicatorDef = {
  id: IndicatorId;
  label: string;
  scoreName: string;
  groupId: "student" | "univFinance" | "corpFinance";
  groupLabel: string;
  weightPct: number;
};

export const INDICATOR_DEFS: Record<IndicatorId, IndicatorDef> = {
  freshman: {
    id: "freshman",
    label: "신입생충원율",
    scoreName: "신입생충원 지수",
    groupId: "student",
    groupLabel: "학생충원",
    weightPct: 40,
  },
  enrolled: {
    id: "enrolled",
    label: "재학생충원율",
    scoreName: "재학생충원 지수",
    groupId: "student",
    groupLabel: "학생충원",
    weightPct: 40,
  },
  dropout: {
    id: "dropout",
    label: "중도탈락율",
    scoreName: "중도탈락 지수",
    groupId: "student",
    groupLabel: "학생충원",
    weightPct: 20,
  },
  fund: {
    id: "fund",
    label: "자금확보율",
    scoreName: "자금확보 지수",
    groupId: "univFinance",
    groupLabel: "대학재정",
    weightPct: 30,
  },
  benefit: {
    id: "benefit",
    label: "재정지원수혜율",
    scoreName: "재정지원수혜 지수",
    groupId: "univFinance",
    groupLabel: "대학재정",
    weightPct: 30,
  },
  tuition: {
    id: "tuition",
    label: "등록금의존율",
    scoreName: "등록금의존 지수",
    groupId: "univFinance",
    groupLabel: "대학재정",
    weightPct: 40,
  },
  property: {
    id: "property",
    label: "수익용재산확보율",
    scoreName: "수익용재산 지수",
    groupId: "corpFinance",
    groupLabel: "법인재정",
    weightPct: 70,
  },
  transfer: {
    id: "transfer",
    label: "법인전입금비율",
    scoreName: "전입금 지수",
    groupId: "corpFinance",
    groupLabel: "법인재정",
    weightPct: 30,
  },
};

export const INDICATOR_GROUPS: {
  groupId: IndicatorDef["groupId"];
  groupLabel: string;
  ids: IndicatorId[];
}[] = [
  {
    groupId: "student",
    groupLabel: "학생충원",
    ids: ["freshman", "enrolled", "dropout"],
  },
  {
    groupId: "univFinance",
    groupLabel: "대학재정",
    ids: ["fund", "benefit", "tuition"],
  },
  {
    groupId: "corpFinance",
    groupLabel: "법인재정",
    ids: ["property", "transfer"],
  },
];

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

export function indicatorScore(
  row: RunAnalyticsRow,
  id: IndicatorId,
): number | null {
  switch (id) {
    case "freshman":
      return row.freshmanIndex;
    case "enrolled":
      return row.enrolledIndex;
    case "dropout":
      return row.dropoutIndex;
    case "fund":
      return row.fundIndex;
    case "benefit":
      return row.benefitIndex;
    case "tuition":
      return row.tuitionIndex;
    case "property":
      return row.propertyIndex;
    case "transfer":
      return row.transferIndex;
  }
}

export function rankedIndicatorRows(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): RunAnalyticsRow[] {
  return rows.filter(
    (row) => !row.excludedFromRanking && indicatorScore(row, id) != null,
  );
}

export function indicatorGrade(
  row: RunAnalyticsRow,
  id: IndicatorId,
): AnalyticsGrade | null {
  const score = indicatorScore(row, id);
  if (score == null || row.excludedFromRanking) return null;
  return gradeFromCompositeScore(score);
}

export function weightedMeanIndicatorScore(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): number | null {
  const usable = rankedIndicatorRows(rows, id);
  if (!usable.length) return null;
  let weightedNum = 0;
  let weightedDen = 0;
  let plainSum = 0;
  for (const row of usable) {
    const score = indicatorScore(row, id);
    if (score == null) continue;
    plainSum += score;
    const weight = row.enrolledTotal;
    if (weight != null && weight > 0) {
      weightedNum += score * weight;
      weightedDen += weight;
    }
  }
  if (weightedDen > 0) return round1(weightedNum / weightedDen);
  return round1(plainSum / usable.length);
}

export function arithmeticMeanIndicatorScore(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): number | null {
  const usable = rankedIndicatorRows(rows, id);
  if (!usable.length) return null;
  const sum = usable.reduce((acc, row) => acc + (indicatorScore(row, id) ?? 0), 0);
  return round1(sum / usable.length);
}

export function medianIndicatorScore(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): number | null {
  return percentile(
    rankedIndicatorRows(rows, id)
      .map((row) => indicatorScore(row, id)!)
      .sort((a, b) => a - b),
    0.5,
  );
}

export function q1IndicatorScore(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): number | null {
  return percentile(
    rankedIndicatorRows(rows, id)
      .map((row) => indicatorScore(row, id)!)
      .sort((a, b) => a - b),
    0.25,
  );
}

export function q3IndicatorScore(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): number | null {
  return percentile(
    rankedIndicatorRows(rows, id)
      .map((row) => indicatorScore(row, id)!)
      .sort((a, b) => a - b),
    0.75,
  );
}

export function iqrIndicatorScore(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): number | null {
  const q1 = q1IndicatorScore(rows, id);
  const q3 = q3IndicatorScore(rows, id);
  if (q1 == null || q3 == null) return null;
  return round1(q3 - q1);
}

function yoyOfMeans(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  id: IndicatorId,
): number | null {
  const curr = arithmeticMeanIndicatorScore(current, id);
  const prev = arithmeticMeanIndicatorScore(previous, id);
  if (curr == null || prev == null) return null;
  return round1(curr - prev);
}

function comparePoint(
  region: string,
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  id: IndicatorId,
): ScoreComparePoint {
  return {
    region,
    avgRate: arithmeticMeanIndicatorScore(current, id),
    yoy: yoyOfMeans(current, previous, id),
    schoolCount: rankedIndicatorRows(current, id).length,
  };
}

export function buildIndicatorKpis(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  id: IndicatorId,
) {
  const ranked = rankedIndicatorRows(current, id);
  const avg = weightedMeanIndicatorScore(current, id);
  const prevAvg = weightedMeanIndicatorScore(previous, id);
  const eCount = ranked.filter((row) => indicatorGrade(row, id) === "E").length;
  const dCount = ranked.filter((row) => indicatorGrade(row, id) === "D").length;
  return {
    weighted: avg,
    yoy: avg != null && prevAvg != null ? round1(avg - prevAvg) : null,
    mean: arithmeticMeanIndicatorScore(current, id),
    median: medianIndicatorScore(current, id),
    iqr: iqrIndicatorScore(current, id),
    q1: q1IndicatorScore(current, id),
    q3: q3IndicatorScore(current, id),
    riskD: dCount,
    riskE: eCount,
    schoolCount: ranked.length,
  };
}

export function buildIndicatorZoneCompare(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  id: IndicatorId,
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
        id,
      ),
    )
    .filter((row) => row.schoolCount > 0);
}

export function buildIndicatorScaleCompare(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  id: IndicatorId,
): ScoreComparePoint[] {
  return SCALE_ORDER.map((scale) =>
    comparePoint(
      scale,
      current.filter((row) => row.scale === scale),
      previous.filter((row) => row.scale === scale),
      id,
    ),
  ).filter((row) => row.schoolCount > 0);
}

export function buildIndicatorSidoRank(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
  id: IndicatorId,
): ScoreComparePoint[] {
  const known = new Set<string>(RISK_SIDO_ORDER);
  const points = RISK_SIDO_ORDER.map((region) =>
    comparePoint(
      region,
      current.filter((row) => toSidoShortLabel(row.province) === region),
      previous.filter((row) => toSidoShortLabel(row.province) === region),
      id,
    ),
  ).filter((row) => row.schoolCount > 0);

  const otherCurrent = current.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  const otherPrevious = previous.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  if (otherCurrent.length) {
    points.push(comparePoint("기타", otherCurrent, otherPrevious, id));
  }

  return [...points].sort((a, b) => (b.avgRate ?? -1) - (a.avgRate ?? -1));
}

export function buildIndicatorGradeBars(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): { grade: AnalyticsGrade; label: string; count: number; fill: string }[] {
  const ranked = rankedIndicatorRows(rows, id);
  return COMPOSITE_GRADE_ORDER.map((grade) => ({
    grade,
    label: COMPOSITE_GRADE_LABELS[grade],
    count: ranked.filter((row) => indicatorGrade(row, id) === grade).length,
    fill: COMPOSITE_GRADE_COLORS[grade],
  }));
}

export function buildIndicatorHistogram(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): { bin: string; count: number; fill: string }[] {
  const ranked = rankedIndicatorRows(rows, id);
  const bins: { bin: string; match: (score: number) => boolean }[] = [
    { bin: "0–20", match: (s) => s < 20 },
    { bin: "20–40", match: (s) => s >= 20 && s < 40 },
    { bin: "40–60", match: (s) => s >= 40 && s < 60 },
    { bin: "60–80", match: (s) => s >= 60 && s < 80 },
    { bin: "80–100", match: (s) => s >= 80 },
  ];
  return bins.map((bin, index) => ({
    bin: bin.bin,
    count: ranked.filter((row) => bin.match(indicatorScore(row, id) ?? -1)).length,
    fill: histogramBarFill(index, bins.length, "below"),
  }));
}

export function buildIndicatorDensity(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): { score: number; density: number }[] {
  const scores = rankedIndicatorRows(rows, id).map(
    (row) => indicatorScore(row, id)!,
  );
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

function jitterFromCode(code: string): number {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return 0.12 + ((hash % 1000) / 1000) * 0.76;
}

export function buildIndicatorStripPoints(
  rows: RunAnalyticsRow[],
  id: IndicatorId,
): {
  name: string;
  score: number;
  jitter: number;
  grade: AnalyticsGrade | null;
}[] {
  return rankedIndicatorRows(rows, id).map((row) => ({
    name: row.name,
    score: indicatorScore(row, id)!,
    jitter: jitterFromCode(row.schoolCodeStd || row.name),
    grade: indicatorGrade(row, id),
  }));
}

export function buildIndicatorZoneTrend(
  series: CompositeYearSeries[],
  id: IndicatorId,
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
        row[zone] = arithmeticMeanIndicatorScore(
          point.rows.filter((item) => item.zone === zone),
          id,
        );
      }
      return row;
    });
}

export function buildIndicatorScaleTrend(
  series: CompositeYearSeries[],
  id: IndicatorId,
): Record<string, string | number | null>[] {
  return series
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((point) => {
      const row: Record<string, string | number | null> = {
        year: String(point.year),
      };
      for (const scale of SCALE_ORDER) {
        row[scale] = arithmeticMeanIndicatorScore(
          point.rows.filter((item) => item.scale === scale),
          id,
        );
      }
      return row;
    });
}

export { trendYDomain };
