/** 재정지원수혜율 업로드 양식 — 1행 헤더 (G~Q열 단위: 원) */

export const FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_HEADER = [
  "연도",
  "학교코드_표준",
  "대학명",
  "설립구분",
  "소재지",
  "학제구분",
  "교육부",
  "(맞춤형국가장학금)",
  "과학기술정보통신부",
  "고용노동부",
  "산업통상부",
  "보건복지부",
  "문화체육관광부",
  "중소벤처기업부",
  "농림축산식품부",
  "기타 28개부처청",
  "지방자치단체",
  "지원액 합계",
  "등록금수입",
  "재정지원수혜율",
] as const;

export const FINANCIAL_SUPPORT_BENEFIT_RATE_CSV_COLUMNS = [
  "year",
  "school_code_std",
  "school_name",
  "school_division",
  "school_kind",
  "region",
  "estb",
  "campus_count",
  "ministry_of_education",
  "national_scholarship",
  "ministry_of_science_ict",
  "ministry_of_employment",
  "ministry_of_trade",
  "ministry_of_health",
  "ministry_of_culture",
  "ministry_of_sme",
  "ministry_of_agriculture",
  "other_ministries",
  "local_government",
  "total_support",
  "tuition_revenue",
  "benefit_rate",
  "uploaded_at",
] as const;

export const FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_SAMPLES = [
  {
    연도: 2024,
    학교코드_표준: "0000101",
    대학명: "서울대학교",
    설립구분: "국립",
    소재지: "서울",
    학제구분: "대학",
    교육부: 50000000000,
    "(맞춤형국가장학금)": 8000000000,
    과학기술정보통신부: 12000000000,
    고용노동부: 500000000,
    산업통상부: 800000000,
    보건복지부: 300000000,
    문화체육관광부: 100000000,
    중소벤처기업부: 50000000,
    농림축산식품부: 200000000,
    "기타 28개부처청": 1500000000,
    지방자치단체: 800000000,
    "지원액 합계": 58200000000,
    등록금수입: "",
    재정지원수혜율: "",
  },
] as const;

export const FINANCIAL_SUPPORT_BENEFIT_RATE_HELP_DESCRIPTION =
  "재정지원수혜율은 대학이 받는 정부·지자체 재정지원 규모를 등록금수입 대비로 나타낸 지표입니다. 업로드 시 G~R열(원) 지원액·등록금수입을 학교코드_표준 기준 본교로 합산한 뒤 수혜율을 재계산하며, 지원액 합계는 맞춤형국가장학금을 차감한 값입니다.";
/** 본교통합 DB 다운로드 헤더 */
export const FINANCIAL_SUPPORT_BENEFIT_RATE_DB_EXPORT_HEADER = [
  "연도",
  "학교코드_표준",
  "대학명",
  "학교구분",
  "학교종류",
  "지역",
  "설립구분",
  "캠퍼스수",
  "교육부",
  "(맞춤형국가장학금)",
  "과학기술정보통신부",
  "고용노동부",
  "산업통상부",
  "보건복지부",
  "문화체육관광부",
  "중소벤처기업부",
  "농림축산식품부",
  "기타 28개부처청",
  "지방자치단체",
  "지원액 합계",
  "등록금수입",
  "재정지원수혜율",
] as const;

export const FINANCIAL_SUPPORT_BENEFIT_RATE_FIXED_ESTB = "사립" as const;

export type FinancialSupportBenefitRateRow = {
  year: number;
  /** 본교통합 후 학교대표코드 */
  schoolCodeStd: string;
  schoolName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  campusCount: number;
  /** 원 단위 저장 */
  ministryOfEducation: number;
  /** H열 맞춤형국가장학금(원) — 지원액 합계 산출 시 차감 */
  nationalScholarship: number;
  ministryOfScienceIct: number;
  ministryOfEmployment: number;
  ministryOfTrade: number;
  ministryOfHealth: number;
  ministryOfCulture: number;
  ministryOfSme: number;
  ministryOfAgriculture: number;
  otherMinistries: number;
  localGovernment: number;
  totalSupport: number;
  /** 등록금수입(억원, ÷100,000,000 반올림) — CSV·화면 표시 */
  tuitionRevenue: number;
  /** 엑셀 S열 재정지원수혜율 (소수 첫째자리) */
  benefitRate: number;
};

export const FINANCIAL_SUPPORT_MINISTRY_COLUMNS = [
  { key: "ministryOfEducation", label: "교육부" },
  {
    key: "nationalScholarship",
    label: "(국가장학금)",
    tone: "yellow" as const,
  },
  { key: "ministryOfScienceIct", label: "과기정통부" },
  { key: "ministryOfEmployment", label: "고용노동부" },
  { key: "ministryOfTrade", label: "산업통상부" },
  { key: "ministryOfHealth", label: "보건복지부" },
  { key: "ministryOfCulture", label: "문화체육부" },
  { key: "ministryOfSme", label: "중소벤처부" },
  { key: "ministryOfAgriculture", label: "농림축산부" },
  { key: "otherMinistries", label: "기타28개처" },
  { key: "localGovernment", label: "지방자치단체" },
] as const;

export const FINANCIAL_SUPPORT_BENEFIT_RATE_HELP_LINES = [
  "재정지원수혜율 : 대학이 받는 정부·지자체 재정지원 규모를 등록금수입 대비로 나타낸 지표이다.",
  "지원액(G~R열) : 원 단위 · 지원액 합계는 맞춤형국가장학금 차감 · 대학별DB 표시는 억원(반올림)",
  "등록금수입(S열) : 원 단위 · 본교·분교 분리/합산 업로드 모두 가능 · 대학별DB 표시는 억원(반올림)",
  "재정지원수혜율 : 본교 합산 후 (지원액합계 / 등록금수입) × 100 · 소수 첫째자리",
  "본교통합 : 학교코드_표준 → 학교대표코드 기준 분교·캠퍼스 데이터를 본교에 합산",
  `설립구분 : 기본 ${FINANCIAL_SUPPORT_BENEFIT_RATE_FIXED_ESTB} · 전체·국립 등 선택 가능`,
] as const;
/** 원 → 억원 (반올림) */
export function wonToEok(won: number | null | undefined): number | null {
  if (won == null || Number.isNaN(won)) return null;
  return Math.round(won / 100_000_000);
}

/** 엑셀 S열 재정지원수혜율 → 소수 첫째자리 */
export function roundBenefitRate(
  rate: number | null | undefined,
): number | null {
  if (rate == null || Number.isNaN(rate)) return null;
  return Math.round(rate * 10) / 10;
}

export function fmtEok(n: number | null | undefined): string {
  const v = typeof n === "number" && !Number.isNaN(n) ? n : null;
  if (v == null) return "—";
  return v.toLocaleString("ko-KR");
}

export function fmtBenefitRate(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
