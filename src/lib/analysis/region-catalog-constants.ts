/** basic_region_codes.csv cdid 오름차순 — 클라이언트·서버 공통 */
export const DEFAULT_REGION_CATALOG = [
  "서울",
  "전남광주",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "세종",
] as const;

export type RegionCatalog = readonly string[];
