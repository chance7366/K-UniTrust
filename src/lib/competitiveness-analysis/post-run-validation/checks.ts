import { getKnownIssue } from "@/lib/competitiveness-analysis/post-run-validation/issue-registry";
import type {
  PostRunValidationContext,
  ValidationFinding,
} from "@/lib/competitiveness-analysis/post-run-validation/types";
import {
  resolveStep12IndicatorIds,
  resolveStep3IndicatorIds,
  resolveAnalysisPolicy,
} from "@/lib/competitiveness-analysis/analysis-policy";
import { parseIndicatorYearLabel } from "@/lib/competitiveness-analysis/parse-indicator-year";
import {
  matchesSchoolKindFilter,
  STEP1_INDICATOR_LABELS,
} from "@/lib/competitiveness-analysis/step1-indicators";
import {
  validateCompetitivenessWeights,
} from "@/lib/competitiveness-analysis/validate-competitiveness-weights";
import { computeRunResultsFromRaw } from "@/lib/competitiveness-analysis/compute-run";
import { loadNationalDistributionsForSettings } from "@/lib/competitiveness-analysis/compute-step2";
import type { NationalDistributionMap } from "@/lib/competitiveness-analysis/national-indicator-distribution";
import {
  checkEnrolledTotals,
  checkSchoolScale,
  checkIndicatorValuesVsCsv,
  checkRepSourceCoverage,
  checkSettingsTargetKind,
  checkSettingsYearLabels,
  checkStepRawAlignment,
  checkStoredValuesVsCsv,
} from "@/lib/competitiveness-analysis/post-run-validation/check-indicator-values";

function findingFromRegistry(
  checkId: string,
  passed: boolean,
  message: string,
  extra?: Partial<ValidationFinding>,
): ValidationFinding {
  const issue = getKnownIssue(checkId)!;
  return {
    checkId,
    title: issue.title,
    passed,
    severity: passed ? "info" : issue.severity,
    owner: issue.owner,
    message,
    userAction: passed ? undefined : issue.userActionGuide,
    ...extra,
  };
}

function resolveIndicatorDataYears(
  _financeTabId: string,
  yearLabel: string,
): number[] {
  const parsed = parseIndicatorYearLabel(yearLabel);
  return parsed ? [parsed.year] : [];
}

function countCsvRowsByKind(
  rows: Record<string, string>[],
  year: number,
): { university: number; juniorCollege: number } {
  let university = 0;
  let juniorCollege = 0;
  const hasCombined = rows.some(
    (row) =>
      Number(row.year) === year && row.cohort?.trim() === "combined",
  );
  for (const row of rows) {
    if (Number(row.year) !== year) continue;
    const cohort = row.cohort?.trim() ?? "";
    if (cohort === "junior-college") {
      juniorCollege += 1;
      continue;
    }
    if (cohort === "combined") {
      university += 1;
      continue;
    }
    if (cohort === "university" && !hasCombined) {
      university += 1;
      continue;
    }
    const kind = row.school_kind ?? row.school_division ?? "";
    if (kind.includes("전문")) juniorCollege += 1;
    else if (kind.includes("대학")) university += 1;
  }
  return { university, juniorCollege };
}

/** DB-DROPOUT-COHORT-001 + DB-COHORT-COVERAGE-001 */
export function checkIndicatorCohortCoverage(
  ctx: ExtendedPostRunContext,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);
  const policy = resolveAnalysisPolicy(ctx.settings);
  const hasUniv = ctx.settings.targetUniversities.some((u) =>
    matchesSchoolKindFilter(u.schoolKind, "university"),
  );
  const hasJc = ctx.settings.targetUniversities.some((u) =>
    matchesSchoolKindFilter(u.schoolKind, "junior-college"),
  );

  for (const id of ids) {
    const ind = ctx.indicators.find((i) => i.financeTabId === id)!;
    const label =
      STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id;
    const yearLabel =
      ctx.settings.indicatorYears[id] ?? ind.defaultYearLabel;
    const dataYears = resolveIndicatorDataYears(id, yearLabel);

    for (const dataYear of dataYears) {
      if (id === "dropout-rate") {
        const raw = countCsvRowsByKind(
          ctx.indicatorSources.dropoutRawRows,
          dataYear,
        );
        const cons = countCsvRowsByKind(
          ctx.indicatorSources.dropoutRows,
          dataYear,
        );

        if (hasUniv && hasJc && raw.university > 0 && raw.juniorCollege === 0) {
          findings.push(
            findingFromRegistry(
              "DB-DROPOUT-COHORT-001",
              false,
              `${label} ${dataYear}년 raw: 4년제 ${raw.university}건 · 전문대 0건`,
              {
                affectedCount: raw.university,
                samples: [`적용연도 ${yearLabel}`],
              },
            ),
          );
        } else if (hasJc && raw.juniorCollege > 0 && cons.juniorCollege === 0) {
          findings.push(
            findingFromRegistry(
              "DB-DROPOUT-COHORT-001",
              false,
              `${label} ${dataYear}년 본교통합 후 전문대 0건 (raw ${raw.juniorCollege}건)`,
            ),
          );
        } else {
          findings.push(
            findingFromRegistry(
              "DB-DROPOUT-COHORT-001",
              true,
              `${label} ${dataYear}년 raw 4년제 ${raw.university} · 전문대 ${raw.juniorCollege} · 통합 ${cons.juniorCollege}`,
            ),
          );
        }
      }

      const nationalDist = ctx.nationalDists.get(id);
      if (nationalDist && hasUniv && hasJc) {
        const univN = nationalDist.university.length;
        const jcN = nationalDist.juniorCollege.length;
        const ok = univN >= 5 && jcN >= 5;
        findings.push(
          findingFromRegistry(
            "DB-COHORT-COVERAGE-001",
            ok,
            ok
              ? `${label} ${dataYear}년 전국분포: 4년제 ${univN} · 전문대 ${jcN}`
              : `${label} ${dataYear}년 전국분포 부족: 4년제 ${univN} · 전문대 ${jcN}`,
            { affectedCount: ok ? 0 : (univN < 5 ? univN : jcN) },
          ),
        );
      }
    }
  }

  return findings;
}

