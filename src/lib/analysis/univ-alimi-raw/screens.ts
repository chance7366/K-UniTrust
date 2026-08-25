import type {
  UnivAlimiColMap,
  UnivAlimiDatasetKind,
  UnivAlimiHelpCopy,
  UnivAlimiIndicatorId,
  UnivAlimiScreenConfig,
} from "./types";

export const UNIV_ALIMI_DATASET_LABEL: Record<UnivAlimiDatasetKind, string> = {
  undergrad: "대학전문",
  grad: "대학원",
};

const UNDERGRAD_IDENTITY: UnivAlimiColMap = {
  year: 0,
  schoolCode: 1,
  schoolKind: 2,
  estb: 3,
  region: 4,
  status: 5,
  schoolName: 6,
  firstMetric: 7,
};

/** 중도탈락 대학원: 기준연도, 학교코드, 학교명, 본분교, …, 대학원명, 과정, 지표 */
const DROPOUT_GRAD: UnivAlimiColMap = {
  year: 0,
  schoolCode: 1,
  schoolKind: 4,
  estb: 5,
  region: 6,
  status: 7,
  schoolName: 2,
  gradName: 8,
  firstMetric: 10,
};

/** 재학생충원 대학전문: 기준연도, 상하반기, 학교코드, …, 학교, 지표 */
const ENROLLED_UNDERGRAD: UnivAlimiColMap = {
  year: 0,
  schoolCode: 2,
  schoolKind: 3,
  estb: 4,
  region: 5,
  status: 6,
  schoolName: 7,
  firstMetric: 8,
};

/** 교비·법인 자금·대차·운영: 회계연도, 학교코드, 학교명, 법인명, 학급, 설립, 학종, 지역, 계정과목 */
const EDU_FUND_IDENTITY: UnivAlimiColMap = {
  year: 0,
  schoolCode: 1,
  schoolName: 2,
  status: 4,
  estb: 5,
  schoolKind: 6,
  region: 7,
  firstMetric: 8,
};

/** 산단 현금·대차·운영: 회계연도, 학교코드, 학교명, 법인명, 설립, 학급, 학종, 지역, 계정과목 */
const SANDAN_IDENTITY: UnivAlimiColMap = {
  year: 0,
  schoolCode: 1,
  schoolName: 2,
  estb: 4,
  status: 5,
  schoolKind: 6,
  region: 7,
  firstMetric: 8,
};

/** 수익용재산: 조사년도, 학교코드_표준, 학교명, 법인명, 학교구분, 지역, 설립, 학교상태, 평가액·순수입 */
const INCOME_PROPERTY_IDENTITY: UnivAlimiColMap = {
  year: 0,
  schoolCode: 1,
  schoolName: 2,
  schoolKind: 4,
  region: 5,
  estb: 6,
  status: 7,
  firstMetric: 8,
};

/** 재정지원: 연도, 학교코드_표준, 대학명, 설립구분, 소재지, 학제구분, 부처별 지원액 */
const FINANCIAL_SUPPORT_IDENTITY: UnivAlimiColMap = {
  year: 0,
  schoolCode: 1,
  schoolName: 2,
  estb: 3,
  region: 4,
  schoolKind: 5,
  status: 99,
  firstMetric: 6,
};

/** 재학생충원 대학원: 기준연도, 학교코드, 학교명, 본분교, …, 대학원명, 지표 */
const ENROLLED_GRAD: UnivAlimiColMap = {
  year: 0,
  schoolCode: 1,
  schoolKind: 4,
  estb: 5,
  region: 6,
  status: 7,
  schoolName: 2,
  gradName: 8,
  firstMetric: 9,
};

export const UNIV_ALIMI_COL: Record<
  UnivAlimiIndicatorId,
  { undergrad: UnivAlimiColMap; grad?: UnivAlimiColMap }
