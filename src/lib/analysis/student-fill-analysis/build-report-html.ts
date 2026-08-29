import { reportA4Styles } from "@/lib/competitiveness-analysis/university-report/report-a4-styles";
import { sfaFillStage } from "./fill-stage";
import type { StudentFillAction, StudentFillFinding } from "./build-deep-report";
import {
  STUDENT_FILL_REPORT_GUIDELINES_VERSION,
  STUDENT_FILL_REPORT_OUTLINE,
  STUDENT_FILL_REPORT_PRIORITY,
  STUDENT_FILL_REPORT_RESULT_METRICS,
} from "./generation-guidelines";
import { renderSfaLineChart } from "./sfa-report-charts";
import type {
  StudentFillPeerMetricKey,
  StudentFillPeerPayload,
  StudentFillPeerRates,
} from "./peer-aggregates";
import type { StudentFillSchoolRow } from "./types";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.trunc(n).toLocaleString("ko-KR")}명`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function extraStyles(): string {
  return `
    .sfa-page-head {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1.5mm;
      margin-bottom: 4mm;
    }
    .sfa-finding {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 2.5mm 3mm;
      margin: 2mm 0;
      background: #f8fafc;
    }
    .sfa-finding-warn { border-left: 3px solid #dc2626; }
    .sfa-finding-ok { border-left: 3px solid #059669; }
    .sfa-finding-info { border-left: 3px solid #0284c7; }
    .sfa-finding h3 { font-size: 10.5pt; margin: 0 0 1mm; color: #0f172a; }
    .sfa-finding p { margin: 0; font-size: 9pt; }
    .sfa-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2mm;
      margin-top: 2.5mm;
    }
    .sfa-meta-grid div {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 2mm 2.5mm;
      font-size: 8.5pt;
    }
    .sfa-meta-grid strong {
      display: block;
      color: #64748b;
      font-size: 7.5pt;
      margin-bottom: 0.5mm;
    }
    .sfa-action { margin-bottom: 3mm; }
    .sfa-action ol { margin: 2mm 0 0; padding-left: 5mm; font-size: 9pt; }
    .sfa-note { font-size: 8.5pt; color: #64748b; }
    .sfa-chart-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
      margin: 2mm 0 0;
    }
    .sfa-chart-wide { grid-column: 1 / -1; }
    .sfa-chart-wide .report-chart,
    .sfa-chart-grid .report-chart { margin: 0; }
    .sfa-chart-grid .report-chart-title { font-size: 8.5pt; }
  `;
}

function wrapSfaReportHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>${reportA4Styles()}\n${extraStyles()}</style>
</head>
<body>
  <div class="report-shell">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function pageOpen(schoolName: string, analysisYear: number, page: number): string {
  return `<article class="report-page" data-sfa-page="${page}">
<div class="sfa-page-head"><span>${esc(schoolName)}</span><span>${analysisYear}년 학생충원분석</span></div>
<div class="report-page-body">`;
}

function pageClose(schoolName: string, page: number, total: number): string {
  return `</div>
<footer class="report-page-footer">${esc(schoolName)} 학생충원 심층진단 보고서 · <span class="report-page-num">${page} / ${total}</span></footer>
</article>`;
}

function rateOf(
  rates: StudentFillPeerRates | null | undefined,
  key: StudentFillPeerMetricKey,
): number | null {
  if (!rates) return null;
  const value = rates[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function yearTable(
  peer: StudentFillPeerPayload | null | undefined,
  metrics: readonly { key: string; label: string }[],
): string {
  const years = peer?.trend.map((row) => row.year) ?? [];
  if (!years.length) return "<p class=\"sfa-note\">5개년 자료가 없습니다.</p>";
  const head = ["지표", ...years.map((year) => `${year}년`)]
    .map((cell) => `<th>${esc(cell)}</th>`)
    .join("");
  const body = metrics
    .map((metric) => {
      const cells = years
        .map((year) => {
          const row = peer?.trend.find((item) => item.year === year);
          return `<td>${fmtPct(rateOf(row?.school, metric.key as StudentFillPeerMetricKey))}</td>`;
        })
        .join("");
      return `<tr><th>${esc(metric.label)}</th>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function compareTable(
  peer: StudentFillPeerPayload | null | undefined,
  metrics: readonly { key: string; label: string }[],
): string {
  const latest = peer?.trend[peer.trend.length - 1];
  const groups = [
    { label: "본교", rates: latest?.school ?? null },
    { label: peer?.slices.zone?.label ?? "권역", rates: latest?.zone ?? peer?.slices.zone ?? null },
    { label: peer?.slices.scale?.label ?? "규모", rates: latest?.scale ?? peer?.slices.scale ?? null },
    { label: peer?.slices.estb?.label ?? "설립", rates: latest?.estb ?? peer?.slices.estb ?? null },
    { label: peer?.slices.sido?.label ?? "시도", rates: latest?.sido ?? peer?.slices.sido ?? null },
    { label: "전국", rates: latest?.nationwide ?? peer?.slices.nationwide ?? null },
  ];
  const head = ["지표", ...groups.map((g) => g.label)]
    .map((cell) => `<th>${esc(cell)}</th>`)
    .join("");
  const body = metrics
    .map((metric) => {
      const cells = groups
        .map(
          (group) =>
            `<td>${fmtPct(rateOf(group.rates, metric.key as StudentFillPeerMetricKey))}</td>`,
        )
        .join("");
      return `<tr><th>${esc(metric.label)}</th>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function resultTablePage(args: {
  schoolName: string;
  analysisYear: number;
  page: number;
  total: number;
  title: string;
  lead: string;
  metrics: readonly { key: string; label: string }[];
  peer?: StudentFillPeerPayload | null;
}): string {
  return `${pageOpen(args.schoolName, args.analysisYear, args.page)}
<h1 class="section-title">${esc(args.title)}</h1>
<p class="sfa-note">${esc(args.lead)}</p>
<h2 class="subsection-title">본교 5개년</h2>
${yearTable(args.peer, args.metrics)}
<h2 class="subsection-title">당해 연도 집단 평균</h2>
${compareTable(args.peer, args.metrics)}
${pageClose(args.schoolName, args.page, args.total)}`;
}

function resultChartPage(args: {
  schoolName: string;
  analysisYear: number;
  page: number;
  total: number;
  title: string;
  metrics: readonly { key: string; label: string }[];
  peer?: StudentFillPeerPayload | null;
}): string {
  const trend = args.peer?.trend ?? [];
  const years = trend.map((row) => String(row.year));
  const zoneLabel = args.peer?.slices.zone?.label ?? "권역";
  const scaleLabel = args.peer?.slices.scale?.label ?? "규모";
  const compact = args.metrics.length > 4;
  const height = compact ? 210 : 340;
  const charts = args.metrics
    .map((metric) => {
      const key = metric.key as StudentFillPeerMetricKey;
      return `<div>${renderSfaLineChart({
        title: `시계열 · ${metric.label}`,
        categories: years,
        series: [
          {
            id: "school",
            label: args.schoolName,
            color: "#059669",
            values: trend.map((row) => rateOf(row.school, key)),
          },
          {
            id: "zone",
            label: `${zoneLabel} 평균`,
            color: "#d97706",
            values: trend.map((row) => rateOf(row.zone, key)),
          },
          {
            id: "scale",
            label: `${scaleLabel} 평균`,
            color: "#0ea5e9",
            values: trend.map((row) => rateOf(row.scale, key)),
          },
          {
            id: "nation",
            label: "전국 동종",
            color: "#2563eb",
            values: trend.map((row) => rateOf(row.nationwide, key)),
          },
        ],
        width: 400,
        height,
        hideLegend: true,
      })}</div>`;
    })
    .join("");
  return `${pageOpen(args.schoolName, args.analysisYear, args.page)}
<h1 class="section-title">${esc(args.title)}</h1>
<p class="sfa-note">해당 파트 전 지표의 5개년 시계열입니다. 초록 본교 · 주황 ${esc(zoneLabel)} · 하늘 ${esc(scaleLabel)} · 파랑 전국 동종.</p>
<div class="sfa-chart-grid">${charts}</div>
${pageClose(args.schoolName, args.page, args.total)}`;
}

function findingCard(item: StudentFillFinding): string {
  return `<article class="sfa-finding sfa-finding-${item.tone}">
  <h3>${esc(item.title)}</h3>
  <p>${esc(item.body)}</p>
</article>`;
}

function actionCard(item: StudentFillAction, index: number): string {
  const meta = [
    item.owner ? `<div><strong>주관</strong>${esc(item.owner)}</div>` : "",
    item.kpi ? `<div><strong>확인</strong>${esc(item.kpi)}</div>` : "",
    item.effect ? `<div><strong>기대</strong>${esc(item.effect)}</div>` : "",
  ].join("");
  const steps = item.steps?.length
    ? `<ol>${item.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>`
    : "";
  return `<article class="sfa-finding sfa-action">
  <p class="kpi-sub">전략 ${index + 1}</p>
  <h3>${esc(item.title)}</h3>
  <p>${esc(item.body)}</p>
  ${steps}
  <div class="sfa-meta-grid">${meta}</div>
</article>`;
}

function buildCover(args: {
  schoolName: string;
  analysisYear: number;
  generatedAt: string;
  school?: StudentFillSchoolRow | null;
  lastRunAt?: string | null;
}): string {
  const school = args.school;
  const stage = school?.rateAll != null ? sfaFillStage(school.rateAll) : null;
  const zone = school?.zone || "권역 미분류";
  const tocPages: Record<string, number> = {
    freshman: 1,
    enrolled: 3,
    foreign: 5,
    diagnosis: 7,
    actions: 8,
  };
  const toc = STUDENT_FILL_REPORT_OUTLINE.filter((item) => item.id !== "cover")
    .map(
      (item, index) =>
        `<li><span class="cover-toc-entry"><span class="toc-num">${index + 1}.</span> ${esc(item.title)}</span><span class="cover-toc-leader" aria-hidden="true"></span><span class="cover-toc-page">${tocPages[item.id] ?? index + 1}</span></li>`,
    )
    .join("");

  return `<article class="report-page report-page-cover" data-sfa-page="cover">
  <div class="report-cover">
    <div class="cover-accent-bar"></div>
    <p class="cover-eyebrow">K-UniTrust · 학생충원분석 (${args.analysisYear}년 에디션)</p>
    <h1 class="cover-main-title">대학별분석<br />개별대학 심층진단 보고서</h1>
    <p class="cover-school-name">${esc(args.schoolName)}</p>
    <div class="cover-meta-box">
      <table class="cover-meta-table">
        <tbody>
          <tr>
            <th>학교코드</th>
            <td>${esc(school?.schoolCodeStd ?? "—")}</td>
            <th>설립구분</th>
            <td>${esc(school?.estb || "—")}</td>
          </tr>
          <tr>
            <th>학교종류</th>
            <td>${esc(school?.schoolDivision || "—")}</td>
            <th>규모</th>
            <td>${esc(school?.scale ?? "—")} · ${fmtCount(school?.enrolledTotal)}</td>
          </tr>
          <tr>
            <th>소재지</th>
            <td>${esc(school?.region || "—")}</td>
            <th>권역</th>
            <td>${esc(zone)}</td>
          </tr>
          <tr>
            <th>정원내외충원율</th>
            <td class="cover-highlight">${fmtPct(school?.rateAll)}</td>
            <th>재학생충원율</th>
            <td>${fmtPct(school?.enrolledFillRate)}</td>
          </tr>
          <tr>
            <th>충원단계</th>
            <td colspan="3"><span class="cover-highlight">${esc(stage?.label ?? "—")}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="cover-run-at">분석실행일시: ${esc(args.lastRunAt ?? "—")} · 지침 v${STUDENT_FILL_REPORT_GUIDELINES_VERSION}</p>
    <p class="cover-generated-at">보고서 생성일시: ${esc(args.generatedAt)}</p>
    <div class="cover-toc">
      <h2 class="cover-toc-title">보고서 목차</h2>
      <ol class="cover-toc-list">${toc}</ol>
    </div>
  </div>
</article>`;
}

export function buildStudentFillReportHtml(input: {
  schoolName: string;
  analysisYear: number;
  generatedAt: string;
  diagnosis: StudentFillFinding[];
  actions: StudentFillAction[];
  school?: StudentFillSchoolRow | null;
  lastRunAt?: string | null;
  peer?: StudentFillPeerPayload | null;
}): string {
  const actionPageCount = input.actions.length > 3 ? 2 : 1;
  const total = 6 + 1 + actionPageCount;
  const common = {
    schoolName: input.schoolName,
    analysisYear: input.analysisYear,
    total,
    peer: input.peer,
  };

  const diagnosisPage = `${pageOpen(input.schoolName, input.analysisYear, 7)}
<h1 class="section-title">제2부 진단 — 추세와 집단 비교</h1>
<p class="sfa-note">탈락은 분석연도−1 공시입니다. 정원외와 외국인을 같은 숫자로 읽지 않습니다.</p>
${input.diagnosis.map(findingCard).join("")}
${pageClose(input.schoolName, 7, total)}`;

  const actionPages = (input.actions.length > 3
    ? [input.actions.slice(0, 3), input.actions.slice(3)]
    : [input.actions]
  )
    .map((chunk, index) => {
      const page = 8 + index;
      const heading =
        index === 0
          ? `<h1 class="section-title">제3부 대응전략</h1>
<p class="sfa-note">현장에서 바로 할 수 있는 일만 적습니다. 모집을 줄여 충원율을 만들지 않습니다.</p>`
          : `<h2 class="subsection-title">대응전략 (계속)</h2>`;
      const priority =
        index === (input.actions.length > 3 ? 1 : 0)
          ? `<h2 class="subsection-title">우선순위</h2><ol>${STUDENT_FILL_REPORT_PRIORITY.map((line) => `<li>${esc(line)}</li>`).join("")}</ol>`
          : "";
      return `${pageOpen(input.schoolName, input.analysisYear, page)}
${heading}
${chunk.map((item, i) => actionCard(item, (index === 0 ? 0 : 3) + i)).join("")}
${priority}
${pageClose(input.schoolName, page, total)}`;
    })
    .join("\n");

  const body = [
    buildCover(input),
    resultTablePage({
      ...common,
      page: 1,
      title: "제1부 분석결과 — 신입생충원",
      lead: "정원내충원율, 정원외비중, 정원내외충원율, 신입생탈락율. 탈락은 Y−1.",
      metrics: STUDENT_FILL_REPORT_RESULT_METRICS.freshman,
    }),
    resultChartPage({
      ...common,
      page: 2,
      title: "제1부 분석결과 — 신입생충원 (차트)",
      metrics: STUDENT_FILL_REPORT_RESULT_METRICS.freshman,
    }),
    resultTablePage({
      ...common,
      page: 3,
      title: "제1부 분석결과 — 재학생충원",
      lead: "재학생충원율, 정원내충원율, 정원외비중, 휴학비중, 유예비중, 중도탈락율.",
      metrics: STUDENT_FILL_REPORT_RESULT_METRICS.enrolled,
    }),
    resultChartPage({
      ...common,
      page: 4,
      title: "제1부 분석결과 — 재학생충원 (차트)",
      metrics: STUDENT_FILL_REPORT_RESULT_METRICS.enrolled,
    }),
    resultTablePage({
      ...common,
      page: 5,
      title: "제1부 분석결과 — 외국인",
      lead: "재적대비비중, 언어능력충족율, 외국인탈락율, 전체외국인탈락율. 학위(A) 기본.",
      metrics: STUDENT_FILL_REPORT_RESULT_METRICS.foreign,
    }),
    resultChartPage({
      ...common,
      page: 6,
      title: "제1부 분석결과 — 외국인 (차트)",
      metrics: STUDENT_FILL_REPORT_RESULT_METRICS.foreign,
    }),
    diagnosisPage,
    actionPages,
  ].join("\n");

  return wrapSfaReportHtml(
    `${input.schoolName} 학생충원 심층진단 보고서 (${input.analysisYear})`,
    body,
  );
}
