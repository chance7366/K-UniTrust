import { gradeFromExtinctionIndex } from "@/lib/analysis/regional-decline-grade";

/** 업로드 양식 — 2행 헤더 (1행 컬럼명, 2행 연령 구간) */
export const REGIONAL_DECLINE_UPLOAD_HEADERS = [
  "기준연도",
  "행정기관코드",
  "행정기관",
  "여성인구",
  "노인인구",
  "인구소멸지수",
] as const;

export const REGIONAL_DECLINE_UPLOAD_SUBHEADERS = [
  "",
  "",
  "",
  "20세~39세",
  "65세이상",
  "",
] as const;

export const REGIONAL_DECLINE_CSV_COLUMNS = [
  "year",
  "region_code",
  "region",
  "region_full",
  "sido",
  "geo_level",
  "women_20_39",
  "senior_65_plus",
  "extinction_index",
  "extinction_grade",
  "uploaded_at",
] as const;

export type RegionalDeclineCsvRow = Record<
  (typeof REGIONAL_DECLINE_CSV_COLUMNS)[number],
  string
>;

export type RegionalDeclineGeoLevel = "sido" | "sigungu";

export const REGIONAL_DECLINE_REGION_ORDER = [
  "전국",
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export const REGIONAL_DECLINE_SIDO_FULL_TO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원도: "강원",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

export function toShortSidoName(full: string): string | null {
  return REGIONAL_DECLINE_SIDO_FULL_TO_SHORT[full] ?? null;
}

export function regionalDeclineRegionSortKey(name: string): number {
  const idx = REGIONAL_DECLINE_REGION_ORDER.indexOf(
    name as (typeof REGIONAL_DECLINE_REGION_ORDER)[number],
  );
  return idx >= 0 ? idx : 999;
}

export function classifyRegionalDeclineAdmin(fullName: string): {
  geoLevel: RegionalDeclineGeoLevel;
  sidoShort: string;
  sidoFull: string;
  label: string;
} | null {
  const tokens = fullName.split(" ");
  const sidoFull = tokens[0] ?? "";
  const sidoShort = toShortSidoName(sidoFull);
  if (!sidoShort) return null;
  if (tokens.length === 1) {
    return { geoLevel: "sido", sidoShort, sidoFull, label: sidoShort };
  }
  const rest = fullName.slice(sidoFull.length).trim();
  return {
    geoLevel: "sigungu",
    sidoShort,
    sidoFull,
    label: rest || fullName,
  };
}

export { gradeFromExtinctionIndex };

/** 양식 다운로드·화면 미리보기용 샘플 */
export const REGIONAL_DECLINE_TEMPLATE_SAMPLES: (string | number)[][] = [
  [2025, "1100000000", "서울특별시", "1,399,752", "1,900,102", 73.67],
  [2025, "1111000000", "서울특별시 종로구", "20,813", "30,664", 67.87],
];

export const REGIONAL_DECLINE_DISPLAY_YEAR_COUNT = 5;

/** 차트·대시보드 시각화 시작 연도 */
export const REGIONAL_DECLINE_CHART_START_YEAR = 2020;

export function pickDefaultDisplayYears(years: number[]): number[] {
  const sorted = [...years].sort((a, b) => a - b);
  if (sorted.length <= REGIONAL_DECLINE_DISPLAY_YEAR_COUNT) return sorted;
  return sorted.slice(-REGIONAL_DECLINE_DISPLAY_YEAR_COUNT);
}
