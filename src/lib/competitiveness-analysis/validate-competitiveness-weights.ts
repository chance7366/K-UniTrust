import type { CompetitivenessIndicatorDef } from "@/lib/analysis/competitiveness-indicators";
import { getCompetitivenessCategories } from "@/lib/analysis/competitiveness-indicators";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";

export type WeightValidationIssue = {
  code: "category-sum" | "category-indicator-sum" | "no-enabled-indicators";
  message: string;
};

export type CategoryIndicatorWeightSummary = {
  categoryId: string;
  categoryLabel: string;
  enabledCount: number;
  sum: number;
  valid: boolean;
};

export function summarizeCategoryIndicatorWeights(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): CategoryIndicatorWeightSummary[] {
  const categories = getCompetitivenessCategories();

  return categories.map((cat) => {
    const enabled = indicators.filter(
      (ind) =>
        ind.categoryId === cat.id &&
        settings.enabledIndicators[ind.financeTabId] !== false,
    );
    const sum = enabled.reduce(
      (s, ind) => s + (settings.indicatorWeights[ind.financeTabId] ?? 0),
      0,
    );

    return {
      categoryId: cat.id,
      categoryLabel: cat.label,
      enabledCount: enabled.length,
      sum,
      valid: enabled.length > 0 && sum === 100,
    };
  });
}

export function validateCompetitivenessWeights(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): WeightValidationIssue[] {
  const issues: WeightValidationIssue[] = [];

  const categorySum = getCompetitivenessCategories().reduce(
    (s, cat) => s + (settings.categoryWeights[cat.id] ?? 0),
    0,
  );

  if (categorySum !== 100) {
    issues.push({
      code: "category-sum",
      message: `카테고리 가중치 합계가 ${categorySum}%입니다. 100%로 맞춰 주세요.`,
    });
  }

  for (const summary of summarizeCategoryIndicatorWeights(settings, indicators)) {
    if (summary.enabledCount === 0) {
      issues.push({
        code: "no-enabled-indicators",
        message: `${summary.categoryLabel} 카테고리에 적용 지표가 1개 이상 필요합니다.`,
      });
      continue;
    }

    if (summary.sum !== 100) {
      issues.push({
        code: "category-indicator-sum",
        message: `${summary.categoryLabel} 지표 가중치 합계가 ${summary.sum}%입니다. 100%로 맞춰 주세요.`,
      });
    }
  }

  return issues;
}

export function formatWeightValidationError(
  issues: WeightValidationIssue[],
): string {
  return issues.map((issue) => issue.message).join(" ");
}
