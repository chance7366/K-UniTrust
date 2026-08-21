"use client";

import { useMemo } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";
import {
  buildUniversityV2Analytics,
  STRATEGIC_QUADRANT_LABELS,
  type IndicatorStatus,
  type IndicatorV2Card,
  type UniversityV2Analytics,
} from "@/lib/competitiveness-analysis/university-v2-analytics";
import type {
  GroupIndexYearRow,
  IndicatorYearRow,
} from "@/lib/competitiveness-analysis/university-detail-data";

import "./university-v2-insights.css";

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

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="uv2-spark-empty">—</span>;
  const w = 72;
  const h = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="uv2-spark" aria-hidden>
      <polyline points={pts} fill="none" stroke="#0284c7" strokeWidth="1.5" />
    </svg>
  );
}

function GapBar({ gap }: { gap: number | null }) {
  if (gap == null) return <span className="text-muted text-xs">—</span>;
  const tone =
    gap >= 10 ? "pos" : gap <= -20 ? "neg" : gap <= -10 ? "warn" : "neu";
  const width = Math.min(100, Math.abs(gap) * 2);
  return (
    <div className="uv2-gap">
      <div className={`uv2-gap-fill uv2-gap-${tone}`} style={{ width: `${width}%` }} />
      <span>
        {gap > 0 ? "+" : ""}
        {gap.toFixed(1)}p
      </span>
    </div>
  );
}

function IndicatorCard({ card }: { card: IndicatorV2Card }) {
  return (
    <article className="uv2-indicator-card">
      <div className="uv2-indicator-head">
        <span>{card.indicatorLabel}</span>
        <span className={`uv2-status uv2-status-${card.status}`}>
          {statusLabel(card.status)}
        </span>
      </div>
      <div className="uv2-indicator-metrics">
        <div>
          <span className="label">지수</span>
          <strong>{card.indexScore?.toFixed(1) ?? "—"}</strong>
        </div>
        <div>
          <span className="label">순위</span>
          <strong>{card.rank ? `${card.rank}위` : "—"}</strong>
        </div>
        <div>
          <span className="label">3년 Δ</span>
          <strong
            className={
              card.momentumLabel === "drop"
                ? "text-danger"
                : card.momentumLabel === "surge"
                  ? "text-success"
                  : ""
            }
          >
            {card.momentum3y != null
              ? `${card.momentum3y > 0 ? "+" : ""}${card.momentum3y.toFixed(1)}`
              : "—"}
          </strong>
        </div>
      </div>
      <div className="uv2-indicator-bottom">
        <Sparkline values={card.sparkline} />
        <GapBar gap={card.nationalGap} />
      </div>
    </article>
  );
}

function QuadrantChart({
  analytics,
}: {
  analytics: UniversityV2Analytics;
}) {
  const x = analytics.studentSectorScore ?? 0;
  const y = analytics.financeHealthScore ?? 0;
  return (
    <div className="uv2-quadrant">
      <div className="uv2-quadrant-grid">
        <span className="uv2-q tl">충원우수·재정취약</span>
        <span className="uv2-q tr">지속가능 선도</span>
        <span className="uv2-q bl">복합 구조위기</span>
        <span className="uv2-q br">재정완충·충원위기</span>
        <div
          className="uv2-quadrant-dot"
          style={{
            left: `${Math.min(92, Math.max(8, x))}%`,
            bottom: `${Math.min(92, Math.max(8, y))}%`,
          }}
          title={`${analytics.strategicQuadrantLabel}`}
        />
      </div>
      <p className={FDB_TYPO.legend}>
        X 충원 {x.toFixed(1)} · Y 재정 {y.toFixed(1)} →{" "}
        <strong>{analytics.strategicQuadrantLabel}</strong>
      </p>
    </div>
  );
}