> = {
  "enrolled-enrollment": {
    undergrad: ENROLLED_UNDERGRAD,
    grad: ENROLLED_GRAD,
  },
  "dropout-rate": {
    undergrad: UNDERGRAD_IDENTITY,
    grad: DROPOUT_GRAD,
  },
  "enrolled-students": {
    undergrad: UNDERGRAD_IDENTITY,
    grad: ENROLLED_GRAD,
  },
  "origin-school": {
    undergrad: UNDERGRAD_IDENTITY,
  },
  "avg-tuition": {
    undergrad: UNDERGRAD_IDENTITY,
    grad: UNDERGRAD_IDENTITY,
  },
  "edu-fund": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "edu-fund-expense": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "edu-balance": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "edu-operation": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "tuition-fund": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "tuition-fund-expense": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "tuition-balance": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "tuition-operation": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "non-tuition-fund": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "non-tuition-fund-expense": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "non-tuition-balance": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "non-tuition-operation": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "corp-fund": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "corp-fund-expense": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "corp-balance": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "corp-operation": {
    undergrad: EDU_FUND_IDENTITY,
  },
  "industry-cash": {
    undergrad: SANDAN_IDENTITY,
  },
  "industry-balance": {
    undergrad: SANDAN_IDENTITY,
  },
  "industry-operation": {
    undergrad: SANDAN_IDENTITY,
  },
  "income-property": {
    undergrad: INCOME_PROPERTY_IDENTITY,
  },
  "financial-support": {
    undergrad: FINANCIAL_SUPPORT_IDENTITY,
  },
};

export function getUnivAlimiCol(
  indicator: UnivAlimiIndicatorId,
  kind: UnivAlimiDatasetKind,
): UnivAlimiColMap {
  const cols = UNIV_ALIMI_COL[indicator][kind];
  if (!cols) {
    throw new Error("이 지표는 해당 구분을 지원하지 않습니다.");
  }
  return cols;
}

const BOTH_DATASETS: UnivAlimiDatasetKind[] = ["undergrad", "grad"];

const ENROLLED_HELP: UnivAlimiHelpCopy = {
  overview:
    "학부와 대학원 재학생을 학생정원에서 모집정지인원을 뺀 값으로 나누어 재학생충원율을 산출한다.",
  source: "대학알리미",
  management:
    "8월 공시이며, 매년 연도별 자료로 관리한다. 대학전문은 상·하반기 자료를 포함한다.",
  notes:
    "학부(대학, 전문대학)와 대학원 별도 관리가 필요. 학교코드는 학교코드 메뉴에서 참조한다.",
  undergradForm:
    "2행 헤더 · 상하반기 · 학교코드 · 학생정원/모집정지/재학생 · 재학생충원율",
  gradForm:
    "3행 헤더 · 학교코드 · 학교명 · 본분교 · 대학원명 · 재학생(석사·박사·석박사통합) · 재학생충원율",
};

const DROPOUT_HELP: UnivAlimiHelpCopy = {
  overview:
    "재적학생 대비 중도탈락 학생 수를 사유별로 나누어 중도탈락 비율을 산출한다.",
  source: "대학알리미",
  management: "8월 공시이며, 매년 연도별 자료로 관리한다.",
  notes:
    "학부(대학, 전문대학)와 대학원 별도 관리가 필요. 대학원은 과정(석사 등) 컬럼이 있다. 학교코드는 학교코드 메뉴에서 참조한다.",
  undergradForm:
    "2행 헤더 · 학교코드 · 재적학생 · 사유별 중도탈락 · 신입생 중도탈락",
  gradForm:
    "2행 헤더 · 학교코드 · 학교명 · 본분교 · 대학원명 · 과정 · 사유별 중도탈락",
};

const ENROLLED_STUDENTS_HELP: UnivAlimiHelpCopy = {
  overview:
    "재학생·휴학생·학위취득유예 학생을 합산하여 재적학생 수를 산출한다.",
  source: "대학알리미",
  management: "8월 공시이며, 매년 연도별 자료로 관리한다.",
  notes:
    "학부(대학, 전문대학)와 대학원 별도 관리가 필요. 학교코드는 학교코드 메뉴에서 참조한다.",
  undergradForm:
    "3행 헤더 · 학교코드 · 학교명 · 학생정원 · 재학생/휴학생/학위취득유예/재적학생(남·여·정원내외)",
  gradForm:
    "3행 헤더 · 학교코드 · 학교명 · 본분교 · 대학원명 · 재학생/휴학생/재적학생(남·여·정원내외)",
};

const ORIGIN_SCHOOL_HELP: UnivAlimiHelpCopy = {
  overview:
    "신입생의 출신 고등학교 유형별·지역정보별 입학자수와 비율을 공시한다.",
  source: "대학알리미",
  management: "매년 연도별 자료로 관리한다. 학부(대학, 전문대학)만 해당한다.",
  notes:
    "대학원 자료는 없다. 학교코드는 학교코드 메뉴에서 참조한다.",
  undergradForm:
    "6행 헤더 · 학교코드 · 총입학자수 · 출신학교 유형별(일반고·특목고·특성화고·자율고·기타) · 지역정보별 입학자수 및 비율",
};

