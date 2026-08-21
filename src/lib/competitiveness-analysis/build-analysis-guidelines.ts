import {
  getCompetitivenessCategories,
  type CompetitivenessIndicatorDef,
} from "@/lib/analysis/competitiveness-indicators";
import {
  ABSOLUTE_INDICATOR_POLICY_LABELS,
  NATIONAL_COMPARISON_SCOPE_LABELS,
  resolveAnalysisPolicy,
  resolveLowerIsBetterSet,
  resolveStep12IndicatorIds,
  resolveStep3IndicatorIds,
  STEP_INDICATOR_SCOPE_LABELS,
} from "@/lib/competitiveness-analysis/analysis-policy";
import {
  GUIDELINES_SECTION_EXAMPLE,
  GUIDELINES_SECTION_FORMULAS,
  GUIDELINES_SECTION_INTEGRATION,
  GUIDELINES_SECTION_PURPOSE,
  INDICATOR_METHODOLOGY,
} from "@/lib/competitiveness-analysis/guidelines-methodology";
import {
  formatPercentileBoundsLabel,
  resolveIndicatorPercentileBounds,
} from "@/lib/competitiveness-analysis/indicator-percentile-bounds";
import { STEP1_INDICATOR_LABELS } from "@/lib/competitiveness-analysis/step1-indicators";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";
import { summarizeCategoryIndicatorWeights } from "@/lib/competitiveness-analysis/validate-competitiveness-weights";

function indicatorDirection(
  financeTabId: string,
  lowerIsBetter: Set<string>,
): string {
  const meta = INDICATOR_METHODOLOGY[financeTabId];
  if (meta) return meta.direction;
  return lowerIsBetter.has(financeTabId) ? "역방향 (-)" : "정방향 (+)";
}

function indicatorDefinition(financeTabId: string): string {
  return INDICATOR_METHODOLOGY[financeTabId]?.definition ?? "—";
}

/** 지표 배점 M = 부문 가중치 × 부문 내 지표 가중치 / 100 (100점 만점 기준) */
function indicatorMaxPoints(
  categoryWeight: number,
  indicatorWeight: number,
): number {
  return Math.round(((categoryWeight * indicatorWeight) / 100) * 100) / 100;
}

function buildSection2IndicatorTable(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
  lowerIsBetter: Set<string>,
): string[] {
  const lines: string[] = [];
  const categories = getCompetitivenessCategories();
  const categorySummaries = summarizeCategoryIndicatorWeights(
    settings,
    indicators,
  );

  const totalCategoryWeight = categories.reduce(
    (s, c) => s + (settings.categoryWeights[c.id] ?? 0),
    0,
  );

  lines.push(
    `■ 2. 평가지표 체계 및 가중치 (종합 ${totalCategoryWeight}점 만점 · 기본설정 반영)`,
  );
  lines.push("");
  lines.push(
    "부문(가중치) | 세부지표 | 부문내% | 배점M | Pₙ/P₍₁₀₀₋ₙ₎ | 방향 | 산출·정의 | 적용연도",
  );
  lines.push(
    "─────────────┼──────────┼────────┼──────┼──────┼───────────┼────────",
  );

  for (const cat of categories) {
    const catWeight = settings.categoryWeights[cat.id] ?? 0;
    const summary = categorySummaries.find((s) => s.categoryId === cat.id);
    const catIndicators = indicators.filter((i) => i.categoryId === cat.id);

    for (const ind of catIndicators) {
      const enabled = settings.enabledIndicators[ind.financeTabId] !== false;
      const indWeight = settings.indicatorWeights[ind.financeTabId] ?? 0;
      const m = indicatorMaxPoints(catWeight, indWeight);
      const year =
        settings.indicatorYears[ind.financeTabId] ?? ind.defaultYearLabel;
      const label =
        STEP1_INDICATOR_LABELS[
          ind.financeTabId as keyof typeof STEP1_INDICATOR_LABELS
        ] ?? ind.label;

      const bounds = resolveIndicatorPercentileBounds(
        settings,
        ind.financeTabId,
      );
      const pLabel = formatPercentileBoundsLabel(bounds);

      lines.push(
        `${cat.label}(${catWeight}%) | ${label}${enabled ? "" : "[미적용]"} | ${indWeight}% | ${m}점 | ${pLabel} | ${indicatorDirection(ind.financeTabId, lowerIsBetter)} | ${indicatorDefinition(ind.financeTabId)} | ${year}`,
      );
    }

    if (summary && summary.enabledCount > 0) {
      lines.push(
        `  → ${cat.label} 적용 지표 가중치 합: ${summary.sum}%${summary.valid ? "" : " (100% 필요)"}`,
      );
    }
    lines.push("");
  }

  return lines;
}

