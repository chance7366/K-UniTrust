"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  buildUniversityReportGuidelinesV2Draft,
  SCREEN_ENHANCEMENT_GAPS,
  STRATEGIC_QUADRANT_LABELS,
  UNIVERSITY_REPORT_GUIDELINES_V2_DRAFT_VERSION,
  UNIVERSITY_REPORT_V2_DESIGN_TOKENS,
  UNIVERSITY_REPORT_V2_OUTLINE,
} from "@/lib/competitiveness-analysis/university-report/generation-guidelines-v2-draft";

import "./university-report-v2-mock.css";

const ANALYSIS_YEAR = 2025;
const SCHOOL = {
  name: "가야대학교",
  code: "0000032",
  region: "경남",
  zone: "동남권",
  composite: 26.6,
  rank: 134,
  cohort: 151,
  grade: "E",
  student: 24.0,
  univFinance: 28.7,
  corpFinance: 31.6,
  balanceIndex: 18.4,
  highRiskCount: 3,
  strength: "법인전입금비율",
};

const INDICATORS = [
  { id: "fresh", label: "신입생충원율", index: 25.4, national: 56.3, rank: 123, momentum: -8.7, status: "danger" as const },
  { id: "enrolled", label: "재학생충원율", index: 20.0, national: 54.9, rank: 128, momentum: +3.6, status: "danger" as const },
  { id: "dropout", label: "중도탈락율", index: 22.1, national: 58.2, rank: 119, momentum: -1.2, status: "warning" as const },
  { id: "fund", label: "자금확보율", index: 31.2, national: 52.4, rank: 115, momentum: +2.1, status: "warning" as const },
  { id: "benefit", label: "재정지원수혜율", index: 11.7, national: 48.6, rank: 131, momentum: -15.3, status: "danger" as const },
  { id: "tuition", label: "등록금의존율", index: 35.8, national: 51.1, rank: 98, momentum: +0.4, status: "neutral" as const },
  { id: "property", label: "수입·재산확보율", index: 28.4, national: 49.7, rank: 112, momentum: -2.8, status: "warning" as const },
  { id: "transfer", label: "법인전입금비율", index: 42.6, national: 38.2, rank: 68, momentum: +5.2, status: "success" as const },
];

const RADAR_LABELS = INDICATORS.map((i) => i.label.replace("율", ""));

type TabId = "gap" | "screen" | "report" | "guidelines";

function RadarMock() {
  const n = INDICATORS.length;
  const cx = 120;
  const cy = 120;
  const r = 90;
  const toPoint = (value: number, i: number, scale: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (value / 100) * r * scale;
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  };
  const schoolPoly = INDICATORS.map((item, i) => {
    const p = toPoint(item.index, i, 1);
    return `${p.x},${p.y}`;
  }).join(" ");
  const nationalPoly = INDICATORS.map((item, i) => {
    const p = toPoint(item.national, i, 1);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 240 240" className="urv2-radar" aria-label="8대 지표 레이더">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={INDICATORS.map((_, i) => {
            const p = toPoint(100, i, s);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="#e2e8f0"
        />
      ))}
      <polygon points={nationalPoly} fill="rgba(2,132,199,0.12)" stroke="#0284C7" strokeWidth="1.5" />
      <polygon points={schoolPoly} fill="rgba(220,38,38,0.15)" stroke="#DC2626" strokeWidth="2" />
      {RADAR_LABELS.map((label, i) => {
        const p = toPoint(115, i, 1);
        return (
          <text key={label} x={p.x} y={p.y} textAnchor="middle" fontSize="7" fill="#64748b">
            {label.length > 5 ? `${label.slice(0, 4)}…` : label}
          </text>
        );
      })}
    </svg>
  );
}

