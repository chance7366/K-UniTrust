/**
 * 학생충원분석 · 종합보고서 생성 지침 (분석결과 화면)
 *
 * 개별대학 보고서와 달리, 분석조건 필터로 고른 대학 집단을
 * 분석연도마다 한 부로 만들고 저장한다.
 */

export const SFA_COMPREHENSIVE_GUIDELINES_VERSION = "1.2.0";

export const SFA_COMPREHENSIVE_FILTERS = [
  { id: "year", label: "기준 연도", rule: "전체 추이(2021~2026) 또는 단일 연도. 매년 저장본을 남긴다." },
  { id: "region", label: "권역 구분", rule: "전국(수도권+지방) · 수도권 · 비수도권(지방권)." },
  { id: "estb", label: "설립 유형", rule: "전체(국공립+사립) · 국공립 · 사립." },
  { id: "type", label: "학제 구분", rule: "전체(일반대+전문대) · 일반대학 · 전문대학." },
] as const;

export const SFA_COMPREHENSIVE_OUTLINE = [
  { id: "report", title: "심층 분석 보고서", order: 1 },
  { id: "ch1", title: "제1장 신입생 충원 및 정원 감축 착시 (설립·권역·학제·선제감축 권역 비교)", order: 2 },
  { id: "ch2", title: "제2장 재학생 유지 및 중도이탈 (설립·권역·학제·선제감축 권역 비교)", order: 3 },
  { id: "ch3", title: "제3장 유학생 양적 팽창과 질적 관리 (설립·권역·학제·선제감축 권역 비교)", order: 4 },
  { id: "ch4", title: "제4장 종합 결론 및 정책 제언", order: 5 },
  { id: "explorer", title: "데이터 탐색기", order: 6 },
  { id: "guideline", title: "보고서 작성 지침서", order: 7 },
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
  "본문·차트·탐색기·지침서 서식은 첨부한 종합보고서(심층 분석 보고서)를 그대로 쓴다.",
  "분석 조건 필터는 기준 연도·권역 구분·설립 유형·학제 구분 네 가지다. 필터를 바꾸면 KPI·차트·서술 숫자가 그 집단으로 다시 계산된다.",
  "보고서는 매년 저장한다. 인쇄·PDF는 A4 가로(landscape)로 출력한다.",
  "전국 고정 문장을 복사하지 않는다. 선택한 필터 집단의 평균으로 적는다.",
  "데이터 탐색기 표도 같은 필터를 따른다.",
  "제1~3장 원문 뒤에 국공립·사립, 수도권·비수도권, 대학·전문대학, 선제 정원감축 권역 비교를 이어서 적는다.",
] as const;