const EDU_FUND_HELP: UnivAlimiHelpCopy = {
  overview:
    "교비회계 자금계산서의 수입 항목(자금수입총계·운영수입·등록금 등)을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금수입 계정과목",
};

const EDU_FUND_EXPENSE_HELP: UnivAlimiHelpCopy = {
  overview:
    "교비회계 자금계산서의 지출 항목(자금지출총계·운영지출·보수 등)을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금지출 계정과목",
};

const EDU_BALANCE_HELP: UnivAlimiHelpCopy = {
  overview:
    "교비회계 대차대조표의 자산·부채·기본금 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 소지역 · 대차대조표 계정과목",
};

const EDU_OPERATION_HELP: UnivAlimiHelpCopy = {
  overview:
    "교비회계 운영계산서의 수익·비용·운영차액 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 운영계산서 계정과목",
};

const TUITION_FUND_HELP: UnivAlimiHelpCopy = {
  overview:
    "등록금회계 자금계산서의 수입 항목(자금수입총계·운영수입·등록금 등)을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금수입 계정과목",
};

const TUITION_FUND_EXPENSE_HELP: UnivAlimiHelpCopy = {
  overview:
    "등록금회계 자금계산서의 지출 항목(자금지출총계·운영지출·보수 등)을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금지출 계정과목",
};

const TUITION_BALANCE_HELP: UnivAlimiHelpCopy = {
  overview:
    "등록금회계 대차대조표의 자산·부채·기본금 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 소지역 · 대차대조표 계정과목",
};

const TUITION_OPERATION_HELP: UnivAlimiHelpCopy = {
  overview:
    "등록금회계 운영계산서의 수익·비용·운영차액 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 운영계산서 계정과목",
};

const NON_TUITION_FUND_HELP: UnivAlimiHelpCopy = {
  overview:
    "비등록금회계 자금계산서의 수입 항목(자금수입총계·운영수입 등)을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금수입 계정과목",
};

const NON_TUITION_FUND_EXPENSE_HELP: UnivAlimiHelpCopy = {
  overview:
    "비등록금회계 자금계산서의 지출 항목(자금지출총계·운영지출 등)을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금지출 계정과목",
};

const NON_TUITION_BALANCE_HELP: UnivAlimiHelpCopy = {
  overview:
    "비등록금회계 대차대조표의 자산·부채·기본금 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 소지역 · 대차대조표 계정과목",
};

const NON_TUITION_OPERATION_HELP: UnivAlimiHelpCopy = {
  overview:
    "비등록금회계 운영계산서의 수익·비용·운영차액 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 원 자료 기준이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 운영계산서 계정과목",
};

const CORP_FUND_HELP: UnivAlimiHelpCopy = {
  overview:
    "법인일반회계 자금계산서의 수입 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금수입 계정과목",
};

const CORP_FUND_EXPENSE_HELP: UnivAlimiHelpCopy = {
  overview:
    "법인일반회계 자금계산서의 지출 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 자금지출 계정과목",
};

const CORP_BALANCE_HELP: UnivAlimiHelpCopy = {
  overview:
    "법인일반회계 대차대조표의 자산·부채·기본금 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 소지역 · 대차대조표 계정과목",
};

const CORP_OPERATION_HELP: UnivAlimiHelpCopy = {
  overview:
    "법인일반회계 운영계산서의 수익·비용·운영차액 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 학급 · 설립 · 학종 · 지역 · 운영계산서 계정과목",
};

const INDUSTRY_CASH_HELP: UnivAlimiHelpCopy = {
  overview:
    "산학협력단 현금흐름표의 현금유입·유출 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 설립 · 학급 · 학종 · 지역 · 현금흐름 계정과목",
};

const INDUSTRY_BALANCE_HELP: UnivAlimiHelpCopy = {
  overview:
    "산학협력단 대차대조표의 자산·부채·기본금 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 설립 · 학급 · 학종 · 지역 · 대차대조표 계정과목",
};