function buildExecutionSection(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): string[] {
  const policy = resolveAnalysisPolicy(settings);
  const step12Ids = resolveStep12IndicatorIds(settings, indicators);
  const step3Ids = resolveStep3IndicatorIds(settings, indicators);
  const lines: string[] = [];

  lines.push("■ 6. 분석 실행 (시스템 · 기본설정·분석방법 반영)");
  lines.push("");
  lines.push(
    `· 대상대학: 분석대상 대표학교 ${settings.targetUniversities.length.toLocaleString("ko-KR")}건`,
  );
  lines.push("· 1단계: 재정분석지표 표시연도에서 원지표값(X) 조회");
  lines.push(
    `  - 조회 지표: ${STEP_INDICATOR_SCOPE_LABELS[policy.step12IndicatorScope]} (${step12Ids.length}개)`,
  );
  lines.push(
    "  - 재학생수: 대학현황 › 대학알리미 › 재적학생의 재학생(A) 계·소계 (대표학교코드 합산, 대학=대학+대학원, 전문대학=전문대학)",
  );
  lines.push(
    "  - 신입생충원율: 재정분석지표 › 학생충원 › 신입생충원율의 정원내외 신입생충원율",
  );
  lines.push(
    "    · 대학은 대학+대학원, 전문대학은 전문대학",
  );
  lines.push(
    "  - 재학생충원율: 재정분석지표 › 학생충원 › 재학생충원율의 정원내외 재학생충원율",
  );
  lines.push(
    "    · 대학은 대학+대학원, 전문대학은 전문대학",
  );
  lines.push(
    "  - 중도탈락율: 재정분석지표 › 학생충원 › 중도탈락율의 재적학생 중도탈락비율",
  );
  lines.push(
    "    · 대학은 대학+대학원, 전문대학은 전문대학",
  );
  lines.push(
    "  - 자금확보율: 재정분석지표 › 대학재정 › 자금확보율의 자금확보율",
  );
  lines.push(
    "  - 재정지원수혜율: 재정분석지표 › 대학재정 › 재정지원수혜율의 재정지원수혜율",
  );
  lines.push(
    "  - 등록금의존율: 재정분석지표 › 대학재정 › 등록금의존율의 등록금의존율",
  );
  lines.push(
    "  - 수익용재산확보율: 재정분석지표 › 법인재정 › 수익용재산확보율의 확보율",
  );
  lines.push(
    "  - 법인전입금비율: 재정분석지표 › 법인재정 › 법인전입금비율의 전입금비율",
  );
  lines.push(
    "· 2단계: §3 선형 보간 — 지표별 Pₙ/P₍₁₀₀₋ₙ₎(§2 설정)로 S 산출 → 0~100 지수·동종 순위",
  );
  lines.push(
    `  - 전국 비교: ${NATIONAL_COMPARISON_SCOPE_LABELS[policy.nationalComparisonScope]}`,
  );
  lines.push(
    `  - 역지표: ${[...resolveLowerIsBetterSet(policy)].map((id) => STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id).join(", ") || "없음"}`,
  );
  lines.push("· 3단계: §4에 따라 부문·종합점수(가중치) 산출 및 동종 순위");
  lines.push(`  - 적용 지표: ${step3Ids.length}개`);
  lines.push(
    `· 절대지표(경영위기·미인증·임시이사): 업로드 '해당' · 자금부족: 자금확보율 DB(자금합계<0, 절대지표 대학에서 생성) · ${ABSOLUTE_INDICATOR_POLICY_LABELS[policy.absoluteIndicatorPolicy]}`,
  );
  lines.push("· 실행 전 검증: 카테고리 가중치 합 100%, 부문별 지표 가중치 합 100%");
  lines.push(
    "· 실행 후 검증: 재정분석지표 *_rep.csv 원값을 기본설정(재학생수·적용연도·대상대학)과 1·2·3단계 결과에 지표별로 대조",
  );

  return lines;
}

/** 기본설정·분석정책 + 평가 표준 지침 통합 문서 */
export function buildAnalysisGuidelines(
  settings: CompetitivenessSettings,
  indicators: CompetitivenessIndicatorDef[],
): string {
  const policy = resolveAnalysisPolicy(settings);
  const lowerIsBetter = resolveLowerIsBetterSet(policy);

  const sections: string[] = [
    GUIDELINES_SECTION_PURPOSE,
    "",
    ...buildSection2IndicatorTable(settings, indicators, lowerIsBetter),
    GUIDELINES_SECTION_FORMULAS,
    "",
    GUIDELINES_SECTION_INTEGRATION,
    "",
    GUIDELINES_SECTION_EXAMPLE,
    "",
    ...buildExecutionSection(settings, indicators),
  ];

  return sections.join("\n");
}
