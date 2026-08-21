import {
  clampPercentileTail,
  upperPercentileRank,
} from "@/lib/competitiveness-analysis/indicator-percentile-bounds";

/** @deprecated analysis-policy.ts DEFAULT_LOWER_IS_BETTER_INDICATOR_IDS 사용 */
export const LOWER_IS_BETTER_INDICATORS = new Set([
  "dropout-rate",
  "tuition-dependency-rate",
]);

/** 집단 분포에서 백분위(0~100)에 해당하는 원천 수치 */
export function percentileValue(
  values: number[],
  percentileRank: number,
): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;

  const p = Math.max(0, Math.min(100, percentileRank));
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const weight = index - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

/** §3 선형 보간 — 0~100 지수 (M 배점은 3단계 가중치에 반영) */
export function rawToLinearPercentileIndexScore(
  nationalValues: number[],
  rawValue: number,
  lowerTailPct: number,
  upperTailPct: number,
  lowerIsBetter: boolean,
): number {
  if (!nationalValues.length) return 0;

  const lowerN = clampPercentileTail(lowerTailPct);
  const upperN = clampPercentileTail(upperTailPct);
  const pLow = percentileValue(nationalValues, lowerN);
  const pHigh = percentileValue(nationalValues, upperPercentileRank(upperN));

  if (pHigh <= pLow) {
    if (lowerIsBetter) return rawValue <= pLow ? 100 : 0;
    return rawValue >= pHigh ? 100 : 0;
  }

  if (lowerIsBetter) {
    if (rawValue <= pLow) return 100;
    if (rawValue >= pHigh) return 0;
    return (
      Math.round(100 * ((pHigh - rawValue) / (pHigh - pLow)) * 10) / 10
    );
  }

  if (rawValue >= pHigh) return 100;
  if (rawValue <= pLow) return 0;
  return Math.round(100 * ((rawValue - pLow) / (pHigh - pLow)) * 10) / 10;
}

/** @deprecated rawToLinearPercentileIndexScore 사용 */
export function nationalPercentile(
  nationalValues: number[],
  value: number,
): number {
  if (!nationalValues.length) return 0;
  const sorted = [...nationalValues].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  return Math.round((below / sorted.length) * 1000) / 10;
}

/** @deprecated rawToLinearPercentileIndexScore 사용 */
export function rawToIndexScore(
  nationalValues: number[],
  rawValue: number,
  financeTabId: string,
  lowerIsBetterIds: Set<string> = LOWER_IS_BETTER_INDICATORS,
): number {
  const lowerIsBetter = lowerIsBetterIds.has(financeTabId);
  return rawToLinearPercentileIndexScore(
    nationalValues,
    rawValue,
    10,
    10,
    lowerIsBetter,
  );
}

export function rankByIndexDesc(scores: number[]): number[] {
  const ranked = [...scores]
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => b.score - a.score);
  const ranks = new Array(scores.length).fill(0);
  ranked.forEach((item, rankIdx) => {
    ranks[item.idx] = rankIdx + 1;
  });
  return ranks;
}