const INDUSTRY_OPERATION_HELP: UnivAlimiHelpCopy = {
  overview:
    "산학협력단 운영계산서의 수익·비용·운영차액 항목을 계정과목별로 공시한다.",
  source: "대학재정알리미",
  management: "매년 회계연도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 회계연도 · 학교코드 · 학교명 · 법인명 · 설립 · 학급 · 학종 · 지역 · 운영계산서 계정과목",
};

const INCOME_PROPERTY_HELP: UnivAlimiHelpCopy = {
  overview:
    "학교법인의 수익용 기본재산(토지·건물·유가증권·예금·기타) 평가액과 순수입액을 공시한다.",
  source: "대학재정알리미",
  management: "매년 조사년도별 자료로 관리한다. 대학·대학원 구분은 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 금액 단위는 천원이다.",
  undergradForm:
    "1행 헤더 · 조사년도 · 학교코드_표준 · 학교명 · 법인명 · 학교구분 · 지역 · 설립 · 학교상태 · 재산 유형별 평가액·순수입액",
};

const FINANCIAL_SUPPORT_HELP: UnivAlimiHelpCopy = {
  overview:
    "교육부 등 중앙부처·지방자치단체 재정지원액과 지원액 합계, 등록금수입, 재정지원수혜율을 공시한다.",
  source: "대학재정알리미",
  management:
    "매년 연도별 자료로 관리한다. 학제구분은 대학·전문대학·대학원대학이며, 대학원 과정 별도 시트는 없다.",
  notes:
    "학교코드는 학교코드 메뉴에서 참조한다. 지원액·등록금수입 단위는 원이다. 재정지원수혜율은 지원액 합계를 등록금수입으로 나눈 비율(%)이다.",
  undergradForm:
    "1행 헤더 · 연도 · 학교코드_표준 · 대학명 · 설립구분 · 소재지 · 학제구분 · 부처별 지원액 · 지원액 합계 · 등록금수입 · 재정지원수혜율",
};

const AVG_TUITION_HELP: UnivAlimiHelpCopy = {
  overview:
    "대학·대학원별 1인당 평균 수업료·등록금과 계열별(인문사회·자연과학·예체능·공학·의학) 등록금을 공시한다.",
  source: "대학알리미",
  management: "매년 연도별 자료로 관리한다.",
  notes:
    "학부(대학, 전문대학)와 대학원 별도 관리가 필요. 학교코드는 학교코드 메뉴에서 참조한다. 등록금자료는 본교, 캠퍼스별 공시되고 있으며, 재정추계분석시 사용하는 대표학교 평균등록금은 재학생충원의 재학생수로 가중평균합니다.",
  undergradForm:
    "1행 헤더 · 학교코드 · 학교명 · 수업료 · 등록금 · 계열별 등록금",
  gradForm:
    "1행 헤더 · 학교코드 · 학교명 · 입학금 · 수업료 · 등록금 · 계열별 등록금",
};

export const UNIV_ALIMI_SCREENS: Record<
  UnivAlimiIndicatorId,
  UnivAlimiScreenConfig
