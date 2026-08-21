import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

/** 하위 n% → Pₙ (기본 10 → P₁₀) */
export const DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT = 10;

/** 상위 n% → P₍₁₀₀₋ₙ₎ (기본 10 → P₉₀) */
export const DEFAULT_INDICATOR_PERCENTILE_UPPER_TAIL_PCT = 10;

export type IndicatorPercentileBounds = {
  lowerTailPct: number;
  upperTailPct: number;
};

export function resolveIndicatorPercentileBounds(
  settings: CompetitivenessSettings,
  financeTabId: string,
): IndicatorPercentileBounds {
  return {
    lowerTailPct: clampPercentileTail(
      settings.indicatorPercentileLowerTailPct?.[financeTabId] ??
        DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT,
    ),
    upperTailPct: clampPercentileTail(
      settings.indicatorPercentileUpperTailPct?.[financeTabId] ??
        DEFAULT_INDICATOR_PERCENTILE_UPPER_TAIL_PCT,
    ),
  };
}

export function clampPercentileTail(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_INDICATOR_PERCENTILE_LOWER_TAIL_PCT;
  return Math.max(1, Math.min(49, Math.round(value)));
}

/** P₍₁₀₀₋upperTail₎ 백분위 순위 */
export function upperPercentileRank(upperTailPct: number): number {
  return 100 - clampPercentileTail(upperTailPct);
}

export function formatPercentileBoundsLabel(bounds: IndicatorPercentileBounds): string {
  return `P${bounds.lowerTailPct}/P${upperPercentileRank(bounds.upperTailPct)} (하위 ${bounds.lowerTailPct}%·상위 ${bounds.upperTailPct}%)`;
}
