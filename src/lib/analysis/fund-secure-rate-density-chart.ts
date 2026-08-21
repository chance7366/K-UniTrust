export type DensityPoint = {
  rate: number;
  count: number;
};

export type FundSecureRateDensityStats = {
  points: DensityPoint[];
  q1: number;
  median: number;
  q3: number;
  mean: number;
  schoolCount: number;
  outlierCount: number;
  highPerformerCount: number;
  below100Count: number;
  /** 차트 렌더·축 표시용 (극단값 캡) */
  displayXMin: number;
  displayXMax: number;
  /** 실제 데이터 최대값 (표시 범위 초과 시 안내) */
  rawMax: number;
  xTicks: number[];
  yMax: number;
};

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function smoothCounts(points: DensityPoint[]): DensityPoint[] {
  return points.map((p, i) => {
    const prev = points[i - 1]?.count ?? p.count;
    const next = points[i + 1]?.count ?? p.count;
    const prev2 = points[i - 2]?.count ?? prev;
    const next2 = points[i + 2]?.count ?? next;
    return {
      rate: p.rate,
      count: (prev2 + prev * 2 + p.count * 4 + next * 2 + next2) / 10,
    };
  });
}

function chooseXStep(span: number): number {
  if (span <= 120) return 20;
  if (span <= 200) return 25;
  if (span <= 280) return 40;
  return 50;
}

export function buildDensityXTicks(xMin: number, xMax: number): number[] {
  const step = chooseXStep(xMax - xMin);
  const ticks: number[] = [];
  if (xMin <= 0) ticks.push(0);
  for (let v = step; v <= xMax; v += step) {
    ticks.push(v);
  }
  if (ticks[ticks.length - 1] !== xMax && xMax - (ticks[ticks.length - 1] ?? 0) > step * 0.4) {
    ticks.push(xMax);
  }
  return ticks;
}

export type RateDensityScale = {
  displayXMin: number;
  displayXMax: number;
  binWidth: number;
};

const DEFAULT_DENSITY_SCALE: RateDensityScale = {
  displayXMin: -50,
  displayXMax: 300,
  binWidth: 2,
};

function resolveDisplayBounds(
  sorted: number[],
  scale?: Partial<RateDensityScale>,
): { displayXMin: number; displayXMax: number; binWidth: number } {
  if (scale?.displayXMin != null && scale?.displayXMax != null && scale?.binWidth) {
    return {
      displayXMin: scale.displayXMin,
      displayXMax: scale.displayXMax,
      binWidth: scale.binWidth,
    };
  }

  const rawMin = sorted[0] ?? 0;
  const p95 = percentile(sorted, 0.95);
  const displayXMin = Math.max(-50, Math.min(0, Math.floor(rawMin / 10) * 10));
  const displayXMax = Math.min(
    300,
    Math.max(220, Math.ceil(Math.max(p95, 150) / 20) * 20),
  );
  return {
    displayXMin,
    displayXMax,
    binWidth: DEFAULT_DENSITY_SCALE.binWidth,
  };
}

/** 자금확보율 분포 — KDE 근사(히스토그램+스무딩) + 중앙값·평균·이상치 통계 */
export function buildFundSecureRateDensity(
  rates: number[],
  scale?: Partial<RateDensityScale>,
): FundSecureRateDensityStats | null {
  if (!rates.length) return null;

  const sorted = [...rates].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const median = percentile(sorted, 0.5);
  const q3 = percentile(sorted, 0.75);
  const mean = sorted.reduce((s, v) => s + v, 0) / rates.length;
  const schoolCount = rates.length;
  const outlierCount = rates.filter((r) => r >= 150).length;
  const highPerformerCount = rates.filter((r) => r >= 120).length;
  const below100Count = rates.filter((r) => r < 100).length;

  const rawMax = sorted[sorted.length - 1] ?? 200;
  const { displayXMin, displayXMax, binWidth } = resolveDisplayBounds(sorted, scale);
  const bins: DensityPoint[] = [];
  for (let start = displayXMin; start < displayXMax; start += binWidth) {
    const end = start + binWidth;
    const center = start + binWidth / 2;
    const count =
      end >= displayXMax
        ? rates.filter((r) => r >= start).length
        : rates.filter((r) => r >= start && r < end).length;
    bins.push({ rate: center, count });
  }

  const points = smoothCounts(bins);
  const yMax = Math.max(...points.map((p) => p.count), 1);
  const xTicks = buildDensityXTicks(displayXMin, displayXMax);

  return {
    points,
    q1: Math.round(q1 * 10) / 10,
    median: Math.round(median * 10) / 10,
    q3: Math.round(q3 * 10) / 10,
    mean: Math.round(mean * 10) / 10,
    schoolCount,
    outlierCount,
    highPerformerCount,
    below100Count,
    displayXMin,
    displayXMax,
    rawMax: Math.round(rawMax * 10) / 10,
    xTicks,
    yMax,
  };
}
