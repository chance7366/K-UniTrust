import {
  buildStudentFillActions,
  buildStudentFillDiagnosis,
  type StudentFillAction,
  type StudentFillFinding,
} from "./build-deep-report";
import { STUDENT_FILL_REPORT_GUIDELINES_VERSION } from "./generation-guidelines";

export {
  buildStudentFillActions,
  buildStudentFillDiagnosis,
  counterfactualRateAll,
} from "./build-deep-report";
export type { StudentFillAction, StudentFillFinding } from "./build-deep-report";

export type StudentFillUniversityReport = {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
  generatedAt: string;
  guidelinesVersion?: string;
  diagnosis: StudentFillFinding[];
  actions: StudentFillAction[];
  html: string;
};

export function buildStudentFillReportHtml(input: {
  schoolName: string;
  analysisYear: number;
  generatedAt: string;
  diagnosis: StudentFillFinding[];
  actions: StudentFillAction[];
}): string {
  const findings = input.diagnosis
    .map(
      (item) =>
        `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`,
    )
    .join("");
  const actions = input.actions
    .map((item, i) => {
      const meta = [
        item.owner ? `<div><strong>주관</strong>${escapeHtml(item.owner)}</div>` : "",
        item.budget ? `<div><strong>예산</strong>${escapeHtml(item.budget)}</div>` : "",
        item.kpi ? `<div><strong>성과지표</strong>${escapeHtml(item.kpi)}</div>` : "",
        item.effect ? `<div><strong>기대효과</strong>${escapeHtml(item.effect)}</div>` : "",
      ].join("");
      const steps = item.steps?.length
        ? `<ol>${item.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`
        : "";
      return `<article class="card"><p class="kicker">과제 ${i + 1}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>${steps}<div class="meta-grid">${meta}</div></article>`;
    })
    .join("");
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.schoolName)} 학생충원 심층진단 보고서 (${input.analysisYear})</title>
  <style>
    body { font-family: "Malgun Gothic", sans-serif; line-height: 1.6; color: #111; max-width: 800px; margin: 32px auto; padding: 0 16px; }
    h1 { font-size: 20px; line-height: 1.35; }
    h2 { font-size: 16px; margin-top: 28px; color: #0f6363; }
    h3 { font-size: 14px; margin: 0 0 8px; }
    .meta { color: #555; font-size: 13px; }
    .card { border: 1px solid #d6d3d1; border-radius: 10px; padding: 12px 14px; margin: 10px 0; }
    .kicker { font-size: 11px; color: #78716c; margin: 0 0 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-size: 12px; }
    .meta-grid div { background: #f5f5f4; border-radius: 8px; padding: 8px; }
    .meta-grid strong { display: block; color: #57534e; font-size: 11px; }
    ol { padding-left: 1.2rem; margin: 8px 0; }
  </style>
</head>
<body>
  <p class="meta">학생충원분석 · 개별대학 심층진단 · 지침 v${escapeHtml(STUDENT_FILL_REPORT_GUIDELINES_VERSION)}</p>
  <h1>${escapeHtml(input.schoolName)} 학생충원 심층진단 보고서 (${input.analysisYear})</h1>
  <p class="meta">생성 시각 ${escapeHtml(input.generatedAt)} · 정원외 ≠ 외국인 · 학위과정 소계(A) 기본 · 탈락은 분석연도−1</p>
  <h2>제1·2부 심층분석·핵심진단</h2>
  ${findings}
  <h2>제3부 대응과제</h2>
  ${actions}
  <h2>제4부 우선순위</h2>
  <p>1학년 누수 차단 → 모집 분모 효과 분리·정원 재배분 → 휴학 복귀 → 정원외 캡 → 유학생 언어. 모집 추가 축소와 유학 규모 확대, 기숙사 신축은 과제로 두지 않습니다.</p>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
