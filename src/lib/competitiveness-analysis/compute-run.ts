import type { CompetitivenessIndicatorDef } from "@/lib/analysis/competitiveness-indicators";
import {
  resolveAnalysisPolicy,
  resolveStep3IndicatorIds,
} from "@/lib/competitiveness-analysis/analysis-policy";
import type { NationalDistributionMap } from "@/lib/competitiveness-analysis/national-indicator-distribution";
import { computeIndexResultsFromRaw } from "@/lib/competitiveness-analysis/compute-step2";
import {
  matchesSchoolKindFilter,
  type SchoolKindFilter,
} from "@/lib/competitiveness-analysis/step1-indicators";
import type {
  CompetitivenessRunPayload,
  CompetitivenessSettings,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";

export function computeRunResultsFromRaw(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
  rawResults: UniversityRawResult[],
  nationalDists: NationalDistributionMap,
): UniversityRunResult[] {
  const policy = resolveAnalysisPolicy(settings);
  const step3Ids = resolveStep3IndicatorIds(settings, indicators);

  const indexResults = computeIndexResultsFromRaw(
    settings,
    indicators,
    rawResults,
    nationalDists,
    step3Ids,
  );

  const results: UniversityRunResult[] = indexResults.map((row) => {
    const cells = row.indicators;
    let composite = 0;
    let weightSum = 0;

    for (const cell of cells) {
      const ind = indicators.find((i) => i.financeTabId === cell.financeTabId);
      if (!ind || cell.dataMissing) continue;
      const catW = settings.categoryWeights[ind.categoryId] ?? 0;
      const indW = settings.indicatorWeights[ind.financeTabId] ?? 0;
      const w = (catW / 100) * (indW / 100);
      composite += cell.indexScore * w;
      weightSum += w;
    }

    const compositeIndex =
      weightSum > 0 ? Math.round((composite / weightSum) * 10) / 10 : 0;

    return {
      ...row,
      compositeIndex,
      compositeRank: 0,
    };
  });

  for (const filter of ["university", "junior-college"] as SchoolKindFilter[]) {
    const group = results
      .filter(
        (r) =>
          matchesSchoolKindFilter(r.schoolKind, filter) &&
          !r.excludedFromRanking,
      )
      .sort((a, b) => b.compositeIndex - a.compositeIndex);
    group.forEach((r, idx) => {
      r.compositeRank = idx + 1;
    });
  }

  if (policy.absoluteIndicatorPolicy === "exclude-from-ranking") {
    for (const r of results) {
      if (r.excludedFromRanking) {
        r.compositeRank = 0;
      }
    }
  }

  return results.sort((a, b) => {
    if (a.excludedFromRanking !== b.excludedFromRanking) {
      return a.excludedFromRanking ? 1 : -1;
    }
    return (a.compositeRank || 999) - (b.compositeRank || 999);
  });
}

export function buildRunPayload(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
  rawResults: UniversityRawResult[],
  nationalDists: NationalDistributionMap,
  lastRunAt: string,
): CompetitivenessRunPayload {
  return {
    rawResults,
    runResults: computeRunResultsFromRaw(
      settings,
      indicators,
      rawResults,
      nationalDists,
    ),
    lastRunAt,
  };
}
