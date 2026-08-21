import {
  UNIVERSITY_REPORT_GUIDELINES_VERSION,
  UNIVERSITY_REPORT_OUTLINE,
} from "@/lib/competitiveness-analysis/university-report/generation-guidelines";

export type ScreenEnhancementGap = {
  id: string;
  v2Module: string;
  currentScreen: string;
  v2Requirement: string;
  proposedScreenModule: string;
  dataFields: string[];
  computeNotes: string;
  priority: "P0" | "P1" | "P2";
  applied: boolean;
};

export const SCREEN_ENHANCEMENT_GAPS: ScreenEnhancementGap[] = [
  {
    id: "executive-summary",
    v2Module: "Executive Summary",
    currentScreen:
      "학교 헤더에 종합지수·순위·진단등급 KPI만 표시. 3초 내 위기 파악용 요약 없음.",
    v2Requirement:
      "종합등급/순위 카드 + 핵심 강점 카드 + 고위험 경보 카드 3단 배치, One-Line AI 총평.",
    proposedScreenModule:
      "「Executive Summary」패널 — KPI 3카드 + AI 한 줄 요약",
    dataFields: [
      "compositeIndex",
      "compositeRank",
      "cohortSize",
      "diagnosticGrade",
      "topStrengthIndicator",
      "highRiskIndicatorCount",
    ],
    computeNotes:
      "강점: 동종 상위 25% 지표 1개. 경보: 하위 7% 지표 수 + E등급.",
    priority: "P0",
    applied: true,
  },
  {
    id: "radar-balance",
    v2Module: "8대 지표 방사형 레이더 & Balance Index",
    currentScreen:
      "8지표는 당해 연도 요약표 + 선택형 1개 추세 차트만. 다차원 균형 시각화 없음.",
    v2Requirement:
      "8각형 레이더(본교 vs 전국 평균 오버레이), 기형 구조(Balance Index) 수치.",
    proposedScreenModule:
      "「지표 균형 진단」— RadarChart + 균형지수",
    dataFields: [
      "indicatorSummaryRows[].indexScore",
      "indicatorSummaryRows[].nationalIndexAvg",
    ],
    computeNotes: "Balance Index = 8지표 지수 표준편차.",
    priority: "P0",
    applied: true,
  },
  {
    id: "strategic-quadrant",
    v2Module: "전략적 포지셔닝 4분면",
    currentScreen: "부문 지수 추세만. 2축 매트릭스 없음.",
    v2Requirement:
      "X=학생충원, Y=재정건전성(대학+법인 가중). 4사분면 유형명.",
    proposedScreenModule: "「전략 포지셔닝」Quadrant 차트",
    dataFields: ["studentSectorScore", "univFinanceScore", "foundationScore"],
    computeNotes: "Y = 가중 부문 지수 합산. 사분면 라벨 4종.",
    priority: "P0",
    applied: true,
  },
  {
    id: "momentum",
    v2Module: "5-Year Momentum",
    currentScreen: "연도별 표·차트만. 기울기·골든타임 경보 없음.",
    v2Requirement: "3~5개년 Δ, 기울기, 추세 지속 시 위기 경고.",
    proposedScreenModule: "스파크라인 + Momentum 뱃지(↑↓→)",
    dataFields: ["indicatorYearRowsById", "groupIndexRows"],
    computeNotes: "3년 Δ ≤ -10p → 급락 경보.",
    priority: "P0",
    applied: true,
  },
  {
    id: "indicator-compact-card",
    v2Module: "8대 지표 콤팩트 카드",
    currentScreen: "당해 연도 요약 표(8행)만.",
    v2Requirement: "카드: 실적 + 스파크라인 + 갭 바 + 방향 뱃지.",
    proposedScreenModule: "「8대 지표 카드 그리드」2열",
    dataFields: ["indicatorSummaryRows", "indicatorYearRowsById"],
    computeNotes: "갭 = 본교 지수 - 벤치마크 지수.",
    priority: "P1",
    applied: true,
  },
  {
    id: "benchmark-gap-chips",
    v2Module: "벤치마크 +/- 컬러 칩",
    currentScreen: "벤치마크 평균 숫자만.",
    v2Requirement: "±%p Danger/Warning/Success 칩.",
    proposedScreenModule: "GapChip 공통 컴포넌트",
    dataFields: ["indexScore", "benchmark indexAvg"],
    computeNotes: "±10p Warning, ±20p Danger.",
    priority: "P1",
    applied: true,
  },
  {
    id: "status-badges",
    v2Module: "Danger / Warning / Success",
    currentScreen: "진단등급 뱃지만.",
    v2Requirement: "지표별 고위험 Danger 뱃지.",
    proposedScreenModule: "IndicatorStatusBadge",
    dataFields: ["rank", "cohortSize"],
    computeNotes: "highRiskThresholdRank 재사용.",
    priority: "P1",
    applied: true,
  },
  {
    id: "action-roadmap",
    v2Module: "Action Roadmap 매트릭스",
    currentScreen: "개선 방향 UI 없음.",
    v2Requirement: "긴급도×실행용이성, 단기/중장기 분류.",
    proposedScreenModule: "「실행 로드맵」탭",
    dataFields: ["weakIndicators", "momentumFlags"],
    computeNotes: "AI 과제 JSON 구조화.",
    priority: "P2",
    applied: true,
  },
  {
    id: "chart-consolidation",
    v2Module: "차트 통합",
    currentScreen: "부문 4차트 + 지표 8개 전체 추세.",
    v2Requirement: "레이더 + 스파크라인 테이블 중심.",
    proposedScreenModule: "추세 탭 전환 UI",
    dataFields: ["groupIndexRows", "indicatorYearRowsById"],
    computeNotes: "8 LineChart는 드릴다운 유지.",
    priority: "P1",
    applied: false,
  },
];

