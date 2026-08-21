import type { UniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-gemini-report-prompt";
import {
  UNIVERSITY_REPORT_OUTLINE,
  type UniversityReportSectionId,
} from "@/lib/competitiveness-analysis/university-report/generation-guidelines";

export type ReportSectionPageMap = Partial<
  Record<UniversityReportSectionId, number>
>;

function fmtEnrolled(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.trunc(value).toLocaleString("ko-KR")}명`;
}

function schoolKindLabel(schoolKind: string): string {
  if (schoolKind.includes("전문")) return `${schoolKind} (전문대)`;
  return `${schoolKind} (4년제)`;
}

function gradeBadgeClass(grade: string): string {
  const letter = grade.charAt(0).toUpperCase();
  if (/^[SABCDE]$/.test(letter)) return `grade-badge-${letter}`;
  return "grade-badge-none";
}

export function buildReportCoverHtml(args: {
  payload: UniversityReportPayload;
  generatedAt: string;
  sectionPages?: ReportSectionPageMap;
}): string {
  const { payload, generatedAt } = args;
  const zoneLabel = payload.zone ?? "권역 미분류";
  const gradeClass = gradeBadgeClass(payload.diagnosticGrade);
  const rankText =
    payload.compositeRank != null
      ? `${payload.compositeRank}위 / ${payload.cohortSize}개교`
      : "순위 제외";

  const tocItems = UNIVERSITY_REPORT_OUTLINE.filter((item) => item.id !== "cover")
    .map((item, index) => {
      const page = args.sectionPages?.[item.id];
      const pageHtml =
        page != null
          ? `<span class="cover-toc-leader" aria-hidden="true"></span><span class="cover-toc-page">${page}</span>`
          : "";
      return `<li><span class="cover-toc-entry"><span class="toc-num">${index + 1}.</span> ${item.title}</span>${pageHtml}</li>`;
    })
    .join("");

  return `<section class="report-cover" aria-label="표지">
  <div class="cover-accent-bar"></div>
  <p class="cover-eyebrow">K-UniTrust 대학경쟁력 진단 리포트 (${payload.analysisYear}년 에디션)</p>
  <h1 class="cover-main-title">대학별경쟁력<br />개별대학 종합분석 보고서</h1>
  <p class="cover-school-name">${escapeHtml(payload.schoolName)}</p>
  <div class="cover-meta-box">
    <table class="cover-meta-table">
      <tbody>
        <tr>
          <th>학교코드</th>
          <td>${escapeHtml(payload.schoolCodeStd)}</td>
          <th>설립구분</th>
          <td>${escapeHtml(payload.estb || "—")}</td>
        </tr>
        <tr>
          <th>학교종류</th>
          <td>${escapeHtml(schoolKindLabel(payload.schoolKind))}</td>
          <th>규모</th>
          <td>${escapeHtml(payload.scaleLabel ?? "—")} · ${fmtEnrolled(payload.enrolledTotal)}</td>
        </tr>
        <tr>
          <th>소재지</th>
          <td>${escapeHtml(payload.region)}</td>
          <th>권역</th>
          <td>${escapeHtml(zoneLabel)}</td>
        </tr>
        <tr>
          <th>종합지수</th>
          <td class="cover-highlight">${payload.compositeIndex?.toFixed(1) ?? "—"}점</td>
          <th>전국 순위</th>
          <td>${escapeHtml(rankText)}</td>
        </tr>
        <tr>
          <th>진단등급</th>
          <td colspan="3"><span class="${gradeClass}">${escapeHtml(payload.diagnosticGrade)}</span></td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="cover-run-at">분석실행일시: ${escapeHtml(payload.lastRunAt ?? "—")}</p>
  <p class="cover-generated-at">보고서 생성일시: ${escapeHtml(generatedAt)}</p>

  <div class="cover-toc">
    <h2 class="cover-toc-title">보고서 목차</h2>
    <ol class="cover-toc-list">${tocItems}</ol>
  </div>
</section>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Gemini가 생성한 표지·목차 블록 제거 (시스템 표지로 대체) */
export function stripGeminiCoverSection(bodyHtml: string): string {
  let html = bodyHtml.trim();

  // Gemini 원본 표지만 제거 — finalize 재적용 시 본문 page-break까지 삭제하지 않음
  if (/^\s*(?:<div class="page">\s*)?<div class="cover-container">/i.test(html)) {
    html = html.replace(
      /^[\s\S]*?<div class="page-break">\s*<\/div>\s*/i,
      "",
    );
    html = html.replace(
      /^<div class="page">\s*<div class="cover-container">[\s\S]*?<\/div>\s*<\/div>\s*/i,
      "",
    );
  }

  // 이전 finalize의 단일 article 래퍼만 제거 (본문 내 article 태그는 유지)
  html = html.replace(
    /^<article[^>]*class="[^"]*report-page-body[^"]*"[^>]*>\s*/i,
    "",
  );
  html = html.replace(/\s*<\/article>\s*$/i, "");

  html = html.replace(/<p class="report-meta">[\s\S]*?<\/p>\s*/i, "");

  return html.trim();
}
