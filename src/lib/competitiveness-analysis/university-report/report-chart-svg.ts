const CHART_COLORS = {
  school: "#059669",
  national: "#2563eb",
  zone: "#d97706",
  sido: "#7c3aed",
  scale: "#0ea5e9",
} as const;

export type ChartSeries = {
  id: string;
  label: string;
  color: string;
  values: Array<number | null>;
};

export type LineChartSpec = {
  title: string;
  years: number[];
  series: ChartSeries[];
  yMin?: number;
  yMax?: number;
  width?: number;
  height?: number;
};

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function finiteValues(series: ChartSeries[]): number[] {
  const out: number[] = [];
  for (const item of series) {
    for (const value of item.values) {
      if (value != null && Number.isFinite(value)) out.push(value);
    }
  }
  return out;
}

function buildPolyline(
  values: Array<number | null>,
  xAt: (index: number) => number,
  yAt: (value: number) => number,
): string | null {
  const segments: string[] = [];
  let current: string[] = [];

  values.forEach((value, index) => {
    if (value == null || Number.isNaN(value)) {
      if (current.length >= 2) segments.push(current.join(" "));
      current = [];
      return;
    }
    current.push(`${xAt(index).toFixed(2)},${yAt(value).toFixed(2)}`);
  });

  if (current.length >= 2) segments.push(current.join(" "));
  if (!segments.length) return null;
  return segments.map((points) => `<polyline fill="none" stroke-width="2" points="${points}" />`).join("");
}

export function renderLineChartSvg(spec: LineChartSpec): string {
  const width = spec.width ?? 760;
  const height = spec.height ?? 220;
  const pad = { top: 28, right: 16, bottom: 34, left: 42 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const values = finiteValues(spec.series);
  const autoMin = values.length ? Math.min(...values) : 0;
  const autoMax = values.length ? Math.max(...values) : 100;
  const yMin = spec.yMin ?? Math.max(0, Math.floor(autoMin / 10) * 10 - 5);
  const yMax = spec.yMax ?? Math.min(100, Math.ceil(autoMax / 10) * 10 + 5);
  const ySpan = Math.max(yMax - yMin, 1);

  const years = spec.years;
  const xAt = (index: number) =>
    pad.left + (years.length <= 1 ? plotW / 2 : (index / (years.length - 1)) * plotW);
  const yAt = (value: number) =>
    pad.top + plotH - ((value - yMin) / ySpan) * plotH;

  const gridLines: string[] = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i += 1) {
    const value = yMin + (ySpan / tickCount) * i;
    const y = yAt(value);
    gridLines.push(
      `<line x1="${pad.left}" y1="${y.toFixed(2)}" x2="${(pad.left + plotW).toFixed(2)}" y2="${y.toFixed(2)}" stroke="#e2e8f0" stroke-width="1" />`,
      `<text x="${(pad.left - 6).toFixed(2)}" y="${(y + 3).toFixed(2)}" text-anchor="end" font-size="10" fill="#64748b">${value.toFixed(0)}</text>`,
    );
  }

  const xLabels = years
    .map(
      (year, index) =>
        `<text x="${xAt(index).toFixed(2)}" y="${(height - 10).toFixed(2)}" text-anchor="middle" font-size="10" fill="#64748b">${year}</text>`,
    )
    .join("");

  const seriesSvg = spec.series
    .map((item) => {
      const polylines = buildPolyline(item.values, xAt, yAt);
      if (!polylines) return "";
      return polylines.replace(
        /stroke-width="2"/g,
        `stroke="${item.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`,
      );
    })
    .join("");

  const dots = spec.series
    .flatMap((item) =>
      item.values.map((value, index) => {
        if (value == null || Number.isNaN(value)) return "";
        return `<circle cx="${xAt(index).toFixed(2)}" cy="${yAt(value).toFixed(2)}" r="2.8" fill="${item.color}" />`;
      }),
    )
    .join("");

  const legend = spec.series
    .map(
      (item) =>
        `<span class="report-chart-legend-item"><span class="report-chart-legend-swatch" style="background:${item.color}"></span>${escapeSvgText(item.label)}</span>`,
    )
    .join("");

  return `<figure class="report-chart" aria-label="${escapeSvgText(spec.title)}">
  <div class="report-chart-title">${escapeSvgText(spec.title)}</div>
  <svg viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
    ${gridLines.join("")}
    <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${(pad.top + plotH).toFixed(2)}" stroke="#94a3b8" stroke-width="1" />
    <line x1="${pad.left}" y1="${(pad.top + plotH).toFixed(2)}" x2="${(pad.left + plotW).toFixed(2)}" y2="${(pad.top + plotH).toFixed(2)}" stroke="#94a3b8" stroke-width="1" />
    ${seriesSvg}
    ${dots}
    ${xLabels}
  </svg>
  <div class="report-chart-legend">${legend}</div>
</figure>`;
}

