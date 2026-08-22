/**
 * 대학별경쟁력 개별대학 보고서 — 생성 표준 지침 (v2.5 Executive Dashboard)
 *
 * · 관리자: 보고서 일괄·개별 생성·재생성·삭제
 * · 사용자: 생성된 보고서 열람·다운로드만 (생성·수정 불가)
 * · 분석연도(에디션) 단위로 보고서 세트 관리
 * · GEMINI_API_KEY 기반 AI 서술은 본 지침과 동일 JSON 입력을 사용
 */

export const UNIVERSITY_REPORT_GUIDELINES_VERSION = "2.6.0";

/** Canvas Executive Navy & Slate 디자인 토큰 */
export const UNIVERSITY_REPORT_EXECUTIVE_DESIGN = {
  palette: {
    navy: "#0F172A",
    slate: "#334155",
    sky: "#0284C7",
    tableHead: "#0F6363",
    risk: "#DC2626",
    success: "#059669",
    warning: "#D97706",
    softBg: "#F8FAFC",
  },
  typography: "Pretendard · 본문 10pt · KPI 16pt Black",
  kpiCards: 4,
  sections: [
    "Executive Summary (4 KPI + 사분면 + 3부문 레이더)",
    "Executive Summary v2 Insights (UniversityV2InsightsPanel 정적)",
    "Indicator Deep-Dive (Gap Bar + Score Bar + 녹청색 헤더 표)",
    "Decision Insight (What-If 가이드 — 정적, 녹청 #0F6363)",
    "SWOT 2×2 매트릭스",
    "Action Roadmap 타임라인",
  ],
} as const;

export const UNIVERSITY_REPORT_ROLE_POLICY = {
  admin: [
    "분석연도별 개별대학 보고서 생성·재생성·삭제",
    "생성 지침 확인 및 일괄 생성 실행",
    "생성 실패·누락 대학 재시도",
  ],
  user: [
    "생성 완료된 보고서 목록 조회",
    "보고서 본문 열람·PDF/HTML 다운로드",
    "생성·재생성·삭제 불가",
  ],
} as const;

/** 보고서 본문 고정 목차 — v2 Executive Design (모든 대학 동일 순서) */
export const UNIVERSITY_REPORT_OUTLINE = [
  {
    id: "cover",
    title: "표지·기본정보",
    order: 1,
  },
  {
    id: "executive-summary",
    title: "Executive Summary (1페이지 진단 요약)",
    order: 2,
  },
  {
    id: "dashboard",
    title: "제1부 대학경쟁력 진단 대시보드",
    order: 3,
  },
  {
    id: "indicator-deep",
    title: "제2부 8대 핵심지표 심층 분석 (카드형)",
    order: 4,
  },
  {
    id: "strategy-roadmap",
    title: "제3부 전략적 종합 총평 및 실행 로드맵",
    order: 5,
  },
  {
    id: "appendix",
    title: "부록 (평가 모델·가중치·데이터 원천)",
    order: 6,
  },
] as const;

export type UniversityReportSectionId =
  (typeof UNIVERSITY_REPORT_OUTLINE)[number]["id"];

