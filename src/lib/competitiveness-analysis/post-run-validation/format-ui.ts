import type {
  PostRunValidationReport,
  ValidationSeverity,
} from "@/lib/competitiveness-analysis/post-run-validation/types";

export type PostRunUiFailedItem = {
  checkId: string;
  severity: ValidationSeverity;
  message: string;
  schools: string[];
  details: string[];
};

/** UI 모달용 요약 (3단계 실행 직후) — 클라이언트·서버 공용, Node 의존 없음 */
export function formatPostRunReportForUi(report: PostRunValidationReport): {
  headline: string;
  statusLabel: string;
  statusTone: "ok" | "warn" | "error";
  sections: { title: string; lines: string[] }[];
  failedItems: PostRunUiFailedItem[];
  reviewPrompt: string;
} {
  const failed = report.findings.filter((f) => !f.passed);
  const errors = failed.filter((f) => f.severity === "error");
  const warnings = failed.filter((f) => f.severity === "warning");

  const statusTone: "ok" | "warn" | "error" =
    errors.length > 0 ? "error" : warnings.length > 0 ? "warn" : "ok";
  const statusLabel =
    statusTone === "ok"
      ? "검증 통과"
      : statusTone === "warn"
        ? "경고 있음 — 확인 후 진행"
        : "검증 실패 — 조치 필요";

  const headline = `${report.analysisYear}년 3단계 실행 후 검증 · ${statusLabel}`;

  const sections: { title: string; lines: string[] }[] = [
    {
      title: "요약",
      lines: [
        `대상 ${report.targetCount}교 · 검사 ${report.summary.totalChecks}항목 · 통과 ${report.summary.passed}`,
        `오류 ${report.summary.errors} · 경고 ${report.summary.warnings}`,
        `마지막 실행: ${report.editionLastRunAt ?? "—"}`,
      ],
    },
  ];

  const failedItems: PostRunUiFailedItem[] = failed.map((f) => {
    const isSchoolCheck =
      f.checkId === "DB-TARGET-MISSING-001" ||
      f.checkId === "DB-INCOME-PROPERTY-001" ||
      f.checkId === "DB-VALUE-SOURCE-001" ||
      f.checkId === "DB-VALUE-STEP-ALIGN-001" ||
      f.checkId === "DB-VALUE-STORED-001" ||
      f.checkId === "DB-ENROLLED-TOTAL-001" ||
      f.checkId === "SET-TARGET-KIND-001";
    const schools = f.affectedSchools?.length
      ? f.affectedSchools
      : isSchoolCheck
        ? (f.samples ?? [])
        : [];
    return {
      checkId: f.checkId,
      severity: f.severity,
      message: f.message,
      schools,
      details: schools.length ? [] : (f.samples ?? []),
    };
  });

  if (report.userActions.length) {
    sections.push({
      title: "사용자 작업",
      lines: report.userActions.map((a, i) => `${i + 1}. ${a}`),
    });
  }

  const passedSample = report.findings
    .filter((f) => f.passed && f.severity !== "info")
    .slice(0, 4)
    .map((f) => `✓ ${f.message}`);
  if (passedSample.length) {
    sections.push({ title: "정상 확인 (일부)", lines: passedSample });
  }

  const reviewPrompt = [
    `경쟁력분석 ${report.analysisYear}년 3단계 실행 후 Post-Run 검증 결과를 검토해 주세요.`,
    "",
    `상태: ${statusLabel}`,
    `오류 ${report.summary.errors} · 경고 ${report.summary.warnings}`,
    "",
    ...(failed.length
      ? [
          "【주의 항목】",
          ...failed.flatMap((f) => {
            const schools = f.affectedSchools?.length
              ? f.affectedSchools
              : (f.samples ?? []);
            return [
              `- [${f.checkId}] ${f.title}: ${f.message}`,
              ...schools.map((school) => `  · ${school}`),
            ];
          }),
          "",
        ]
      : []),
    ...(report.userActions.length
      ? ["【사용자 작업】", ...report.userActions.map((a) => `- ${a}`), ""]
      : []),
    "위 결과를 바탕으로 원인 분석, 데이터 보완 필요 여부, 코드 수정 필요 여부를 알려 주세요.",
  ].join("\n");

  return { headline, statusLabel, statusTone, sections, failedItems, reviewPrompt };
}