/** DB-TARGET-MISSING-001, DB-INCOME-PROPERTY-001 */
export function checkStep1MissingRaw(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);
  const missingByIndicator = new Map<string, string[]>();

  for (const row of ctx.rawResults) {
    for (const id of ids) {
      const cell = row.indicators.find((c) => c.financeTabId === id);
      if (!cell?.found || cell.rawValue == null) {
        const list = missingByIndicator.get(id) ?? [];
        list.push(
          row.region
            ? `${row.schoolName} (${row.region})`
            : row.schoolName,
        );
        missingByIndicator.set(id, list);
      }
    }
  }

  for (const id of ids) {
    const label =
      STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id;
    const missing = missingByIndicator.get(id) ?? [];
    const checkId =
      id === "income-property-secure-rate"
        ? "DB-INCOME-PROPERTY-001"
        : "DB-TARGET-MISSING-001";

    findings.push(
      findingFromRegistry(
        checkId,
        missing.length === 0,
        missing.length === 0
          ? `${label}: 대상 ${ctx.rawResults.length}교 원값 OK`
          : `${label}: DB 누락 ${missing.length}교`,
        {
          affectedCount: missing.length,
          samples: missing,
          affectedSchools: missing,
        },
      ),
    );
  }

  return findings;
}

/** LOGIC-INDEX-ALL-ZERO-001, LOGIC-DATA-MISSING-001 */
export function checkStep2IndexHealth(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);

  for (const id of ids) {
    const label =
      STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id;

    for (const filter of ["university", "junior-college"] as const) {
      const rows = ctx.indexResults.filter((r) =>
        matchesSchoolKindFilter(r.schoolKind, filter),
      );
      if (!rows.length) continue;

      const cells = rows
        .map((r) => r.indicators.find((c) => c.financeTabId === id))
        .filter(Boolean);
      const missing = cells.filter((c) => c!.dataMissing).length;
      const scored = cells.filter((c) => !c!.dataMissing);
      const allZero =
        scored.length > 0 && scored.every((c) => c!.indexScore === 0);

      if (missing > 0) {
        findings.push(
          findingFromRegistry(
            "LOGIC-DATA-MISSING-001",
            true,
            `${label} · ${filter === "university" ? "4년제" : "전문대"}: dataMissing ${missing}/${rows.length}교 (종합 가중치 제외)`,
            { affectedCount: missing },
          ),
        );
      }

      if (allZero) {
        findings.push(
          findingFromRegistry(
            "LOGIC-INDEX-ALL-ZERO-001",
            false,
            `${label} · ${filter === "university" ? "4년제" : "전문대"}: 지수 전원 0점 (${rows.length}교)`,
            { affectedCount: rows.length },
          ),
        );
      }
    }
  }

  return findings;
}