/** 제1부 — 대학별경쟁력 화면에 표시되는 항목 전체 (누락 금지) */
export const SCREEN_MIRROR_CHECKLIST = {
  header: [
    "분석연도",
    "5극3특 권역(또는 권역 미분류)",
    "학교명·대표학교코드",
    "소재 시·도·설립구분·학교종류(4년제/전문대)",
    "재학생수·규모(대/중/소규모)",
    "절대지표 플래그(학자금제한·임시이사·결산미제출·자금부족) — 해당 시만",
    "종합지수·동종 전국 순위/집단 크기",
    "진단등급(S~E, 등급제외, C(지표 불균형) 포함)",
  ],
  groupTrend: [
    "학생충원 지수 · 연도별 추세 차트(선택 대학 vs 전국·권역·시·도·규모)",
    "대학재정 지수 · 연도별 추세 차트",
    "법인재정 지수 · 연도별 추세 차트",
    "종합지수 · 연도별 추세 차트",
    "당해 연도 그룹 지수 비교표(4행: 학생충원/대학재정/법인재정/종합 × 5벤치마크)",
    "종합지수 행: 동종 전국 순위 표기",
  ],
  indicatorDrilldown: [
    "8개 지표 선택 버튼과 동일한 지표명",
    "선택 지표 연도별 표: 분석연도·원지표·지수·순위·전국·권역·시·도·규모(지수 평균)",
    "선택 지표 연도별 추세 차트(5개 계열)",
  ],
  fullSummary: [
    "당해 연도 전체 지표 요약 — 학생충원 3지표",
    "당해 연도 전체 지표 요약 — 대학재정 3지표",
    "당해 연도 전체 지표 요약 — 법인재정 2지표",
    "각 행: 지표명·원지표·지수·순위·전국·권역·시·도·규모",
  ],
  v2Executive: [
    "Navy 헤더 바(K-UniTrust v2.5) + Executive Summary 패널",
    "KPI 4카드: 종합/등급 · 순위 · Danger 개수 · Strength 개수",
    "진단 서술(exec-narrative) — payload.v2Analytics.oneLineSummary 기반",
    "사분면 2×2 quad-matrix(본교 위치 핀) + chart-pillar-radar(3부문)",
  ],
  v2Insights: [
    "v2 Insights 패널 정적 HTML — report-v2-insights 섹션(2쪽 단독)",
    "진단 요약 3카드 · 레이더/4분면 · 8대 지표 콤팩트 카드(4열 2행) · 로드맵 요약 — 시스템 자동 생성",
    "Gemini 중복 작성 금지 (재주입 시 시스템이 자동 갱신)",
  ],
  v2IndicatorDeep: [
    "Indicator Deep-Dive: chart-gap-bar · chart-score-bar SVG",
    "8대 지표 표 — 녹청색(#0F6363) thead · Danger/Warning/Strength 뱃지",
    "Balance Index 수치 표기",
  ],
  v2DecisionInsight: [
    "Decision Insight 녹청 패널(exec-panel-dark, #0F6363) — 우선 개선 3대 레버(Danger→Warning→전국 Gap 열위 순으로 최대 3개 자동 선정)",
    "인터랙티브 슬라이더는 화면 전용, 보고서는 가이드만",
  ],
  v2Swot: [
    "SWOT 2×2 (SO/ST/WO/WT) — 시스템 템플릿 + Gemini 제3부 AI 보강",
  ],
  v2RadarBalance: [
    "8대 지표 레이더(선택) — chart-radar-balance",
  ],
  v2Quadrant: [
    "사분면 HTML quad-matrix (chart-strategic-quadrant SVG 대체 가능)",
  ],
  v2IndicatorCards: [
    "8대 지표 상세 표 — Gap·모멘텀·뱃지",
  ],
  v2Roadmap: [
    "Action Roadmap — roadmap-item 타임라인(단기 rose / 중장기 sky 좌측 보더)",
    "5쪽 단독: 단기 3건 + 중장기 1~2건 — 시스템이 진단 데이터로 자동 생성",
    "1순위는 전략 사분면별 대표 과제, 2~3순위는 우선 개선 3대 레버 지표 과제",
    "단기 roadmap-phase: 「단기 긴급 (1년 이내)」 · roadmap-body: 우선순위·이행 주기 문구",
  ],
  footerMeta: [
    "동종 집단(4년제 또는 전문대) 기준임을 명시",
    "분석실행 일시(에디션 runAt)",
    "당해 에디션 가중치·적용지표·적용연도 요약",
  ],
} as const;

