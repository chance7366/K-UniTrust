import type {
  GroupIndexYearRow,
  IndicatorYearRow,
} from "@/lib/competitiveness-analysis/university-detail-data";
import type { UniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-gemini-report-prompt";
import { pillarChartData } from "@/lib/competitiveness-analysis/university-report/build-report-v2-screen-html";
import {
  CHART_COLORS,
  renderGapBarChartSvg,
  renderLineChartCard,
  renderLineChartSvg,
  renderPillarRadarChartSvg,
  renderQuadrantChartSvg,
  renderRadarChartSvg,
  renderScoreBarChartSvg,
  type LineChartSpec,
} from "@/lib/competitiveness-analysis/university-report/report-chart-svg";

const GROUP_CHARTS = [
  { key: "studentEnrollment" as const, label: "학생충원 지수" },
  { key: "univFinance" as const, label: "대학재정 지수" },
  { key: "corpFinance" as const, label: "법인재정 지수" },
  { key: "composite" as const, label: "종합지수" },
];

const INDICATOR_CHART_IDS: Record<string, { financeTabId: string; label: string }> = {
  "trend-freshman-enrollment-rate": {
    financeTabId: "freshman-enrollment-rate",
    label: "신입생충원율",
  },
  "trend-enrolled-enrollment-rate": {
    financeTabId: "enrolled-enrollment-rate",
    label: "재학생충원율",
  },
  "trend-dropout-rate": {
    financeTabId: "dropout-rate",
    label: "중도탈락율",
  },
  "trend-fund-secure-rate": {
    financeTabId: "fund-secure-rate",
    label: "자금확보율",
  },
  "trend-financial-support-benefit-rate": {
    financeTabId: "financial-support-benefit-rate",
    label: "재정지원수혜율",
  },
  "trend-tuition-dependency-rate": {
    financeTabId: "tuition-dependency-rate",
    label: "등록금의존율",
  },
  "trend-income-property-secure-rate": {
    financeTabId: "income-property-secure-rate",
    label: "수익용재산확보율",
  },
  "trend-corp-transfer-ratio": {
    financeTabId: "corp-transfer-ratio",
    label: "법인전입금비율",
  },
  "corp-transfer-ratio": {
    financeTabId: "corp-transfer-ratio",
    label: "법인전입금비율",
  },
};

function resolveChartId(chartId: string): string {
  if (INDICATOR_CHART_IDS[chartId]) return chartId;
  const withTrend = `trend-${chartId}`;
  if (INDICATOR_CHART_IDS[withTrend]) return withTrend;
  return chartId;
}

function scaleLabel(payload: UniversityReportPayload): string {
  return payload.scaleLabel ? `${payload.scaleLabel} 평균` : "규모 평균";
}

function groupChartSpec(
  rows: GroupIndexYearRow[],
  key: (typeof GROUP_CHARTS)[number]["key"],
  label: string,
  scaleName: string,
): LineChartSpec {
  const years = rows.map((row) => row.analysisYear);
  return {
    title: `${label} · 연도별 추세 (지수 0~100)`,
    years,
    yMin: 0,
    yMax: 100,
    // 전폭 1열 그리드 — 4개 차트가 A4 1장을 채우도록 낮은 종횡비 사용
    height: 160,
    series: [
      {
        id: "school",
        label: "선택 대학",
        color: CHART_COLORS.school,
        values: rows.map((row) => row[key]),
      },
      {
        id: "national",
        label: "전국 평균",
        color: CHART_COLORS.national,
        values: rows.map((row) => row.national[key]),
      },
      {
        id: "zone",
        label: "권역 평균",
        color: CHART_COLORS.zone,
        values: rows.map((row) => row.zone[key]),
      },
      {
        id: "sido",
        label: "시·도 평균",
        color: CHART_COLORS.sido,
        values: rows.map((row) => row.sido[key]),
      },
      {
        id: "scale",
        label: scaleName,
        color: CHART_COLORS.scale,
        values: rows.map((row) => row.scale[key]),
      },
    ],
  };
}

function indicatorChartSpec(
  rows: IndicatorYearRow[],
  label: string,
  scaleName: string,
): LineChartSpec {
  const years = rows.map((row) => row.analysisYear);
  return {
    title: `${label} · 연도별 지수 추세 (지수 0~100)`,
    years,
    yMin: 0,
    yMax: 100,
    // 지표 드릴다운 페이지 — 표 아래 여백을 차트가 채우도록 확대
    height: 300,
    series: [
      {
        id: "school",
        label: "선택 대학",
        color: CHART_COLORS.school,
        values: rows.map((row) =>
          row.dataMissing ? null : row.indexScore,
        ),
      },
      {
        id: "national",
        label: "전국 평균",
        color: CHART_COLORS.national,
        values: rows.map((row) => row.national.indexAvg),
      },
      {
        id: "zone",
        label: "권역 평균",
        color: CHART_COLORS.zone,
        values: rows.map((row) => row.zone.indexAvg),
      },
      {
        id: "sido",
        label: "시·도 평균",
        color: CHART_COLORS.sido,
        values: rows.map((row) => row.sido.indexAvg),
      },
      {
        id: "scale",
        label: scaleName,
        color: CHART_COLORS.scale,
        values: rows.map((row) => row.scale.indexAvg),
      },
    ],
  };
}

function buildChartHtml(
  chartId: string,
  payload: UniversityReportPayload,
): string | null {
  const resolvedId = resolveChartId(chartId);
  const scaleName = scaleLabel(payload);
  const groupRows = payload.groupIndexRows as GroupIndexYearRow[];
  const indicatorRowsById =
    payload.indicatorYearRowsById as Record<string, IndicatorYearRow[]>;

  if (resolvedId === "group-index-trend") {
    if (!groupRows.length) return null;
    const cards = GROUP_CHARTS.map((chart) =>
      renderLineChartCard(
        groupChartSpec(groupRows, chart.key, chart.label, scaleName),
      ),
    ).join("");
    return `<div class="report-chart-grid">${cards}</div>`;
  }

  if (resolvedId === "chart-pillar-radar") {
    const data = pillarChartData(payload);
    return renderPillarRadarChartSvg(data);
  }

  if (resolvedId === "chart-gap-bar" && payload.v2Analytics) {
    const items = payload.v2Analytics.indicatorCards.map((c) => ({
      label: c.indicatorLabel,
      gap: c.nationalGap,
    }));
    return renderGapBarChartSvg(items);
  }

  if (resolvedId === "chart-score-bar" && payload.v2Analytics) {
    const items = payload.v2Analytics.indicatorCards.map((c) => ({
      label: c.indicatorLabel,
      score: c.indexScore,
    }));
    return renderScoreBarChartSvg(items);
  }

  if (resolvedId === "chart-radar-balance" && payload.v2Analytics) {
    const v2 = payload.v2Analytics;
    return renderRadarChartSvg({
      school: v2.radarSchool,
      national: v2.radarNational,
      balanceIndex: v2.balanceIndex,
    });
  }

  if (resolvedId === "chart-strategic-quadrant" && payload.v2Analytics) {
    const v2 = payload.v2Analytics;
    return renderQuadrantChartSvg({
      studentScore: v2.studentSectorScore ?? 0,
      financeHealth: v2.financeHealthScore ?? 0,
      quadrantLabel: v2.strategicQuadrantLabel,
    });
  }

  const indicatorMeta = INDICATOR_CHART_IDS[resolvedId];
  if (indicatorMeta) {
    const rows = indicatorRowsById[indicatorMeta.financeTabId];
    if (!rows?.length) return null;
    return renderLineChartSvg(
      indicatorChartSpec(rows, indicatorMeta.label, scaleName),
    );
  }

  return null;
}

const PLACEHOLDER_RE =
  /<div\b[^>]*\bdata-chart-id="([^"]+)"[^>]*>[\s\S]*?<\/div>/gi;

