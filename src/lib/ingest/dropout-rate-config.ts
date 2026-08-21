/** 중도탈락율 업로드 양식 — 1행 헤더 */

export const DROPOUT_RATE_METRIC_GROUPS = [
  {
    key: "enrolled",
    label: "재적학생",
    columns: [
      { key: "total", label: "재적학생" },
      { key: "dropouts", label: "중도탈락" },
      { key: "rate", label: "중도탈락비율" },
    ],
  },
  {
    key: "freshman",
    label: "신입생",
    columns: [
      { key: "total", label: "신입생" },
      { key: "dropouts", label: "중도탈락" },
      { key: "rate", label: "중도탈락비율" },
    ],
  },
] as const;

export type DropoutRateRow = {
  year: number;
  schoolKind: string;
  estb: string;
  schoolDivision: string;
  region: string;
  schoolCodeStd: string;
  schoolName: string;
  enrolled: {
    total: number;
    dropouts: number;
    rate: number;
  };
  freshman: {
    total: number;
    dropouts: number;
    rate: number;
  };
};

export const DROPOUT_RATE_CSV_COLUMNS = [
  "year",
  "school_kind",
  "estb",
  "school_division",
  "region",
  "status",
  "school_code_std",
  "school_name",
  "enrolled_students",
  "enrolled_dropouts",
  "enrolled_dropout_rate",
  "freshman_students",
  "freshman_dropouts",
  "freshman_dropout_rate",
  "uploaded_at",
] as const;

export type DropoutRateCsvRow = Record<
  (typeof DROPOUT_RATE_CSV_COLUMNS)[number],
  string
>;

export const DROPOUT_RATE_TEMPLATE_HEADER = [
  "기준연도",
  "학교종류",
  "설립구분",
  "지역",
  "상태",
  "학교코드_표준",
  "학교",
  "재적학생",
  "재적학생중도탈락",
  "재적학생중도탈락비율",
  "재적학생_신입생",
  "신입생중도탈락",
  "신입생중도탈락비율",
] as const;

export const DROPOUT_RATE_TEMPLATE_SAMPLES = [
  {
    기준연도: 2024,
    학교종류: "대학교",
    설립구분: "사립",
    지역: "경남",
    상태: "기존",
    학교코드_표준: "0002748",
    학교: "가야대학교(김해)",
    재적학생: 2012,
    재적학생중도탈락: 179,
    재적학생중도탈락비율: 8.9,
    재적학생_신입생: 370,
    신입생중도탈락: 42,
    신입생중도탈락비율: 11.4,
  },
  {
    기준연도: 2024,
    학교종류: "대학교",
    설립구분: "국·공립",
    지역: "서울",
    상태: "기존",
    학교코드_표준: "0000019",
    학교: "서울대학교",
    재적학생: 28500,
    재적학생중도탈락: 450,
    재적학생중도탈락비율: 1.58,
    재적학생_신입생: 5200,
    신입생중도탈락: 35,
    신입생중도탈락비율: 0.67,
  },
] as const;
