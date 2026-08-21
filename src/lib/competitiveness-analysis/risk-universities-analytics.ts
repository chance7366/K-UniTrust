import { matchSidoRegion } from "@/lib/analysis/korea-sido-regions";
import type { RunAnalyticsRow } from "@/lib/competitiveness-analysis/run-analytics";

export const RISK_SIDO_ORDER = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export type RiskSidoRow = {
  region: string;
  schoolCount: number;
  avgScore: number | null;
  yoy: number | null;
  median: number | null;
  meanScore: number | null;
  riskCount: number;
};

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

export function toSidoShortLabel(province: string): string {
  const matched = matchSidoRegion(province, province.trim());
  return matched?.shortLabel ?? province.trim();
}

export function isRiskGradeRow(row: RunAnalyticsRow): boolean {
  return !row.excludedFromRanking && (row.grade === "D" || row.grade === "E");
}

export function weightedMeanScore(rows: RunAnalyticsRow[]): number | null {
  if (!rows.length) return null;
  let weightedNum = 0;
  let weightedDen = 0;
  let plainSum = 0;
  for (const row of rows) {
    plainSum += row.totalScore;
    const weight = row.enrolledTotal;
    if (weight != null && weight > 0) {
      weightedNum += row.totalScore * weight;
      weightedDen += weight;
    }
  }
  if (weightedDen > 0) return round1(weightedNum / weightedDen);
  return round1(plainSum / rows.length);
}

export function arithmeticMeanScore(rows: RunAnalyticsRow[]): number | null {
  if (!rows.length) return null;
  const sum = rows.reduce((acc, row) => acc + row.totalScore, 0);
  return round1(sum / rows.length);
}

export function medianScore(rows: RunAnalyticsRow[]): number | null {
  const values = rows.map((row) => row.totalScore).sort((a, b) => a - b);
  return percentile(values, 0.5);
}

export function q1Score(rows: RunAnalyticsRow[]): number | null {
  const values = rows.map((row) => row.totalScore).sort((a, b) => a - b);
  return percentile(values, 0.25);
}

export function q3Score(rows: RunAnalyticsRow[]): number | null {
  const values = rows.map((row) => row.totalScore).sort((a, b) => a - b);
  return percentile(values, 0.75);
}

export function iqrScore(rows: RunAnalyticsRow[]): number | null {
  const q1 = q1Score(rows);
  const q3 = q3Score(rows);
  if (q1 == null || q3 == null) return null;
  return round1(q3 - q1);
}

function aggregateRegion(
  region: string,
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): RiskSidoRow {
  const avg = weightedMeanScore(current);
  const prev = weightedMeanScore(previous);
  return {
    region,
    schoolCount: current.length,
    avgScore: avg,
    yoy: avg != null && prev != null ? round1(avg - prev) : null,
    median: medianScore(current),
    meanScore: arithmeticMeanScore(current),
    riskCount: current.filter(isRiskGradeRow).length,
  };
}

export function buildRiskSidoRows(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): RiskSidoRow[] {
  const bySido = (rows: RunAnalyticsRow[], region: string) =>
    rows.filter((row) => toSidoShortLabel(row.province) === region);

  const sidoRows = RISK_SIDO_ORDER.map((region) =>
    aggregateRegion(region, bySido(current, region), bySido(previous, region)),
  ).filter((row) => row.schoolCount > 0);

  const known = new Set<string>(RISK_SIDO_ORDER);
  const otherCurrent = current.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  const otherPrevious = previous.filter(
    (row) => !known.has(toSidoShortLabel(row.province)),
  );
  if (otherCurrent.length) {
    sidoRows.push(aggregateRegion("기타", otherCurrent, otherPrevious));
  }
  return sidoRows;
}

export function buildRiskTotalRow(
  current: RunAnalyticsRow[],
  previous: RunAnalyticsRow[],
): RiskSidoRow {
  return aggregateRegion("전체", current, previous);
}

export function riskUniversityRows(rows: RunAnalyticsRow[]): RunAnalyticsRow[] {
  return [...rows.filter(isRiskGradeRow)].sort(
    (a, b) => a.totalScore - b.totalScore,
  );
}
