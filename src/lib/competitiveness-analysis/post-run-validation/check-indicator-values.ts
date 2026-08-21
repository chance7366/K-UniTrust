import { getKnownIssue } from "@/lib/competitiveness-analysis/post-run-validation/issue-registry";
import type {
  PostRunValidationContext,
  ValidationFinding,
} from "@/lib/competitiveness-analysis/post-run-validation/types";
import { resolveStep12IndicatorIds } from "@/lib/competitiveness-analysis/analysis-policy";
import {
  countRepRowsByCohort,
  INDICATOR_REP_SPEC,
  indicatorRepLabel,
  lookupExpectedIndicatorValue,
  valuesApproxEqual,
} from "@/lib/competitiveness-analysis/indicator-rep-lookup";
import { parseIndicatorYearLabel } from "@/lib/competitiveness-analysis/parse-indicator-year";
import { classifyTargetSchoolKind } from "@/lib/competitiveness-analysis/step1-indicators";
import { lookupEnrolledStudentCount } from "@/lib/analysis/enrolled-students-rep-count";
import { getCompetitivenessIndicators } from "@/lib/analysis/competitiveness-indicators";
import { buildRunAnalyticsRows } from "@/lib/competitiveness-analysis/run-analytics";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import type {
  UniversityRawResult,
  UniversityRunResult,
} from "@/lib/competitiveness-analysis/types";

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

function schoolLabel(row: { schoolName: string; region?: string }): string {
  return row.region ? `${row.schoolName} (${row.region})` : row.schoolName;
}

function resolveYear(
  ctx: PostRunValidationContext,
  financeTabId: string,
): number | null {
  const ind = ctx.indicators.find((i) => i.financeTabId === financeTabId);
  const yearLabel =
    ctx.settings.indicatorYears[financeTabId] ?? ind?.defaultYearLabel ?? "";
  return parseIndicatorYearLabel(yearLabel)?.year ?? null;
}

function findTarget(ctx: PostRunValidationContext, schoolCodeStd: string) {
  return ctx.settings.targetUniversities.find(
    (u) => u.schoolCodeStd === schoolCodeStd,
  );
}

/** SET-TARGET-KIND-001 — 대상대학은 대학·전문대학만 */
export function checkSettingsTargetKind(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const others = ctx.settings.targetUniversities.filter(
    (u) =>
      classifyTargetSchoolKind(u.schoolKind) === "other" &&
      classifyTargetSchoolKind(u.schoolDivision) === "other",
  );
  return [
    findingFromRegistry(
      "SET-TARGET-KIND-001",
      others.length === 0,
      others.length === 0
        ? `대상대학 ${ctx.settings.targetUniversities.length}교 — 대학·전문대학만`
        : `대상대학에 대학·전문대학이 아닌 ${others.length}교 포함`,
      {
        affectedCount: others.length,
        affectedSchools: others.map(schoolLabel),
      },
    ),
  ];
}

/** SET-YEAR-LABEL-001 — 적용연도는 YYYY년 */
export function checkSettingsYearLabels(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);
  const bad: string[] = [];
  for (const id of ids) {
    const ind = ctx.indicators.find((i) => i.financeTabId === id);
    const label =
      ctx.settings.indicatorYears[id] ?? ind?.defaultYearLabel ?? "";
    const parsed = parseIndicatorYearLabel(label);
    if (!parsed || parsed.half) {
      bad.push(`${indicatorRepLabel(id)}=${label || "(없음)"}`);
    }
  }
  return [
    findingFromRegistry(
      "SET-YEAR-LABEL-001",
      bad.length === 0,
      bad.length === 0
        ? `적용연도 ${ids.length}개 지표 — YYYY년 형식 OK`
        : `적용연도 형식 오류 ${bad.length}건: ${bad.join("; ")}`,
      { samples: bad },
    ),
  ];
}

