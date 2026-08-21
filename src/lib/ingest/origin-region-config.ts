/** 출신지역 업로드 양식 — 2행 헤더 (기준연도·학교정보 + 출신지역별 학생수·비율) */

export const ORIGIN_REGION_REGION_GROUPS = [
  { key: "special_city", label: "특광자치시" },
  { key: "small_city_etc", label: "중소도시등" },
  { key: "metro", label: "특별시" },
  { key: "wide_city", label: "광역시·특별자치시" },
  { key: "small_city", label: "중소도시" },
  { key: "town_special_other", label: "읍면/특수/기타" },
] as const;

export type OriginRegionCategoryKey =
  (typeof ORIGIN_REGION_REGION_GROUPS)[number]["key"];

export type OriginRegionCategoryCell = {
  count: number;
  ratio: number;
};

export type OriginRegionRow = {
  year: number;
  schoolCodeStd: string;
  schoolKind: string;
  estb: string;
  schoolDivision: string;
  region: string;
  schoolName: string;
  totalEnrolled: number;
  byRegion: Record<OriginRegionCategoryKey, OriginRegionCategoryCell>;
};

export const ORIGIN_REGION_CSV_COLUMNS = [
  "year",
  "school_kind",
  "estb",
  "region",
  "status",
  "school_code_std",
  "school_name",
  "total_enrolled",
  "special_city_count",
  "special_city_ratio",
  "small_city_etc_count",
  "small_city_etc_ratio",
  "metro_count",
  "metro_ratio",
  "wide_city_count",
  "wide_city_ratio",
  "small_city_count",
  "small_city_ratio",
  "town_special_other_count",
  "town_special_other_ratio",
  "uploaded_at",
] as const;

export type OriginRegionCsvRow = Record<
  (typeof ORIGIN_REGION_CSV_COLUMNS)[number],
  string
>;

export const ORIGIN_REGION_REGION_CSV_KEYS: Record<
  OriginRegionCategoryKey,
  { count: string; ratio: string }
> = {
  special_city: { count: "special_city_count", ratio: "special_city_ratio" },
  small_city_etc: {
    count: "small_city_etc_count",
    ratio: "small_city_etc_ratio",
  },
  metro: { count: "metro_count", ratio: "metro_ratio" },
  wide_city: { count: "wide_city_count", ratio: "wide_city_ratio" },
  small_city: { count: "small_city_count", ratio: "small_city_ratio" },
  town_special_other: {
    count: "town_special_other_count",
    ratio: "town_special_other_ratio",
  },
};

/** 양식 미리보기 — 1행 헤더(병합 구간 표시용) */
export const ORIGIN_REGION_TEMPLATE_HEADER_ROW1 = [
  "기준연도",
  "학교종류",
  "설립구분",
  "지역",
  "상태",
  "학교코드_표준",
  "학교",
  "총입학자수",
  "특광자치시",
  "",
  "중소도시등",
  "",
  "특별시",
  "",
  "광역시·특별자치시",
  "",
  "중소도시",
  "",
  "읍면/특수/기타",
  "",
] as const;

export const ORIGIN_REGION_TEMPLATE_HEADER_ROW2 = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "학생수",
  "비율",
  "학생수",
  "비율",
  "학생수",
  "비율",
  "학생수",
  "비율",
  "학생수",
  "비율",
  "학생수",
  "비율",
] as const;

export const ORIGIN_REGION_TEMPLATE_SAMPLES = [
  {
    기준연도: 2026,
    학교종류: "대학교",
    설립구분: "사립",
    지역: "경남",
    상태: "기존",
    학교코드_표준: "0002748",
    학교: "가야대학교(김해)",
    총입학자수: 430,
    특광자치시_학생수: 163,
    특광자치시_비율: 37.9,
    중소도시등_학생수: 267,
    중소도시등_비율: 62.1,
    특별시_학생수: 13,
    특별시_비율: 3.02,
    "광역시·특별자치시_학생수": 150,
    "광역시·특별자치시_비율": 34.88,
    중소도시_학생수: 173,
    중소도시_비율: 40.23,
    "읍면/특수/기타_학생수": 94,
    "읍면/특수/기타_비율": 21.86,
  },
  {
    기준연도: 2026,
    학교종류: "대학교",
    설립구분: "국·공립",
    지역: "서울",
    상태: "기존",
    학교코드_표준: "0000104",
    학교: "서울대학교",
    총입학자수: 2890,
    특광자치시_학생수: 0,
    특광자치시_비율: 0,
    중소도시등_학생수: 0,
    중소도시등_비율: 0,
    특별시_학생수: 1245,
    특별시_비율: 43.1,
    "광역시·특별자치시_학생수": 892,
    "광역시·특별자치시_비율": 30.9,
    중소도시_학생수: 612,
    중소도시_비율: 21.2,
    "읍면/특수/기타_학생수": 141,
    "읍면/특수/기타_비율": 4.9,
  },
] as const;