/** 제2부 — 지표·부문별 서술 필수 요소 */
export const INDICATOR_ANALYSIS_TEMPLATE = {
  perIndicator: [
    "지표 정의·산출 원천(재정분석지표 메뉴명·표시연도)",
    "정방향/역방향 여부 및 해석 방향",
    "당해 연도 원지표값(X)·환산 지수(0~100)·동종 순위",
    "전국 동종 평균 지수 대비 우위/열위(차이 %p 또는 배수)",
    "소재 5극3특 권역 동종 평균 대비",
    "소재 시·도 동종 평균 대비",
    "동일 규모(재학생 기준) 동종 평균 대비",
    "2~3문장: 수치 근거 기반 경쟁력 해석(추측·외부 자료 금지)",
  ],
  perSector: [
    "부문명(학생충원·대학재정·법인재정)·부문 가중치",
    "부문 지수(100점 만점) 및 구성 지표 기여 요약",
    "부문 내 강점·약점 지표 1~2개씩",
    "부문별 5벤치마크 대비 위치",
  ],
  composite: [
    "종합지수 산출식(부문 가중 평균) 요약",
    "당해 종합지수·순위·진단등급",
    "진단등급 컷(S≥77, A≥65, B≥56, C≥44, D≥30, E<30)",
    "지표 불균형 등급상한(C): 동종 하위 7% 지표 2개 이상 시 S/A/B → C",
    "종합점수와 부문·지표 간 정합성 설명",
  ],
} as const;

/** 제3부 — 총평·개선 권고 작성 규칙 */
export const OVERALL_ASSESSMENT_RULES = {
  structure: [
    "① 한 줄 요약(종합 등급·순위·핵심 메시지)",
    "② 강점(상위 25% 이내 또는 벤치마크 상회 지표)",
    "③ 취약점(하위 25%·동종 하위 7%·벤치마크 하회 지표)",
    "④ 부문별 우선 개선 과제(학생충원→대학재정→법인재정 순으로 연계 서술 가능)",
    "⑤ 실행 가능한 개선 노력(지표 방향성에 부합, 수치 목표는 제시하지 않음)",
    "⑥ 데이터 결손·등급제외·절대지표 해당 시 주의 문구",
  ],
  weakIndicatorCriteria: [
    "동종 순위가 집단 하위 7% 이내(고위험 지표)",
    "지수가 전국·권역·시·도·규모 평균 모두 하회",
    "역방향 지표에서 원지표가 P90(상위 n%) 이상",
    "정방향 지표에서 원지표가 P10(하위 n%) 이하",
  ],
  improvementTone: [
    "K-UniTrust 분석 결과와 지표 정의 범위 안에서만 권고",
    "「○○% 달성」 등 구체 목표치 임의 설정 금지",
    "「모집·유지·재정·법인 지원」 등 지표 성격에 맞는 일반·실무 조치",
    "타 대학명·순위 공개 비교 문구 금지(본교 vs 평균만)",
  ],
} as const;

/**
 * 제2부 심층 분석 — 표준 형식 (모든 대학 동일)
 * 금지: 부문당 1개 장문 단락으로 8지표를 뭉개서 서술
 */