/** DB-REP-COVERAGE-001 — 적용연도 *_rep.csv 코호트 존재 */
export function checkRepSourceCoverage(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);
  const hasUniv = ctx.settings.targetUniversities.some(
    (u) => classifyTargetSchoolKind(u.schoolKind) !== "junior-college",
  );
  const hasJc = ctx.settings.targetUniversities.some(
    (u) =>
      classifyTargetSchoolKind(u.schoolKind) === "junior-college" ||
      classifyTargetSchoolKind(u.schoolDivision) === "junior-college",
  );

  for (const id of ids) {
    const spec = INDICATOR_REP_SPEC[id];
    const year = resolveYear(ctx, id);
    const label = indicatorRepLabel(id);
    if (!spec || year == null) {
      findings.push(
        findingFromRegistry(
          "DB-REP-COVERAGE-001",
          false,
          `${label}: 적용연도 또는 *_rep.csv 명세 없음`,
        ),
      );
      continue;
    }
    const counts = countRepRowsByCohort(ctx.indicatorSources[spec.sourceKey], year);
    const univN = spec.isStudent ? counts.combined : counts.university;
    const jcN = counts.juniorCollege;
    const missing: string[] = [];
    if (hasUniv && univN === 0) {
      missing.push(spec.isStudent ? "대학(combined)" : "대학(university)");
    }
    if (hasJc && jcN === 0) missing.push("전문대(junior-college)");
    findings.push(
      findingFromRegistry(
        "DB-REP-COVERAGE-001",
        missing.length === 0,
        missing.length === 0
          ? `${label} ${year}년 *_rep: 대학 ${univN} · 전문대 ${jcN}`
          : `${label} ${year}년 *_rep 코호트 없음: ${missing.join(", ")} (대학 ${univN} · 전문대 ${jcN})`,
        { affectedCount: missing.length },
      ),
    );
  }

  return findings;
}

/** DB-ENROLLED-TOTAL-001 — 기본설정·1단계 재학생수 vs *_rep.csv */
export function checkEnrolledTotals(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const maps = ctx.enrolledStudentCounts;
  const settingsMismatches: string[] = [];
  const step1Mismatches: string[] = [];

  if (!maps) {
    return [
      findingFromRegistry(
        "DB-ENROLLED-TOTAL-001",
        false,
        "재적학생 재학생(A) 합산 맵이 없어 재학생수를 대조하지 못했습니다.",
      ),
    ];
  }

  for (const uni of ctx.settings.targetUniversities) {
    const kind =
      classifyTargetSchoolKind(uni.schoolKind) === "junior-college" ||
      classifyTargetSchoolKind(uni.schoolDivision) === "junior-college"
        ? "junior-college"
        : "university";
    const expected = lookupEnrolledStudentCount(
      maps,
      uni.schoolCodeStd,
      kind,
    );
    const settingsValue = uni.enrolledTotal ?? null;
    if (expected != null && settingsValue != null) {
      if (Math.abs(expected - settingsValue) >= 1) {
        settingsMismatches.push(
          `${schoolLabel(uni)}: 설정 ${settingsValue} · 재적학생 ${expected}`,
        );
      }
    } else if (expected != null && settingsValue == null) {
      settingsMismatches.push(
        `${schoolLabel(uni)}: 설정 공란 · 재적학생 ${expected}`,
      );
    } else if (expected == null && settingsValue != null) {
      settingsMismatches.push(
        `${schoolLabel(uni)}: 설정 ${settingsValue} · DB 없음`,
      );
    }

    const step1 = ctx.rawResults.find(
      (r) => r.schoolCodeStd === uni.schoolCodeStd,
    );
    const step1Value = step1?.enrolledTotal ?? null;
    if (expected != null && step1Value != null) {
      if (Math.abs(expected - step1Value) >= 1) {
        step1Mismatches.push(
          `${schoolLabel(uni)}: 1단계 ${step1Value} · 재적학생 ${expected}`,
        );
      }
    } else if (expected != null && step1Value == null) {
      step1Mismatches.push(
        `${schoolLabel(uni)}: 1단계 공란 · 재적학생 ${expected}`,
      );
    }
  }

  const settingsWrong = settingsMismatches.filter(
    (line) => !line.includes("설정 공란"),
  );
  const settingsEmpty = settingsMismatches.length - settingsWrong.length;
  const valueErrors = [...settingsWrong, ...step1Mismatches];
  const passed = valueErrors.length === 0;

  return [
    findingFromRegistry(
      "DB-ENROLLED-TOTAL-001",
      passed,
      passed
        ? settingsEmpty > 0
          ? `재학생수: 1단계 ${ctx.rawResults.length}교 vs 재적학생 재학생(A) 일치. 저장 설정값은 비어 있고 대상대학 화면은 실시간 조회`
          : `재학생수: 기본설정·1단계 ${ctx.settings.targetUniversities.length}교 vs ${ctx.analysisYear}년 재적학생 재학생(A) OK`
        : `재학생수 값 오류 — 설정 ${settingsWrong.length}교 · 1단계 ${step1Mismatches.length}교`,
      {
        affectedCount: valueErrors.length,
        affectedSchools: valueErrors,
      },
    ),
  ];
}

