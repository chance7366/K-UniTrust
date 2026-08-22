/**
 * Gemini 개별대학 보고서 생성용 프롬프트 빌더
 * buildUniversityReportGuidelines() 전문을 system 역할로 사용한다.
 */

import { buildUniversityReportGuidelines } from "@/lib/competitiveness-analysis/university-report/build-university-report-guidelines";
import {
  UNIVERSITY_REPORT_GEMINI_BODY_SPEC,
  UNIVERSITY_REPORT_GUIDELINES_VERSION,
} from "@/lib/competitiveness-analysis/university-report/generation-guidelines";
import type { CompetitivenessSettings } from "@/lib/competitiveness-analysis/types";
import type { UniversityV2Analytics } from "@/lib/competitiveness-analysis/university-v2-analytics";

export type UniversityReportPayload = {
  analysisYear: number;
  schoolCodeStd: string;
  schoolName: string;
  schoolKind: string;
  estb: string;
  region: string;
  zone: string | null;
  scaleLabel: string | null;
  enrolledTotal: number | null;
  compositeIndex: number | null;
  compositeRank: number | null;
  cohortSize: number;
  diagnosticGrade: string;
  absoluteFlags: string[];
  groupIndexRows: unknown[];
  indicatorSummaryRows: unknown[];
  indicatorYearRowsById: Record<string, unknown[]>;
  v2Analytics: UniversityV2Analytics;
  settingsAtRun: Partial<CompetitivenessSettings>;
  lastRunAt: string | null;
};

function buildGeminiBodySkeleton(analysisYear: number): string {
  const h4Blocks = UNIVERSITY_REPORT_GEMINI_BODY_SPEC.indicatorH4Titles.map(
    (title, i) => {
      const chartId = UNIVERSITY_REPORT_GEMINI_BODY_SPEC.trendChartIds[i];
      return `  <h4 class="subsubsection-title">${title}</h4>
  <p><!-- JSON 수치 기반 2~3문장 해석 --></p>
  <table class="data-table"><!-- 5개년: 분석연도·원지표·환산지수·순위·전국·권역·시도·규모 --></table>
  <div data-chart-id="${chartId}"></div>`;
    },
  ).join("\n\n");

  return `<h2 class="section-title">제1부 대학경쟁력 진단 대시보드</h2>

<h3 class="subsection-title">1.1 대학 기본정보 및 진단 개요</h3>
<p><!-- 진단 개요 --></p>
<table class="data-table"><!-- 12열: 학교명·대표학교코드·설립구분·학교종류·소재 시·도·권역·재학생 수·규모 구분·절대지표 플래그·종합지수·전국 순위·진단등급 --></table>

<h3 class="subsection-title">1.2 영역별 그룹 지수 및 연도별 추세</h3>
<p><!-- 5개년 추세 서술 --></p>
<table class="data-table"><!-- 5개년×부문지수·벤치마크 비교 --></table>
<div data-chart-id="group-index-trend"></div>

<h3 class="subsection-title">1.3 8대 핵심지표 연도별 드릴다운 및 추세</h3>
<p><!-- 8대 지표 드릴다운 intro --></p>

${h4Blocks}

<h3 class="subsection-title">1.4 ${analysisYear}년 전체 지표 요약</h3>
<table class="data-table"><!-- 8지표 요약 --></table>

<h2 class="section-title">제2부 8대 핵심지표 심층 분석</h2>
<h3 class="subsection-title">2.1 학생충원 부문 분석 (부문 가중치: …%, 부문지수: …점)</h3>
<p><!-- 부문 intro: 가중치·부문지수·벤치마크 대비 1문장 --></p>
<p><strong>[신입생충원율]</strong> <!-- 원지표·환산지수·순위·Gap·해석 2~3문장 --></p>
<p><strong>[재학생충원율]</strong> <!-- 동일 형식 --></p>
<p><strong>[중도탈락율]</strong> <!-- 역방향 · 동일 형식 --></p>
<h3 class="subsection-title">2.2 대학재정 부문 분석 (부문 가중치: …%, 부문지수: …점)</h3>
<p><!-- 부문 intro --></p>
<p><strong>[자금확보율]</strong> <!-- … --></p>
<p><strong>[재정지원수혜율]</strong> <!-- … --></p>
<p><strong>[등록금의존율]</strong> <!-- 역방향 · … --></p>
<h3 class="subsection-title">2.3 법인재정 부문 분석 (부문 가중치: …%, 부문지수: …점)</h3>
<p><!-- 부문 intro --></p>
<p><strong>[수익용재산확보율]</strong> <!-- … --></p>
<p><strong>[법인전입금비율]</strong> <!-- … --></p>
<h3 class="subsection-title">2.4 종합지수 및 진단등급 종합 평가</h3>
<p><!-- 종합지수·순위·등급·Balance Index·사분면 --></p>
<p><!-- 고위험 N개·강점 N개·구조적 개혁 필요성 --></p>

<h2 class="section-title">제3부 전략적 종합 총평 및 실행 로드맵</h2>
<h3 class="subsection-title">3.1 전략적 종합 총평</h3>
<p><!-- 한 줄 요약: 종합·순위·등급·사분면·고위험 --></p>
<p><!-- 부문별 강·약·연계 과제 --></p>
<h3 class="subsection-title">3.2 SWOT 분석 AI 보강 서술</h3>
<p><!-- K-UniTrust 진단 결과를 바탕으로 한 … SWOT 분석 --></p>
<p><strong>[강점 (Strengths)]</strong> <!-- … --></p>
<p><strong>[약점 (Weaknesses)]</strong> <!-- … --></p>
<p><strong>[기회 (Opportunities)]</strong> <!-- … --></p>
<p><strong>[위기 (Threats)]</strong> <!-- … --></p>
<p><strong>[SO 전략 (강점-기회 활용)]</strong> <!-- … --></p>
<p><strong>[ST 전략 (강점-위기 극복)]</strong> <!-- … --></p>
<p><strong>[WO 전략 (약점-기회 활용)]</strong> <!-- … --></p>
<p><strong>[WT 전략 (약점-위기 극복)]</strong> <!-- … --></p>
<h3 class="subsection-title">3.3 실행 로드맵 AI 보강 서술</h3>
<p><!-- 단기·중장기 구분 권고 intro --></p>
<p><strong>[단기 비상 대응 과제 (1년 이내)]</strong></p>
<p>① <strong><!-- 과제명 -->:</strong> <!-- 실행 내용 --></p>
<p>② <strong><!-- 과제명 -->:</strong> <!-- 실행 내용 --></p>
<p>③ <strong><!-- 과제명 -->:</strong> <!-- 실행 내용 --></p>
<p><strong>[중장기 구조개혁 과제 (2~3년 이내)]</strong></p>
<p>① <strong><!-- 과제명 -->:</strong> <!-- 실행 내용 --></p>
<p>② <strong><!-- 과제명 -->:</strong> <!-- 실행 내용 --></p>

<h2 class="section-title">부록: 평가 모델·가중치·데이터 원천</h2>
<h3 class="subsection-title">1. 평가 개요 및 일반 원칙</h3>
<p><!-- 부록 --></p>
<h3 class="subsection-title">2. 평가지표 체계 및 가중치 (${analysisYear}년 실행 설정 기준)</h3>
<p><!-- 부록 --></p>
<h3 class="subsection-title">3. 세부 산출 공식 (절대평가형 선형 보간법)</h3>
<p><!-- 부록 --></p>
<h3 class="subsection-title">4. 부문별 및 최종 종합점수 산출</h3>
<p><!-- 부록 --></p>
<h3 class="subsection-title">5. 진단 등급 산정 기준 및 등급상한 규칙</h3>
<p><!-- 부록 --></p>
<h3 class="subsection-title">6. 분석 실행 메타데이터</h3>
<p><!-- 부록 --></p>`;
}

