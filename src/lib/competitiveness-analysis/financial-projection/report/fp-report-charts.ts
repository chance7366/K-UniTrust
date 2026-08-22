/** 재정추계 보고서 전용 SVG 차트 — 음수·억원 축 지원, 서버 렌더링 */

export type FpChartSeries = {
  label: string;
  color: string;
  type: "line" | "bar";
  values: Array<number | null>;
  dashed?: boolean;
};

export type FpChartSpec = {
  title: string;
  years: number[];
  series: FpChartSeries[];
  unit: string;
  width?: number;
  height?: number;
  /** 세로 기준선을 그릴 연도 (예: 가용고갈 연도) */
  markerYear?: number | null;
  markerLabel?: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function niceStep(span: number): number {
  const raw = span / 5;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-6)));
  const unit = raw / pow;
  if (unit <= 1) return pow;
  if (unit <= 2) return 2 * pow;
  if (unit <= 5) return 5 * pow;
  return 10 * pow;
}

function fmtTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}천`;
  return `${Math.round(v * 10) / 10}`;
}

export function renderFpChartSvg(spec: FpChartSpec): string {
  const width = spec.width ?? 720;
  const height = spec.height ?? 235;
  const pad = { top: 14, right: 14, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const finite = spec.series
    .flatMap((s) => s.values)
    .filter((v): v is number => v != null && Number.isFinite(v));
  let min = finite.length ? Math.min(...finite, 0) : 0;
  let max = finite.length ? Math.max(...finite, 0) : 100;
  if (min === max) max = min + 1;
  const step = niceStep(max - min);
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;
  const span = max - min || 1;

  const n = spec.years.length;
  const xAt = (i: number) =>
    pad.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => pad.top + plotH - ((v - min) / span) * plotH;

  const parts: string[] = [];

  for (let v = min; v <= max + step / 2; v += step) {
    const y = yAt(v);
    parts.push(
      `<line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${width - pad.right}" y2="${y.toFixed(1)}" stroke="${v === 0 ? "#94a3b8" : "#e2e8f0"}" stroke-width="${v === 0 ? 1.4 : 1}" />`,
      `<text x="${pad.left - 5}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="8.5" fill="#64748b">${fmtTick(v)}</text>`,
    );
  }

  const tickEvery = Math.max(1, Math.ceil(n / 10));
  spec.years.forEach((year, i) => {
    if (i % tickEvery !== 0 && i !== n - 1) return;
    parts.push(
      `<text x="${xAt(i).toFixed(1)}" y="${height - 24}" text-anchor="middle" font-size="8.5" fill="#64748b">${year}</text>`,
    );
  });

  if (spec.markerYear != null) {
    const idx = spec.years.indexOf(spec.markerYear);
    if (idx >= 0) {
      const x = xAt(idx);
      parts.push(
        `<line x1="${x.toFixed(1)}" y1="${pad.top}" x2="${x.toFixed(1)}" y2="${pad.top + plotH}" stroke="#dc2626" stroke-width="1.2" stroke-dasharray="4 3" />`,
      );
      if (spec.markerLabel) {
        const anchor = idx > n * 0.7 ? "end" : "start";
        const dx = idx > n * 0.7 ? -4 : 4;
        parts.push(
          `<text x="${(x + dx).toFixed(1)}" y="${pad.top + 9}" text-anchor="${anchor}" font-size="8" font-weight="700" fill="#dc2626">${esc(spec.markerLabel)}</text>`,
        );
      }
    }
  }

  const barSeries = spec.series.filter((s) => s.type === "bar");
  const groupW = n > 0 ? plotW / n : plotW;
  const barW = Math.max(
    2,
    Math.min(14, (groupW * 0.62) / Math.max(barSeries.length, 1)),
  );
  barSeries.forEach((series, bi) => {
    series.values.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) return;
      const cx = xAt(i);
      const x =
        cx - (barSeries.length * barW) / 2 + bi * barW;
      const y0 = yAt(0);
      const y1 = yAt(v);
      const top = Math.min(y0, y1);
      const h = Math.max(Math.abs(y0 - y1), 0.5);
      parts.push(
        `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${series.color}" opacity="0.85" rx="1" />`,
      );
    });
  });

  for (const series of spec.series) {
    if (series.type !== "line") continue;
    const pts: string[] = [];
    series.values.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) return;
      pts.push(`${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`);
    });
    if (pts.length < 2) continue;
    parts.push(
      `<polyline points="${pts.join(" ")}" fill="none" stroke="${series.color}" stroke-width="2"${series.dashed ? ' stroke-dasharray="5 3"' : ""} stroke-linejoin="round" stroke-linecap="round" />`,
    );
  }

  const legend = spec.series
    .map(
      (s) =>
        `<span class="report-chart-legend-item"><span class="report-chart-legend-swatch" style="background:${s.color}"></span>${esc(s.label)}</span>`,
    )
    .join("");

  return `<figure class="report-chart" aria-label="${esc(spec.title)}">
  <div class="report-chart-title">${esc(spec.title)} <span style="font-weight:400;color:#94a3b8">(단위: ${esc(spec.unit)})</span></div>
  <svg viewBox="0 0 ${width} ${height}" role="img" preserveAspectRatio="xMidYMid meet">${parts.join("")}</svg>
  <div class="report-chart-legend">${legend}</div>
</figure>`;
}
