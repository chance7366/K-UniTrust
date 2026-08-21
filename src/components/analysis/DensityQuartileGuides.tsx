/** 밀도 분포 차트 — 사분위·평균 가이드 (화면 픽셀 획, 흰 외곽선) */

/**
 * 통계분석 화면과 같은 의미 방향.
 * KPI: 평균=민트, 중앙값=파랑, 위험군=빨강
 * 단계별: 고위험=빨강, 위험=주황, 양호=파랑, 여유=녹색
 */
export const DENSITY_GUIDE = {
  iqrFill: "#38BDF8",
  q1: "#F43F5E",
  median: "#3B82F6",
  q3: "#10B981",
  mean: "#3B9A6A",
} as const;

export function HaloLine({
  x,
  color,
  dashed,
  width = 2.5,
}: {
  x: number;
  color: string;
  dashed?: string;
  width?: number;
}) {
  return (
    <g>
      <line
        x1={x}
        y1="12"
        x2={x}
        y2="82"
        stroke="#ffffff"
        strokeWidth={width + 3.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={x}
        y1="12"
        x2={x}
        y2="82"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

export function DensityQuartileMarks({
  q1X,
  medianX,
  q3X,
  meanX,
}: {
  q1X: number;
  medianX: number;
  q3X: number;
  meanX: number;
}) {
  const iqrLeft = Math.min(q1X, q3X);
  const iqrWidth = Math.max(Math.abs(q3X - q1X), 0.35);

  return (
    <g aria-hidden="true">
      <rect
        x={iqrLeft}
        y="12"
        width={iqrWidth}
        height="70"
        fill={DENSITY_GUIDE.iqrFill}
        opacity={0.28}
      />
      <HaloLine x={q1X} color={DENSITY_GUIDE.q1} dashed="7 5" width={2.8} />
      <HaloLine x={q3X} color={DENSITY_GUIDE.q3} dashed="7 5" width={2.8} />
      <HaloLine x={meanX} color={DENSITY_GUIDE.mean} dashed="2 5" width={3.2} />
      <HaloLine x={medianX} color={DENSITY_GUIDE.median} width={3.8} />
    </g>
  );
}

function Swatch({
  color,
  dashed,
}: {
  color: string;
  dashed?: boolean;
}) {
  return (
    <span
      className="inline-block h-3.5 w-5 shrink-0 rounded-[1px] border border-white/80"
      style={{
        backgroundImage: dashed
          ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`
          : undefined,
        backgroundColor: dashed ? "transparent" : color,
        boxShadow: `0 0 0 1px ${color}55`,
      }}
    />
  );
}

export function DensityQuartileLegend({
  q1,
  median,
  q3,
  mean,
  formatPct,
}: {
  q1: number;
  median: number;
  q3: number;
  mean: number;
  formatPct: (v: number) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-border/70 bg-surface px-3 py-2 text-[12px] leading-none text-foreground shadow-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: DENSITY_GUIDE.iqrFill }}>
        <span
          className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm"
          style={{ background: `${DENSITY_GUIDE.iqrFill}55`, border: `1px solid ${DENSITY_GUIDE.iqrFill}` }}
        />
        중간 50% 구간
      </span>
      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: DENSITY_GUIDE.q1 }}>
        <Swatch color={DENSITY_GUIDE.q1} dashed />
        하위 25% {formatPct(q1)}
      </span>
      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: DENSITY_GUIDE.median }}>
        <Swatch color={DENSITY_GUIDE.median} />
        중앙값 {formatPct(median)}
      </span>
      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: DENSITY_GUIDE.q3 }}>
        <Swatch color={DENSITY_GUIDE.q3} dashed />
        상위 25% {formatPct(q3)}
      </span>
      <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: DENSITY_GUIDE.mean }}>
        <Swatch color={DENSITY_GUIDE.mean} dashed />
        평균 {formatPct(mean)}
      </span>
    </div>
  );
}

type PlotLabel = {
  id: string;
  x: number;
  label: string;
  color: string;
};

export function DensityQuartilePlotLabels({
  q1X,
  medianX,
  q3X,
  meanX,
  q1,
  median,
  q3,
  mean,
  formatPct,
}: {
  q1X: number;
  medianX: number;
  q3X: number;
  meanX: number;
  q1: number;
  median: number;
  q3: number;
  mean: number;
  formatPct: (v: number) => string;
}) {
  const items: PlotLabel[] = [
    { id: "q1", x: q1X, label: `하위 25% ${formatPct(q1)}`, color: DENSITY_GUIDE.q1 },
    { id: "q3", x: q3X, label: `상위 25% ${formatPct(q3)}`, color: DENSITY_GUIDE.q3 },
    { id: "mean", x: meanX, label: `평균 ${formatPct(mean)}`, color: DENSITY_GUIDE.mean },
    { id: "median", x: medianX, label: `중앙값 ${formatPct(median)}`, color: DENSITY_GUIDE.median },
  ].sort((a, b) => a.x - b.x);

  const tops: number[] = [];
  for (let i = 0; i < items.length; i++) {
    let top = 7;
    for (let j = 0; j < i; j++) {
      if (Math.abs(items[i].x - items[j].x) < 14) {
        top = Math.max(top, tops[j] + 15);
      }
    }
    tops.push(top);
  }

  return (
    <>
      {items.map((item, i) => (
        <span
          key={item.id}
          className="absolute whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold shadow-sm"
          style={{
            left: `${item.x}%`,
            top: `${tops[i]}%`,
            transform: "translateX(-50%)",
            color: item.color,
            background: "rgba(255,255,255,0.94)",
            border: `1.5px solid ${item.color}`,
          }}
        >
          {item.label}
        </span>
      ))}
    </>
  );
}