export const PART2_DEEP_ANALYSIS_SPEC = {
  reference: "표준 제2부 형식 — 부문 intro + 지표별 라벨 단락 + 종합 평가 2문단",
  antiPatterns: [
    "2.1~2.3을 부문당 1문단으로만 작성 (지표별 단락 생략 금지)",
    "지표별 [지표명] 라벨·원지표·환산지수·순위·Gap 누락",
    "2.4에 Balance Index·고위험/강점 지표 개수·사분면명 누락",
    "동일 문단을 연속으로 중복 출력",
  ],
  sectorIntro: {
    template:
      "{부문명} 부문은 {가중치}% 가중치를 반영하는 영역입니다. {학교명}의 {analysisYear}년 {부문} 부문 지수는 {점수}점으로, 전국·권역·시·도·규모 평균 대비 위치를 1문장으로 요약합니다.",
    minParagraphs: 1,
  },
  perIndicator: {
    format: '<p><strong>[{지표명}]</strong> {적용연도}년 원지표 {원지표}, 환산지수 {지수}점({순위}위). 전국 평균 지수 대비 {Gap}p, 권역·규모 대비 해석 2~3문장.</p>',
    requiredFields: [
      "원지표값(%, 배수 등 화면과 동일 단위)",
      "환산지수(0~100, 소수 1자리)",
      "동종 순위(N위)",
      "전국 평균 지수 대비 Gap(%p)",
      "권역 또는 규모 평균 대비 1회 이상 언급",
      "역방향 지표는 「낮을수록 우수」 명시",
    ],
    countBySection: {
      "2.1": 3,
      "2.2": 3,
      "2.3": 2,
    },
  },
  composite: {
    "2.4": [
      "종합지수·동종 순위·진단등급(S~E) 1문장",
      "Balance Index 수치·사분면명(복합 구조위기형 등) 1문장",
      "고위험(Danger) 지표 N개·강점(Strength) 지표 N개 — JSON v2Analytics 기준",
      "부문 간 불균형·구조적 개혁 필요성 1문장",
    ],
    minParagraphs: 2,
  },
} as const;

/**
 * 제3부 총평·SWOT·로드맵 — 표준 형식 (모든 대학 동일)
 */
export const PART3_STRATEGY_ROADMAP_SPEC = {
  reference:
    "표준 제3부 형식 — 총평 2문단 + SWOT 4문단·전략 4문단 + 로드맵 단기 3·중장기 2",
  antiPatterns: [
    "3.1을 1문단으로만 작성",
    "3.2 SWOT을 「강점 (Strengths):」 한 줄 나열 — [SO/ST/WO/WT] 전략 문단 누락",
    "3.3을 「진단 결과를 바탕으로…」 2문장으로만 작성 (과제별 ①②③ 단락 생략 금지)",
    "3.2 intro 문단을 두 번 반복 출력",
  ],
  section31: {
    minParagraphs: 2,
    content: [
      "① 한 줄 요약: 종합지수·순위·등급·사분면·고위험 지표 수",
      "② 부문별 강·약: 강점 지표(원지표·순위) + 취약 지표 + 연계 과제",
    ],
  },
  section32: {
    intro: "K-UniTrust 진단 결과를 바탕으로 한 {학교명}의 전략적 SWOT 분석 및 실행 대응 방안입니다.",
    swotLabels: [
      "<p><strong>[강점 (Strengths)]</strong> …</p>",
      "<p><strong>[약점 (Weaknesses)]</strong> …</p>",
      "<p><strong>[기회 (Opportunities)]</strong> …</p>",
      "<p><strong>[위기 (Threats)]</strong> …</p>",
    ],
    strategyParagraphs: [
      "<p><strong>[SO 전략 (강점-기회 활용)]</strong> …</p>",
      "<p><strong>[ST 전략 (강점-위기 극복)]</strong> …</p>",
      "<p><strong>[WO 전략 (약점-기회 활용)]</strong> …</p>",
      "<p><strong>[WT 전략 (약점-위기 극복)]</strong> …</p>",
    ],
    note: "SO/ST/WO/WT 4문단은 시스템이 swot-grid 2×2 카드로 자동 변환 — 반드시 포함",
  },
  section33: {
    intro:
      "{학교명}의 경쟁력 회복을 위한 실행 로드맵은 단기 비상 대응 과제와 중장기 구조개혁 과제로 구분하여 추진할 것을 권고합니다.",
    shortTerm: {
      heading: "<p><strong>[단기 비상 대응 과제 (1년 이내)]</strong></p>",
      items: 3,
      itemFormat:
        "<p>① <strong>{과제명}:</strong> {실행 내용 1~2문장}</p>",
      examples: [
        "사분면 TF 구성(복합 구조위기·충원우수 재정취약 등)",
        "우선 개선 지표(신입생충원율·수익용재산확보율 등)별 단기 과제",
      ],
    },
    midLong: {
      heading: "<p><strong>[중장기 구조개혁 과제 (2~3년 이내)]</strong></p>",
      items: 2,
      itemFormat:
        "<p>① <strong>{과제명}:</strong> {실행 내용 1~2문장}</p>",
    },
    minTotalParagraphs: 8,
  },
} as const;