function QuadrantMock() {
  const x = (SCHOOL.student / 100) * 100;
  const y = ((SCHOOL.univFinance * 0.4 + SCHOOL.corpFinance * 0.1) / 0.5 / 100) * 100;
  return (
    <div className="urv2-quadrant">
      <div className="urv2-quadrant-grid">
        <span className="urv2-q-label urv2-q-tl">충원우수·재정취약</span>
        <span className="urv2-q-label urv2-q-tr">지속가능 선도</span>
        <span className="urv2-q-label urv2-q-bl">복합 구조위기</span>
        <span className="urv2-q-label urv2-q-br">재정완충·충원위기</span>
        <div
          className="urv2-quadrant-dot"
          style={{ left: `${Math.min(92, Math.max(8, x))}%`, bottom: `${Math.min(92, Math.max(8, y))}%` }}
          title={`${SCHOOL.name} (${SCHOOL.student.toFixed(1)}, ${y.toFixed(1)})`}
        />
      </div>
      <p className={FDB_TYPO.legend}>
        X: 학생충원 {SCHOOL.student} · Y: 재정건전성 {(y).toFixed(1)} →{" "}
        <strong className="text-danger">복합 구조위기형</strong>
      </p>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 72;
  const h = 24;
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
    <svg width={w} height={h} className="urv2-spark">
      <polyline points={pts} fill="none" stroke="#0284C7" strokeWidth="1.5" />
    </svg>
  );
}

function GapBar({ gap }: { gap: number }) {
  const pct = Math.min(100, Math.abs(gap) * 2);
  const tone = gap >= 0 ? "pos" : gap <= -20 ? "neg" : "warn";
  return (
    <div className="urv2-gap-bar">
      <div className={`urv2-gap-fill urv2-gap-${tone}`} style={{ width: `${pct}%` }} />
      <span>{gap > 0 ? "+" : ""}{gap.toFixed(1)}p</span>
    </div>
  );
}

