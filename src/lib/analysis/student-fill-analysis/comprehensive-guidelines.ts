/**
 * 학생충원분석 · 종합보고서 생성 지침 (분석결과 화면)
 *
 * 개별대학 보고서와 달리, 분석조건 필터로 고른 대학 집단을
 * 분석연도마다 한 부로 만들고 저장한다.
 */

export const SFA_COMPREHENSIVE_GUIDELINES_VERSION = "2.0.0";

export const SFA_COMPREHENSIVE_FILTERS = [
  { id: "year", label: "기준 연도", rule: "전체 추이(2021~2026) 또는 단일 연도. 매년 저장본을 남긴다." },
  { id: "region", label: "권역 구분", rule: "전국(수도권+지방) · 수도권 · 비수도권(지방권)." },
  { id: "estb", label: "설립 유형", rule: "전체(국공립+사립) · 국공립 · 사립." },
  { id: "type", label: "학제 구분", rule: "전체(일반대+전문대) · 일반대학 · 전문대학." },
] as const;

export const SFA_COMPREHENSIVE_OUTLINE = [
  { id: "cover", title: "표지", order: 0 },
  { id: "toc", title: "목차", order: 1 },
  { id: "ch1", title: "제1장 서론 및 분석 개요 (본교 합산·율 재계산)", order: 2 },
  { id: "ch2", title: "제2장 시장 구조 분석: 학교수 변화 진단", order: 3 },
  { id: "ch3", title: "제3장 신입생 충원 심층 분석", order: 4 },
  { id: "ch4", title: "제4장 재학생 충원 심층 분석", order: 5 },
  { id: "ch5", title: "제5장 외국인 학생 심층 분석", order: 6 },
  { id: "ch6", title: "제6장 종합 진단", order: 7 },
  { id: "ch7", title: "제7장 진단 총평 및 대응전략", order: 8 },
  { id: "ch8", title: "제8장 교육부 정책 제언", order: 9 },
] as const;

export const SFA_COMPREHENSIVE_ROLE_POLICY = {
  admin: [
    "분석연도·권역·설립·학제 조합마다 종합보고서 생성·재생성",
    "생성 전 본 지침 확인",
    "저장된 보고서 열람·인쇄·PDF 저장",
  ],
  user: [
    "이미 생성된 종합보고서 열람·인쇄·PDF 저장",
    "생성·재생성 불가",
  ],
} as const;

export const SFA_COMPREHENSIVE_RULES = [
  "본문·차트는 분석실행 결과(본교 합산 후 율 재계산)로 채운다. 캠퍼스 율을 평균하지 않는다.",
  "분석 조건 필터는 기준 연도·권역 구분·설립 유형·학제 구분 네 가지다.",
  "보고서는 매년 저장한다. 인쇄·PDF는 A4 세로(portrait)로 출력한다.",
  "시계열은 분석연도 기준 5개년(Y-4~Y)이다.",
  "평균과 중앙값을 같이 적는다. 상위 10교 표는 본교 합산 율로 순위를 매긴다.",
] as const;