/** 등록금의존율 업로드 양식 — 1행 헤더 (단위: 천원) */

export const TUITION_DEPENDENCY_RATE_TEMPLATE_HEADER = [
  "기준연도",
  "학교코드_표준",
  "학교명",
  "학교구분명",
  "학교종류명",
  "지역명",
  "설립구분명",
  "등록금수입",
  "교비_운영수입",
  "산단_운영수입",
  "운영수입합계",
  "등록금의존율",
] as const;

export type TuitionDependencyRateRow = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  tuitionRevenue: number;
  schoolOperatingRevenue: number;
  industryOperatingRevenue: number;
  totalOperatingRevenue: number;
  tuitionDependencyRate: number;
};

export const TUITION_DEPENDENCY_RATE_CSV_COLUMNS = [
  "year",
  "school_code_std",
  "school_name",
  "school_division",
  "school_kind",
  "region",
  "estb",
  "tuition_revenue",
  "school_operating_revenue",
  "industry_operating_revenue",
  "total_operating_revenue",
  "tuition_dependency_rate",
  "uploaded_at",
] as const;

export type TuitionDependencyRateCsvRow = Record<
  (typeof TUITION_DEPENDENCY_RATE_CSV_COLUMNS)[number],
  string
>;

export const TUITION_DEPENDENCY_RATE_HELP_LINES = [
  "등록금의존율 : 대학의 등록금수입 외 보조금, 산학협력수익, 기부금 등의 외부 재원을 통한 운영으로 대학 재정의 안정적 확보 정도를 판단한다.",
  "산출시 : 등록금수입(수강료수입제외) / 운영수입(교비회계+산학협력단회계)",
  "교비회계 운영수입 : 자금계산서 운영수입",
  "산단회계 운영수입 : 현금흐름표의 운영활동현금유입액",
  "낮을 수록 좋은 지표이다.",
] as const;

export const TUITION_DEPENDENCY_RATE_TEMPLATE_SAMPLES = [
  {
    기준연도: 2024,
    학교코드_표준: "0002748",
    학교명: "가야대학교(김해)",
    학교구분명: "대학",
    학교종류명: "대학교",
    지역명: "경남",
    설립구분명: "사립",
    등록금수입: 11433880.02,
    교비_운영수입: 20735265.777,
    산단_운영수입: 1044515.019,
    운영수입합계: 21779780.796,
    등록금의존율: 52.5,
  },
  {
    기준연도: 2024,
    학교코드_표준: "0000046",
    학교명: "가톨릭대학교",
    학교구분명: "대학",
    학교종류명: "대학교",
    지역명: "경기",
    설립구분명: "사립",
    등록금수입: 89234567.12,
    교비_운영수입: 198765432.1,
    산단_운영수입: 45678901.23,
    운영수입합계: 244444333.33,
    등록금의존율: 36.5,
  },
] as const;
