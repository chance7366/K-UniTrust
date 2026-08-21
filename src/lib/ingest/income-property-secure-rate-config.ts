/** 수익용재산확보율 업로드 양식 — 1행 헤더 (금액 I~U열 단위: 천원) */

export const INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER = [
  "조사년도",
  "학교코드_표준",
  "학교명",
  "법인명",
  "학교구분명",
  "지역명",
  "설립구분명",
  "학교상태명",
  "토지_평가액",
  "토지_순수입액",
  "건물_평가액",
  "건물_순수입액",
  "유가증권-평가액",
  "유가증권_순수입액",
  "예금_평가액",
  "예금_순수입액",
  "기타재산_평가액",
  "기타재산_순수입액",
  "담보차감액",
  "평가액 합계",
  "순수입액 합계",
] as const;

/** DB down / 화면 표시용 (백만원 + 계산 컬럼) */
export const INCOME_PROPERTY_SECURE_RATE_EXPORT_HEADER = [
  ...INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER.slice(0, 4),
  ...INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER.slice(8),
  "등록금수입",
  "재산확보율",
  "수익율",
] as const;

export const INCOME_PROPERTY_AMOUNT_HEADERS = [
  "토지_평가액",
  "토지_순수입액",
  "건물_평가액",
  "건물_순수입액",
  "유가증권-평가액",
  "유가증권_순수입액",
  "예금_평가액",
  "예금_순수입액",
  "기타재산_평가액",
  "기타재산_순수입액",
  "평가액 합계",
  "순수입액 합계",
] as const;

export type IncomePropertyAmountKey =
  | "landAppraised"
  | "landNetIncome"
  | "buildingAppraised"
  | "buildingNetIncome"
  | "securitiesAppraised"
  | "securitiesNetIncome"
  | "depositAppraised"
  | "depositNetIncome"
  | "otherAppraised"
  | "otherNetIncome"
  | "collateralDeduction"
  | "totalAppraised"
  | "totalNetIncome";

/** 평가액 합계 앞 (담보차감액) 제외 — 테이블 금액열 */
export const INCOME_PROPERTY_TABLE_AMOUNT_HEADERS = [
  ...INCOME_PROPERTY_AMOUNT_HEADERS.slice(0, -2),
] as const;

export const INCOME_PROPERTY_COLLATERAL_DISPLAY_HEADER = "(담보차감액)" as const;

export const INCOME_PROPERTY_TABLE_TOTAL_HEADERS = [
  "평가액 합계",
  "순수입액 합계",
] as const;

export const INCOME_PROPERTY_TABLE_AMOUNT_KEYS: IncomePropertyAmountKey[] = [
  "landAppraised",
  "landNetIncome",
  "buildingAppraised",
  "buildingNetIncome",
  "securitiesAppraised",
  "securitiesNetIncome",
  "depositAppraised",
  "depositNetIncome",
  "otherAppraised",
  "otherNetIncome",
];

export const INCOME_PROPERTY_TABLE_TOTAL_KEYS: IncomePropertyAmountKey[] = [
  "totalAppraised",
  "totalNetIncome",
];

export const INCOME_PROPERTY_AMOUNT_KEYS: IncomePropertyAmountKey[] = [
  "landAppraised",
  "landNetIncome",
  "buildingAppraised",
  "buildingNetIncome",
  "securitiesAppraised",
  "securitiesNetIncome",
  "depositAppraised",
  "depositNetIncome",
  "otherAppraised",
  "otherNetIncome",
  "collateralDeduction",
  "totalAppraised",
  "totalNetIncome",
];

export type IncomePropertySecureRateRow = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  corpName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  schoolStatus: string;
  landAppraised: number;
  landNetIncome: number;
  buildingAppraised: number;
  buildingNetIncome: number;
  securitiesAppraised: number;
  securitiesNetIncome: number;
  depositAppraised: number;
  depositNetIncome: number;
  otherAppraised: number;
  otherNetIncome: number;
  /** 담보차감액 (천원) — 각 재산 평가액에서 차감 후 평가액 합계 산출 */
  collateralDeduction: number;
  totalAppraised: number;
  totalNetIncome: number;
};

export type IncomePropertySecureRateDisplayRow = IncomePropertySecureRateRow & {
  /** 전년도 등록금수입 (천원, 자금확보율 DB) */
  tuitionRevenue: number | null;
  tuitionRevenueMillion: number | null;
  propertySecureRate: number | null;
  revenueRate: number | null;
};

export const INCOME_PROPERTY_SECURE_RATE_CSV_COLUMNS = [
  "year",
  "school_code_std",
  "school_name",
  "corp_name",
  "school_division",
  "region",
  "estb",
  "school_status",
  "land_appraised",
  "land_net_income",
  "building_appraised",
  "building_net_income",
  "securities_appraised",
  "securities_net_income",
  "deposit_appraised",
  "deposit_net_income",
  "other_appraised",
  "other_net_income",
  "collateral_deduction",
  "total_appraised",
  "total_net_income",
  "uploaded_at",
] as const;

export type IncomePropertySecureRateCsvRow = Record<
  (typeof INCOME_PROPERTY_SECURE_RATE_CSV_COLUMNS)[number],
  string
>;

export const INCOME_PROPERTY_HELP_LINES = [
  "수익용재산확보율 : 학교법인이 보유한 수익용기본재산 규모가 등록금수입 대비 어느 정도인지를 나타내는 지표이다.",
  "재산확보율 = 평가액 합계 ÷ 전년도 등록금수입 × 100 (소수점 1자리, 예: 2025년 = 2025년 평가액합계 / 2024년 등록금수입 × 100)",
  "담보차감액(S열)은 각 재산별 평가액에서 차감되는 금액이며, 평가액 합계는 차감 반영 후 값입니다.",
  "수익율 = 순수입액 합계 ÷ 평가액 합계 × 100 (소수점 3자리에서 반올림, 2자리 표시)",
  "등록금수입은 대학재정 · 자금확보율 DB의 전년도·동일 학교코드 데이터를 사용한다.",
  "업로드 금액(I~U열) 단위는 천원이며, 화면·DB down 시 백만원으로 환산(반올림)하여 표시한다.",
] as const;

export const INCOME_PROPERTY_TEMPLATE_SAMPLES = [
  {
    조사년도: 2024,
    학교코드_표준: "0002748",
    학교명: "가야대학교(김해)",
    법인명: "대구학원",
    학교구분명: "대학",
    지역명: "경남",
    설립구분명: "사립",
    학교상태명: "기존",
    토지_평가액: 21317545,
    토지_순수입액: 21317545,
    건물_평가액: 3931273,
    건물_순수입액: 381253,
    "유가증권-평가액": 0,
    유가증권_순수입액: 0,
    예금_평가액: 739734,
    예금_순수입액: 22240,
    기타재산_평가액: 0,
    기타재산_순수입액: 0,
    담보차감액: 0,
    "평가액 합계": 25988552,
    "순수입액 합계": 21721038,
  },
] as const;