/** 5쪽 v2 Action Roadmap — 시스템 생성 (Gemini 작성 금지) */
export const V2_ACTION_ROADMAP_PAGE_SPEC = {
  reference: "본문 5쪽 단독 페이지 — 시스템 자동 생성",
  structure: {
    shortTermCount: 3,
    midLongCount: 1,
    phaseLabels: {
      short: "단기 긴급 (1년 이내)",
      mid: "중장기 구조 (2~3년)",
    },
    bodyShort: "우선순위 최상 (Urgent) · 즉시 이행·월간 모니터링 / 우선순위 상 (High) · …",
    bodyMid: "중장기 핵심 과제 · 구조개혁·재정 건전성 로드맵 연계",
  },
  taskSource: [
    "1순위: 전략 사분면별 TF·점검 과제",
    "2~3순위: 우선 개선 3대 레버 상위 지표 과제",
    "중장기: 사분면별 중장기 과제 + 잔여 레버",
  ],
} as const;

/** 8개 지표 — 보고서 공통 명칭·부문·방향 */
export const REPORT_INDICATOR_CATALOG = [
  {
    id: "freshman-enrollment-rate",
    label: "신입생충원율",
    sector: "학생충원",
    direction: "positive" as const,
    definition: "정원내외 신입생충원율. 높을수록 우수.",
    source: "재정분석지표 › 학생충원 › 신입생충원율(정원내외)",
  },
  {
    id: "enrolled-enrollment-rate",
    label: "재학생충원율",
    sector: "학생충원",
    direction: "positive" as const,
    definition: "정원내외 재학생충원율. 높을수록 우수.",
    source: "재정분석지표 › 학생충원 › 재학생충원율(정원내외)",
  },
  {
    id: "dropout-rate",
    label: "중도탈락율",
    sector: "학생충원",
    direction: "negative" as const,
    definition: "재적학생 중도탈락비율. 낮을수록 우수.",
    source: "재정분석지표 › 학생충원 › 중도탈락율",
  },
  {
    id: "fund-secure-rate",
    label: "자금확보율",
    sector: "대학재정",
    direction: "positive" as const,
    definition: "자금확보율. 높을수록 우수.",
    source: "재정분석지표 › 대학재정 › 자금확보율",
  },
  {
    id: "financial-support-benefit-rate",
    label: "재정지원수혜율",
    sector: "대학재정",
    direction: "positive" as const,
    definition: "재정지원수혜율. 높을수록 우수.",
    source: "재정분석지표 › 대학재정 › 재정지원수혜율",
  },
  {
    id: "tuition-dependency-rate",
    label: "등록금의존율",
    sector: "대학재정",
    direction: "negative" as const,
    definition: "등록금의존율. 낮을수록 우수.",
    source: "재정분석지표 › 대학재정 › 등록금의존율",
  },
  {
    id: "income-property-secure-rate",
    label: "수익용재산확보율",
    sector: "법인재정",
    direction: "positive" as const,
    definition: "수익용재산 확보율. 높을수록 우수.",
    source: "재정분석지표 › 법인재정 › 수익용재산확보율",
  },
  {
    id: "corp-transfer-ratio",
    label: "법인전입금비율",
    sector: "법인재정",
    direction: "positive" as const,
    definition: "법인전입금비율. 높을수록 우수.",
    source: "재정분석지표 › 법인재정 › 법인전입금비율",
  },
] as const;

