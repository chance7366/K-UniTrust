/** 법인전입금비율 업로드 양식 — 1행 헤더 (단위: 천원) */

export const CORP_TRANSFER_RATIO_TEMPLATE_HEADER = [
  "기준연도",
  "학교코드_표준",
  "학교명",
  "학교구분명",
  "학교종류명",
  "지역명",
  "설립구분명",
  "경상비전입금",
  "법정부담전입금",
  "자산전입금",
  "전입금합계",
  "등록금수입",
  "전입금비율",
] as const;

export type CorpTransferRatioRow = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  schoolDivision: string;
  schoolKind: string;
  region: string;
  estb: string;
  ordinaryExpenseTransfer: number;
  legalObligationTransfer: number;
  assetTransfer: number;
  totalTransfer: number;
  tuitionRevenue: number;
  transferRatio: number;
};

export const CORP_TRANSFER_RATIO_CSV_COLUMNS = [
  "year",
  "school_code_std",
  "school_name",
  "school_division",
  "school_kind",
  "region",
  "estb",
  "ordinary_expense_transfer",
  "legal_obligation_transfer",
  "asset_transfer",
  "total_transfer",
  "tuition_revenue",
  "transfer_ratio",
  "uploaded_at",
] as const;

export type CorpTransferRatioCsvRow = Record<
  (typeof CORP_TRANSFER_RATIO_CSV_COLUMNS)[number],
  string
>;

export const CORP_TRANSFER_RATIO_HELP_LINES = [
  "법인전입금비율 : 학교법인이 수익용기본재산을 활용하여 수익을 창출하고 대학의 운영경비를 어느정도 지원하고 있는지를 판단하는 지표로 법인의 재정건전성을 평가한다.",
  "산출식 : 교비회계 법인전입금 / 등록금수입(수강료제외)",
  "교비회계 법인전입금 : 경상비전입금, 법정부담전입금, 자산전입금",
  "높을 수록 좋은 지표이다.",
] as const;

export const CORP_TRANSFER_RATIO_TEMPLATE_SAMPLES = [
  {
    기준연도: 2024,
    학교코드_표준: "0002748",
    학교명: "가야대학교(김해)",
    학교구분명: "대학",
    학교종류명: "대학교",
    지역명: "경남",
    설립구분명: "사립",
    경상비전입금: 7260,
    법정부담전입금: 148400,
    자산전입금: 0,
    전입금합계: 155660,
    등록금수입: 11433880.02,
    전입금비율: 1.4,
  },
  {
    기준연도: 2024,
    학교코드_표준: "0000046",
    학교명: "가톨릭대학교",
    학교구분명: "대학",
    학교종류명: "대학교",
    지역명: "경기",
    설립구분명: "사립",
    경상비전입금: 39614067.576,
    법정부담전입금: 7964456.992,
    자산전입금: 0,
    전입금합계: 47578524.568,
    등록금수입: 89773776.206,
    전입금비율: 53,
  },
] as const;
