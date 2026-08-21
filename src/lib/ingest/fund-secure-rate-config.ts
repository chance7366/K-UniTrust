/** 자금확보율 업로드 양식 — 1행 헤더 (단위: 천원) */

export const FUND_SECURE_RATE_TEMPLATE_HEADER = [
  "기준연도",
  "학교코드_표준",
  "학교명",
  "학교구분명",
  "학교종류명",
  "지역명",
  "설립구분명",
  "교비_이월자금",
  "교비_기금",
  "산단_이월자금",
  "산단_기금",
  "자금합계",
  "등록금수입",
  "자금확보율",
] as const;

export type FundSecureRateRow = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  schoolFundsCarryover: number;
  schoolFundsEndowment: number;
  industryCarryover: number;
  industryEndowment: number;
  totalFunds: number;
  tuitionRevenue: number;
  fundSecureRate: number;
};

export const FUND_SECURE_RATE_CSV_COLUMNS = [
  "year",
  "school_code_std",
  "school_name",
  "school_division",
  "school_kind",
  "region",
  "estb",
  "school_funds_carryover",
  "school_funds_endowment",
  "industry_carryover",
  "industry_endowment",
  "total_funds",
  "tuition_revenue",
  "fund_secure_rate",
  "uploaded_at",
] as const;

export type FundSecureRateCsvRow = Record<
  (typeof FUND_SECURE_RATE_CSV_COLUMNS)[number],
  string
>;

export const FUND_SECURE_RATE_HELP_DESCRIPTION =
  "대학의 등록금수입(수강료제외) 대비 얼마만큼의 자금을 확보하고 있는가를 보는 지표입니다. 자금은 교비회계의 미사용차기이월자금과 원금보존기금, 임의기금 합계액과 산학협력단의 이월금(유동자산 - 유동부채)과 장기금융상품, 연구/건축/장학/기타기금의 합계액입니다.";

export const FUND_SECURE_RATE_TEMPLATE_SAMPLES = [
  {
    기준연도: 2024,
    학교코드_표준: "0002748",
    학교명: "가야대학교(김해)",
    학교구분명: "대학",
    학교종류명: "대학교",
    지역명: "경남",
    설립구분명: "사립",
    교비_이월자금: 1613185.364,
    교비_기금: 27074722.083,
    산단_이월자금: 167159.832,
    산단_기금: 0,
    자금합계: 28855067.279,
    등록금수입: 11433880.02,
    자금확보율: 252.4,
  },
  {
    기준연도: 2024,
    학교코드_표준: "0000019",
    학교명: "서울대학교",
    학교구분명: "대학",
    학교종류명: "대학교",
    지역명: "서울",
    설립구분명: "국·공립",
    교비_이월자금: 892345678.12,
    교비_기금: 1250000000,
    산단_이월자금: 456789012.34,
    산단_기금: 890000000,
    자금합계: 3489134690.46,
    등록금수입: 2100000000,
    자금확보율: 166.1,
  },
] as const;
