import { reportA4Styles } from "@/lib/competitiveness-analysis/university-report/report-a4-styles";

import type { StudentFillCohortSnapshot } from "./aggregate-cohort";
import {
  comprehensiveFilterLabel,
  type SfaComprehensiveFilter,
} from "./comprehensive-filter";
import { SFA_COMPREHENSIVE_GUIDELINES_VERSION } from "./comprehensive-guidelines";
import { STUDENT_FILL_REPORT_RESULT_METRICS } from "./generation-guidelines";
import { renderSfaLineChart } from "./sfa-report-charts";

export type ComprehensiveFinding = {
  title: string;
  body: string;
  tone: "warn" | "ok" | "info";
};

export type ComprehensiveAction = {
  title: string;
  body: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.trunc(n).toLocaleString("ko-KR");
}

function trendWord(latest: number | null, oldest: number | null): string {
  if (latest == null || oldest == null) return "시계열 부족";
  const gap = latest - oldest;
  if (gap >= 0.5) return "증가";
  if (gap <= -0.5) return "감소";
  return "유지";
}

function pick(
  snap: StudentFillCohortSnapshot,
  key: keyof StudentFillCohortSnapshot,
): number | null {
  const value = snap[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildComprehensiveDiagnosis(
  current: StudentFillCohortSnapshot,
  trend: StudentFillCohortSnapshot[],
): ComprehensiveFinding[] {
  const first = trend[0] ?? current;
  const findings: ComprehensiveFinding[] = [
    {
      title: "신입생충원 추세",
      body: `정원내충원율은 ${fmtPct(first.rateIn)}에서 ${fmtPct(current.rateIn)}로 ${trendWord(current.rateIn, first.rateIn)}했습니다. 정원내외충원율은 ${fmtPct(current.rateAll)}, 정원외비중은 ${fmtPct(current.outShare)}(${trendWord(current.outShare, first.outShare)})입니다.`,
      tone:
        current.rateIn != null && current.rateIn < 90
          ? "warn"
          : current.outShare != null &&
              first.outShare != null &&
              current.outShare > first.outShare + 0.5
            ? "warn"
            : "info",
    },
    {
      title: "신입생탈락과 중도탈락",
      body: `신입생탈락율 ${fmtPct(current.freshmanDropoutRate)}, 중도탈락율 ${fmtPct(current.dropoutRate)}입니다.${
        current.freshmanDropoutRate != null &&
        current.dropoutRate != null &&
        current.freshmanDropoutRate > current.dropoutRate
          ? " 신입생탈락율이 더 높아 입학 직후 이탈이 큽니다."
          : " 신입생탈락율이 중도탈락율보다 높지는 않습니다."
      }`,
      tone:
        current.freshmanDropoutRate != null &&
        current.dropoutRate != null &&
        current.freshmanDropoutRate > current.dropoutRate
          ? "warn"
          : "ok",
    },
    {
      title: "재학생충원",
      body: `재학생충원율 ${fmtPct(current.enrolledFillRate)}, 정원내 재학생충원율 ${fmtPct(current.enrolledFillRateIn)}, 정원외비중 ${fmtPct(current.enrolledOutShare)}입니다. 휴학비중 ${fmtPct(current.leaveShare)}, 유예비중 ${fmtPct(current.deferShare)}입니다.`,
      tone:
        current.enrolledFillRate != null && current.enrolledFillRate < 90
          ? "warn"
          : "info",
    },
    {
      title: "외국인",
      body: `재적대비 외국인 비중은 ${fmtPct(first.foreignShare)}에서 ${fmtPct(current.foreignShare)}로 ${trendWord(current.foreignShare, first.foreignShare)}했습니다. 언어능력충족율 ${fmtPct(current.langAbilityRate)}, 외국인탈락율 ${fmtPct(current.foreignDropRate)}, 전체외국인탈락율 ${fmtPct(current.foreignDropAllRate)}입니다.`,
      tone:
        current.langAbilityRate != null && current.langAbilityRate < 50
          ? "warn"
          : "info",
    },
  ];
  return findings;
}

export function buildComprehensiveActions(
  current: StudentFillCohortSnapshot,
): ComprehensiveAction[] {
  const actions: ComprehensiveAction[] = [];
  if (
    current.freshmanDropoutRate != null &&
    current.dropoutRate != null &&
    current.freshmanDropoutRate > current.dropoutRate
  ) {
    actions.push({
      title: "입학 직후 출석 챙기기",
      body: "1학년 첫 학기 결석이 쌓이는 학과부터 지도교수가 연락합니다. 모집을 줄여 충원율을 올려 보이게 하지 않습니다.",
    });
  }
  if (current.rateIn != null && current.rateIn < 94) {
    actions.push({
      title: "정원내 미충원 학과 정원 조정",
      body: "충원이 되는 학과로 정원을 옮깁니다. 정원외를 늘려 숫자를 맞추지 않습니다.",
    });
  }
  if (current.langAbilityRate != null && current.langAbilityRate < 50) {
    actions.push({
      title: "유학생 한국어 수업 보강",
      body: "전공 수업 전에 한국어 수업을 듣게 합니다. 언어충족율이 낮은 상태에서 유학생을 더 뽑지 않습니다.",
    });
  }
  if (current.leaveShare != null && current.leaveShare >= 10) {
    actions.push({
      title: "장기 휴학 학생 복학 안내",
      body: "1년 넘게 휴학 중인 학생에게 학과가 연락하고, 복학하는 학기는 등록금을 나눠 내게 합니다.",
    });
  }
  if (actions.length === 0) {
    actions.push({
      title: "현재 지표 유지",
      body: "선택한 집단에서 당장 손볼 약한 지표가 뚜렷하지 않습니다. 정원내 충원과 입학 직후 이탈만 매 학기 확인합니다.",
    });
  }
  return actions;
}

type MetricDef = { key: string; label: string };

function metricValue(
  snap: StudentFillCohortSnapshot,
  key: string,
): number | null {
  return pick(snap, key as keyof StudentFillCohortSnapshot);
}

function extraStyles(): string {
  return `
    .sfa-page-head { display:flex; justify-content:space-between; font-size:7.5pt; color:#94a3b8; border-bottom:1px solid #e2e8f0; padding-bottom:1.5mm; margin-bottom:4mm; }
    .sfa-finding { border:1px solid #e2e8f0; border-radius:6px; padding:2.5mm 3mm; margin:2mm 0; background:#f8fafc; }
    .sfa-finding-warn { border-left:3px solid #dc2626; }
    .sfa-finding-ok { border-left:3px solid #059669; }
    .sfa-finding-info { border-left:3px solid #0284c7; }
    .sfa-finding h3 { font-size:10.5pt; margin:0 0 1mm; color:#0f172a; }
    .sfa-finding p { margin:0; font-size:9pt; }
    .sfa-note { font-size:8.5pt; color:#64748b; }
    .sfa-chart-grid { display:grid; grid-template-columns:1fr 1fr; gap:3mm; margin:2mm 0 0; }
    .sfa-meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:2mm; margin-top:2.5mm; }
    .sfa-meta-grid div { background:#fff; border:1px solid #e2e8f0; border-radius:5px; padding:2mm 2.5mm; font-size:8.5pt; }
    .sfa-meta-grid strong { display:block; color:#64748b; font-size:7.5pt; margin-bottom:0.5mm; }
    .sfa-action { margin: 2.5mm 0; }
    .sfa-action h3 { font-size:10.5pt; margin:0 0 1mm; }
    .sfa-action p { margin:0; font-size:9pt; }
  `;
}

function pageOpen(scope: string, year: number, page: number): string {
  return `<article class="report-page" data-sfa-page="${page}">
<div class="sfa-page-head"><span>${esc(scope)}</span><span>${year}년 학생충원 종합보고서</span></div>
<div class="report-page-body">`;
}

function pageClose(scope: string, page: number, total: number): string {
  return `</div>
<footer class="report-page-footer">${esc(scope)} · <span class="report-page-num">${page} / ${total}</span></footer>
</article>`;
}

function resultTable(
  title: string,
  metrics: readonly MetricDef[],
  trend: StudentFillCohortSnapshot[],
): string {
  const years = trend.map((row) => row.year);
  const head = ["지표", ...years.map((y) => `${y}년`)]
    .map((h) => `<th>${esc(h)}</th>`)
    .join("");
  const body = metrics
    .map((metric) => {
      const cells = trend
        .map((snap) => `<td>${fmtPct(metricValue(snap, metric.key))}</td>`)
        .join("");
      return `<tr><th>${esc(metric.label)}</th>${cells}</tr>`;
    })
    .join("");
  return `<h2 class="subsection-title">${esc(title)}</h2>
<p class="sfa-note">선택한 분석조건 집단의 가중 집계입니다. 대학 수 ${fmtInt(trend[trend.length - 1]?.schoolCount)}교.</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function resultCharts(
  title: string,
  metrics: readonly MetricDef[],
  trend: StudentFillCohortSnapshot[],
): string {
  const cats = trend.map((row) => String(row.year));
  const charts = metrics
    .map((metric) =>
      renderSfaLineChart({
        title: metric.label,
        categories: cats,
        series: [
          {
            id: metric.key,
            label: metric.label,
            color: "#2a7a55",
            values: trend.map((snap) => metricValue(snap, metric.key)),
          },
        ],
        width: 340,
        height: 168,
        hideLegend: true,
      }),
    )
    .join("");
  return `<h2 class="subsection-title">${esc(title)} 시계열</h2>
<div class="sfa-chart-grid">${charts}</div>`;
}

export function buildStudentFillComprehensiveHtml(input: {
  filter: SfaComprehensiveFilter;
  generatedAt: string;
  current: StudentFillCohortSnapshot;
  trend: StudentFillCohortSnapshot[];
  diagnosis: ComprehensiveFinding[];
  actions: ComprehensiveAction[];
}): string {
  const scope = comprehensiveFilterLabel(input.filter);
  const year = input.filter.analysisYear;
  const total = 7;
  let page = 0;
  const next = () => {
    page += 1;
    return pageOpen(scope, year, page);
  };

  const cover = `${next()}
<div class="cover-accent-bar"></div>
<p class="cover-eyebrow">학생충원분석 · 종합보고서</p>
<h1 class="cover-main-title">${year}년 학생충원 종합보고서</h1>
<p class="cover-school-name">${esc(scope)}</p>
<div class="sfa-meta-grid">
  <div><strong>분석연도</strong>${year}년</div>
  <div><strong>대상 대학</strong>${fmtInt(input.current.schoolCount)}교</div>
  <div><strong>생성일시</strong>${esc(input.generatedAt)}</div>
  <div><strong>지침</strong>v${SFA_COMPREHENSIVE_GUIDELINES_VERSION}</div>
</div>
<p class="sfa-note" style="margin-top:4mm">본 보고서는 분석조건 필터로 고른 대학만 집계합니다. 필터가 바뀌면 다른 저장본이 됩니다. 탈락 지표는 공시 시차상 ${year - 1}년 자료입니다.</p>
${pageClose(scope, page, total)}`;

  const freshmanTable = `${next()}
<h1 class="section-title">제1장 신입생충원</h1>
${resultTable("신입생충원 지표", STUDENT_FILL_REPORT_RESULT_METRICS.freshman, input.trend)}
${pageClose(scope, page, total)}`;

  const freshmanChart = `${next()}
${resultCharts("신입생충원", STUDENT_FILL_REPORT_RESULT_METRICS.freshman, input.trend)}
${pageClose(scope, page, total)}`;

  const enrolledTable = `${next()}
<h1 class="section-title">제2장 재학생충원</h1>
${resultTable("재학생충원 지표", STUDENT_FILL_REPORT_RESULT_METRICS.enrolled, input.trend)}
${pageClose(scope, page, total)}`;

  const enrolledChart = `${next()}
${resultCharts("재학생충원", STUDENT_FILL_REPORT_RESULT_METRICS.enrolled, input.trend)}
${pageClose(scope, page, total)}`;

  const foreign = `${next()}
<h1 class="section-title">제3장 외국인</h1>
${resultTable("외국인 지표", STUDENT_FILL_REPORT_RESULT_METRICS.foreign, input.trend)}
${resultCharts("외국인", STUDENT_FILL_REPORT_RESULT_METRICS.foreign, input.trend)}
${pageClose(scope, page, total)}`;

  const diagnosis = `${next()}
<h1 class="section-title">제4장 진단 · 제5장 대응방향</h1>
${input.diagnosis
  .map(
    (item) =>
      `<div class="sfa-finding sfa-finding-${item.tone}"><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></div>`,
  )
  .join("")}
<h2 class="subsection-title">대응방향</h2>
${input.actions
  .map(
    (item, i) =>
      `<div class="sfa-action"><h3>${i + 1}. ${esc(item.title)}</h3><p>${esc(item.body)}</p></div>`,
  )
  .join("")}
${pageClose(scope, page, total)}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(`${year}년 학생충원 종합보고서 · ${scope}`)}</title>
  <style>${reportA4Styles()}\n${extraStyles()}</style>
</head>
<body>
  <div class="report-shell">
    ${cover}${freshmanTable}${freshmanChart}${enrolledTable}${enrolledChart}${foreign}${diagnosis}
  </div>
</body>
</html>`;
}