/** LOGIC-COMPOSITE-GAP-001 */
export function checkCompositeCohortGap(
  ctx: PostRunValidationContext,
  gapThreshold = 8,
): ValidationFinding[] {
  const avg = (filter: "university" | "junior-college") => {
    const scores = ctx.runResults
      .filter((r) => matchesSchoolKindFilter(r.schoolKind, filter))
      .map((r) => r.compositeIndex);
    if (!scores.length) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const univAvg = avg("university");
  const jcAvg = avg("junior-college");
  if (univAvg == null || jcAvg == null) {
    return [];
  }

  const gap = Math.abs(univAvg - jcAvg);
  const passed = gap <= gapThreshold;

  return [
    findingFromRegistry(
      "LOGIC-COMPOSITE-GAP-001",
      passed,
      passed
        ? `4년제·전문대 종합점수 평균 차 ${gap.toFixed(1)}점 (임계 ${gapThreshold}점 이내)`
        : `4년제 평균 ${univAvg.toFixed(1)} · 전문대 ${jcAvg.toFixed(1)} · 차 ${gap.toFixed(1)}점 — 지표 누락·편향 점검`,
      { detail: `4년제 n=${ctx.runResults.filter((r) => matchesSchoolKindFilter(r.schoolKind, "university")).length}, 전문대 n=${ctx.runResults.filter((r) => matchesSchoolKindFilter(r.schoolKind, "junior-college")).length}` },
    ),
  ];
}

/** SYS-WEIGHT-001 */
export function checkWeights(ctx: PostRunValidationContext): ValidationFinding[] {
  const issues = validateCompetitivenessWeights(ctx.settings, ctx.indicators);
  return [
    findingFromRegistry(
      "SYS-WEIGHT-001",
      issues.length === 0,
      issues.length === 0
        ? "카테고리·지표 가중치 합 100% OK"
        : `가중치 오류 ${issues.length}건: ${issues.map((i) => i.message).join("; ")}`,
      { samples: issues.map((i) => i.message).slice(0, 5) },
    ),
  ];
}

/** SYS-STORED-FRESH-001 */
export function checkStoredVsFresh(
  ctx: PostRunValidationContext,
  storedRunResults: PostRunValidationContext["runResults"],
): ValidationFinding[] {
  let mismatch = 0;
  const samples: string[] = [];

  for (const stored of storedRunResults) {
    const fresh = ctx.runResults.find(
      (r) => r.schoolCodeStd === stored.schoolCodeStd,
    );
    if (!fresh) continue;
    if (Math.abs(stored.compositeIndex - fresh.compositeIndex) > 0.05) {
      mismatch += 1;
      if (samples.length < 5) {
        samples.push(
          `${stored.schoolName}: stored=${stored.compositeIndex} fresh=${fresh.compositeIndex}`,
        );
      }
    }
  }

  return [
    findingFromRegistry(
      "SYS-STORED-FRESH-001",
      mismatch === 0,
      mismatch === 0
        ? `저장 step3 ${storedRunResults.length}교 vs 재계산 일치`
        : `종합지수 불일치 ${mismatch}교`,
      { affectedCount: mismatch, samples },
    ),
  ];
}

export type ExtendedPostRunContext = PostRunValidationContext & {
  nationalDists: NationalDistributionMap;
};

export async function buildExtendedContext(
  analysisYear: number,
  edition: NonNullable<Awaited<ReturnType<typeof import("@/lib/competitiveness-analysis/editions-db").getEditionFull>>>,
  indicators: PostRunValidationContext["indicators"],
  indicatorSources: PostRunValidationContext["indicatorSources"],
): Promise<ExtendedPostRunContext> {
  const { runStep2Analysis } = await import(
    "@/lib/competitiveness-analysis/compute-step2"
  );
  const step2 = await runStep2Analysis(edition.settings, indicators);
  const step3Ids = resolveStep3IndicatorIds(edition.settings, indicators);
  const nationalDists = await loadNationalDistributionsForSettings(
    edition.settings,
    indicators,
    step3Ids,
  );
  const runResults = computeRunResultsFromRaw(
    edition.settings,
    indicators,
    step2.rawResults,
    nationalDists,
  );
  const { loadEnrolledStudentCountsByRep } = await import(
    "@/lib/analysis/enrolled-students-rep-count"
  );
  const enrolledStudentCounts = await loadEnrolledStudentCountsByRep(
    analysisYear,
  );

  return {
    analysisYear,
    settings: edition.settings,
    indicators,
    rawResults: step2.rawResults,
    indexResults: step2.indexResults,
    runResults,
    indicatorSources,
    lastRunAt: edition.results.lastRunAt,
    nationalDists,
    storedStep1: edition.results.step1RawResults,
    storedStep2: edition.results.step2IndexResults,
    storedStep3: edition.results.runResults,
    enrolledStudentCounts,
  };
}

export function runAllPostRunChecks(
  ctx: ExtendedPostRunContext,
  storedRunResults: PostRunValidationContext["runResults"],
): ValidationFinding[] {
  return [
    ...checkWeights(ctx),
    ...checkSettingsTargetKind(ctx),
    ...checkSettingsYearLabels(ctx),
    ...checkRepSourceCoverage(ctx),
    ...checkEnrolledTotals(ctx),
    ...checkSchoolScale(ctx),
    ...checkIndicatorValuesVsCsv(ctx),
    ...checkStepRawAlignment(ctx),
    ...checkStoredValuesVsCsv(
      ctx,
      ctx.storedStep1 ?? null,
      ctx.storedStep2 ?? null,
      ctx.storedStep3 ?? storedRunResults,
    ),
    ...checkIndicatorCohortCoverage(ctx),
    ...checkStep1MissingRaw(ctx),
    ...checkStep2IndexHealth(ctx),
    ...checkCompositeCohortGap(ctx),
    ...checkStoredVsFresh(ctx, storedRunResults),
    findingFromRegistry(
      "MONITOR-GRADE-CUTOFF-001",
      true,
      "진단등급 S~E는 제안안(고정 컷). 통계분석·Step3 참고용.",
    ),
  ];
}