export function UniversityReportV2Mock() {
  const [tab, setTab] = useState<TabId>("gap");
  const guidelines = useMemo(
    () => buildUniversityReportGuidelinesV2Draft(ANALYSIS_YEAR),
    [],
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: "gap", label: "화면 보강 검토" },
    { id: "screen", label: "v2 화면 목업" },
    { id: "report", label: "v2 보고서 목업" },
    { id: "guidelines", label: "지침 v2 초안" },
  ];

  return (
    <div className="urv2-root">
      <header className="urv2-banner">
        <div>
          <p className="urv2-banner-eyebrow">프로덕션 미적용 · 검토 전용 목업</p>
          <h1 className="urv2-banner-title">
            대학별경쟁력 v2.0 — 화면 보강 &amp; 보고서 지침 검토
          </h1>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            Gemini 제안(Executive Design &amp; Strategy) 반영 · 현행 v1.1.0 대비 ·{" "}
            <Link href="/analysis/competitiveness-analysis/university" className="text-accent hover:underline">
              프로덕션 화면
            </Link>
            {" · "}
            <Link href="/mockups/competitiveness-analysis/university" className="text-accent hover:underline">
              v1 UI 목업
            </Link>
          </p>
        </div>
        <div className="urv2-version-badge">{UNIVERSITY_REPORT_GUIDELINES_V2_DRAFT_VERSION}</div>
      </header>

      <nav className="urv2-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "urv2-tab active" : "urv2-tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "gap" ? (
        <section className="urv2-panel">
          <h2 className="urv2-h2">개별대학 화면 — v2 보고서 연동을 위한 보강 항목</h2>
          <p className={`mb-4 ${FDB_TYPO.bodyText}`}>
            보고서 v2.0 콘텐츠(레이더·4분면·모멘텀·로드맵)는 <strong>화면에 동일 데이터가 있어야</strong>{" "}
            JSON payload로 전달·검증 가능합니다. 우선순위 P0부터 화면에 추가하는 것을 권장합니다.
          </p>
          <div className="urv2-table-wrap">
            <table className="urv2-table">
              <thead>
                <tr>
                  <th>우선</th>
                  <th>v2 모듈</th>
                  <th>현행 화면</th>
                  <th>v2 요구</th>
                  <th>제안 화면 모듈</th>
                  <th>필요 데이터</th>
                </tr>
              </thead>
              <tbody>
                {SCREEN_ENHANCEMENT_GAPS.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`urv2-priority urv2-p-${row.priority}`}>{row.priority}</span>
                    </td>
                    <td className="font-medium">{row.v2Module}</td>
                    <td>{row.currentScreen}</td>
                    <td>{row.v2Requirement}</td>
                    <td className="text-accent-cyan">{row.proposedScreenModule}</td>
                    <td className="text-xs">{row.dataFields.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="urv2-callout mt-6">
            <strong>적용 순서 제안</strong>
            <ol className="mt-2 list-decimal pl-5 text-sm">
              <li>P0: Executive Summary · 레이더 · 4분면 · 모멘텀 (payload v2 필드 정의)</li>
              <li>P1: 8대 지표 카드 · Gap 칩 · 차트 통합 탭</li>
              <li>P2: 실행 로드맵 UI · AI Callout 캐시 연동</li>
              <li>화면 검증 후 <code>generation-guidelines.ts</code> v2.0 승격 및 보고서 템플릿 교체</li>
            </ol>
          </div>
        </section>
      ) : null}

      {tab === "screen" ? (
        <section className="urv2-panel">
          <h2 className="urv2-h2">
            v2 개별대학 화면 목업 — {SCHOOL.name} ({ANALYSIS_YEAR}년)
          </h2>
          <p className={`mb-4 ${FDB_TYPO.legend}`}>
            기존 헤더·부문 추세·지표 드릴다운 아래에 추가될 신규 섹션 미리보기
          </p>

          <div className="urv2-exec-cards">
            <div className="urv2-exec-card urv2-exec-grade">
              <p className="urv2-exec-label">종합 진단</p>
              <p className="urv2-exec-value">{SCHOOL.composite}점</p>
              <p className="urv2-exec-sub">
                {SCHOOL.rank}/{SCHOOL.cohort}위 ·{" "}
                <span className="urv2-badge-e">{SCHOOL.grade}등급</span>
              </p>
            </div>
            <div className="urv2-exec-card urv2-exec-strength">
              <p className="urv2-exec-label">핵심 강점</p>
              <p className="urv2-exec-value text-success">{SCHOOL.strength}</p>
              <p className="urv2-exec-sub">동종 상위 25% · 지수 42.6</p>
            </div>
            <div className="urv2-exec-card urv2-exec-risk">
              <p className="urv2-exec-label">고위험 경보</p>
              <p className="urv2-exec-value text-danger">{SCHOOL.highRiskCount}개 지표</p>
              <p className="urv2-exec-sub">하위 7% · 재정지원수혜율 급락</p>
            </div>
          </div>

          <div className="urv2-callout urv2-callout-accent">
            AI One-Line: {SCHOOL.name}은 종합 {SCHOOL.composite}점·{SCHOOL.grade}등급으로 복합
            구조위기 구간이며, 재정지원수혜율·신입생충원 지표의 동시 약화가 핵심 리스크입니다.
          </div>

          <div className="urv2-grid-2">
            <div className="urv2-card">
              <h3 className="urv2-h3">8대 지표 균형 진단 (Radar)</h3>
              <RadarMock />
              <p className={FDB_TYPO.legend}>
                Balance Index: <strong>{SCHOOL.balanceIndex}</strong> (기형적 — 재정·충원 불균형)
              </p>
            </div>
            <div className="urv2-card">
              <h3 className="urv2-h3">전략적 포지셔닝 4분면</h3>
              <QuadrantMock />
            </div>
          </div>

          <h3 className="urv2-h3 mt-6">8대 지표 콤팩트 카드 (2열 그리드)</h3>
          <div className="urv2-indicator-grid">
            {INDICATORS.map((ind) => {
              const gap = ind.index - ind.national;
              return (
                <article key={ind.id} className="urv2-indicator-card">
                  <div className="urv2-indicator-head">
                    <span>{ind.label}</span>
                    <span className={`urv2-status urv2-status-${ind.status}`}>
                      {ind.status === "danger" ? "Danger" : ind.status === "warning" ? "Warning" : ind.status === "success" ? "Strength" : "—"}
                    </span>
                  </div>
                  <div className="urv2-indicator-metrics">
                    <div>
                      <span className="label">지수</span>
                      <strong>{ind.index}</strong>
                    </div>
                    <div>
                      <span className="label">순위</span>
                      <strong>{ind.rank}위</strong>
                    </div>
                    <div>
                      <span className="label">5년 Δ</span>
                      <strong className={ind.momentum < 0 ? "text-danger" : "text-success"}>
                        {ind.momentum > 0 ? "+" : ""}{ind.momentum}p
                      </strong>
                    </div>
                  </div>
                  <div className="urv2-indicator-spark">
                    <Sparkline values={[ind.index - ind.momentum, ind.index - ind.momentum / 2, ind.index - 2, ind.index - 1, ind.index]} />
                    <GapBar gap={gap} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "report" ? (
        <section className="urv2-panel">
          <h2 className="urv2-h2">v2 보고서 구조 목업 (A4 Executive Edition)</h2>
          <div className="urv2-outline-compare">
            <div>
              <h3 className="urv2-h3">v1.1.0 (현행)</h3>
              <ol className="text-sm">
                <li>표지·기본정보</li>
                <li>제1부 화면 재현 (KPI·추세·8지표 표)</li>
                <li>제2부 지표별 서술 (줄글)</li>
                <li>제3부 총평·개선 (줄글)</li>
                <li>부록</li>
              </ol>
            </div>
            <div>
              <h3 className="urv2-h3 text-accent">v2.0-draft (제안)</h3>
              <ol className="text-sm">
                {UNIVERSITY_REPORT_V2_OUTLINE.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="urv2-a4-preview">
            <p className="urv2-a4-label">Executive Summary — 1페이지 미리보기</p>
            <div className="urv2-a4-page">
              <div className="urv2-a4-bar" />
              <h1 className="urv2-a4-h1">{SCHOOL.name} · {ANALYSIS_YEAR}년 경쟁력 진단</h1>
              <div className="urv2-exec-cards urv2-exec-cards-compact">
                <div className="urv2-exec-card urv2-exec-grade">
                  <p className="urv2-exec-label">종합</p>
                  <p className="urv2-exec-value">{SCHOOL.grade}</p>
                </div>
                <div className="urv2-exec-card">
                  <p className="urv2-exec-label">포지션</p>
                  <p className="urv2-exec-value text-sm">복합 구조위기</p>
                </div>
                <div className="urv2-exec-card urv2-exec-risk">
                  <p className="urv2-exec-label">경보</p>
                  <p className="urv2-exec-value text-sm">{SCHOOL.highRiskCount} 지표</p>
                </div>
              </div>
              <div className="urv2-a4-charts">
                <RadarMock />
                <QuadrantMock />
              </div>
              <div className="urv2-callout urv2-callout-report">
                핵심 메시지: 5개년 종합지수 정체(20~30점대). 학생충원·재정지원 동반 취약. 단기
                모집·중도이탈 케어와 중장기 전공·재산 수익 구조 개선 병행 필요.
              </div>
            </div>
          </div>

          <h3 className="urv2-h3 mt-8">제3부 실행 로드맵 매트릭스 (목업)</h3>
          <div className="urv2-roadmap">
            <div className="urv2-roadmap-cell">
              <strong>단기 긴급 (1년)</strong>
              <ul>
                <li>수시·정원 외 모집 전략 재편</li>
                <li>중도탈락 고위험 학과 집중 상담</li>
              </ul>
            </div>
            <div className="urv2-roadmap-cell">
              <strong>중장기 구조 (2~3년)</strong>
              <ul>
                <li>전공 구조조정·학과 통폐합 검토</li>
                <li>수익용 기본재산 운용 고도화</li>
              </ul>
            </div>
          </div>
          <div className="urv2-matrix">
            {["높은 긴급도·실행 용이", "높은 긴급도·실행 어려움", "낮은 긴급도·실행 용이", "낮은 긴급도·실행 어려움"].map(
              (label) => (
                <div key={label} className="urv2-matrix-cell">
                  {label}
                </div>
              ),
            )}
          </div>

          <div className="urv2-palette mt-6">
            <span>Design tokens:</span>
            {Object.entries(UNIVERSITY_REPORT_V2_DESIGN_TOKENS).map(([k, v]) => (
              <span key={k} className="urv2-swatch" style={{ background: v }} title={`${k}: ${v}`} />
            ))}
          </div>
        </section>
      ) : null}

      {tab === "guidelines" ? (
        <section className="urv2-panel">
          <h2 className="urv2-h2">보고서 생성 지침 v2.0 초안 (미적용)</h2>
          <p className={`mb-3 ${FDB_TYPO.legend}`}>
            승인 후 <code>generation-guidelines.ts</code> 교체 · payload 스키마 v2 · HTML/CSS 템플릿
            개편 순으로 적용
          </p>
          <pre className="urv2-guidelines-pre">{guidelines}</pre>
          <h3 className="urv2-h3 mt-6">4분면 유형 정의</h3>
          <ul className="text-sm">
            {STRATEGIC_QUADRANT_LABELS.map((q) => (
              <li key={q.id}>
                <strong>{q.label}</strong> — {q.desc}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
