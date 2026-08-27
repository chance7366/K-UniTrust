import { sfaFillStage } from "./fill-stage";
import type { StudentFillSchoolRow } from "./types";

export type StudentFillFinding = {
  title: string;
  body: string;
  tone: "warn" | "ok" | "info";
};

export type StudentFillAction = {
  title: string;
  body: string;
};

function fmtCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.trunc(n).toLocaleString("ko-KR")}명`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export function buildStudentFillDiagnosis(row: StudentFillSchoolRow): StudentFillFinding[] {
  const items: StudentFillFinding[] = [];
  if (row.rateAll != null) {
    const stage = sfaFillStage(row.rateAll);
    items.push({
      title: `신입생충원 ${stage.label}`,
      body: `정원내외 충원율 ${fmtPct(row.rateAll)}, 정원내 ${fmtPct(row.rateIn)}, 정원외 입학 비중 ${fmtPct(row.outShare)}. 정원외를 외국인으로 보지 않습니다.`,
      tone:
        stage.tone === "ok"
          ? "ok"
          : stage.tone === "crisis" || stage.tone === "warn"
            ? "warn"
            : "info",
    });
  } else {
    items.push({
      title: "신입생충원 자료",
      body: "정원내외 충원율을 계산할 신입생충원 자료가 없습니다.",
      tone: "info",
    });
  }

  if (row.recruitChange != null) {
    items.push({
      title: row.recruitChange <= -8 ? "모집 축소로 충원율 방어" : "모집 규모는 완만",
      body: `전년 대비 모집인원 ${fmtPct(row.recruitChange)}. 축소가 크면 충원율만으로 수요를 판단하기 어렵습니다.`,
      tone: row.recruitChange <= -8 ? "warn" : "ok",
    });
  }

  const leaveHigh =
    row.leaveShare != null ? row.leaveShare >= 6 : false;
  items.push({
    title: "재적 구성",
    body: `재학생(충원) ${fmtCount(row.enrolledFill)} · 휴학 ${fmtCount(row.leaveCount)}(${fmtPct(row.leaveShare)}) · 유예 ${fmtCount(row.deferCount)}(${fmtPct(row.deferShare)}). 정원외 재학생 ${fmtCount(row.enrolledOutside)}(${fmtPct(row.enrolledOutShare)}).`,
    tone: leaveHigh ? "warn" : "info",
  });

  const freshmanHigh =
    row.freshmanDropoutRate != null ? row.freshmanDropoutRate >= 8 : false;
  items.push({
    title: "탈락",
    body: `전체 중도탈락율 ${fmtPct(row.dropoutRate)} (Y−1), 신입생 중도탈락율 ${fmtPct(row.freshmanDropoutRate)}.`,
    tone: freshmanHigh ? "warn" : "info",
  });

  const foreignWarn =
    (row.foreignDropRate != null && row.foreignDropRate >= 12) ||
    (row.foreignShare != null && row.foreignShare >= 20);
  items.push({
    title: "외국인 대체·이탈",
    body: `학위(A) ${fmtCount(row.foreignDegree)} · 재적대비 ${fmtPct(row.foreignShare)} · 연수(C) ${fmtCount(row.foreignTraining)} · 언어능력충족 ${fmtPct(row.langAbilityRate)}. 학위 탈락율 ${fmtPct(row.foreignDropRate)}, 비학위 포함 ${fmtPct(row.foreignDropAllRate)}.`,
    tone: foreignWarn ? "warn" : row.foreignDegree == null ? "info" : "ok",
  });

  return items;
}

export function buildStudentFillActions(row: StudentFillSchoolRow): StudentFillAction[] {
  const actions: StudentFillAction[] = [];
  if (row.rateAll != null && row.rateAll < 98) {
    actions.push({
      title: "정원내 충원 경로 점검",
      body: "수시·정시 등록률과 학과별 미충원을 분리해 정원 조정 여부를 결정합니다.",
    });
  }
  if (row.recruitChange != null && row.recruitChange <= -8) {
    actions.push({
      title: "모집 축소의 재정 효과 명시",
      body: "충원율 개선이 모집 축소 효과인지 실제 수요 회복인지 구분하고, 등록금 수입 영향을 재정추계와 맞춥니다.",
    });
  }
  if (
    (row.enrolledOutShare != null && row.enrolledOutShare >= 18) ||
    (row.outShare != null && row.outShare >= 20)
  ) {
    actions.push({
      title: "정원외 의존 관리",
      body: "정원외 입학·재학생 비중을 학과별로 공개하고, 외국인 학위과정과 섞어 해석하지 않습니다.",
    });
  }
  if (row.freshmanDropoutRate != null && row.freshmanDropoutRate >= 7) {
    actions.push({
      title: "1학년 적응·이탈 프로그램",
      body: "신입생 중도탈락율이 전체 탈락율보다 높으면 첫 학기 학습지원·상담 대상을 확대합니다.",
    });
  }
  if (row.foreignShare != null && row.foreignShare >= 8) {
    actions.push({
      title: "학위 외국인 유지",
      body: `언어능력충족 ${fmtPct(row.langAbilityRate)} · 학위 탈락 ${fmtPct(row.foreignDropRate)}. 연수(C) 규모와 학위 전환 경로를 분리해 관리합니다.`,
    });
  }
  if (!actions.length) {
    actions.push({
      title: "현 수준 유지·모니터링",
      body: "충원·탈락·외국인 지표가 안정적이거나 자료가 제한적입니다. 연 1회 권역·규모 동일집단과 비교합니다.",
    });
  }
  return actions;
}

export type StudentFillUniversityReport = {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
  generatedAt: string;
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
        `<li><strong>${escapeHtml(item.title)}.</strong> ${escapeHtml(item.body)}</li>`,
    )
    .join("");
  const actions = input.actions
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.title)}.</strong> ${escapeHtml(item.body)}</li>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.schoolName)} 학생충원 진단 보고서 (${input.analysisYear})</title>
  <style>
    body { font-family: "Malgun Gothic", sans-serif; line-height: 1.55; color: #111; max-width: 720px; margin: 32px auto; padding: 0 16px; }
    h1 { font-size: 20px; }
    h2 { font-size: 16px; margin-top: 24px; }
    .meta { color: #555; font-size: 13px; }
    ol, ul { padding-left: 1.25rem; }
    li { margin: 0.4rem 0; }
  </style>
</head>
<body>
  <p class="meta">학생충원분석 · 대학별 진단</p>
  <h1>${escapeHtml(input.schoolName)} 학생충원 진단 보고서 (${input.analysisYear})</h1>
  <p class="meta">생성 시각 ${escapeHtml(input.generatedAt)} · 정원외 ≠ 외국인 · 학위과정 소계(A) 기본 · 탈락은 분석연도−1</p>
  <h2>진단</h2>
  <ol>${findings}</ol>
  <h2>대응과제</h2>
  <ul>${actions}</ul>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
