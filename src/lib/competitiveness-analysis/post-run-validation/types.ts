/** 분석 실행 후 검증 — 공통 타입 */

export type ValidationSeverity = "error" | "warning" | "info";

/** system=자동 개선·코드, user=사용자 작업 필요, monitor=참고·추적 */
export type ValidationOwner = "system" | "user" | "monitor";

export type ValidationCheckId = string;

/** 알려진 이슈·검증 규칙 카탈로그 (새 이슈 발견 시 여기에 추가) */
export type KnownIssueRecord = {
  id: ValidationCheckId;
  title: string;
  category: "data" | "logic" | "system";
  severity: ValidationSeverity;
  owner: ValidationOwner;
  /** 최초 발견·등록 */
  discoveredAt: string;
  /** 재발 방지를 위한 설명 */
  description: string;
  /** 사용자 조치 안내 (owner=user 일 때) */
  userActionGuide?: string;
  /** 자동 조치 가능 여부 */
  autoFixable: boolean;
  /** 해결·완화 이력 */
  history?: { at: string; note: string }[];
};

export type ValidationFinding = {
  checkId: ValidationCheckId;
  title: string;
  passed: boolean;
  severity: ValidationSeverity;
  owner: ValidationOwner;
  message: string;
  detail?: string;
  affectedCount?: number;
  samples?: string[];
  /** 주의·오류에 해당하는 대학 표시명 (지역 포함) */
  affectedSchools?: string[];
  userAction?: string;
};

export type PostRunValidationReport = {
  analysisYear: number;
  validatedAt: string;
  editionLastRunAt: string | null;
  targetCount: number;
  summary: {
    totalChecks: number;
    passed: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  findings: ValidationFinding[];
  /** 사용자가 해야 할 작업 (중복 제거) */
  userActions: string[];
  /** 시스템·코드 측 개선 메모 */
  systemNotes: string[];
  /** 검증 실패 여부 (error 1건 이상) */
  ok: boolean;
};

export type PostRunValidationContext = {
  analysisYear: number;
  settings: import("@/lib/competitiveness-analysis/types").CompetitivenessSettings;
  indicators: import("@/lib/analysis/competitiveness-indicators").CompetitivenessIndicatorDef[];
  rawResults: import("@/lib/competitiveness-analysis/types").UniversityRawResult[];
  indexResults: import("@/lib/competitiveness-analysis/types").UniversityRunResult[];
  runResults: import("@/lib/competitiveness-analysis/types").UniversityRunResult[];
  indicatorSources: Awaited<
    import("@/lib/competitiveness-analysis/indicator-value-loader").IndicatorSourceData
  >;
  lastRunAt: string | null;
  storedStep1?: import("@/lib/competitiveness-analysis/types").UniversityRawResult[] | null;
  storedStep2?: import("@/lib/competitiveness-analysis/types").UniversityRunResult[] | null;
  storedStep3?: import("@/lib/competitiveness-analysis/types").UniversityRunResult[] | null;
  enrolledStudentCounts?: import("@/lib/analysis/enrolled-students-rep-count").EnrolledStudentCountMaps | null;
};