/** Gemini 본문의 data-chart-id placeholder를 SVG 차트로 교체 */
export function injectReportCharts(
  html: string,
  payload: UniversityReportPayload,
): string {
  const injected = html.replace(PLACEHOLDER_RE, (match, chartId: string) => {
    const chartHtml = buildChartHtml(chartId, payload);
    return chartHtml ?? match;
  });
  const refreshed = refreshLineChartFigures(
    normalizeReportChartTitles(injected),
    payload,
  );
  return dedupeNestedReportCharts(refreshed);
}

const LINE_CHART_FIGURE_RE =
  /<figure class="report-chart" aria-label="([^"]*)">(?:(?!<figure)[\s\S])*?<\/figure>/g;

/**
 * 재주입 시 이미 렌더된 연도별 추세 line chart figure를 최신 스펙으로 재렌더링.
 * (placeholder가 아닌 완성 figure는 injectReportCharts로는 갱신되지 않음)
 */
function refreshLineChartFigures(
  html: string,
  payload: UniversityReportPayload,
): string {
  const scaleName = scaleLabel(payload);
  const groupRows = payload.groupIndexRows as GroupIndexYearRow[];
  const indicatorRowsById =
    payload.indicatorYearRowsById as Record<string, IndicatorYearRow[]>;

  return html.replace(LINE_CHART_FIGURE_RE, (match, ariaLabel: string) => {
    const groupMeta = GROUP_CHARTS.find((c) =>
      ariaLabel.startsWith(`${c.label} · 연도별 추세`),
    );
    if (groupMeta && groupRows.length) {
      return renderLineChartSvg(
        groupChartSpec(groupRows, groupMeta.key, groupMeta.label, scaleName),
      );
    }

    const indicatorMeta = Object.values(INDICATOR_CHART_IDS).find((meta) =>
      ariaLabel.startsWith(`${meta.label} · 연도별 지수 추세`),
    );
    if (indicatorMeta) {
      const rows = indicatorRowsById[indicatorMeta.financeTabId];
      if (rows?.length) {
        return renderLineChartSvg(
          indicatorChartSpec(rows, indicatorMeta.label, scaleName),
        );
      }
    }

    return match;
  });
}

/** Gemini·재주입 HTML에 남은 구형 차트 제목 보정 */
export function normalizeReportChartTitles(html: string): string {
  return html
    .replace(/수입·재산확보율 · 연도별 지수 추세/g, "수익용재산확보율 · 연도별 지수 추세")
    .replace(/수입·재산확보율/g, "수익용재산확보율");
}

/** reinject 등으로 생긴 report-chart 중첩 figure 정리 */
export function dedupeNestedReportCharts(html: string): string {
  let out = html;
  let prev = "";
  while (prev !== out) {
    prev = out;
    out = out.replace(
      /<figure class="report-chart"([^>]*)>\s*<figure class="report-chart"[^>]*>([\s\S]*?)<\/figure>\s*<\/figure>/gi,
      '<figure class="report-chart"$1>$2</figure>',
    );
  }
  return out;
}