/** 벤치마크 비교 서술 표준 문구 */
export const BENCHMARK_NARRATIVE_LABELS = {
  national: "전국 동종(4년제 또는 전문대) 평균",
  zone: "소재 5극3특 권역 동종 평균",
  sido: "소재 시·도 동종 평균",
  scale: "동일 규모(재학생 기준) 동종 평균",
} as const;

/**
 * Gemini HTML 본문 골격 — 표준 골격 (모든 대학 동일)
 * 시스템 v2·Insights·Deep-Dive·Decision·SWOT·Roadmap 제외 · Gemini 작성 구간만
 */
export const UNIVERSITY_REPORT_GEMINI_BODY_SPEC = {
  reference: "표준 본문 골격 — 시스템 A4 분할·병합 후 본문 약 22쪽 (모든 대학 동일)",
  forbidden: [
    "style=\"…\" 등 inline style 속성 (A4 page-break 분할 실패 원인)",
    "제목 클래스명 임의 변경(subsection-title / subsubsection-title 고정)",
    "h4 형식 임의 변경 — 반드시 (N) 지표명 (부문 · 역방향) 형식",
    "8개 지표를 한 절에 몰아넣기 — h4마다 표+차트 placeholder 1세트",
    "1.2 절에 chart-grid 직접 삽입 — group-index-trend placeholder만",
    "부록 제목 임의 변경 — 「부록: 평가 모델·가중치·데이터 원천」",
    "가상 시뮬레이션 예시 등 JSON에 없는 부록 절 임의 추가",
  ],
  sections: [
    {
      part: "제1부",
      h2: "제1부 대학경쟁력 진단 대시보드",
      subsections: [
        "1.1 대학 기본정보 및 진단 개요 — 12열 단일 data-table(학교명·코드·설립·종류·시도·권역·재학생·규모·절대지표·종합·순위·등급)",
        "1.2 영역별 그룹 지수 및 연도별 추세 — 5개년×벤치마크 비교 data-table + <div data-chart-id=\"group-index-trend\"></div>",
        "1.3 8대 핵심지표 연도별 드릴다운 및 추세 — intro p 1개 후 h4×8 (각: p + 5개년 표 + trend placeholder)",
        "1.4 {analysisYear}년 전체 지표 요약 — 8지표×벤치마크 요약 표",
      ],
    },
    {
      part: "제2부",
      h2: "제2부 8대 핵심지표 심층 분석",
      subsections: [
        "2.1 학생충원 부문 분석 (부문 가중치: …%, 부문지수: …점) — intro p 1 + [지표명] p×3",
        "2.2 대학재정 부문 분석 (부문 가중치: …%, 부문지수: …점) — intro p 1 + [지표명] p×3",
        "2.3 법인재정 부문 분석 (부문 가중치: …%, 부문지수: …점) — intro p 1 + [지표명] p×2",
        "2.4 종합지수 및 진단등급 종합 평가 — p×2 (Balance Index·Danger/Strength·사분면)",
      ],
    },
    {
      part: "제3부",
      h2: "제3부 전략적 종합 총평 및 실행 로드맵",
      subsections: [
        "3.1 전략적 종합 총평 — p×2 이상",
        "3.2 SWOT 분석 AI 보강 서술 — intro + [강점/약점/기회/위기] p×4 + [SO/ST/WO/WT] p×4",
        "3.3 실행 로드맵 AI 보강 서술 — intro + [단기] ①②③ + [중장기] ①②",
      ],
    },
    {
      part: "부록",
      h2: "부록: 평가 모델·가중치·데이터 원천",
      subsections: [
        "1. 평가 개요 및 일반 원칙",
        "2. 평가지표 체계 및 가중치 (2025년 실행 설정 기준)",
        "3. 세부 산출 공식 (절대평가형 선형 보간법)",
        "4. 부문별 및 최종 종합점수 산출",
        "5. 진단 등급 산정 기준 및 등급상한 규칙",
        "6. 분석 실행 메타데이터",
      ],
    },
  ],
  indicatorH4Titles: [
    "(1) 신입생충원율 (학생충원 부문)",
    "(2) 재학생충원율 (학생충원 부문)",
    "(3) 중도탈락율 (학생충원 부문 · 역방향)",
    "(4) 자금확보율 (대학재정 부문)",
    "(5) 재정지원수혜율 (대학재정 부문)",
    "(6) 등록금의존율 (대학재정 부문 · 역방향)",
    "(7) 수익용재산확보율 (법인재정 부문)",
    "(8) 법인전입금비율 (법인재정 부문)",
  ],
  trendChartIds: [
    "trend-freshman-enrollment-rate",
    "trend-enrolled-enrollment-rate",
    "trend-dropout-rate",
    "trend-fund-secure-rate",
    "trend-financial-support-benefit-rate",
    "trend-tuition-dependency-rate",
    "trend-income-property-secure-rate",
    "trend-corp-transfer-ratio",
  ],
} as const;

