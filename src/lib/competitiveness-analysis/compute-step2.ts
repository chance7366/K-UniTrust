import type { CompetitivenessIndicatorDef } from "@/lib/analysis/competitiveness-indicators";
import type { TargetUniversityRow } from "@/lib/competitiveness-analysis/config";
import {
  absoluteLabelsFor,
  isExcludedFromRanking,
  resolveAnalysisPolicy,
  resolveLowerIsBetterSet,
  resolveStep12IndicatorIds,
} from "@/lib/competitiveness-analysis/analysis-policy";
import {
  buildAllNationalDistributions,
  getNationalValuesForScope,
  type NationalDistributionMap,
} from "@/lib/competitiveness-analysis/national-indicator-distribution";
import {
  loadIndicatorSourceData,
  loadStep1RawIndicatorResults,
  rawResultsToValueMap,
} from "@/lib/competitiveness-analysis/indicator-value-loader";
import {
  resolveIndicatorPercentileBounds,
} from "@/lib/competitiveness-analysis/indicator-percentile-bounds";
import {
  rankByIndexDesc,
  rawToLinearPercentileIndexScore,
} from "@/lib/competitiveness-analysis/percentile-utils";
import {
  matchesSchoolKindFilter,
  type SchoolKindFilter,
} from "@/lib/competitiveness-analysis/step1-indicators";
import type {
  CompetitivenessSettings,
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";

export type Step2RunPayload = {
  rawResults: UniversityRawResult[];
  indexResults: UniversityRunResult[];
  lastRunAt: string;
};

export async function loadNationalDistributionsForSettings(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
  indicatorIds?: string[],
): Promise<NationalDistributionMap> {
  const ids =
    indicatorIds ?? resolveStep12IndicatorIds(settings, indicators);
  const sources = await loadIndicatorSourceData();
  const defaultYears = Object.fromEntries(
    indicators.map((i) => [i.financeTabId, i.defaultYearLabel]),
  );
  return buildAllNationalDistributions(
    ids,
    settings.indicatorYears,
    defaultYears,
    sources,
  );
}

export function computeIndexResultsFromRaw(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
  rawResults: UniversityRawResult[],
  nationalDists: NationalDistributionMap,
  indicatorIds?: string[],
): UniversityRunResult[] {
  const policy = resolveAnalysisPolicy(settings);
  const lowerIsBetter = resolveLowerIsBetterSet(policy);
  const ids = indicatorIds ?? resolveStep12IndicatorIds(settings, indicators);

  const activeIndicators = ids
    .map((id) => indicators.find((i) => i.financeTabId === id))
    .filter((i): i is CompetitivenessIndicatorDef => i != null);

  const uniRows = settings.targetUniversities;
  const rawByUni = rawResultsToValueMap(rawResults);
  const indicatorCells = new Map<string, UniversityRunResult["indicators"]>();

  for (const ind of activeIndicators) {
    const nationalDist = nationalDists.get(ind.financeTabId);
    const rawValues = uniRows.map((u) => {
      const v = rawByUni.get(u.schoolCodeStd)?.[ind.financeTabId];
      return v ?? null;
    });

    const bounds = resolveIndicatorPercentileBounds(settings, ind.financeTabId);
    const lowerIsBetterFlag = lowerIsBetter.has(ind.financeTabId);

    const indexScores = rawValues.map((raw, idx) => {
      if (raw == null) return null;
      const nationalValues = getNationalValuesForScope(
        nationalDist,
        uniRows[idx]!.schoolKind,
        policy.nationalComparisonScope,
      );
      if (!nationalValues.length) return null;
      return rawToLinearPercentileIndexScore(
        nationalValues,
        raw,
        bounds.lowerTailPct,
        bounds.upperTailPct,
        lowerIsBetterFlag,
      );
    });

    const ranks = rankTargetGroupBySchoolKind(
      uniRows,
      indexScores.map((s) => s ?? 0),
      indexScores.map((s) => s == null),
    );

    uniRows.forEach((u, idx) => {
      const list = indicatorCells.get(u.schoolCodeStd) ?? [];
      const missing = indexScores[idx] == null;
      list.push({
        financeTabId: ind.financeTabId,
        label: ind.label,
        rawValue: rawValues[idx] ?? 0,
        indexScore: missing ? 0 : indexScores[idx]!,
        rank: ranks[idx]!,
        dataMissing: missing,
      });
      indicatorCells.set(u.schoolCodeStd, list);
    });
  }

  return uniRows.map((u) => ({
    schoolCodeStd: u.schoolCodeStd,
    schoolName: u.schoolName,
    estb: u.estb,
    schoolKind: u.schoolKind,
    region: u.region,
    indicators: indicatorCells.get(u.schoolCodeStd) ?? [],
    compositeIndex: 0,
    compositeRank: 0,
    absoluteLabels: absoluteLabelsFor(u),
    excludedFromRanking: isExcludedFromRanking(u, policy),
  }));
}

function rankTargetGroupBySchoolKind(
  uniRows: TargetUniversityRow[],
  indexScores: number[],
  missingFlags?: boolean[],
): number[] {
  const ranks = new Array(indexScores.length).fill(0);
  const filters: SchoolKindFilter[] = ["university", "junior-college"];

  for (const filter of filters) {
    const indices = uniRows
      .map((u, idx) => ({ u, idx }))
      .filter(({ u }) => matchesSchoolKindFilter(u.schoolKind, filter))
      .map(({ idx }) => idx);
    if (!indices.length) continue;
    const groupScores = indices.map((idx) =>
      missingFlags?.[idx] ? -1 : indexScores[idx]!,
    );
    const groupRanks = rankByIndexDesc(groupScores);
    indices.forEach((globalIdx, localIdx) => {
      ranks[globalIdx] = missingFlags?.[globalIdx] ? 0 : groupRanks[localIdx]!;
    });
  }

  return ranks;
}

/** 2단계: 1단계 원지표 + 전국 백분위 지수 (분석지침 정책 적용) */
export async function runStep2Analysis(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): Promise<Step2RunPayload> {
  const indicatorIds = resolveStep12IndicatorIds(settings, indicators);
  const rawResults = await loadStep1RawIndicatorResults(
    settings,
    indicators,
    indicatorIds,
  );
  const nationalDists = await loadNationalDistributionsForSettings(
    settings,
    indicators,
    indicatorIds,
  );
  const indexResults = computeIndexResultsFromRaw(
    settings,
    indicators,
    rawResults,
    nationalDists,
    indicatorIds,
  );
  return {
    rawResults,
    indexResults,
    lastRunAt: new Date().toLocaleString("ko-KR"),
  };
}