export const UNIVERSITY_REPORT_V2_DESIGN_TOKENS = {
  primary: "#0F172A",
  accent: "#0284C7",
  risk: "#DC2626",
  warning: "#D97706",
  success: "#059669",
  softBg: "#F8FAFC",
} as const;

export const STRATEGIC_QUADRANT_LABELS = [
  { id: "leader", label: "지속가능 선도형", desc: "충원·재정 모두 상위" },
  { id: "fiscal-cushion", label: "재정완충 위기형", desc: "재정 양호·충원 취약" },
  { id: "enrollment-strong", label: "충원우수 재정취약형", desc: "충원 양호·재정 취약" },
  { id: "compound-crisis", label: "복합 구조위기형", desc: "충원·재정 모두 하위" },
] as const;

export function buildUniversityReportGuidelinesV2Draft(analysisYear: number): string {
  return [
    "═══════════════════════════════════════════════════════════",
    "  K-UniTrust · 대학별경쟁력 개별대학 보고서 생성 지침",
    `  버전 ${UNIVERSITY_REPORT_GUIDELINES_VERSION} (프로덕션 적용됨)`,
    `  · 분석연도 ${analysisYear}년`,
    "═══════════════════════════════════════════════════════════",
    "",
    "■ 1. 보고서 목차",
    ...UNIVERSITY_REPORT_OUTLINE.map((i) => `  ${i.order}. ${i.title}`),
    "",
    "■ 2. 화면-보고서 정합: v2 모듈 → payload.v2Analytics",
    "■ 3. Executive Summary: KPI 3카드 + 레이더 + 4분면 + One-Line",
    "■ 4. 제2부: 8대 지표 콤팩트 카드 (갭 바 + 스파크라인 + AI)",
    "■ 5. 제3부: 단기/중장기 로드맵 + 2×2 매트릭스",
    "",
    "— v2.0 프로덕션 —",
  ].join("\n");
}
