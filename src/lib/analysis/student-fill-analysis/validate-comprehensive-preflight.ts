import { attachStudentFillAux } from "./load-join";
import {
  filterStudentFillSchools,
  type SfaComprehensiveFilter,
} from "./comprehensive-filter";
import { listStudentFillEditionYears, readStudentFillEdition } from "./store";
import type { StudentFillSchoolRow } from "./types";

export type SfaPreflightLevel = "error" | "warning";

export type SfaPreflightIssue = {
  level: SfaPreflightLevel;
  code: string;
  message: string;
  schools?: string[];
};

export type SfaComprehensivePreflight = {
  ok: boolean;
  analysisYear: number;
  years: number[];
  schoolCount: number;
  issues: SfaPreflightIssue[];
  summary: string;
};

const COVERAGE_WARN = {
  dropout: 0.9,
  foreign: 0.85,
  enrolled: 0.95,
} as const;

function coverage(
  rows: StudentFillSchoolRow[],
  pick: (r: StudentFillSchoolRow) => unknown,
) {
  if (!rows.length) return { nn: 0, n: 0, ratio: 0, missing: [] as string[] };
  const missing = rows.filter((r) => pick(r) == null).map((r) => r.schoolName);
  const nn = rows.length - missing.length;
  return { nn, n: rows.length, ratio: nn / rows.length, missing };
}

function names(list: string[], max = 8) {
  if (!list.length) return "";
  const head = list.slice(0, max).join(", ");
  return list.length > max ? `${head} 외 ${list.length - max}교` : head;
}

export function formatSfaPreflightSummary(result: SfaComprehensivePreflight): string {
  if (!result.issues.length) {
    return `${result.analysisYear}년 검증을 통과했습니다. 본교 ${result.schoolCount}교 · 시계열 ${result.years.join("–")} · 표·차트는 분석실행 숫자로 채웁니다.`;
  }
  const errors = result.issues.filter((i) => i.level === "error");
  const warns = result.issues.filter((i) => i.level === "warning");
  const lines: string[] = [];
  if (errors.length) {
    lines.push(`생성 전 검증에서 오류 ${errors.length}건이 있어 보고서를 저장하지 않았습니다.`);
    for (const issue of errors) lines.push(`· [오류] ${issue.message}`);
    lines.push("분석실행을 다시 한 뒤 종합보고서를 생성하세요. 공시 없는 값은 0으로 채우지 않습니다.");
  } else {
    lines.push(`생성 전 검증에서 주의 ${warns.length}건이 있습니다. 공시 없는 값은 0으로 채우지 않고, 있는 본교만으로 평균을 냅니다.`);
    for (const issue of warns) lines.push(`· [주의] ${issue.message}`);
  }
  return lines.join("\n");
}