/** A4 본문 페이지 배치 — 페이지별 내용과 레이아웃 품질 원칙 */
export const UNIVERSITY_REPORT_PAGE_LAYOUT = {
  /** 표지 제외 본문 페이지 번호 → 내용 */
  bodyPages: [
    "1: §1 Executive Summary (KPI·사분면·레이더)",
    "2: v2 Insights (진단 요약·콤팩트 카드·로드맵 요약)",
    "3: Indicator Deep-Dive — Gap·Score 차트 + 8대 지표 표",
    "4: Decision Insight + SWOT 2×2",
    "5: Action Roadmap",
    "6+: 제1부(1.1+1.2) → 그룹 추세 차트 4종 → 지표 h4×8 → 1.4 → 제2부 → 제3부 → 부록",
  ],
  /** 페이지 채움·오버플로 품질 원칙 (시스템 레이아웃 검증 기준) */
  qualityPrinciples: [
    "각 페이지 내용은 A4 본문 영역(여백 제외)을 초과하지 않는다 — 오버플로 발생 시 표·차트·여백을 압축한다.",
    "페이지 절반 이상이 빈 배치를 지양한다 — 차트·표 크기를 페이지에 맞게 확대한다.",
    "그룹 추세 차트 4종은 전폭 1열로 배치해 A4 1장을 채운다.",
    "지표 드릴다운 페이지는 표 + 확대 추세 차트로 하단 여백을 최소화한다.",
    "부록·제1부 첫 페이지의 대형 표는 압축 스타일(축소 폰트·셀 여백)을 적용한다.",
    "섹션 마지막 페이지의 잔여 여백은 허용한다(내용 임의 늘리기 금지).",
  ],
} as const;

