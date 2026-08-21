/** 재학생충원 업로드 양식 — 2행 헤더 */

export const ENROLLED_ENROLLMENT_METRIC_GROUPS = [
  {
    key: "enrolled",
    label: "재학생",
    columns: [
      { key: "total", label: "계" },
      { key: "within", label: "정원내" },
      { key: "outside", label: "정원외" },
    ],
  },
  {
    key: "fillRate",
    label: "재학생충원율",
    columns: [{ key: "total", label: "" }],
  },
  {
    key: "fillRateWithin",
    label: "정원내 재학생충원율",
    columns: [{ key: "within", label: "" }],
  },
] as const;

export type EnrolledEnrollmentRow = {
  year: number;
  half: string;
  schoolKind: string;
  estb: string;
  schoolDivision: string;
  region: string;
  schoolCodeStd: string;
  schoolName: string;
  studentQuota: number;
  recruitmentSuspension: number;
  enrolled: { total: number; within: number; outside: number };
  fillRate: number;
  fillRateWithin: number;
};

export const ENROLLED_ENROLLMENT_CSV_COLUMNS = [
  "year",
  "half",
  "school_kind",
  "estb",
  "school_division",
  "region",
  "status",
  "school_code_std",
  "school_name",
  "student_quota",
  "recruitment_suspension",
  "enrolled_total",
  "enrolled_within",
  "enrolled_outside",
  "fill_rate",
  "fill_rate_within",
  "uploaded_at",
] as const;

export type EnrolledEnrollmentCsvRow = Record<
  (typeof ENROLLED_ENROLLMENT_CSV_COLUMNS)[number],
  string
>;

export const ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW1 = [
  "기준연도",
  "상하반기",
  "학교종류",
  "설립구분",
  "지역",
  "상태",
  "학교코드_표준",
  "학교",
  "학생정원",
  "학생모집정지인원",
  "재학생",
  "",
  "",
  "재학생충원율",
  "정원내 재학생 충원율",
] as const;

export const ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2 = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "계",
  "정원내",
  "정원외",
  "",
  "",
] as const;

export const ENROLLED_ENROLLMENT_TEMPLATE_SAMPLES = [
  {
    기준연도: 2025,
    상하반기: "하반기",
    학교종류: "대학교",
    설립구분: "사립",
    지역: "경남",
    상태: "기존",
    학교코드_표준: "0002748",
    학교: "가야대학교(김해)",
    학생정원: 3200,
    학생모집정지인원: 0,
    재학생_계: 2980,
    재학생_정원내: 2850,
    재학생_정원외: 130,
    재학생충원율: 93.13,
    정원내재학생충원율: 89.06,
  },
  {
    기준연도: 2025,
    상하반기: "하반기",
    학교종류: "대학교",
    설립구분: "국·공립",
    지역: "서울",
    상태: "기존",
    학교코드_표준: "0000019",
    학교: "서울대학교",
    학생정원: 28500,
    학생모집정지인원: 0,
    재학생_계: 27200,
    재학생_정원내: 26800,
    재학생_정원외: 400,
    재학생충원율: 95.44,
    정원내재학생충원율: 94.04,
  },
] as const;
