import { reportA4Styles } from "@/lib/competitiveness-analysis/university-report/report-a4-styles";
import type { RiskStageTone } from "@/lib/competitiveness-analysis/financial-projection/risk-stage";
import type { ProjectionYearRow } from "@/lib/competitiveness-analysis/financial-projection/types";

import {
  FP_REPORT_GUIDELINES_VERSION,
  FP_REPORT_TOC,
  FP_RISK_STAGE_DEFINITIONS,
  FP_SCENARIO_DEFINITIONS,
  type FpNarrativeSlotId,
} from "./generation-guidelines";
import type { FpReportPayload, FpReportScenario } from "./build-fp-report-payload";
import { renderFpChartSvg } from "./fp-report-charts";

const COLOR = {
  navy: "#0f172a",
  sky: "#0284c7",
  emerald: "#059669",
  rose: "#e11d48",
  amber: "#d97706",
  slate: "#64748b",
  violet: "#7c3aed",
};

const STAGE_TONE_CLASS: Record<RiskStageTone, string> = {
  ok: "fp-stage-ok",
  caution: "fp-stage-caution",
  warn: "fp-stage-warn",
  crisis: "fp-stage-crisis",
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtInt(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

function fmtEok1(v: number): string {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function yearOrNone(y: number | null, endYear: number): string {
  return y == null ? `구간(~${endYear}년) 내 없음` : `${y}년`;
}

/** lastRunAt은 ISO 또는 이미 한국어 형식 문자열일 수 있음 */
function formatRunAt(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("ko-KR");
}

function negClass(v: number): string {
  return v < 0 ? ' class="fp-neg"' : "";
}

function narrativeSlot(id: FpNarrativeSlotId): string {
  return `<div class="fp-narrative" data-fp-narrative="${id}"><!--NARRATIVE:${id}--></div>`;
}

/** 표 표시연도 — 분석연도부터 5년 연속 + 7·10·15년차 + 끝연도 (A4 1쪽 수용) */
function tableYears(analysisYear: number, endYear: number): number[] {
  const years: number[] = [];
  for (let y = analysisYear; y <= Math.min(analysisYear + 5, endYear); y += 1) {
    years.push(y);
  }
  for (const offset of [7, 10, 15]) {
    const y = analysisYear + offset;
    if (y < endYear && !years.includes(y)) years.push(y);
  }
  if (!years.includes(endYear)) years.push(endYear);
  return years;
}

function rowsFor(
  rows: ProjectionYearRow[],
  years: number[],
): ProjectionYearRow[] {
  const byYear = new Map(rows.map((r) => [r.year, r]));
  return years
    .map((y) => byYear.get(y))
    .filter((r): r is ProjectionYearRow => Boolean(r));
}

function pageOpen(payload: FpReportPayload, page: number, extraClass = ""): string {
  return `<article class="report-page${extraClass ? ` ${extraClass}` : ""}" data-fp-page="${page}">
<div class="fp-page-head"><span>${esc(payload.school.schoolName)}</span><span>${payload.analysisYear}년 대학별 재정추계 분석</span></div>
<div class="report-page-body">`;
}

function pageClose(payload: FpReportPayload, page: number): string {
  return `</div>
<footer class="report-page-footer">${esc(payload.school.schoolName)} 재정추계 분석 보고서 · <span class="report-page-num">${page} / ${FP_REPORT_TOC.length}</span></footer>
</article>`;
}

/* ── 표지 ── */

function buildCover(payload: FpReportPayload, generatedAt: string): string {
  const base = payload.base;
  const toc = FP_REPORT_TOC.map(
    (t) =>
      `<li><span class="toc-num">${t.page}</span><span class="cover-toc-entry">${esc(t.title)}</span><span class="cover-toc-leader"></span><span class="cover-toc-page">${t.page}</span></li>`,
  ).join("");

  return `<article class="report-page report-page-cover" data-fp-page="cover">
  <div class="report-cover">
    <div class="cover-accent-bar"></div>
    <p class="cover-eyebrow">K-UniTrust · 대학별추계분석</p>
    <h1 class="cover-main-title">${payload.analysisYear}년 대학별 재정추계<br />분석 보고서</h1>
    <p class="cover-school-name">${esc(payload.school.schoolName)}</p>
    <div class="cover-meta-box">
      <table class="cover-meta-table">
        <tbody>
          <tr>
            <th>분석연도</th><td>${payload.analysisYear}년</td>
            <th>추계구간</th><td>${payload.analysisYear}~${payload.endYear}년</td>
          </tr>
          <tr>
            <th>소재지</th><td>${esc(payload.school.region)} ${esc(payload.school.sigungu)}</td>
            <th>학교종류</th><td>${esc(payload.school.schoolKind)}</td>
          </tr>
          <tr>
            <th>위험단계</th><td><span class="cover-highlight">${esc(base.stage.label)}</span> (기본 시나리오)</td>
            <th>가용자금 고갈</th><td><span class="cover-highlight">${yearOrNone(base.liquidityDepletionYear, payload.endYear)}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="cover-run-at">분석실행: ${payload.lastRunAt ? esc(formatRunAt(payload.lastRunAt)) : "—"} · 지침 v${FP_REPORT_GUIDELINES_VERSION}</p>
    <p class="cover-generated-at">보고서 생성: ${esc(generatedAt)}</p>
    <div class="cover-toc">
      <p class="cover-toc-title">목차</p>
      <ul class="cover-toc-list">${toc}</ul>
    </div>
  </div>
</article>`;
}

/* ── 1쪽 종합 요약 ── */

function buildExecPage(payload: FpReportPayload): string {
  const base = payload.base;
  const depletion = base.liquidityDepletionYear;
  const yearsLeft =
    depletion == null ? null : depletion - payload.analysisYear;

  const kpis = `
<div class="kpi-grid-4">
  <div class="kpi-card ${base.stage.tone === "crisis" ? "kpi-risk" : base.stage.tone === "ok" ? "kpi-strength" : "kpi-neutral"}">
    <p class="kpi-label">위험단계</p>
    <p class="kpi-value" style="font-size:13pt">${esc(base.stage.label)}</p>
    <p class="kpi-sub">기본 시나리오 · 참고 분류</p>
  </div>
  <div class="kpi-card ${base.operatingLossYear ? "kpi-risk" : "kpi-strength"}">
    <p class="kpi-label">운영손익 적자</p>
    <p class="kpi-value" style="font-size:13pt">${base.operatingLossYear ? `${base.operatingLossYear}년` : "없음"}</p>
    <p class="kpi-sub">수입 &lt; 지출 최초 연도</p>
  </div>
  <div class="kpi-card ${base.cashDeficitYear ? "kpi-risk" : "kpi-strength"}">
    <p class="kpi-label">자금수지 적자</p>
    <p class="kpi-value" style="font-size:13pt">${base.cashDeficitYear ? `${base.cashDeficitYear}년` : "없음"}</p>
    <p class="kpi-sub">당기 자금수지 &lt; 0</p>
  </div>
  <div class="kpi-card ${depletion ? "kpi-risk" : "kpi-strength"}">
    <p class="kpi-label">가용자금 고갈</p>
    <p class="kpi-value" style="font-size:13pt">${depletion ? `${depletion}년` : "없음"}</p>
    <p class="kpi-sub">${yearsLeft != null ? `분석연도부터 ${yearsLeft}년 후` : `전망 구간(~${payload.endYear}년) 내 없음`}</p>
  </div>
</div>`;

  const scenarioRows = payload.scenarios
    .map((s) => {
      const end = s.rows[s.rows.length - 1];
      return `<tr>
  <td><strong>${esc(s.label)}</strong></td>
  <td>${yearOrNone(s.operatingLossYear, payload.endYear)}</td>
  <td>${yearOrNone(s.cashDeficitYear, payload.endYear)}</td>
  <td>${yearOrNone(s.liquidityDepletionYear, payload.endYear)}</td>
  <td${negClass(end?.usableLiquidityEok ?? 0)}>${end ? fmtEok1(end.usableLiquidityEok) : "—"}</td>
  <td>${esc(s.stage.label)}</td>
</tr>`;
    })
    .join("");

  return `${pageOpen(payload, 1)}
<div class="exec-report-header">
  <div><span class="exec-brand">K-UNITRUST</span><span class="exec-report-title">재정추계 Executive Summary</span></div>
  <div class="exec-report-header-right">${esc(payload.school.schoolName)}<span class="exec-header-sep">|</span>${payload.analysisYear}년 분석<span class="exec-header-sep">|</span>추계 ${payload.analysisYear}~${payload.endYear}년</div>
</div>
${kpis}
<h2 class="subsection-title">시나리오별 재정 분기점 비교</h2>
<table class="data-table">
  <thead>
    <tr><th>시나리오</th><th>운영손익 적자</th><th>자금수지 적자</th><th>가용자금 고갈</th><th>${payload.endYear}년 가용자금(억원)</th><th>위험단계</th></tr>
  </thead>
  <tbody>${scenarioRows}</tbody>
</table>
<h2 class="subsection-title">종합 총평</h2>
${narrativeSlot("exec-summary")}
${pageClose(payload, 1)}`;
}

/* ── 2쪽 학생수 ── */

function buildStudentsPage(payload: FpReportPayload): string {
  const rows = payload.base.rows;
  const years = rows.map((r) => r.year);
  const hasGraduate = rows.some((r) => r.graduateStudents > 0);

  const chartLeft = renderFpChartSvg({
    title: "재학생·신입생 전망",
    unit: "명",
    years,
    width: 352,
    height: 190,
    series: [
      { label: "신입생", color: COLOR.slate, type: "bar", values: rows.map((r) => r.freshmen || null) },
      { label: "학부 재학생", color: COLOR.sky, type: "line", values: rows.map((r) => r.undergradStudents) },
      ...(hasGraduate
        ? [{ label: "대학원 재학생", color: COLOR.emerald, type: "line" as const, values: rows.map((r) => r.graduateStudents) }]
        : []),
    ],
  });

  const forecast = rows.filter((r) => r.rowKind !== "actual");
  const chartRight = renderFpChartSvg({
    title: "충원율·학령인구 지수 전망",
    unit: "% · 지수",
    years: forecast.map((r) => r.year),
    width: 352,
    height: 190,
    series: [
      { label: "충원율(%)", color: COLOR.violet, type: "line", values: forecast.map((r) => r.fillRatePct) },
      { label: "학령인구 지수", color: COLOR.amber, type: "line", dashed: true, values: forecast.map((r) => r.schoolAgeDeclineIndex || null) },
    ],
  });

  const trows = rowsFor(rows, tableYears(payload.analysisYear, payload.endYear))
    .map(
      (r) => `<tr>
  <td>${r.year}</td>
  <td>${fmtInt(r.quota)}</td>
  <td>${fmtInt(r.freshmen)}</td>
  <td>${fmtInt(r.undergradStudents)}</td>
  <td>${r.graduateStudents ? fmtInt(r.graduateStudents) : "—"}</td>
  <td><strong>${fmtInt(r.students)}</strong></td>
  <td>${r.fillRatePct.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%</td>
  <td>${r.schoolAgeDeclineIndex > 0 ? r.schoolAgeDeclineIndex.toLocaleString("ko-KR", { maximumFractionDigits: 1 }) : "—"}</td>
</tr>`,
    )
    .join("");

  return `${pageOpen(payload, 2)}
<h1 class="section-title">제1부 추계결과 ① 학생수 전망</h1>
<p class="fp-basis-note">기본(base) 시나리오 기준 · 소재 시도 학령인구 감소 지수 반영 · 실적(교비)·추정(알리미)·전망 구분</p>
<div class="report-chart-grid">${chartLeft}${chartRight}</div>
<table class="data-table fp-compact-table">
  <thead><tr><th>연도</th><th>정원</th><th>신입</th><th>학부</th><th>대학원</th><th>재학생 계</th><th>충원율</th><th>학령지수</th></tr></thead>
  <tbody>${trows}</tbody>
</table>
${narrativeSlot("students")}
${pageClose(payload, 2)}`;
}

/* ── 3쪽 수입·지출 ── */

function buildPnlPage(payload: FpReportPayload): string {
  const forecast = payload.base.rows.filter((r) => r.rowKind !== "actual");
  const years = forecast.map((r) => r.year);

  const chart = renderFpChartSvg({
    title: "운영 수입·지출·운영차액 전망",
    unit: "억원",
    years,
    height: 190,
    series: [
      { label: "총수입", color: COLOR.sky, type: "bar", values: forecast.map((r) => r.revenueEok) },
      { label: "총지출", color: COLOR.rose, type: "bar", values: forecast.map((r) => r.expenseEok) },
      { label: "등록금수입", color: COLOR.emerald, type: "line", values: forecast.map((r) => r.tuitionRevenueEok) },
      { label: "운영차액", color: COLOR.navy, type: "line", values: forecast.map((r) => r.operatingProfitEok) },
    ],
    markerYear: payload.base.operatingLossYear,
    markerLabel: payload.base.operatingLossYear ? `${payload.base.operatingLossYear}년 적자 전환` : undefined,
  });

  const trows = rowsFor(forecast, tableYears(payload.analysisYear, payload.endYear))
    .map(
      (r) => `<tr>
  <td>${r.year}</td>
  <td>${fmtEok1(r.tuitionRevenueEok)}</td>
  <td>${fmtEok1(r.revenueEok)}</td>
  <td>${fmtEok1(r.expenseEok)}</td>
  <td${negClass(r.operatingProfitEok)}><strong>${fmtEok1(r.operatingProfitEok)}</strong></td>
</tr>`,
    )
    .join("");

  return `${pageOpen(payload, 3)}
<h1 class="section-title">제1부 추계결과 ② 수입·지출 전망</h1>
<p class="fp-basis-note">수입 = 등록금 + 맞춤형국가장학금 + 기타수입 · 지출 = 고정비(보수·관리운영·교육외) + 변동비(연구학생경비) · 단위: 억원</p>
${chart}
<table class="data-table fp-compact-table">
  <thead><tr><th>연도</th><th>등록금수입</th><th>총수입</th><th>총지출</th><th>운영차액</th></tr></thead>
  <tbody>${trows}</tbody>
</table>
${narrativeSlot("pnl")}
${pageClose(payload, 3)}`;
}

/* ── 4쪽 자금수지·가용자금 ── */

function buildCashPage(payload: FpReportPayload): string {
  const forecast = payload.base.rows.filter((r) => r.rowKind !== "actual");
  const years = forecast.map((r) => r.year);

  const chart = renderFpChartSvg({
    title: "당기 자금수지·가용자금 누적 전망",
    unit: "억원",
    years,
    height: 190,
    series: [
      { label: "당기 자금수지", color: COLOR.slate, type: "bar", values: forecast.map((r) => r.cashflowEok) },
      { label: "가용자금", color: COLOR.emerald, type: "line", values: forecast.map((r) => r.usableLiquidityEok) },
    ],
    markerYear: payload.base.liquidityDepletionYear,
    markerLabel: payload.base.liquidityDepletionYear ? `${payload.base.liquidityDepletionYear}년 가용자금 고갈` : undefined,
  });

  const trows = rowsFor(forecast, tableYears(payload.analysisYear, payload.endYear))
    .map(
      (r) => `<tr>
  <td>${r.year}</td>
  <td${negClass(r.cashflowEok)}>${fmtEok1(r.cashflowEok)}</td>
  <td${negClass(r.usableLiquidityEok)}><strong>${fmtEok1(r.usableLiquidityEok)}</strong></td>
  <td>${r.usableLiquidityEok <= 0 ? '<span class="fp-neg">고갈</span>' : r.isDeficit ? '<span class="fp-warn-text">당기적자</span>' : "정상"}</td>
</tr>`,
    )
    .join("");

  return `${pageOpen(payload, 4)}
<h1 class="section-title">제1부 추계결과 ③ 자금수지·가용자금</h1>
<p class="fp-basis-note">가용자금 = 교비 이월자금 + 임의기금 + 원금보존기금 (산학협력단 제외) · 고갈 = 가용자금 ≤ 0 시점 · 단위: 억원</p>
${chart}
<table class="data-table fp-compact-table">
  <thead><tr><th>연도</th><th>당기 자금수지</th><th>가용자금 잔액</th><th>상태</th></tr></thead>
  <tbody>${trows}</tbody>
</table>
${narrativeSlot("cash")}
${pageClose(payload, 4)}`;
}

/* ── 5쪽 1인당 지표 ── */

function buildPerCapitaPage(payload: FpReportPayload): string {
  const rows = payload.perCapitaRows;
  const years = rows.map((r) => r.year);

  const chart = renderFpChartSvg({
    title: "1인당 지출 vs 1인당 등록금",
    unit: "백만원",
    years,
    height: 190,
    series: [
      { label: "1인당 지출", color: COLOR.rose, type: "line", values: rows.map((r) => r.expenseMan) },
      { label: "1인당 등록금", color: COLOR.sky, type: "line", values: rows.map((r) => r.tuitionMan) },
      { label: "갭(지출−등록금)", color: COLOR.slate, type: "line", dashed: true, values: rows.map((r) => r.gapMan) },
    ],
  });

  const byYear = new Map(rows.map((r) => [r.year, r]));
  const trows = tableYears(payload.analysisYear, payload.endYear)
    .map((y) => byYear.get(y))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(
      (r) => `<tr>
  <td>${r.year}</td>
  <td>${fmtEok1(r.expenseMan)}</td>
  <td>${fmtEok1(r.tuitionMan)}</td>
  <td${negClass(-r.gapMan)}>${fmtEok1(r.gapMan)}</td>
</tr>`,
    )
    .join("");

  return `${pageOpen(payload, 5)}
<h1 class="section-title">제1부 추계결과 ④ 1인당 지표</h1>
<p class="fp-basis-note">1인당 지출 = 총지출 ÷ 재학생 · 1인당 등록금 = 등록금수입 ÷ 재학생 · 갭이 클수록 등록금 외 재원 의존 확대 · 단위: 백만원</p>
${chart}
<table class="data-table fp-compact-table">
  <thead><tr><th>연도</th><th>1인당 지출</th><th>1인당 등록금</th><th>갭(지출−등록금)</th></tr></thead>
  <tbody>${trows}</tbody>
</table>
${narrativeSlot("percapita")}
${pageClose(payload, 5)}`;
}

/* ── 6쪽 시나리오 비교 ── */

function scenarioAssumption(s: FpReportScenario): string {
  const p = s.params;
  return `등록금 ${p.tuitionIncreaseRatePct > 0 ? "+" : ""}${p.tuitionIncreaseRatePct}% · 기타수입 ${p.subsidyChangeRatePct > 0 ? "+" : ""}${p.subsidyChangeRatePct}%/년 · 충원 ${p.fillRateAdjPct > 0 ? "+" : ""}${p.fillRateAdjPct}%p · 중도탈락 +${p.dropoutRateAddonPct}%p · 고정비절감 ${p.fixedCostCutRatePct}%/년`;
}

function buildScenarioPage(payload: FpReportPayload): string {
  const forecastYears = payload.base.rows
    .filter((r) => r.rowKind !== "actual")
    .map((r) => r.year);

  const colorMap: Record<string, string> = {
    best: COLOR.emerald,
    base: COLOR.sky,
    worst: COLOR.amber,
    stress: COLOR.rose,
  };

  const chart = renderFpChartSvg({
    title: "시나리오별 가용자금 경로",
    unit: "억원",
    years: forecastYears,
    height: 190,
    series: payload.scenarios.map((s) => {
      const byYear = new Map(s.rows.map((r) => [r.year, r.usableLiquidityEok]));
      return {
        label: s.label,
        color: colorMap[s.scenario],
        type: "line" as const,
        values: forecastYears.map((y) => byYear.get(y) ?? null),
      };
    }),
    markerYear: payload.base.liquidityDepletionYear,
    markerLabel: payload.base.liquidityDepletionYear ? `기본 ${payload.base.liquidityDepletionYear}년 고갈` : undefined,
  });

  const trows = payload.scenarios
    .map(
      (s) => `<tr>
  <td><strong>${esc(s.label)}</strong></td>
  <td class="text-left" style="font-size:8pt">${esc(scenarioAssumption(s))}</td>
  <td>${yearOrNone(s.operatingLossYear, payload.endYear)}</td>
  <td>${yearOrNone(s.liquidityDepletionYear, payload.endYear)}</td>
</tr>`,
    )
    .join("");

  return `${pageOpen(payload, 6)}
<h1 class="section-title">제1부 추계결과 ⑤ 시나리오 비교</h1>
<p class="fp-basis-note">물가(CPI) ${payload.cpiPct}%·보수 상승률(대학별 CAGR ${payload.school.laborCostCagrPct.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%)은 4개 시나리오 공통 적용</p>
${chart}
<table class="data-table">
  <thead><tr><th style="width:12%">시나리오</th><th>가정</th><th style="width:18%">운영손익 적자</th><th style="width:18%">가용자금 고갈</th></tr></thead>
  <tbody>${trows}</tbody>
</table>
${narrativeSlot("scenarios")}
${pageClose(payload, 6)}`;
}

/* ── 7쪽 한계진단 ① ── */

function buildDiagnosisVerdictPage(payload: FpReportPayload): string {
  const base = payload.base;
  const yearsLeft =
    base.liquidityDepletionYear == null
      ? null
      : base.liquidityDepletionYear - payload.analysisYear;

  const milestones = `
<div class="fp-milestone-grid">
  <div class="fp-milestone ${base.operatingLossYear ? "fp-milestone-risk" : "fp-milestone-ok"}">
    <p class="fp-milestone-step">1단계</p>
    <p class="fp-milestone-title">운영손익 적자</p>
    <p class="fp-milestone-year">${base.operatingLossYear ? `${base.operatingLossYear}년` : "없음"}</p>
    <p class="fp-milestone-desc">연간 수입이 지출을 하회하기 시작하는 시점</p>
  </div>
  <div class="fp-milestone ${base.cashDeficitYear ? "fp-milestone-risk" : "fp-milestone-ok"}">
    <p class="fp-milestone-step">2단계</p>
    <p class="fp-milestone-title">자금수지 적자</p>
    <p class="fp-milestone-year">${base.cashDeficitYear ? `${base.cashDeficitYear}년` : "없음"}</p>
    <p class="fp-milestone-desc">당기 자금수지가 음(−)으로 전환, 적립·이월자금 잠식 시작</p>
  </div>
  <div class="fp-milestone ${base.liquidityDepletionYear ? "fp-milestone-risk" : "fp-milestone-ok"}">
    <p class="fp-milestone-step">3단계</p>
    <p class="fp-milestone-title">가용자금 고갈</p>
    <p class="fp-milestone-year">${base.liquidityDepletionYear ? `${base.liquidityDepletionYear}년` : "없음"}</p>
    <p class="fp-milestone-desc">${yearsLeft != null ? `분석연도부터 ${yearsLeft}년 후 · 대응 골든타임의 종점` : "전망 구간 내 고갈 없음"}</p>
  </div>
</div>`;

  return `${pageOpen(payload, 7)}
<h1 class="section-title">제2부 한계진단 ① 위험단계 판정</h1>
<div class="fp-stage-banner ${STAGE_TONE_CLASS[base.stage.tone]}">위험단계 <strong>${esc(base.stage.label)}</strong><span class="fp-stage-hint">${esc(base.stage.hint)}</span></div>
<div class="fp-basis-note" style="margin-top:3mm">판정 기준 — 경영위기: 5년 이내 가용자금 고갈 · 경고: 6~10년 차 고갈 · 주의: 11년 차 이후 고갈 또는 운영적자 존재 · 정상: 고갈·적자 없음.
이 분류는 재정추계에 따른 참고 분류이며 교육부 한계대학 지정이 아니다.</div>
<h2 class="subsection-title">재정 한계 3대 분기점 (기본 시나리오)</h2>
${milestones}
<h2 class="subsection-title">판정 근거 상세</h2>
${narrativeSlot("diagnosis-verdict")}
${pageClose(payload, 7)}`;
}

/* ── 8쪽 한계진단 ② ── */

function buildDiagnosisStructurePage(payload: FpReportPayload): string {
  const s = payload.school;
  const st = payload.structure;

  const fixedBreakdown =
    s.fixedCostLaborEok != null &&
    s.fixedCostAdminEok != null &&
    s.fixedCostNonEduEok != null
      ? `보수 ${fmtEok1(s.fixedCostLaborEok)} + 관리운영 ${fmtEok1(s.fixedCostAdminEok)} + 교육외 ${fmtEok1(s.fixedCostNonEduEok)}`
      : "보수·관리운영비·교육외비용 합계 (3·2년 평균)";
  const structureRows = `
<tr><td class="text-left">고정비 합계 (연간)</td><td><strong>${fmtEok1(s.fixedCostsEok)}억원</strong></td><td class="text-left">${fixedBreakdown}</td></tr>
<tr><td class="text-left">보수 상승률 (5년 CAGR)</td><td><strong>${s.laborCostCagrPct.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%</strong></td><td class="text-left">고정비 에스컬레이션에 적용</td></tr>
<tr><td class="text-left">등록금 의존도 (분석연도)</td><td><strong>${st.tuitionDependencePct != null ? `${st.tuitionDependencePct}%` : "—"}</strong></td><td class="text-left">등록금수입 ÷ 총수입</td></tr>
<tr><td class="text-left">학생 1인당 고정비</td><td><strong>${st.fixedCostPerStudentMan != null ? `${fmtEok1(st.fixedCostPerStudentMan)}백만원` : "—"}</strong></td><td class="text-left">재학생 감소 시 1인당 부담 증가</td></tr>
<tr><td class="text-left">기타수입 / 국가장학금</td><td><strong>${fmtEok1(s.otherRevenuesEok)} / ${fmtEok1(s.nationalScholarshipEok)}억원</strong></td><td class="text-left">등록금 외 재원 (기준액)</td></tr>
<tr><td class="text-left">가용자금 (분석연도 초)</td><td><strong>${fmtEok1(s.usableLiquidityEok)}억원</strong></td><td class="text-left">이월 + 임의기금 + 원금보존기금</td></tr>
<tr><td class="text-left">학령인구 지수 경로</td><td><strong>${st.schoolAgeIndexStart != null ? st.schoolAgeIndexStart.toLocaleString("ko-KR", { maximumFractionDigits: 1 }) : "—"} → ${st.schoolAgeIndexEnd != null ? st.schoolAgeIndexEnd.toLocaleString("ko-KR", { maximumFractionDigits: 1 }) : "—"}</strong></td><td class="text-left">소재 시도 18세 인구, ${payload.analysisYear + 1}년=100</td></tr>`;

  const tornadoRows = payload.tornado
    .map(
      (t) => `<tr>
  <td class="text-left">${esc(t.factor)}</td>
  <td${t.worseShift < 0 ? ' class="fp-neg"' : ""}>${t.worseShift > 0 ? "+" : ""}${t.worseShift}년</td>
  <td${t.betterShift > 0 ? ' class="fp-pos"' : ""}>${t.betterShift > 0 ? "+" : ""}${t.betterShift}년</td>
</tr>`,
    )
    .join("");

  return `${pageOpen(payload, 8)}
<h1 class="section-title">제2부 한계진단 ② 구조 진단·민감도</h1>
<h2 class="subsection-title">재정 구조 지표 (분석연도 기준)</h2>
<table class="data-table fp-compact-table">
  <thead><tr><th style="width:28%">지표</th><th style="width:24%">값</th><th>해석 기준</th></tr></thead>
  <tbody>${structureRows}</tbody>
</table>
${narrativeSlot("diagnosis-structure")}
<h2 class="subsection-title">민감도 분석 — 가용자금 고갈 시점 변화 (기본 시나리오)</h2>
<table class="data-table fp-compact-table">
  <thead><tr><th>변수 (±1 단위)</th><th>악화 시 고갈 이동</th><th>개선 시 고갈 이동</th></tr></thead>
  <tbody>${tornadoRows}</tbody>
</table>
${narrativeSlot("diagnosis-sensitivity")}
${pageClose(payload, 8)}`;
}

/* ── 9쪽 대응전략 ① ── */

function buildStrategyDefensePage(payload: FpReportPayload): string {
  const goalRows = [1, 2, 3, 4, 5]
    .map((delay) => {
      const g = payload.goalSeekByDelay[String(delay)];
      if (!g) return "";
      return `<tr>
  <td>고갈 +${delay}년 지연</td>
  <td>${g.targetYear}년</td>
  <td><strong>${g.cutPct.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%/년</strong></td>
  <td>${g.achieved ? '<span class="fp-pos">달성 가능</span>' : '<span class="fp-neg">절감만으로 불가</span>'}</td>
</tr>`;
    })
    .join("");

  const actionCards = payload.contingencyActions
    .map(
      (a) => `<div class="fp-action-card">
  <div class="fp-action-head"><span class="fp-action-priority">우선순위 ${a.priority}</span>${a.delayYears > 0 ? `<span class="fp-action-delay">고갈 지연 효과 약 ${a.delayYears}년</span>` : ""}</div>
  <p class="fp-action-title">${esc(a.action)}</p>
  <p class="fp-action-effect">${esc(a.effect)}</p>
</div>`,
    )
    .join("");

  return `${pageOpen(payload, 9)}
<h1 class="section-title">제3부 대응전략 ① 재정 방어선 구축</h1>
<h2 class="subsection-title">목표탐색 — 고갈 지연에 필요한 고정비 절감률 (기본 시나리오)</h2>
<p class="fp-basis-note">고정비(보수·관리운영비·교육외비용)를 매년 일정 비율 절감할 때 가용자금 고갈 시점이 얼마나 늦춰지는지 역산한 결과</p>
<table class="data-table fp-compact-table">
  <thead><tr><th>목표</th><th>목표 고갈 연도</th><th>필요 절감률</th><th>판정</th></tr></thead>
  <tbody>${goalRows || '<tr><td colspan="4">전망 구간 내 가용자금 고갈이 없어 목표탐색이 불필요하다.</td></tr>'}</tbody>
</table>
<h2 class="subsection-title">우선순위 대응 카드</h2>
<div class="fp-action-grid">${actionCards}</div>
<h2 class="subsection-title">대응전략 총론</h2>
${narrativeSlot("strategy-overview")}
${pageClose(payload, 9)}`;
}

/* ── 10쪽 대응전략 ② 로드맵 ── */

function buildStrategyRoadmapPage(payload: FpReportPayload): string {
  const y = payload.analysisYear;
  return `${pageOpen(payload, 10)}
<h1 class="section-title">제3부 대응전략 ② 단계별 실행 로드맵</h1>
<div class="roadmap-list report-part3-roadmap">
  <div class="roadmap-item">
    <div class="roadmap-head"><span class="roadmap-phase">단기 · ${y}~${y + 1}년</span><p class="roadmap-title">재정 방어선 확보</p></div>
    ${narrativeSlot("strategy-shortterm")}
  </div>
  <div class="roadmap-item roadmap-mid">
    <div class="roadmap-head"><span class="roadmap-phase roadmap-phase-mid">중기 · ${y + 2}~${y + 4}년</span><p class="roadmap-title">수입 다변화·구조 조정</p></div>
    ${narrativeSlot("strategy-midterm")}
  </div>
  <div class="roadmap-item" style="border-left-color:#7c3aed">
    <div class="roadmap-head"><span class="roadmap-phase" style="color:#5b21b6;background:#ede9fe">장기 · ${y + 5}년~</span><p class="roadmap-title">지속가능 재정 모델 전환</p></div>
    ${narrativeSlot("strategy-longterm")}
  </div>
</div>
<h2 class="subsection-title">마무리 총평</h2>
${narrativeSlot("closing")}
${pageClose(payload, 10)}`;
}

/* ── 11쪽 부록 ── */

function buildAppendixPage(payload: FpReportPayload): string {
  return `${pageOpen(payload, 11)}
<h1 class="section-title">부록 — 추계 방법론·가정</h1>
<h2 class="subsection-title">추계 산식</h2>
<ul class="fp-method-list">
  <li><strong>학생수</strong> — 소재 시도 학령인구 감소 지수(18세, ${payload.analysisYear + 1}년=100)에 충원율·중도탈락 가정을 적용해 신입생·재학생을 연도별로 추계한다.</li>
  <li><strong>수입</strong> — 등록금수입(가중평균 수업료 × 재학생) + 맞춤형국가장학금(재학생 비례) + 기타수입(증감률 가정 적용). ${payload.settlementYear}년까지는 교비 결산 실적을 사용한다.</li>
  <li><strong>지출</strong> — 고정비(보수·관리운영비·교육외비용, 보수 CAGR로 상승) + 변동비(연구학생경비 × 재학생, CPI 연동).</li>
  <li><strong>가용자금</strong> — 교비 이월자금 + 임의기금 + 원금보존기금(산학협력단 제외)에서 출발해 당기 자금수지를 누적한다. 고갈 = 가용자금 ≤ 0.</li>
</ul>
<h2 class="subsection-title">시나리오 가정</h2>
<pre class="fp-appendix-pre">${esc(FP_SCENARIO_DEFINITIONS)}</pre>
<h2 class="subsection-title">위험단계 판정 기준</h2>
<pre class="fp-appendix-pre">${esc(FP_RISK_STAGE_DEFINITIONS)}</pre>
<h2 class="subsection-title">유의사항</h2>
<ul class="fp-method-list">
  <li>본 보고서는 공시·결산 자료 기반 시뮬레이션이며, 정원 조정·법인전입 등 개별 대학의 중장기 계획은 반영되지 않았다.</li>
  <li>위험단계는 참고 분류이며 교육부 한계대학 지정과 무관하다.</li>
  <li>물가(CPI) ${payload.cpiPct}%, 보수 상승률은 대학별 보수 5년 CAGR(${payload.school.laborCostCagrPct.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%)을 적용했다.</li>
</ul>
${pageClose(payload, 11)}`;
}

/* ── 추가 스타일 ── */

export function fpReportExtraStyles(): string {
  return `
    /* ── A4 1쪽 수용을 위한 압축 레이아웃 ── */
    [data-fp-page] .section-title {
      margin: 0 0 3mm;
      font-size: 15pt;
      padding-bottom: 2mm;
    }
    [data-fp-page] .subsection-title {
      margin: 4mm 0 2mm;
      font-size: 11.5pt;
    }
    [data-fp-page] table,
    [data-fp-page] .data-table {
      margin: 2.5mm 0 4mm;
    }
    [data-fp-page] .report-chart {
      margin: 2mm 0 4mm;
    }
    [data-fp-page] .report-chart-grid {
      /* 재정추계 보고서는 2열 유지 (경쟁력 보고서 공용 스타일이 1열로 변경됨) */
      grid-template-columns: 1fr 1fr;
      margin: 2mm 0 4mm;
      gap: 3mm;
    }
    [data-fp-page] .report-chart-title { font-size: 8.5pt; margin-bottom: 1mm; }
    [data-fp-page] .report-chart-legend { margin-top: 1mm; font-size: 7pt; gap: 2mm 4mm; }
    [data-fp-page] .kpi-grid-4 { margin-bottom: 3.5mm; }
    [data-fp-page] .exec-report-header { margin-bottom: 3mm; }
    [data-fp-page="cover"] .cover-toc { margin-top: 5mm; padding-top: 4mm; }
    [data-fp-page="cover"] .cover-toc-list { line-height: 1.75; }

    .fp-page-head {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1.5mm;
      margin-bottom: 4mm;
    }

    .fp-stage-banner {
      border-radius: 8px;
      padding: 2.5mm 4mm;
      font-size: 10.5pt;
      font-weight: 600;
      margin: 2mm 0 3.5mm;
      border: 1px solid transparent;
    }
    .fp-stage-banner strong { font-size: 12pt; margin-left: 1mm; }
    .fp-stage-hint { display: block; font-size: 8pt; font-weight: 400; margin-top: 1mm; opacity: 0.85; }
    .fp-stage-ok { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
    .fp-stage-ok strong { color: #059669; }
    .fp-stage-caution { background: #fffbeb; border-color: #fde68a; color: #92400e; }
    .fp-stage-caution strong { color: #d97706; }
    .fp-stage-warn { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
    .fp-stage-warn strong { color: #ea580c; }
    .fp-stage-crisis { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .fp-stage-crisis strong { color: #dc2626; }

    .fp-basis-note {
      font-size: 7.5pt;
      color: #64748b;
      background: #f8fafc;
      border-left: 3px solid #0284c7;
      padding: 1.5mm 2.5mm;
      margin: 1.5mm 0 3mm;
      line-height: 1.5;
    }

    .fp-neg { color: #dc2626 !important; font-weight: 600; }
    .fp-pos { color: #059669 !important; font-weight: 600; }
    .fp-warn-text { color: #d97706; font-weight: 600; }

    .fp-compact-table { font-size: 8pt; }
    .fp-compact-table th, .fp-compact-table td { padding: 1.2mm 1.5mm; line-height: 1.35; }

    .fp-narrative { margin: 1.5mm 0; }
    .fp-narrative p {
      font-size: 9pt;
      line-height: 1.52;
      text-align: justify;
      word-break: keep-all;
      margin: 1.6mm 0;
    }

    .fp-milestone-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
      margin: 4mm 0;
    }
    .fp-milestone {
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 3mm;
      background: #f8fafc;
    }
    .fp-milestone-risk { background: #fef2f2; border-color: #fecaca; }
    .fp-milestone-ok { background: #ecfdf5; border-color: #a7f3d0; }
    .fp-milestone-step { font-size: 7pt; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase; }
    .fp-milestone-title { font-size: 9.5pt; font-weight: 700; color: #0f172a; margin: 1mm 0; }
    .fp-milestone-year { font-size: 14pt; font-weight: 800; color: #0f172a; margin: 1mm 0; }
    .fp-milestone-risk .fp-milestone-year { color: #dc2626; }
    .fp-milestone-ok .fp-milestone-year { color: #059669; }
    .fp-milestone-desc { font-size: 7.5pt; color: #64748b; margin: 1mm 0 0; line-height: 1.45; }

    .fp-action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
      margin: 3mm 0 5mm;
    }
    .fp-action-card {
      border: 1px solid #e2e8f0;
      border-top: 3px solid #0284c7;
      border-radius: 6px;
      padding: 2.5mm 3mm;
      background: #f8fafc;
    }
    .fp-action-head { display: flex; justify-content: space-between; gap: 2mm; margin-bottom: 1.5mm; }
    .fp-action-priority { font-size: 7pt; font-weight: 800; color: #0284c7; }
    .fp-action-delay { font-size: 7pt; color: #059669; font-weight: 600; }
    .fp-action-title { font-size: 9pt; font-weight: 700; color: #0f172a; margin: 0 0 1mm; line-height: 1.4; }
    .fp-action-effect { font-size: 8pt; color: #64748b; margin: 0; line-height: 1.45; }

    .fp-method-list { font-size: 9pt; line-height: 1.65; }
    .fp-method-list li { margin: 2.5mm 0; }
    .fp-appendix-pre {
      font-family: inherit;
      font-size: 8.5pt;
      line-height: 1.7;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 3mm;
      white-space: pre-wrap;
      margin: 2mm 0 5mm;
    }

    .roadmap-item .fp-narrative { margin: 1mm 0 0; }
    .roadmap-item .fp-narrative p { font-size: 8.5pt; margin: 1.5mm 0; }

    @media print {
      [data-fp-page] .kpi-grid-4 { grid-template-columns: repeat(4, 1fr); }
    }
  `;
}

/** 서술 슬롯 placeholder가 포함된 보고서 본문(표지 포함) 생성 */
export function buildFpReportSkeleton(
  payload: FpReportPayload,
  generatedAt: string,
): string {
  return [
    buildCover(payload, generatedAt),
    buildExecPage(payload),
    buildStudentsPage(payload),
    buildPnlPage(payload),
    buildCashPage(payload),
    buildPerCapitaPage(payload),
    buildScenarioPage(payload),
    buildDiagnosisVerdictPage(payload),
    buildDiagnosisStructurePage(payload),
    buildStrategyDefensePage(payload),
    buildStrategyRoadmapPage(payload),
    buildAppendixPage(payload),
  ].join("\n");
}

/** 최종 HTML 문서 래핑 */
export function wrapFpReportHtml(args: {
  title: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(args.title)}</title>
  <style>${reportA4Styles()}\n${fpReportExtraStyles()}</style>
</head>
<body>
  <div class="report-shell">
    ${args.bodyHtml}
  </div>
</body>
</html>`;
}