export async function validateStudentFillComprehensivePreflight(
  filter: SfaComprehensiveFilter,
): Promise<SfaComprehensivePreflight> {
  const analysisYear = filter.analysisYear;
  const expectedYears = [0, 1, 2, 3, 4].map((i) => analysisYear - 4 + i);
  const storedYears = await listStudentFillEditionYears();
  const issues: SfaPreflightIssue[] = [];

  const edition = await readStudentFillEdition(analysisYear);
  if (!edition || !edition.schools.length) {
    issues.push({
      level: "error",
      code: "NO_EDITION",
      message: `${analysisYear}년 분석실행 저장본이 없거나 대상 본교가 없습니다. 먼저 분석실행을 하세요.`,
    });
    const result = {
      ok: false,
      analysisYear,
      years: [],
      schoolCount: 0,
      issues,
      summary: "",
    };
    result.summary = formatSfaPreflightSummary(result);
    return result;
  }

  const missingYears = expectedYears.filter((y) => !storedYears.includes(y));
  if (missingYears.length) {
    issues.push({
      level: "warning",
      code: "YEAR_GAPS",
      message: `5개년(${expectedYears[0]}–${analysisYear}) 중 저장본이 없는 해: ${missingYears.join(", ")}. 시계열이 짧아질 수 있습니다.`,
    });
  }

  const schools = filterStudentFillSchools(
    await attachStudentFillAux(edition.schools, analysisYear),
    filter,
  );
  if (!schools.length) {
    issues.push({
      level: "error",
      code: "NO_SCHOOLS",
      message: "선택한 분석조건(권역·설립·학제)에 해당하는 본교가 없습니다.",
    });
    const result = {
      ok: false,
      analysisYear,
      years: storedYears.filter((y) => y <= analysisYear).slice(0, 5),
      schoolCount: 0,
      issues,
      summary: "",
    };
    result.summary = formatSfaPreflightSummary(result);
    return result;
  }

  const rateIn = coverage(schools, (r) => r.rateIn);
  const rateAll = coverage(schools, (r) => r.rateAll);
  const enrolled = coverage(schools, (r) => r.enrolledFillRate);
  const dropout = coverage(schools, (r) => r.dropoutRate);
  const freshman = coverage(schools, (r) => r.freshmanDropoutRate);
  const foreign = coverage(schools, (r) => r.foreignTotal);

  if (rateIn.ratio === 0 && rateAll.ratio === 0) {
    issues.push({
      level: "error",
      code: "STALE_FRESHMAN",
      message: `${analysisYear}년 정원내·정원내외충원율이 전원 비어 있습니다. 분석실행 저장본이 비정상입니다. 분석실행을 다시 하세요.`,
    });
  }
  if (dropout.ratio === 0 && freshman.ratio === 0) {
    issues.push({
      level: "error",
      code: "STALE_DROPOUT",
      message: `${analysisYear}년 신입생탈락율·중도탈락율이 전원 비어 있습니다. 탈락 공시 조인이 안 된 저장본입니다. 분석실행을 다시 하세요.`,
    });
  }
  if (foreign.ratio === 0) {
    issues.push({
      level: "error",
      code: "STALE_FOREIGN",
      message: `${analysisYear}년 외국인 인원이 전원 비어 있습니다. 외국인 공시 조인이 안 된 저장본(시안 숫자 위험)입니다. 분석실행을 다시 하세요.`,
    });
  }

  const denomNoRate = schools.filter(
    (r) => r.rateIn == null && (r.recruitWithin ?? 0) > 0,
  );
  if (denomNoRate.length) {
    issues.push({
      level: "error",
      code: "RATE_MISSING_WITH_DENOM",
      message: `정원내 모집이 있는데 정원내충원율이 없는 본교 ${denomNoRate.length}교: ${names(denomNoRate.map((r) => r.schoolName))}. 데이터 오류로 보고 분석실행을 다시 하세요.`,
      schools: denomNoRate.map((r) => r.schoolName),
    });
  }

  const zeroDenom = schools.filter(
    (r) => r.rateIn == null && (r.recruitWithin ?? 0) <= 0 && (r.recruitTotal ?? 0) <= 0,
  );
  if (zeroDenom.length) {
    issues.push({
      level: "warning",
      code: "ZERO_RECRUIT",
      message: `모집인원이 0이라 충원율을 계산하지 않은 본교 ${zeroDenom.length}교: ${names(zeroDenom.map((r) => r.schoolName))}. 0%로 채우지 않습니다.`,
      schools: zeroDenom.map((r) => r.schoolName),
    });
  }

  if (enrolled.ratio < COVERAGE_WARN.enrolled && enrolled.ratio > 0) {
    issues.push({
      level: "warning",
      code: "ENROLLED_COVERAGE",
      message: `재학생충원율 공시 ${enrolled.nn}/${enrolled.n}교. 없는 본교(${names(enrolled.missing)})는 평균에서 제외합니다.`,
      schools: enrolled.missing,
    });
  }
  if (dropout.ratio < COVERAGE_WARN.dropout && dropout.ratio > 0) {
    issues.push({
      level: "warning",
      code: "DROPOUT_COVERAGE",
      message: `중도탈락율 공시 ${dropout.nn}/${dropout.n}교. 없는 본교는 평균에서 제외합니다. ${names(dropout.missing)}`,
      schools: dropout.missing,
    });
  }
  if (freshman.ratio < COVERAGE_WARN.dropout && freshman.ratio > 0) {
    issues.push({
      level: "warning",
      code: "FRESHMAN_DROPOUT_COVERAGE",
      message: `신입생탈락율 공시 ${freshman.nn}/${freshman.n}교. 없는 본교는 평균에서 제외합니다. ${names(freshman.missing)}`,
      schools: freshman.missing,
    });
  }
  if (foreign.ratio < COVERAGE_WARN.foreign && foreign.ratio > 0) {
    issues.push({
      level: "warning",
      code: "FOREIGN_COVERAGE",
      message: `외국인 인원 공시 ${foreign.nn}/${foreign.n}교. 교대·간호 등 미공시 ${foreign.missing.length}교는 0명으로 넣지 않고 평균에서 제외합니다. ${names(foreign.missing)}`,
      schools: foreign.missing,
    });
  }

  const wild = schools.filter((r) => {
    const rates = [r.rateIn, r.rateAll, r.enrolledFillRate, r.dropoutRate, r.foreignShare];
    return rates.some((v) => v != null && (v < 0 || v > 300));
  });
  if (wild.length) {
    issues.push({
      level: "warning",
      code: "OUTLIER_RATE",
      message: `율 값이 0% 미만이거나 300%를 넘는 본교 ${wild.length}교: ${names(wild.map((r) => r.schoolName))}. 표에는 그대로 두고 해석 시 분모 소표본을 확인하세요.`,
      schools: wild.map((r) => r.schoolName),
    });
  }

  const yearsUsed = storedYears.filter((y) => y <= analysisYear).sort((a, b) => a - b).slice(-5);
  const result: SfaComprehensivePreflight = {
    ok: issues.every((i) => i.level !== "error"),
    analysisYear,
    years: yearsUsed,
    schoolCount: schools.length,
    issues,
    summary: "",
  };
  result.summary = formatSfaPreflightSummary(result);
  return result;
}