export function buildGeminiUniversityReportPrompt(args: {
  analysisYear: number;
  settings: CompetitivenessSettings;
  payload: UniversityReportPayload;
}): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = buildUniversityReportGuidelines(
    args.analysisYear,
    args.settings,
  );

  const userPrompt = [
    `다음 JSON은 ${args.payload.schoolName}(${args.payload.schoolCodeStd})의 ${args.analysisYear}년 대학별경쟁력 분석 데이터입니다.`,
    `위 system 지침 v${UNIVERSITY_REPORT_GUIDELINES_VERSION} Executive Dashboard 규칙을 따르고, JSON에 없는 수치는 만들지 마세요.`,
    "HTML로 보고서 본문만 작성하세요(표지·v2 Executive·Insights·Deep-Dive·Decision·SWOT·Roadmap은 시스템 자동). A4 인쇄 기준.",
    "",
    "■ 레퍼런스 형식 (필수)",
    `· ${UNIVERSITY_REPORT_GEMINI_BODY_SPEC.reference}`,
    "· 모든 대학은 동일 HTML 골격·제목·절 순서 — 내용(수치·서술)만 대학별로 다름",
    "",
    "■ 시스템 자동 삽입 (작성 금지·중복 금지)",
    "· report-executive-dashboard (§1 Executive, Insights, Deep-Dive, Decision, SWOT, Roadmap)",
    "",
    "■ Gemini 작성 규칙 (엄수)",
    "· 문체: 경어체(「…입니다」·「…합니다」) 통일 · 동일 문단 반복 출력 금지",
    "· inline style 속성(style=…) 사용 금지 — A4 page-break 분할 실패",
    "· class=\"subsection-title\" / \"subsubsection-title\" / \"section-title\" / \"data-table\" 고정",
    "· h4 제목은 아래 8종 그대로 (번호·부문명·역방향 표기 유지)",
    ...UNIVERSITY_REPORT_GEMINI_BODY_SPEC.indicatorH4Titles.map((t) => `  - ${t}`),
    "· 1.2 절: 5개년 표 + <div data-chart-id=\"group-index-trend\"></div> (chart-grid 직접 삽입 금지)",
    "· 1.3 절: h4마다 p + 5개년 표 + trend-* placeholder 1개 (8지표 각각 분리)",
    "· 부록 h2: 「부록: 평가 모델·가중치·데이터 원천」",
    "",
    "■ 제2부·제3부 표준 형식 (모든 대학 동일)",
    "· 제2부: 부문 intro 1문단 + 지표별 <p><strong>[지표명]</strong> …</p> (2.1·2.2 각 3개, 2.3 2개) + 2.4 2문단",
    "· 제2부 금지: 부문당 1장문 단락으로 8지표 통합 서술",
    "· 제3부 3.2: [강점/약점/기회/위기] 4문단 + [SO/ST/WO/WT] 전략 4문단 (swot-grid 변환용)",
    "· 제3부 3.3: [단기 비상] ①②③ + [중장기] ①② — 2문장 요약 금지",
    "· 5쪽 Action Roadmap은 시스템 자동 — Gemini 작성 금지",
    "",
    "■ HTML 골격 (이 구조·제목을 유지하고 <!-- --> 주석을 실제 내용으로 채우세요)",
    buildGeminiBodySkeleton(args.analysisYear),
    "",
    "■ 입력 JSON",
    "```json",
    JSON.stringify(args.payload, null, 2),
    "```",
  ].join("\n");

  return { systemInstruction, userPrompt };
}
