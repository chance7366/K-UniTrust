/** 학생충원 보고서용 SVG 시계열 차트 */

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type SfaChartSeries = {
  id: string;
  label: string;
  color: string;
  values: Array<number | null>;
};

function finite(values: Array<number | null | undefined>): number[] {
  return values.filter((n): n is number => n != null && Number.isFinite(n));
}

function yDomain(values: number[]): { min: number; max: number } {
  if (!values.length) return { min: 0, max: 100 };
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max(2, (rawMax - rawMin) * 0.12);
  const min = Math.max(0, Math.floor((rawMin - pad) / 5) * 5);
  const max = Math.ceil((rawMax + pad) / 5) * 5;
  return { min, max: max <= min ? min + 10 : max };
}

function yTicks(min: number, max: number): number[] {
  const span = max - min;
  const step = span <= 20 ? 5 : span <= 50 ? 10 : 20;
  const ticks: number[] = [];
  for (let v = min; v <= max + 0.01; v += step) ticks.push(Number(v.toFixed(1)));
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

export function renderSfaLineChart(args: {
  title: string;
  categories: string[];
  series: SfaChartSeries[];
  width?: number;
  height?: number;
  hideLegend?: boolean;
}): string {
  const width = args.width ?? 720;
  const height = args.height ?? 200;
  const pad = { top: 12, right: 14, bottom: 28, left: 38 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const { min, max } = yDomain(args.series.flatMap((item) => finite(item.values)));
  const span = Math.max(max - min, 1);
  const n = Math.max(args.categories.length, 1);
  const xAt = (i: number) =>
    pad.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => pad.top + plotH - ((v - min) / span) * plotH;

  const grid = yTicks(min, max)
    .map((tick) => {
      const y = yAt(tick);
      return `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${(pad.left + plotW).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2e8f0" />
        <text x="${(pad.left - 5).toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#64748b">${tick.toFixed(0)}</text>`;
    })
    .join("");

  const xLabels = args.categories
    .map(
      (label, i) =>
        `<text x="${xAt(i).toFixed(1)}" y="${(height - 8).toFixed(1)}" text-anchor="middle" font-size="9" fill="#64748b">${esc(label)}</text>`,
    )
    .join("");

  const lines = args.series
    .map((item) => {
      const pts: string[] = [];
      const dots: string[] = [];
      item.values.forEach((value, i) => {
        if (value == null || !Number.isFinite(value)) return;
        const x = xAt(i).toFixed(1);
        const y = yAt(value).toFixed(1);
        pts.push(`${x},${y}`);
        dots.push(`<circle cx="${x}" cy="${y}" r="2.6" fill="${item.color}" />`);
      });
      if (pts.length < 2) return dots.join("");
      return `<polyline points="${pts.join(" ")}" fill="none" stroke="${item.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />${dots.join("")}`;
    })
    .join("");

  const legend = args.hideLegend
    ? ""
    : `<div class="report-chart-legend">${args.series
        .map(
          (item) =>
            `<span class="report-chart-legend-item"><span class="report-chart-legend-swatch" style="background:${item.color}"></span>${esc(item.label)}</span>`,
        )
        .join("")}</div>`;

  return `<figure class="report-chart" aria-label="${esc(args.title)}">
  <div class="report-chart-title">${esc(args.title)}</div>
  <svg viewBox="0 0 ${width} ${height}" role="img">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#fff" />
    ${grid}
    <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#94a3b8" />
    <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="#94a3b8" />
    ${lines}
    ${xLabels}
  </svg>
  ${legend}
</figure>`;
}