export function renderLineChartCard(spec: LineChartSpec): string {
  return `<div class="report-chart-card">${renderLineChartSvg(spec)}</div>`;
}

/** 화면 v2 · 보고서 콤팩트 카드용 미니 스파크라인 */
export function renderSparklineSvg(values: number[]): string {
  if (values.length < 2) return "—";
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
  return `<svg class="report-sparkline" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#0284c7" stroke-width="1.5" /></svg>`;
}

export function renderPillarRadarChartSvg(args: {
  labels: string[];
  school: number[];
  national: number[];
}): string {
  const school = args.labels.map((label, i) => ({
    label,
    value: args.school[i] ?? 0,
  }));
  const national = args.labels.map((label, i) => ({
    label,
    value: args.national[i] ?? 0,
  }));
  return renderRadarChartSvg({
    school,
    national,
    balanceIndex: null,
    title: "3대 핵심 부문별 환산 점수 균형도",
    hideBalance: true,
  });
}

export function renderGapBarChartSvg(
  items: { label: string; gap: number | null }[],
): string {
  const width = 360;
  const height = 280;
  const pad = { top: 14, right: 10, bottom: 30, left: 28 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const gaps = items.map((i) => i.gap ?? 0);
  const maxAbs = Math.max(20, ...gaps.map((g) => Math.abs(g)));
  const barW = plotW / Math.max(items.length, 1) - 5;
  const zeroY = pad.top + plotH / 2;
  const labelY = pad.top + plotH + 18;

  const bars = items
    .map((item, i) => {
      const gap = item.gap ?? 0;
      const x = pad.left + i * (plotW / items.length) + 2.5;
      const h = (Math.abs(gap) / maxAbs) * (plotH / 2 - 2);
      const y = gap >= 0 ? zeroY - h : zeroY;
      const color = gap < 0 ? "#EF4444" : "#10B981";
      const label =
        item.label.length > 7 ? `${item.label.slice(0, 6)}…` : item.label;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" fill="${color}" rx="3" />
        <text x="${(x + barW / 2).toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="9" fill="#64748b">${escapeSvgText(label)}</text>`;
    })
    .join("");

  return `<figure class="report-chart" aria-label="전국 평균 대비 격차">
  <div class="report-chart-title">지표별 전국 평균 대비 격차 (Gap p)</div>
  <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img">
    <line x1="${pad.left}" y1="${zeroY.toFixed(1)}" x2="${(pad.left + plotW).toFixed(1)}" y2="${zeroY.toFixed(1)}" stroke="#94a3b8" stroke-width="1.2" />
    ${bars}
  </svg>
</figure>`;
}

export function renderScoreBarChartSvg(
  items: { label: string; score: number | null }[],
): string {
  const width = 360;
  const height = 280;
  const pad = { top: 10, right: 12, bottom: 8, left: 82 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const rowH = plotH / Math.max(items.length, 1);
  const barH = Math.max(rowH - 6, 8);

  const bars = items
    .map((item, i) => {
      const score = item.score ?? 0;
      const y = pad.top + i * rowH + (rowH - barH) / 2;
      const w = (score / 100) * plotW;
      const label =
        item.label.length > 9 ? `${item.label.slice(0, 8)}…` : item.label;
      return `<text x="${(pad.left - 5).toFixed(1)}" y="${(y + barH / 2 + 3.5).toFixed(1)}" text-anchor="end" font-size="9" fill="#475569">${escapeSvgText(label)}</text>
        <rect x="${pad.left}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${barH.toFixed(1)}" fill="#0284C7" rx="3" />
        <text x="${(pad.left + w + 5).toFixed(1)}" y="${(y + barH / 2 + 3.5).toFixed(1)}" font-size="9" fill="#0f172a">${score.toFixed(1)}</text>`;
    })
    .join("");

  return `<figure class="report-chart" aria-label="환산 지수">
  <div class="report-chart-title">지표별 환산 점수 (100점 만점)</div>
  <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img">
    ${bars}
  </svg>
</figure>`;
}

export function renderRadarChartSvg(args: {
  school: { label: string; value: number }[];
  national: { label: string; value: number }[];
  balanceIndex: number | null;
  title?: string;
  hideBalance?: boolean;
}): string {
  const width = 360;
  const height = 320;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = 110;
  const n = args.school.length;
  if (!n) return "";

  const angleAt = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI) / n;
  const pointAt = (i: number, value: number) => {
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    const a = angleAt(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const gridLevels = [25, 50, 75, 100];
  const grids = gridLevels
    .map((level) => {
      const pts = Array.from({ length: n }, (_, i) => {
        const p = pointAt(i, level);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1" />`;
    })
    .join("");

  const axes = Array.from({ length: n }, (_, i) => {
    const p = pointAt(i, 100);
    const label = escapeSvgText(args.school[i]?.label ?? "");
    const lx = cx + (radius + 18) * Math.cos(angleAt(i));
    const ly = cy + (radius + 14) * Math.sin(angleAt(i));
    return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#cbd5e1" stroke-width="1" />
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="9" fill="#64748b">${label}</text>`;
  }).join("");

  const poly = (values: number[], color: string, fillOpacity: number) => {
    const pts = values
      .map((v, i) => {
        const p = pointAt(i, v);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");
    return `<polygon points="${pts}" fill="${color}" fill-opacity="${fillOpacity}" stroke="${color}" stroke-width="2" />`;
  };

  const schoolVals = args.school.map((s) => s.value);
  const nationalVals = args.national.map((s) => s.value);

  const titleText =
    args.title ??
    `8대 지표 균형 (본교 vs 전국)${args.hideBalance ? "" : ` · Balance ${args.balanceIndex?.toFixed(1) ?? "—"}`}`;

  return `<figure class="report-chart" aria-label="레이더 차트">
  <div class="report-chart-title">${escapeSvgText(titleText)}</div>
  <svg viewBox="0 0 ${width} ${height}" role="img">
    ${grids}
    ${axes}
    ${poly(nationalVals, "#0284C7", 0.12)}
    ${poly(schoolVals, "#DC2626", 0.2)}
  </svg>
  <div class="report-chart-legend">
    <span class="report-chart-legend-item"><span class="report-chart-legend-swatch" style="background:#DC2626"></span>선택 대학</span>
    <span class="report-chart-legend-item"><span class="report-chart-legend-swatch" style="background:#0284C7"></span>전국 평균</span>
  </div>
</figure>`;
}

export function renderQuadrantChartSvg(args: {
  studentScore: number;
  financeHealth: number;
  quadrantLabel: string;
}): string {
  const width = 320;
  const height = 240;
  const pad = 28;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const x = pad + (Math.max(0, Math.min(100, args.studentScore)) / 100) * plotW;
  const y = pad + plotH - (Math.max(0, Math.min(100, args.financeHealth)) / 100) * plotH;

  return `<figure class="report-chart" aria-label="전략 포지셔닝">
  <div class="report-chart-title">전략 포지셔닝 4분면 · ${escapeSvgText(args.quadrantLabel)}</div>
  <svg viewBox="0 0 ${width} ${height}" role="img">
    <rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}" fill="#f8fafc" stroke="#cbd5e1" />
    <line x1="${pad + plotW / 2}" y1="${pad}" x2="${pad + plotW / 2}" y2="${pad + plotH}" stroke="#94a3b8" stroke-dasharray="4" />
    <line x1="${pad}" y1="${pad + plotH / 2}" x2="${pad + plotW}" y2="${pad + plotH / 2}" stroke="#94a3b8" stroke-dasharray="4" />
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#DC2626" stroke="#fff" stroke-width="2" />
    <text x="${pad + 4}" y="${pad + 12}" font-size="8" fill="#64748b">충원↑</text>
    <text x="${pad + plotW - 4}" y="${pad + plotH - 4}" text-anchor="end" font-size="8" fill="#64748b">재정→</text>
  </svg>
</figure>`;
}

export { CHART_COLORS };