/** 보고서 품질·형식 통일 규칙 */
export const UNIVERSITY_REPORT_FORMAT_RULES = [
  "모든 대학 보고서는 v2.5 Executive Dashboard 동일 구조·디자인·표준 본문 골격을 따른다.",
  "문체: 본문 서술은 경어체(「…입니다」·「…합니다」)로 통일한다. 개조식·서술체 혼용 금지.",
  "동일 문단·문장을 연속으로 중복 출력하지 않는다.",
  "Gemini 본문: inline style 금지 · subsection-title/subsubsection-title 클래스 고정 · h4 8종 각각 별도 절.",
  "Executive Summary·v2 Insights·Indicator Deep-Dive·Decision Insight·SWOT·Roadmap(5쪽) HTML은 시스템 생성 — Gemini 중복 작성 금지.",
  "5쪽 Action Roadmap: 단기 3 + 중장기 1~2 — 전략 사분면·우선 개선 3대 레버 기반 시스템 자동 생성.",
  "제2부: 부문 intro + 지표별 [지표명] 단락(2.1×3·2.2×3·2.3×2) + 2.4 종합 2문단.",
  "제3부: 3.1 총평 2문단 · 3.2 SWOT 4문단+SO/ST/WO/WT 전략 4문단 · 3.3 단기①②③+중장기①②.",
  "용지: A4 세로(portrait), 여백 상 25mm·좌우 15mm·하 18mm. Pretendard · Slate 본문 #334155. 표지·목차 시스템 자동.",
  "페이지: 표지 제외 본문 각 페이지 = A4 1장. 하단 중앙 페이지 번호(1부터).",
  "페이지 채움: 내용이 A4 본문 영역을 초과하지 않아야 하며(오버플로 금지), 페이지 절반 이상이 비는 배치를 지양한다.",
  "부별 시작: Executive Summary(v2) → Insights → 제1부 → 제2부 → 제3부 → 부록은 각각 새 페이지에서 시작한다.",
  "표지 목차: 이중 번호 금지. 각 항목 우측에 본문 시작 페이지 번호.",
  "제목: section-title(#0F172A) · subsection-title(#0284C7) · exec-h1/exec-h2(Executive 패널).",
  "KPI 4카드: kpi-grid-4 · kpi-risk|kpi-strength|kpi-neutral — Rose/Emerald/Slate 톤.",
  "표(data-table·exec-indicator-table) thead: 녹청색 #0F6363 · 흰색 글자 · badge-danger|warning|strength.",
  "Decision Insight: exec-panel-dark 배경 #0F6363(녹청) · 흰색/연녹 텍스트.",
  "SWOT: swot-grid 2×2 · swot-so|st|wo|wt 색상 구분.",
  "Roadmap: roadmap-item · border-left rose(단기)/sky(중장기).",
  "색상: Navy #0F172A, Sky #0284C7, Teal #0F6363, Risk #DC2626, Success #059669, Warning #D97706.",
  "차트: 그룹 추세 4종은 전폭 1열 배치(A4 1장 채움) · 지표 드릴다운 추세 차트는 확대형 · 4분면 차트는 사분면 명칭 라벨 포함.",
  "지표명: 「수익용재산확보율」(수입·재산확보율 오표기 금지).",
  "What-If 슬라이더는 화면 전용 — 보고서 Decision Insight 패널(정적)만.",
  "본문 단락(p) 위·아래 여백을 두어 가독성을 확보한다.",
  "모든 표(data-table)의 헤더(th)와 데이터(td)는 기본 가운데 정렬(center)이다.",
  "표·차트는 대학별경쟁력 화면과 동일한 수치·소수 자릿수(지수 1자리, 원지표는 화면과 동일)를 사용한다.",
  "차트는 시스템이 분석 JSON으로 SVG를 생성·삽입한다. 축·범례·색상은 화면과 동일(5계열).",
  "데이터 결손(—)은 「자료 없음」으로 표기하고, AI 서술에서 임의 보간하지 않는다.",
  "분석연도가 바뀌면 해당 연도 에디션 분석결과만 사용한다. 타 연도 수치 혼용 금지.",
  "생성 시점의 기본설정(가중치·적용지표·Pₙ/P₍₁₀₀₋ₙ₎·분석정책)을 부록에 기록한다.",
  "보고서 파일명: {analysisYear}_{schoolCodeStd}_{schoolName}_competitiveness-report.{html|pdf}",
  "PDF: HTML 보고서를 A4 PDF로 변환·캐시하며, HTML 갱신 시 자동 재생성한다.",
  "저장 위치: data/reports/competitiveness/{analysisYear}/{schoolCodeStd}/",
] as const;

/** HTML 본문 작성 시 Gemini가 사용할 클래스명 */
export const UNIVERSITY_REPORT_HTML_CLASSES = {
  partTitle: "section-title",
  sectionTitle: "subsection-title",
  subsectionTitle: "subsubsection-title",
  table: "data-table",
} as const;