/** DB-SCHOOL-SCALE-001 — 3단계 재학생수·규모 vs 재적학생 재학생(A) */
export function checkSchoolScale(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const maps = ctx.enrolledStudentCounts;
  if (!maps) {
    return [
      findingFromRegistry(
        "DB-SCHOOL-SCALE-001",
        false,
        "재적학생 재학생(A) 합산 맵이 없어 규모를 대조하지 못했습니다.",
      ),
    ];
  }

  const liveTargets = ctx.settings.targetUniversities.map((uni) => {
    const kind =
      classifyTargetSchoolKind(uni.schoolKind) === "junior-college" ||
      classifyTargetSchoolKind(uni.schoolDivision) === "junior-college"
        ? "junior-college"
        : "university";
    return {
      ...uni,
      enrolledTotal:
        lookupEnrolledStudentCount(maps, uni.schoolCodeStd, kind) ??
        uni.enrolledTotal ??
        null,
    };
  });
  const analytics = buildRunAnalyticsRows(
    ctx.runResults,
    { ...ctx.settings, targetUniversities: liveTargets },
    getCompetitivenessIndicators(),
    ctx.rawResults,
  );
  const mismatches: string[] = [];

  for (const row of analytics) {
    const kind = row.type === "전문대" ? "junior-college" : "university";
    const expectedEnrolled = lookupEnrolledStudentCount(
      maps,
      row.schoolCodeStd,
      kind,
    );
    const expectedScale = schoolScaleFromEnrolled(expectedEnrolled, row.type);
    const enrolledMismatch =
      expectedEnrolled != null &&
      row.enrolledTotal != null &&
      Math.abs(expectedEnrolled - row.enrolledTotal) >= 1;
    const missingOnOneSide =
      (expectedEnrolled != null && row.enrolledTotal == null) ||
      (expectedEnrolled == null && row.enrolledTotal != null);
    const scaleMismatch = expectedScale !== row.scale;
    if (!enrolledMismatch && !missingOnOneSide && !scaleMismatch) continue;
    mismatches.push(
      `${schoolLabel({ schoolName: row.name, region: row.province })}: 3단계 ${row.enrolledTotal ?? "공란"}(${row.scale ?? "공란"}) · 재적학생 ${expectedEnrolled ?? "없음"}(${expectedScale ?? "공란"})`,
    );
  }

  return [
    findingFromRegistry(
      "DB-SCHOOL-SCALE-001",
      mismatches.length === 0,
      mismatches.length === 0
        ? `3단계 재학생수·규모 ${analytics.length}교 vs 재적학생 재학생(A) 규모 분류 OK`
        : `3단계 재학생수·규모 불일치 ${mismatches.length}교`,
      {
        affectedCount: mismatches.length,
        affectedSchools: mismatches,
      },
    ),
  ];
}

function cellRaw(
  row: UniversityRawResult | UniversityRunResult | undefined,
  financeTabId: string,
): number | null {
  const cell = row?.indicators.find((c) => c.financeTabId === financeTabId);
  if (!cell) return null;
  if ("found" in cell && !cell.found) return null;
  if ("dataMissing" in cell && cell.dataMissing) return null;
  return cell.rawValue ?? null;
}

/** DB-VALUE-SOURCE-001 — 지표별 1단계 원값 vs 재정분석 *_rep.csv */
export function checkIndicatorValuesVsCsv(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);

  for (const id of ids) {
    const year = resolveYear(ctx, id);
    const label = indicatorRepLabel(id);
    const mismatches: string[] = [];
    let compared = 0;

    for (const row of ctx.rawResults) {
      const uni = findTarget(ctx, row.schoolCodeStd) ?? row;
      const actual = cellRaw(row, id);
      const expected =
        year == null
          ? null
          : lookupExpectedIndicatorValue(
              ctx.indicatorSources,
              id,
              year,
              uni.schoolKind,
              "schoolDivision" in uni ? uni.schoolDivision : "",
              row.schoolCodeStd,
            );

      if (expected == null && actual == null) continue;
      if (expected != null && actual != null) {
        compared += 1;
        if (!valuesApproxEqual(expected, actual)) {
          mismatches.push(
            `${schoolLabel(row)}: 실행 ${actual} · DB ${expected}`,
          );
        }
        continue;
      }
      if (expected != null && actual == null) {
        mismatches.push(`${schoolLabel(row)}: 실행 공란 · DB ${expected}`);
        continue;
      }
      mismatches.push(`${schoolLabel(row)}: 실행 ${actual} · DB 없음`);
    }

    findings.push(
      findingFromRegistry(
        "DB-VALUE-SOURCE-001",
        mismatches.length === 0,
        mismatches.length === 0
          ? `${label}: 1단계 ${compared}셀 vs *_rep.csv 일치`
          : `${label}: 1단계 원값 오류 ${mismatches.length}교`,
        {
          affectedCount: mismatches.length,
          affectedSchools: mismatches,
        },
      ),
    );
  }

  return findings;
}

