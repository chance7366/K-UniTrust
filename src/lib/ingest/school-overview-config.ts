/** 학교개황 업로드 양식 — 학교 개황 정보 (1행 헤더) */

export const SCHOOL_OVERVIEW_TEMPLATE_HEADER = [
  "학교코드_표준",
  "학교명",
  "본분교",
  "학제",
  "지역",
  "설립구분",
  "관련법령",
  "법인명",
  "학교상태",
  "학교명(영문)",
  "도로명주소",
  "지번주소",
  "우편번호",
  "학교개교일",
  "학교홈페이지",
] as const;

export type SchoolOverviewRow = {
  schoolCodeStd: string;
  schoolName: string;
  mainBranch: string;
  schoolType: string;
  /** 학교코드 DB 연동 — school_kind */
  schoolKind: string;
  region: string;
  establishment: string;
  relatedLaw: string;
  corpName: string;
  schoolStatus: string;
  schoolNameEn: string;
  roadAddress: string;
  lotAddress: string;
  zipCode: string;
  foundedDate: string;
  homepage: string;
};

export const SCHOOL_OVERVIEW_COLUMNS: {
  key: keyof SchoolOverviewRow;
  label: string;
}[] = [
  { key: "schoolCodeStd", label: "학교코드" },
  { key: "schoolName", label: "학교명" },
  { key: "mainBranch", label: "본분교" },
  { key: "schoolType", label: "학교구분" },
  { key: "region", label: "지역" },
  { key: "establishment", label: "설립구분" },
  { key: "relatedLaw", label: "관련법령" },
  { key: "corpName", label: "법인명" },
  { key: "schoolStatus", label: "학교상태" },
  { key: "schoolNameEn", label: "학교명(영문)" },
  { key: "roadAddress", label: "도로명주소" },
  { key: "lotAddress", label: "지번주소" },
  { key: "zipCode", label: "우편번호" },
  { key: "foundedDate", label: "학교개교일" },
  { key: "homepage", label: "학교홈페이지" },
];

export const SCHOOL_OVERVIEW_CSV_COLUMNS = [
  "school_code_std",
  "school_name",
  "main_branch",
  "school_type",
  "region",
  "establishment",
  "related_law",
  "corp_name",
  "school_status",
  "school_name_en",
  "road_address",
  "lot_address",
  "zip_code",
  "founded_date",
  "homepage",
  "uploaded_at",
] as const;

export type SchoolOverviewCsvRow = Record<
  (typeof SCHOOL_OVERVIEW_CSV_COLUMNS)[number],
  string
>;

export const SCHOOL_OVERVIEW_SOURCE_FILE =
  "학교 개황 정보(2026.7.22.기준).xlsx";
export const SCHOOL_OVERVIEW_BASE_DATE = "2026-07-22";

export const SCHOOL_OVERVIEW_TEMPLATE_SAMPLES = [
  {
    학교코드_표준: "0000001",
    학교명: "국립강릉원주대학교",
    본분교: "본교",
    학제: "대학교",
    지역: "강원",
    설립구분: "국립",
    관련법령: "고등교육법",
    법인명: "해당없음",
    학교상태: "폐교",
    "학교명(영문)": "Gangneung Wonju National University",
    도로명주소: "강원특별자치도 강릉시 죽헌길 7 (지변동)",
    지번주소: "",
    우편번호: "25457",
    학교개교일: "1979-03-01",
    학교홈페이지: "www.gwnu.ac.kr",
  },
  {
    학교코드_표준: "0002748",
    학교명: "가야대학교(김해)",
    본분교: "본교",
    학제: "대학교",
    지역: "경남",
    설립구분: "사립",
    관련법령: "고등교육법",
    법인명: "학교법인 가야학원",
    학교상태: "기존",
    "학교명(영문)": "Gaya University",
    도로명주소: "경상남도 김해시 인제로 197",
    지번주소: "",
    우편번호: "50834",
    학교개교일: "1992-03-01",
    학교홈페이지: "www.gaya.ac.kr",
  },
] as const;
