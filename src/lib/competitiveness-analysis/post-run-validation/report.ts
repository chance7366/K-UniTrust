import fs from "node:fs/promises";
import path from "node:path";

import type {
  PostRunValidationReport,
  ValidationFinding,
} from "@/lib/competitiveness-analysis/post-run-validation/types";

export function buildPostRunReport(
  analysisYear: number,
  lastRunAt: string | null,
  targetCount: number,
  findings: ValidationFinding[],
): PostRunValidationReport {
  const failed = findings.filter((f) => !f.passed);
  const errors = failed.filter((f) => f.severity === "error").length;
  const warnings = failed.filter((f) => f.severity === "warning").length;
  const infos = findings.filter((f) => f.passed && f.severity === "info").length;

  const userActions = [
    ...new Set(
      failed
        .filter((f) => f.owner === "user" && f.userAction)
        .map((f) => f.userAction!),
    ),
  ];

  const systemNotes = failed
    .filter((f) => f.owner === "system")
    .map((f) => `[${f.checkId}] ${f.message}`);

  return {
    analysisYear,
    validatedAt: new Date().toISOString(),
    editionLastRunAt: lastRunAt,
    targetCount,
    summary: {
      totalChecks: findings.length,
      passed: findings.filter((f) => f.passed).length,
      errors,
      warnings,
      infos,
    },
    findings,
    userActions,
    systemNotes,
    ok: errors === 0,
  };
}

export function formatPostRunReportText(report: PostRunValidationReport): string {
  const lines: string[] = [];
  lines.push("=".repeat(72));
  lines.push(`경쟁력분석 실행 후 검증 — ${report.analysisYear}년`);
  lines.push(`검증 시각: ${report.validatedAt}`);
  lines.push(`마지막 분석 실행: ${report.editionLastRunAt ?? "—"}`);
  lines.push(`대상대학: ${report.targetCount}교`);
  lines.push(
    `결과: ${report.ok ? "✓ PASS" : "✗ FAIL"} — 통과 ${report.summary.passed}/${report.summary.totalChecks}, error ${report.summary.errors}, warning ${report.summary.warnings}`,
  );
  lines.push("");

  lines.push("── 검증 항목 ──");
  for (const f of report.findings) {
    const icon = f.passed ? "✓" : f.severity === "error" ? "✗" : "⚠";
    lines.push(`${icon} [${f.checkId}] ${f.title}`);
    lines.push(`   ${f.message}`);
    if (f.affectedSchools?.length) {
      lines.push(`   해당 대학 (${f.affectedSchools.length}교):`);
      for (const school of f.affectedSchools) {
        lines.push(`     · ${school}`);
      }
    } else if (f.samples?.length) {
      lines.push(`   상세: ${f.samples.join(" · ")}`);
    }
    if (!f.passed && f.userAction) {
      lines.push(`   → 사용자 조치: ${f.userAction}`);
    }
  }

  if (report.userActions.length) {
    lines.push("");
    lines.push("── 사용자 작업 필요 ──");
    report.userActions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  }

  if (report.systemNotes.length) {
    lines.push("");
    lines.push("── 시스템·코드 개선 메모 ──");
    report.systemNotes.forEach((n) => lines.push(`· ${n}`));
  }

  lines.push("");
  lines.push(
    "새 이슈 발견 시: src/lib/competitiveness-analysis/post-run-validation/issue-registry.ts 에 등록",
  );
  lines.push("=".repeat(72));
  return lines.join("\n");
}

const REPORT_DIR = path.join(process.cwd(), "data/validation/competitiveness");

export async function savePostRunReport(
  report: PostRunValidationReport,
): Promise<{ jsonPath: string; textPath: string }> {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const stamp = report.validatedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(
    REPORT_DIR,
    `post-run-${report.analysisYear}-${stamp}.json`,
  );
  const textPath = path.join(
    REPORT_DIR,
    `post-run-${report.analysisYear}-${stamp}.txt`,
  );
  const latestJson = path.join(REPORT_DIR, `latest-${report.analysisYear}.json`);
  const latestText = path.join(REPORT_DIR, `latest-${report.analysisYear}.txt`);

  const text = formatPostRunReportText(report);
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(textPath, text, "utf8");
  await fs.writeFile(latestJson, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(latestText, text, "utf8");

  return { jsonPath, textPath };
}

export async function appendRunLog(report: PostRunValidationReport): Promise<void> {
  const logPath = path.join(REPORT_DIR, "run-log.jsonl");
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const entry = {
    at: report.validatedAt,
    analysisYear: report.analysisYear,
    ok: report.ok,
    errors: report.summary.errors,
    warnings: report.summary.warnings,
    failedCheckIds: report.findings.filter((f) => !f.passed).map((f) => f.checkId),
  };
  await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
}