export function UniversityV2InsightsPanel({
  analysisYear,
  schoolName,
  compositeIndex,
  diagnosticGrade,
  cohortSize,
  groupIndexRows,
  indicatorSummaryRows,
  indicatorYearRowsById,
  settings,
}: {
  analysisYear: number;
  schoolName: string;
  compositeIndex: number | null;
  diagnosticGrade: string;
  cohortSize: number;
  groupIndexRows: GroupIndexYearRow[];
  indicatorSummaryRows: {
    categoryId: string;
    categoryLabel: string;
    indicatorId: string;
    indicatorLabel: string;
    rawValue: number | null;
    indexScore: number | null;
    rank: number | null;
    dataMissing: boolean;
    nationalIndexAvg: number | null;
  }[];
  indicatorYearRowsById: Record<string, IndicatorYearRow[]>;
  settings: CompetitivenessSettings;
}) {
  const analytics = useMemo(
    () =>
      buildUniversityV2Analytics({
        analysisYear,
        schoolName,
        compositeIndex,
        diagnosticGrade,
        cohortSize,
        groupIndexRows,
        indicatorSummaryRows,
        indicatorYearRowsById,
        settings,
      }),
    [
      analysisYear,
      schoolName,
      compositeIndex,
      diagnosticGrade,
      cohortSize,
      groupIndexRows,
      indicatorSummaryRows,
      indicatorYearRowsById,
      settings,
    ],
  );

  const radarData = analytics.radarSchool.map((s, i) => ({
    subject: s.label.length > 6 ? `${s.label.slice(0, 5)}…` : s.label,
    school: s.value,
    national: analytics.radarNational[i]?.value ?? 0,
  }));

  return (
    <section className="uv2-panel">
      <div className="uv2-panel-head">
        <h3 className="uv2-title">Executive Summary · v2</h3>
        <p className={FDB_TYPO.legend}>
          3초 진단 · 레이더 · 포지셔닝 · 모멘텀 — 보고서 v2.0과 동일 데이터
        </p>
      </div>

      <div className="uv2-exec-cards">
        <div className="uv2-exec-card uv2-exec-grade">
          <p className="uv2-exec-label">종합 진단</p>
          <p className="uv2-exec-value">{compositeIndex?.toFixed(1) ?? "—"}</p>
          <p className="uv2-exec-sub">
            {diagnosticGrade} · {cohortSize}개교 중
          </p>
        </div>
        <div className="uv2-exec-card uv2-exec-strength">
          <p className="uv2-exec-label">핵심 강점</p>
          <p className="uv2-exec-value text-sm">
            {analytics.strengthIndicator?.indicatorLabel ?? "—"}
          </p>
          <p className="uv2-exec-sub">
            {analytics.strengthIndicator?.rank
              ? `${analytics.strengthIndicator.rank}위`
              : "—"}
          </p>
        </div>
        <div className="uv2-exec-card uv2-exec-risk">
          <p className="uv2-exec-label">고위험 경보</p>
          <p className="uv2-exec-value text-danger">
            {analytics.highRiskIndicatorCount}개
          </p>
          <p className="uv2-exec-sub">
            {analytics.weakestIndicator?.indicatorLabel ?? "—"}
          </p>
        </div>
      </div>

      <div className="uv2-callout">{analytics.oneLineSummary}</div>

      <div className="uv2-grid-2">
        <div className="uv2-card">
          <h4 className="uv2-h4">8대 지표 균형 (Radar)</h4>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="선택 대학"
                  dataKey="school"
                  stroke="#DC2626"
                  fill="#DC2626"
                  fillOpacity={0.2}
                />
                <Radar
                  name="전국"
                  dataKey="national"
                  stroke="#0284C7"
                  fill="#0284C7"
                  fillOpacity={0.12}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className={FDB_TYPO.legend}>
            Balance Index:{" "}
            <strong>{analytics.balanceIndex?.toFixed(1) ?? "—"}</strong>
            {analytics.balanceIndex != null && analytics.balanceIndex > 15
              ? " · 기형적 불균형"
              : ""}
          </p>
        </div>
        <div className="uv2-card">
          <h4 className="uv2-h4">전략 포지셔닝 4분면</h4>
          <QuadrantChart analytics={analytics} />
          <p className={`mt-2 text-xs text-muted ${FDB_TYPO.legend}`}>
            {STRATEGIC_QUADRANT_LABELS[analytics.strategicQuadrant].desc}
          </p>
        </div>
      </div>

      <h4 className="uv2-h4 mt-4">8대 지표 콤팩트 카드</h4>
      <div className="uv2-indicator-grid">
        {analytics.indicatorCards.map((card) => (
          <IndicatorCard key={card.indicatorId} card={card} />
        ))}
      </div>

      <h4 className="uv2-h4 mt-4">실행 로드맵 (규칙 기반 초안 · 보고서 AI 보강)</h4>
      <div className="uv2-roadmap">
        <div className="uv2-roadmap-col">
          <strong>단기 긴급 (1년)</strong>
          <ul>
            {analytics.shortTermTasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="uv2-roadmap-col">
          <strong>중장기 구조 (2~3년)</strong>
          <ul>
            {analytics.midLongTermTasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export { buildUniversityV2Analytics };