/** DB-VALUE-STEP-ALIGN-001 — 1·2·3단계 원값 동일 */
export function checkStepRawAlignment(
  ctx: PostRunValidationContext,
): ValidationFinding[] {
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);
  const mismatches: string[] = [];

  for (const row of ctx.rawResults) {
    const step2 = ctx.indexResults.find(
      (r) => r.schoolCodeStd === row.schoolCodeStd,
    );
    const step3 = ctx.runResults.find(
      (r) => r.schoolCodeStd === row.schoolCodeStd,
    );
    for (const id of ids) {
      const v1 = cellRaw(row, id);
      if (v1 == null) continue;
      const step2Cell = step2?.indicators.find((c) => c.financeTabId === id);
      const step3Cell = step3?.indicators.find((c) => c.financeTabId === id);
      const v2 = step2Cell?.rawValue ?? null;
      const v3 = step3Cell?.rawValue ?? null;
      const step2Off = step2 != null && (v2 == null || !valuesApproxEqual(v1, v2));
      const step3Off = step3 != null && (v3 == null || !valuesApproxEqual(v1, v3));
      if (step2Off || step3Off) {
        mismatches.push(
          `${schoolLabel(row)} ${indicatorRepLabel(id)}: 1단계 ${v1} · 2단계 ${v2 ?? "공란"} · 3단계 ${v3 ?? "공란"}`,
        );
      }
    }
  }

  return [
    findingFromRegistry(
      "DB-VALUE-STEP-ALIGN-001",
      mismatches.length === 0,
      mismatches.length === 0
        ? `1·2·3단계 원값 ${ctx.rawResults.length}교 × ${ids.length}지표 일치`
        : `1·2·3단계 원값 불일치 ${mismatches.length}건`,
      {
        affectedCount: mismatches.length,
        affectedSchools: mismatches,
      },
    ),
  ];
}

/** DB-VALUE-STORED-001 — 저장 1·2·3단계 원값 vs 재조회 *_rep.csv */
export function checkStoredValuesVsCsv(
  ctx: PostRunValidationContext,
  storedStep1: UniversityRawResult[] | null,
  storedStep2: UniversityRunResult[] | null,
  storedStep3: UniversityRunResult[] | null,
): ValidationFinding[] {
  const ids = resolveStep12IndicatorIds(ctx.settings, ctx.indicators);
  const mismatches: string[] = [];

  const compareStored = (
    stage: string,
    rows: Array<UniversityRawResult | UniversityRunResult> | null,
  ) => {
    if (!rows?.length) return;
    for (const row of rows) {
      const uni = findTarget(ctx, row.schoolCodeStd);
      if (!uni) continue;
      for (const id of ids) {
        const year = resolveYear(ctx, id);
        if (year == null) continue;
        const actual = cellRaw(row, id);
        const expected = lookupExpectedIndicatorValue(
          ctx.indicatorSources,
          id,
          year,
          uni.schoolKind,
          uni.schoolDivision,
          row.schoolCodeStd,
        );
        if (expected == null || actual == null) continue;
        if (!valuesApproxEqual(expected, actual)) {
          mismatches.push(
            `${schoolLabel(row)} ${indicatorRepLabel(id)} ${stage}: 저장 ${actual} · DB ${expected}`,
          );
        }
      }
    }
  };

  compareStored("1단계", storedStep1);
  compareStored("2단계", storedStep2);
  compareStored("3단계", storedStep3);

  const hasStored = Boolean(
    storedStep1?.length || storedStep2?.length || storedStep3?.length,
  );
  if (!hasStored) {
    return [
      findingFromRegistry(
        "DB-VALUE-STORED-001",
        true,
        "저장 결과 없음 — 원값 저장 대조 생략",
      ),
    ];
  }

  return [
    findingFromRegistry(
      "DB-VALUE-STORED-001",
      mismatches.length === 0,
      mismatches.length === 0
        ? "저장 1·2·3단계 원값 vs *_rep.csv 일치"
        : `저장 원값과 *_rep.csv 불일치 ${mismatches.length}건`,
      {
        affectedCount: mismatches.length,
        affectedSchools: mismatches,
      },
    ),
  ];
}