> = {
  "enrolled-enrollment": {
    id: "enrolled-enrollment",
    tabId: "enrolled-enrollment",
    title: "재학생충원",
    subtitle: "대학알리미 · 재학생 충원 현황",
    apiBase: "/api/ingest/univ-map/alimi/enrolled-enrollment",
    datasets: BOTH_DATASETS,
    help: ENROLLED_HELP,
  },
  "dropout-rate": {
    id: "dropout-rate",
    tabId: "dropout-rate",
    title: "중도탈락",
    subtitle: "대학알리미 · 중도탈락 학생 현황",
    apiBase: "/api/ingest/univ-map/alimi/dropout-rate",
    datasets: BOTH_DATASETS,
    help: DROPOUT_HELP,
  },
  "enrolled-students": {
    id: "enrolled-students",
    tabId: "enrolled-students",
    title: "재적학생",
    subtitle: "대학알리미 · 재적학생 현황",
    apiBase: "/api/ingest/univ-map/alimi/enrolled-students",
    datasets: BOTH_DATASETS,
    help: ENROLLED_STUDENTS_HELP,
  },
  "origin-school": {
    id: "origin-school",
    tabId: "origin-school",
    title: "출신학교",
    subtitle: "대학알리미 · 신입생 출신 고등학교 유형·지역",
    apiBase: "/api/ingest/univ-map/alimi/origin-school",
    datasets: ["undergrad"],
    help: ORIGIN_SCHOOL_HELP,
  },
  "avg-tuition": {
    id: "avg-tuition",
    tabId: "avg-tuition",
    title: "평균등록금",
    subtitle: "대학알리미 · 1인당 평균 등록금",
    apiBase: "/api/ingest/univ-map/alimi/avg-tuition",
    datasets: BOTH_DATASETS,
    help: AVG_TUITION_HELP,
  },
  "edu-fund": {
    id: "edu-fund",
    tabId: "edu-fund",
    title: "교비자금(수입)",
    subtitle: "대학재정알리미 · 교비회계 자금계산서 수입",
    apiBase: "/api/ingest/univ-map/alimi/edu-fund",
    datasets: ["undergrad"],
    help: EDU_FUND_HELP,
  },
  "edu-fund-expense": {
    id: "edu-fund-expense",
    tabId: "edu-fund-expense",
    title: "교비자금(지출)",
    subtitle: "대학재정알리미 · 교비회계 자금계산서 지출",
    apiBase: "/api/ingest/univ-map/alimi/edu-fund-expense",
    datasets: ["undergrad"],
    help: EDU_FUND_EXPENSE_HELP,
  },
  "edu-balance": {
    id: "edu-balance",
    tabId: "edu-balance",
    title: "교비대차",
    subtitle: "대학재정알리미 · 교비회계 대차대조표",
    apiBase: "/api/ingest/univ-map/alimi/edu-balance",
    datasets: ["undergrad"],
    help: EDU_BALANCE_HELP,
  },
  "edu-operation": {
    id: "edu-operation",
    tabId: "edu-operation",
    title: "교비운영",
    subtitle: "대학재정알리미 · 교비회계 운영계산서",
    apiBase: "/api/ingest/univ-map/alimi/edu-operation",
    datasets: ["undergrad"],
    help: EDU_OPERATION_HELP,
  },
  "tuition-fund": {
    id: "tuition-fund",
    tabId: "tuition-fund",
    title: "등록금자금(수입)",
    subtitle: "대학재정알리미 · 등록금회계 자금계산서 수입",
    apiBase: "/api/ingest/univ-map/alimi/tuition-fund",
    datasets: ["undergrad"],
    help: TUITION_FUND_HELP,
  },
  "tuition-fund-expense": {
    id: "tuition-fund-expense",
    tabId: "tuition-fund-expense",
    title: "등록금자금(지출)",
    subtitle: "대학재정알리미 · 등록금회계 자금계산서 지출",
    apiBase: "/api/ingest/univ-map/alimi/tuition-fund-expense",
    datasets: ["undergrad"],
    help: TUITION_FUND_EXPENSE_HELP,
  },
  "tuition-balance": {
    id: "tuition-balance",
    tabId: "tuition-balance",
    title: "등록금대차",
    subtitle: "대학재정알리미 · 등록금회계 대차대조표",
    apiBase: "/api/ingest/univ-map/alimi/tuition-balance",
    datasets: ["undergrad"],
    help: TUITION_BALANCE_HELP,
  },
  "tuition-operation": {
    id: "tuition-operation",
    tabId: "tuition-operation",
    title: "등록금운영",
    subtitle: "대학재정알리미 · 등록금회계 운영계산서",
    apiBase: "/api/ingest/univ-map/alimi/tuition-operation",
    datasets: ["undergrad"],
    help: TUITION_OPERATION_HELP,
  },
  "non-tuition-fund": {
    id: "non-tuition-fund",
    tabId: "non-tuition-fund",
    title: "비등록금자금(수입)",
    subtitle: "대학재정알리미 · 비등록금회계 자금계산서 수입",
    apiBase: "/api/ingest/univ-map/alimi/non-tuition-fund",
    datasets: ["undergrad"],
    help: NON_TUITION_FUND_HELP,
  },
  "non-tuition-fund-expense": {
    id: "non-tuition-fund-expense",
    tabId: "non-tuition-fund-expense",
    title: "비등록금자금(지출)",
    subtitle: "대학재정알리미 · 비등록금회계 자금계산서 지출",
    apiBase: "/api/ingest/univ-map/alimi/non-tuition-fund-expense",
    datasets: ["undergrad"],
    help: NON_TUITION_FUND_EXPENSE_HELP,
  },
  "non-tuition-balance": {
    id: "non-tuition-balance",
    tabId: "non-tuition-balance",
    title: "비등록금대차",
    subtitle: "대학재정알리미 · 비등록금회계 대차대조표",
    apiBase: "/api/ingest/univ-map/alimi/non-tuition-balance",
    datasets: ["undergrad"],
    help: NON_TUITION_BALANCE_HELP,
  },
  "non-tuition-operation": {
    id: "non-tuition-operation",
    tabId: "non-tuition-operation",
    title: "비등록금운영",
    subtitle: "대학재정알리미 · 비등록금회계 운영계산서",
    apiBase: "/api/ingest/univ-map/alimi/non-tuition-operation",
    datasets: ["undergrad"],
    help: NON_TUITION_OPERATION_HELP,
  },
  "corp-fund": {
    id: "corp-fund",
    tabId: "corp-fund",
    title: "법인자금(수입)",
    subtitle: "대학재정알리미 · 법인일반회계 자금계산서 수입",
    apiBase: "/api/ingest/univ-map/alimi/corp-fund",
    datasets: ["undergrad"],
    help: CORP_FUND_HELP,
  },
  "corp-fund-expense": {
    id: "corp-fund-expense",
    tabId: "corp-fund-expense",
    title: "법인자금(지출)",
    subtitle: "대학재정알리미 · 법인일반회계 자금계산서 지출",
    apiBase: "/api/ingest/univ-map/alimi/corp-fund-expense",
    datasets: ["undergrad"],
    help: CORP_FUND_EXPENSE_HELP,
  },
  "corp-balance": {
    id: "corp-balance",
    tabId: "corp-balance",
    title: "법인대차",
    subtitle: "대학재정알리미 · 법인일반회계 대차대조표",
    apiBase: "/api/ingest/univ-map/alimi/corp-balance",
    datasets: ["undergrad"],
    help: CORP_BALANCE_HELP,
  },
  "corp-operation": {
    id: "corp-operation",
    tabId: "corp-operation",
    title: "법인운영",
    subtitle: "대학재정알리미 · 법인일반회계 운영계산서",
    apiBase: "/api/ingest/univ-map/alimi/corp-operation",
    datasets: ["undergrad"],
    help: CORP_OPERATION_HELP,
  },
  "industry-cash": {
    id: "industry-cash",
    tabId: "industry-cash",
    title: "산단현금",
    subtitle: "대학재정알리미 · 산학협력단 현금흐름표",
    apiBase: "/api/ingest/univ-map/alimi/industry-cash",
    datasets: ["undergrad"],
    help: INDUSTRY_CASH_HELP,
  },
  "industry-balance": {
    id: "industry-balance",
    tabId: "industry-balance",
    title: "산단대차",
    subtitle: "대학재정알리미 · 산학협력단 대차대조표",
    apiBase: "/api/ingest/univ-map/alimi/industry-balance",
    datasets: ["undergrad"],
    help: INDUSTRY_BALANCE_HELP,
  },
  "industry-operation": {
    id: "industry-operation",
    tabId: "industry-operation",
    title: "산단운영",
    subtitle: "대학재정알리미 · 산학협력단 운영계산서",
    apiBase: "/api/ingest/univ-map/alimi/industry-operation",
    datasets: ["undergrad"],
    help: INDUSTRY_OPERATION_HELP,
  },
  "income-property": {
    id: "income-property",
    tabId: "income-property",
    title: "수익용재산",
    subtitle: "대학재정알리미 · 학교법인 수익용 기본재산",
    apiBase: "/api/ingest/univ-map/alimi/income-property",
    datasets: ["undergrad"],
    help: INCOME_PROPERTY_HELP,
  },
  "financial-support": {
    id: "financial-support",
    tabId: "financial-support",
    title: "재정지원",
    subtitle: "대학재정알리미 · 부처·지자체 재정지원액",
    apiBase: "/api/ingest/univ-map/alimi/financial-support",
    datasets: ["undergrad"],
    help: FINANCIAL_SUPPORT_HELP,
  },
};

export function getUnivAlimiDatasets(
  indicator: UnivAlimiIndicatorId,
): UnivAlimiDatasetKind[] {
  return UNIV_ALIMI_SCREENS[indicator].datasets;
}

export function isUnivAlimiIndicator(
  value: string,
): value is UnivAlimiIndicatorId {
  return value in UNIV_ALIMI_SCREENS;
}

export function parseUnivAlimiDataset(
  value: string,
): UnivAlimiDatasetKind | null {
  if (value === "undergrad" || value === "grad") return value;
  return null;
}
