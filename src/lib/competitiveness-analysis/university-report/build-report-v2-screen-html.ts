import type { UniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-gemini-report-prompt";
import { buildReportV2InsightsHtml } from "@/lib/competitiveness-analysis/university-report/build-report-v2-insights-html";
import type { GroupIndexYearRow } from "@/lib/competitiveness-analysis/university-detail-data";
import {
  selectImprovementLevers,
  STRATEGIC_QUADRANT_LABELS,
  type IndicatorStatus,
  type IndicatorV2Card,
  type MomentumLabel,
  type StrategicQuadrantId,
} from "@/lib/competitiveness-analysis/university-v2-analytics";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtEnrolled(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.trunc(value).toLocaleString("ko-KR")}명`;
}

function statusBadge(status: IndicatorStatus): string {
  switch (status) {
    case "danger":
      return `<span class="badge badge-danger">Danger</span>`;
    case "warning":
      return `<span class="badge badge-warning">Warning</span>`;
    case "success":
      return `<span class="badge badge-strength">Strength</span>`;
    default:
      return `<span class="badge badge-neutral">—</span>`;
  }
}

function momentumText(label: MomentumLabel, delta: number | null): string {
  if (delta == null) return "—";
  const sign = delta > 0 ? "+" : "";
  const value = `${sign}${delta.toFixed(1)}p`;
  switch (label) {
    case "drop":
      return `${value} (급락)`;
    case "surge":
      return `${value} (급증)`;
    default:
      return `${value} (보류)`;
  }
}

function fmtRaw(card: IndicatorV2Card): string {
  if (card.rawValue == null) return "—";
  const v = card.rawValue;
  if (
    card.indicatorId.includes("rate") ||
    card.indicatorId.includes("ratio")
  ) {
    return `${v.toFixed(1)}%`;
  }
  return v.toFixed(1);
}

function rankPercentile(rank: number | null, cohort: number): string {
  if (rank == null || cohort <= 0) return "—";
  const pct = ((rank / cohort) * 100).toFixed(1);
  return `상위 ${pct}%`;
}

function quadrantCells(active: StrategicQuadrantId): string {
  const cells: {
    id: StrategicQuadrantId;
    roman: string;
    title: string;
    desc: string;
    tone: string;
  }[] = [
    {
      id: "fiscal-cushion",
      roman: "Ⅰ",
      title: "재정 우수형",
      desc: "재정자산 높음 · 충원율 낮음",
      tone: "neutral",
    },
    {
      id: "leader",
      roman: "Ⅱ",
      title: "안정 성장형",
      desc: "재정자산 높음 · 충원율 높음",
      tone: "positive",
    },
    {
      id: "compound-crisis",
      roman: "Ⅲ",
      title: "복합 구조위기형",
      desc: "재정·충원 모두 하위",
      tone: "crisis",
    },
    {
      id: "enrollment-strong",
      roman: "Ⅳ",
      title: "충원 중심형",
      desc: "재정자산 낮음 · 충원율 높음",
      tone: "neutral",
    },
  ];

  return cells
    .map((cell) => {
      const isActive = cell.id === active;
      const cls = isActive
        ? "quad-cell quad-cell-active"
        : `quad-cell quad-cell-${cell.tone}`;
      const pin = isActive
        ? `<span class="quad-pin">${escapeHtml("본교 위치")}</span>`
        : "";
      return `<div class="${cls}">${pin}<div class="quad-roman">${cell.roman}. ${escapeHtml(cell.title)}</div><div class="quad-desc">${escapeHtml(cell.desc)}</div></div>`;
    })
    .join("");
}

function strengthSummary(cards: IndicatorV2Card[]): string {
  return cards
    .filter((c) => c.status === "success")
    .slice(0, 2)
    .map((c) => `${c.indicatorLabel}(${c.rank}위)`)
    .join(" / ");
}

function dangerSummary(cards: IndicatorV2Card[]): string {
  const danger = cards.filter((c) => c.status === "danger");
  const byCat: Record<string, number> = {};
  for (const c of danger) {
    byCat[c.categoryLabel] = (byCat[c.categoryLabel] ?? 0) + 1;
  }
  return Object.entries(byCat)
    .map(([k, v]) => `${k} ${v}개`)
    .join(" · ");
}

function buildSwotSection(payload: UniversityReportPayload): string {
  const v2 = payload.v2Analytics;
  const s = v2.strengthIndicator;
  const w = v2.weakestIndicator;

  return `<div class="exec-panel">
  <div class="exec-panel-head">
    <span class="exec-eyebrow">Strategic Orientation</span>
    <h2 class="exec-h2">SWOT 기반 전략 실행 매트릭스 (2×2)</h2>
    <p class="exec-lead">내부 강·약점과 외부 기회·위협을 결합한 4대 실행 전략입니다. (보고서·PDF용 정적 전개)</p>
  </div>
  <div class="swot-grid">
    <article class="swot-card swot-so">
      <div class="swot-tag">SO · 강점 활용 — 기회 포착</div>
      <h3 class="swot-title">${s ? `${escapeHtml(s.indicatorLabel)} 기반 재투자` : "강점 지표 활용"}</h3>
      <p class="swot-body">${s ? `${escapeHtml(s.indicatorLabel)}(${s.rank}위) 등 상대 강점을 지역·산학 연계 기회와 연결합니다.` : "동종 상위 지표를 기회 영역과 연계합니다."}</p>
    </article>
    <article class="swot-card swot-st">
      <div class="swot-tag">ST · 강점 활용 — 위협 방어</div>
      <h3 class="swot-title">재정·자산 완충력 활용</h3>
      <p class="swot-body">학령인구 감소·충원 충격에 대비해 재정·자금 지표의 완충 역할을 극대화합니다.</p>
    </article>
    <article class="swot-card swot-wo">
      <div class="swot-tag">WO · 약점 보완 — 기회 포착</div>
      <h3 class="swot-title">${w ? escapeHtml(w.indicatorLabel) : "취약 지표"} 개선 · 국고·RISE 연계</h3>
      <p class="swot-body">${w ? `${escapeHtml(w.indicatorLabel)}(${w.rank}위) 등 취약 지표를 지자체·국고 사업 수주로 보완합니다.` : "취약 지표를 외부 지원 사업과 연계합니다."}</p>
    </article>
    <article class="swot-card swot-wt">
      <div class="swot-tag">WT · 약점 보완 — 위협 회피</div>
      <h3 class="swot-title">구조조정 · 충원·유지 통합 대응</h3>
      <p class="swot-body">${escapeHtml(v2.strategicQuadrantLabel)} 구간에 맞춰 정원·학과 구조조정과 이탈 방지를 병행합니다.</p>
    </article>
  </div>
</div>`;
}

function buildRoadmapSection(payload: UniversityReportPayload): string {
  const v2 = payload.v2Analytics;
  const shortItems = v2.shortTermTasks.map(
    (task, i) => `<article class="roadmap-item roadmap-short">
      <div class="roadmap-head">
        <span class="roadmap-phase">단기 긴급 (1년 이내)</span>
        <h3 class="roadmap-title">${escapeHtml(task)}</h3>
      </div>
      <p class="roadmap-body">우선순위 ${i === 0 ? "최상 (Urgent)" : "상 (High)"} · 즉시 이행·월간 모니터링</p>
    </article>`,
  );
  const midItems = v2.midLongTermTasks.map(
    (task) => `<article class="roadmap-item roadmap-mid">
      <div class="roadmap-head">
        <span class="roadmap-phase roadmap-phase-mid">중장기 구조 (2~3년)</span>
        <h3 class="roadmap-title">${escapeHtml(task)}</h3>
      </div>
      <p class="roadmap-body">중장기 핵심 과제 · 구조개혁·재정 건전성 로드맵 연계</p>
    </article>`,
  );

  return `<div class="exec-panel">
  <div class="exec-panel-head">
    <span class="exec-eyebrow">Action Roadmap</span>
    <h2 class="exec-h2">단계별 핵심 실행 로드맵</h2>
    <p class="exec-lead">${escapeHtml(payload.schoolName)} ${payload.analysisYear}년 진단 기반 단기·중장기 과제입니다.</p>
  </div>
  <div class="roadmap-list">${shortItems.join("")}${midItems.join("")}</div>
</div>`;
}

function pillarWeights(payload: UniversityReportPayload): string[] {
  const cw = payload.settingsAtRun.categoryWeights;
  const se = cw?.["student-enrollment"] ?? 50;
  const uf = cw?.["univ-finance"] ?? 40;
  const cf = cw?.["corp-finance"] ?? 10;
  return [
    `학생충원 (${se}%)`,
    `대학재정 (${uf}%)`,
    `법인재정 (${cf}%)`,
  ];
}

function currentGroupRow(
  payload: UniversityReportPayload,
): GroupIndexYearRow | undefined {
  return (payload.groupIndexRows as GroupIndexYearRow[]).find(
    (r) => r.analysisYear === payload.analysisYear,
  );
}

/** Executive Navy & Slate 대시보드 — Canvas v2.5 디자인 (A4·PDF 정적) */
export function buildReportV2ScreenHtml(payload: UniversityReportPayload): string {
  const v2 = payload.v2Analytics;
  const group = currentGroupRow(payload);
  const rankText =
    payload.compositeRank != null
      ? `${payload.compositeRank}위`
      : "순위 제외";
  const zoneLabel = payload.zone ?? "권역 미분류";
  const strengthList = strengthSummary(v2.indicatorCards);
  const dangerList = dangerSummary(v2.indicatorCards);

  const indicatorRows = v2.indicatorCards
    .map((card) => {
      const gap = card.nationalGap;
      const gapText =
        gap != null ? `${gap > 0 ? "+" : ""}${gap.toFixed(1)} p` : "—";
      const gapCls =
        gap != null && gap < 0 ? "text-risk" : gap != null && gap > 0 ? "text-success" : "";
      return `<tr>
        <td>${escapeHtml(card.categoryLabel)}</td>
        <td class="text-left font-semibold">${escapeHtml(card.indicatorLabel)}</td>
        <td>${fmtRaw(card)}</td>
        <td><strong>${card.indexScore?.toFixed(1) ?? "—"}</strong></td>
        <td>${card.rank ? `${card.rank}위` : "—"}</td>
        <td class="${gapCls}">${gapText}</td>
        <td>${momentumText(card.momentumLabel, card.momentum3y)}</td>
        <td>${statusBadge(card.status)}</td>
      </tr>`;
    })
    .join("\n");

  const gradeClass =
    payload.diagnosticGrade.charAt(0) === "E" ||
    payload.diagnosticGrade.charAt(0) === "D"
      ? "kpi-card kpi-risk"
      : "kpi-card kpi-neutral";

  return `<section class="report-v2-screen report-executive-dashboard" data-report-v2-screen="true" aria-label="Executive Dashboard v2.5">

  <header class="exec-report-header">
    <div class="exec-report-header-left">
      <span class="exec-brand">K-UniTrust v2.5</span>
      <span class="exec-report-title">${escapeHtml(payload.schoolName)} 대학경쟁력 진단 대시보드</span>
    </div>
    <div class="exec-report-header-right">
      <span>분석 ${payload.analysisYear}년</span>
      <span class="exec-header-sep">|</span>
      <span>${escapeHtml(payload.schoolCodeStd)}</span>
    </div>
  </header>

  <!-- §1 Executive Summary -->
  <div class="exec-panel">
    <div class="exec-panel-head exec-panel-head-split">
      <div>
        <span class="exec-eyebrow">Executive Summary</span>
        <h1 class="exec-h1">대학 종합 경쟁력 진단 총평</h1>
      </div>
      <div class="exec-meta-chips">
        <span>${escapeHtml(payload.region)} · ${escapeHtml(zoneLabel)}</span>
        <span class="exec-chip-sep">|</span>
        <span>${escapeHtml(payload.scaleLabel ?? "—")} (${fmtEnrolled(payload.enrolledTotal)})</span>
        <span class="exec-chip-sep">|</span>
        <span>${escapeHtml(payload.estb)} · ${escapeHtml(payload.schoolKind)}</span>
      </div>
    </div>

    <p class="exec-narrative">${escapeHtml(v2.oneLineSummary)} ${v2.strengthIndicator ? `핵심 강점은 ${escapeHtml(v2.strengthIndicator.indicatorLabel)}(${v2.strengthIndicator.rank}위)입니다.` : ""} 전략 포지셔닝은 <strong class="text-risk">${escapeHtml(v2.strategicQuadrantLabel)}</strong> 구간입니다.</p>

    <div class="kpi-grid-4">
      <div class="${gradeClass}">
        <div class="kpi-label">종합지수 / 진단등급</div>
        <div class="kpi-value">${payload.compositeIndex?.toFixed(1) ?? "—"} <span class="kpi-unit">점</span></div>
        <div class="kpi-pill kpi-pill-risk">${escapeHtml(payload.diagnosticGrade)}</div>
      </div>
      <div class="kpi-card kpi-neutral">
        <div class="kpi-label">동종 전국 순위</div>
        <div class="kpi-value">${rankText}</div>
        <div class="kpi-sub">${payload.cohortSize}개교 중 ${rankPercentile(payload.compositeRank, payload.cohortSize)}</div>
      </div>
      <div class="kpi-card kpi-risk">
        <div class="kpi-label">고위험 지표 (Danger)</div>
        <div class="kpi-value">${v2.highRiskIndicatorCount} <span class="kpi-unit">개</span></div>
        <div class="kpi-sub">${escapeHtml(dangerList || "—")}</div>
      </div>
      <div class="kpi-card kpi-strength">
        <div class="kpi-label">핵심 강점 (Strength)</div>
        <div class="kpi-value">${v2.strengthIndicatorCount} <span class="kpi-unit">개</span></div>
        <div class="kpi-sub">${escapeHtml(strengthList || "—")}</div>
      </div>
    </div>

    <div class="exec-split-charts">
      <div class="exec-split-left">
        <h3 class="exec-h3">대학 경쟁력 사분면 매트릭스</h3>
        <p class="exec-caption">X=학생충원 ${v2.studentSectorScore?.toFixed(1) ?? "—"} · Y=재정건전성 ${v2.financeHealthScore?.toFixed(1) ?? "—"}</p>
        <div class="quad-matrix">${quadrantCells(v2.strategicQuadrant)}</div>
        <p class="exec-caption">${escapeHtml(STRATEGIC_QUADRANT_LABELS[v2.strategicQuadrant].desc)}</p>
      </div>
      <div class="exec-split-right exec-chart-box">
        <div data-chart-id="chart-pillar-radar"></div>
      </div>
    </div>
  </div>
</section>

  <div class="page-break"></div>
  ${buildReportV2InsightsHtml(payload)}

  <div class="page-break"></div>
  <section class="report-v2-screen report-executive-dashboard report-v2-continued" data-report-v2-screen="true" aria-label="Executive Dashboard v2.5 (continued)">

  <!-- §2 Indicator Deep-Dive -->
  <div class="exec-panel">
    <div class="exec-panel-head">
      <span class="exec-eyebrow">Indicator Deep-Dive</span>
      <h2 class="exec-h2">8대 핵심 평가 지표 상세</h2>
      <p class="exec-lead">전국 평균 대비 Gap·환산지수·3년 모멘텀을 통합 검토합니다. Balance Index: <strong>${v2.balanceIndex?.toFixed(1) ?? "—"}</strong></p>
    </div>

    <div class="exec-split-charts">
      <div class="exec-chart-box"><div data-chart-id="chart-gap-bar"></div></div>
      <div class="exec-chart-box"><div data-chart-id="chart-score-bar"></div></div>
    </div>

    <div class="exec-table-wrap">
      <table class="data-table exec-indicator-table">
        <thead>
          <tr>
            <th>부문</th>
            <th>핵심 평가 지표</th>
            <th>원지표</th>
            <th>환산지수</th>
            <th>동종 순위</th>
            <th>전국 Gap</th>
            <th>3년 모멘텀</th>
            <th>위험도</th>
          </tr>
        </thead>
        <tbody>${indicatorRows}</tbody>
      </table>
    </div>
  </div>

  <!-- §3 Decision Insight (정적 — 화면 What-If 시뮬레이터 요약) -->
  <div class="exec-panel exec-panel-dark">
    <span class="exec-eyebrow exec-eyebrow-light">Decision Insight</span>
    <h2 class="exec-h2 exec-h2-light">지표 개선 우선순위 (What-If 시뮬레이션 가이드)</h2>
    <p class="exec-lead exec-lead-light">인터랙티브 슬라이더 시뮬레이터는 대학별경쟁력 화면에서 제공됩니다. 보고서에는 현재 진단 기준 우선 개선 3대 레버를 제시합니다.</p>
    <ul class="exec-priority-list">
      ${selectImprovementLevers(v2.indicatorCards)
        .map(
          (c) =>
            `<li><strong>${escapeHtml(c.indicatorLabel)}</strong> — Gap ${c.nationalGap?.toFixed(1) ?? "—"}p · ${c.rank}위 · ${momentumText(c.momentumLabel, c.momentum3y)}</li>`,
        )
        .join("")}
    </ul>
    <p class="exec-tip">💡 충원·재정지원 수혜 지표 개선이 종합지수 상승에 가장 큰 영향을 미칩니다. 구체 목표치는 AI·경영진 협의 후 설정하십시오.</p>
  </div>

  ${buildSwotSection(payload)}
  ${buildRoadmapSection(payload)}

</section>`;
}

const V2_SCREEN_RE =
  /<section\b[^>]*\bdata-report-v2-screen="true"[^>]*>[\s\S]*?<\/section>/gi;

const V2_INSIGHTS_RE =
  /<section\b[^>]*\bdata-report-v2-insights="true"[^>]*>[\s\S]*?<\/section>/gi;

export function stripReportV2Screen(html: string): string {
  return html.replace(V2_SCREEN_RE, "").trim();
}

export function stripReportV2Insights(html: string): string {
  return html.replace(V2_INSIGHTS_RE, "").trim();
}

const GEMINI_BODY_START_RE =
  /(?:<div class="report-body">|<h2 class="section-title">제1부)/i;

const V2_ORPHAN_MARKERS =
  /report-v2|exec-panel|exec-split|swot-|roadmap-|§[23]|Decision Insight|Strategic Orientation|Action Roadmap|Indicator Deep-Dive/i;

/** reinject용 — v2·Insights·연속 section 및 인접 page-break 제거 */
export function stripAllReportV2Blocks(html: string): string {
  let out = stripReportV2Insights(stripReportV2Screen(html));

  // 페이지 분할로 section이 깨진 경우 — Gemini 본문(제1부) 직전 v2 잔여물 제거
  const geminiStart = out.search(GEMINI_BODY_START_RE);
  if (geminiStart > 0 && V2_ORPHAN_MARKERS.test(out.slice(0, geminiStart))) {
    out = out.slice(geminiStart);
  }

  out = out.replace(/<section\b[^>]*\breport-v2(?:-continued)?[^>]*>\s*/gi, "");
  out = out.replace(/(?:<div class="page-break">\s*<\/div>\s*)+/gi, "");
  return out.trim();
}

export function injectReportV2Screen(
  html: string,
  payload: UniversityReportPayload,
): string {
  const cleaned = stripAllReportV2Blocks(html);
  return `${buildReportV2ScreenHtml(payload)}\n${cleaned}`;
}

/** chart-pillar-radar 주입용 부문 데이터 */
export function pillarChartData(payload: UniversityReportPayload): {
  labels: string[];
  school: number[];
  national: number[];
} {
  const group = currentGroupRow(payload);
  const labels = pillarWeights(payload);
  return {
    labels,
    school: [
      group?.studentEnrollment ?? 0,
      group?.univFinance ?? 0,
      group?.corpFinance ?? 0,
    ],
    national: [
      group?.national.studentEnrollment ?? 0,
      group?.national.univFinance ?? 0,
      group?.national.corpFinance ?? 0,
    ],
  };
}
