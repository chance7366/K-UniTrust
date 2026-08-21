import type { UniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-gemini-report-prompt";
import {
  STRATEGIC_QUADRANT_LABELS,
  type IndicatorStatus,
  type IndicatorV2Card,
} from "@/lib/competitiveness-analysis/university-v2-analytics";
import {
  renderQuadrantChartSvg,
  renderRadarChartSvg,
} from "@/lib/competitiveness-analysis/university-report/report-chart-svg";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status: IndicatorStatus): string {
  switch (status) {
    case "danger":
      return "Danger";
    case "warning":
      return "Warning";
    case "success":
      return "Strength";
    default:
      return "—";
  }
}

function sparklineSvg(values: number[]): string {
  if (values.length < 2) return `<span class="rv2-spark-empty">—</span>`;
  const w = 72;
  const h = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `<svg width="${w}" height="${h}" class="rv2-spark" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#0284c7" stroke-width="1.5" /></svg>`;
}

function gapBarHtml(gap: number | null): string {
  if (gap == null) return `<span class="rv2-gap-empty">—</span>`;
  const tone =
    gap >= 10 ? "pos" : gap <= -20 ? "neg" : gap <= -10 ? "warn" : "neu";
  const width = Math.min(100, Math.abs(gap) * 2);
  const text = `${gap > 0 ? "+" : ""}${gap.toFixed(1)}p`;
  return `<div class="rv2-gap"><div class="rv2-gap-fill rv2-gap-${tone}" style="width:${width}%"></div><span>${text}</span></div>`;
}

function indicatorCardHtml(card: IndicatorV2Card): string {
  const momentumCls =
    card.momentumLabel === "drop"
      ? "rv2-momentum-drop"
      : card.momentumLabel === "surge"
        ? "rv2-momentum-surge"
        : "";
  const momentumText =
    card.momentum3y != null
      ? `${card.momentum3y > 0 ? "+" : ""}${card.momentum3y.toFixed(1)}`
      : "—";

  return `<article class="rv2-indicator-card">
  <div class="rv2-indicator-head">
    <span>${escapeHtml(card.indicatorLabel)}</span>
    <span class="rv2-status rv2-status-${card.status}">${statusLabel(card.status)}</span>
  </div>
  <div class="rv2-indicator-metrics">
    <div><span class="rv2-metric-label">지수</span><strong>${card.indexScore?.toFixed(1) ?? "—"}</strong></div>
    <div><span class="rv2-metric-label">순위</span><strong>${card.rank ? `${card.rank}위` : "—"}</strong></div>
    <div><span class="rv2-metric-label">3년 Δ</span><strong class="${momentumCls}">${momentumText}</strong></div>
  </div>
  <div class="rv2-indicator-bottom">
    ${sparklineSvg(card.sparkline)}
    ${gapBarHtml(card.nationalGap)}
  </div>
</article>`;
}

/** 대시보드 UniversityV2InsightsPanel — A4·PDF 정적 HTML */
export function buildReportV2InsightsHtml(
  payload: UniversityReportPayload,
): string {
  const v2 = payload.v2Analytics;
  const radarChart = renderRadarChartSvg({
    school: v2.radarSchool,
    national: v2.radarNational,
    balanceIndex: v2.balanceIndex,
    title: "8대 지표 균형 (Radar)",
    hideBalance: true,
  });
  const quadrantChart = renderQuadrantChartSvg({
    studentScore: v2.studentSectorScore ?? 0,
    financeHealth: v2.financeHealthScore ?? 0,
    quadrantLabel: v2.strategicQuadrantLabel,
  });
  const balanceNote =
    v2.balanceIndex != null && v2.balanceIndex > 15
      ? " · 기형적 불균형"
      : "";
  const indicatorCards = v2.indicatorCards.map(indicatorCardHtml).join("\n");
  const shortTasks = v2.shortTermTasks
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join("");
  const midTasks = v2.midLongTermTasks
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join("");

  return `<section class="report-v2-insights rv2-panel" data-report-v2-insights="true" aria-label="Executive Summary v2 Insights">
  <div class="rv2-panel-head">
    <h2 class="rv2-title">Executive Summary · v2</h2>
    <p class="rv2-lead">3초 진단 · 레이더 · 포지셔닝 · 모멘텀 — 보고서 v2.0과 동일 데이터</p>
  </div>

  <div class="rv2-exec-cards">
    <div class="rv2-exec-card rv2-exec-grade">
      <p class="rv2-exec-label">종합 진단</p>
      <p class="rv2-exec-value">${payload.compositeIndex?.toFixed(1) ?? "—"}</p>
      <p class="rv2-exec-sub">${escapeHtml(payload.diagnosticGrade)} · ${payload.cohortSize}개교 중</p>
    </div>
    <div class="rv2-exec-card rv2-exec-strength">
      <p class="rv2-exec-label">핵심 강점</p>
      <p class="rv2-exec-value rv2-exec-value-sm">${escapeHtml(v2.strengthIndicator?.indicatorLabel ?? "—")}</p>
      <p class="rv2-exec-sub">${v2.strengthIndicator?.rank ? `${v2.strengthIndicator.rank}위` : "—"}</p>
    </div>
    <div class="rv2-exec-card rv2-exec-risk">
      <p class="rv2-exec-label">고위험 경보</p>
      <p class="rv2-exec-value rv2-exec-value-risk">${v2.highRiskIndicatorCount}개</p>
      <p class="rv2-exec-sub">${escapeHtml(v2.weakestIndicator?.indicatorLabel ?? "—")}</p>
    </div>
  </div>

  <div class="rv2-callout">${escapeHtml(v2.oneLineSummary)}</div>

  <div class="rv2-grid-2">
    <div class="rv2-card">
      <h3 class="rv2-h4">8대 지표 균형 (Radar)</h3>
      <div class="rv2-chart-slot">${radarChart}</div>
      <p class="rv2-caption">Balance Index: <strong>${v2.balanceIndex?.toFixed(1) ?? "—"}</strong>${balanceNote}</p>
    </div>
    <div class="rv2-card">
      <h3 class="rv2-h4">전략 포지셔닝 4분면</h3>
      <div class="rv2-chart-slot">${quadrantChart}</div>
      <p class="rv2-caption">${escapeHtml(STRATEGIC_QUADRANT_LABELS[v2.strategicQuadrant].desc)}</p>
    </div>
  </div>

  <h3 class="rv2-h4 rv2-section-gap">8대 지표 콤팩트 카드</h3>
  <div class="rv2-indicator-grid">${indicatorCards}</div>

  <h3 class="rv2-h4 rv2-section-gap">실행 로드맵 (규칙 기반 초안 · 보고서 AI 보강)</h3>
  <div class="rv2-roadmap">
    <div class="rv2-roadmap-col">
      <strong>단기 긴급 (1년)</strong>
      <ul>${shortTasks}</ul>
    </div>
    <div class="rv2-roadmap-col">
      <strong>중장기 구조 (2~3년)</strong>
      <ul>${midTasks}</ul>
    </div>
  </div>
</section>`;
}
