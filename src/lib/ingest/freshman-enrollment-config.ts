/** 신입생충원 업로드 양식 — 2행 헤더 */

export const FRESHMAN_ENROLLMENT_METRIC_GROUPS = [
  {
    key: "recruit",
    label: "모집인원",
    columns: [
      { key: "total", label: "계" },
      { key: "within", label: "정원내" },
      { key: "outside", label: "정원외" },
    ],
  },
  {
    key: "enrolled",
    label: "입학자",
    columns: [
      { key: "total", label: "계" },
      { key: "within", label: "정원내" },
      { key: "outside", label: "정원외" },
    ],
  },
  {
    key: "fillRate",
    label: "신입생충원율",
    columns: [
      { key: "within", label: "정원내" },
      { key: "withinOutside", label: "정원내외" },
    ],
  },
] as const;

export type FreshmanEnrollmentRow = {
  year: number;
  schoolKind: string;
  estb: string;
  schoolDivision: string;
  region: string;
  schoolCodeStd: string;
  schoolName: string;
  admissionQuota: number;
  recruit: { total: number; within: number; outside: number };
  enrolled: { total: number; within: number; outside: number };
  fillRate: { within: number; withinOutside: number };
};

export const FRESHMAN_ENROLLMENT_CSV_COLUMNS = [
  "year",
  "school_kind",
  "estb",
  "school_division",
  "region",
  "status",
  "school_code_std",
  "school_name",
  "admission_quota",
  "recruit_total",
  "recruit_within",
  "recruit_outside",
  "enrolled_total",
  "enrolled_within",
  "enrolled_outside",
  "fill_rate_within",
  "fill_rate_within_outside",
  "uploaded_at",
] as const;

export type FreshmanEnrollmentCsvRow = Record<
  (typeof FRESHMAN_ENROLLMENT_CSV_COLUMNS)[number],
  string
>;

export const FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW1 = [
  "기준연도",
  "학교종류",
  "설립구분",
  "지역",
  "상태",
  "학교코드_표준",
  "학교",
  "입학정원",
  "모집인원",
  "",
  "",
  "입학자",
  "",
  "",
  "신입생충원율",
  "",
] as const;

export const FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW2 = [
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
  "계",
  "정원내",
  "정원외",
  "정원내",
  "정원내외",
] as const;

/** DB 원본 down 전용 — 학교구분(학교코드 DB 연동) 포함 */
export const FRESHMAN_ENROLLMENT_DB_EXPORT_HEADER_ROW1 = [
  "기준연도",
  "학교종류",
  "설립구분",
  "학교구분",
  "지역",
  "상태",
  "학교코드_표준",
  "학교",
  "입학정원",
  "모집인원",
  "",
  "",
  "입학자",
  "",
  "",
  "신입생충원율",
  "",
] as const;

export const FRESHMAN_ENROLLMENT_DB_EXPORT_HEADER_ROW2 = [
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
  "계",
  "정원내",
  "정원외",
  "정원내",
  "정원내외",
] as const;

export const FRESHMAN_ENROLLMENT_TEMPLATE_SAMPLES = [
  {
    기준연도: 2025,
    학교종류: "대학교",
    설립구분: "사립",
    지역: "경남",
    상태: "기존",
    학교코드_표준: "0002748",
    학교: "가야대학교(김해)",
    입학정원: 405,
    모집인원_계: 432,
    모집인원_정원내: 409,
    모집인원_정원외: 23,
    입학자_계: 414,
    입학자_정원내: 389,
    입학자_정원외: 25,
    신입생충원율_정원내: 95.11,
    신입생충원율_정원내외: 95.83,
  },
  {
    기준연도: 2025,
    학교종류: "대학교",
    설립구분: "국·공립",
    지역: "서울",
    상태: "기존",
    학교코드_표준: "0000019",
    학교: "서울대학교",
    입학정원: 2890,
    모집인원_계: 2950,
    모집인원_정원내: 2890,
    모집인원_정원외: 60,
    입학자_계: 2920,
    입학자_정원내: 2865,
    입학자_정원외: 55,
    신입생충원율_정원내: 99.13,
    신입생충원율_정원내외: 99.32,
  },
] as const;
