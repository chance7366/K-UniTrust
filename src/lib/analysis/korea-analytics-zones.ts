import { matchSidoRegion } from "@/lib/analysis/korea-sido-regions";
import { CHART_THEME } from "@/lib/theme/teal-glow";

/**
 * 5극 3특 권역
 * 5극: 수도권·충청권·동남권·대경권·서남권
 * 3특: 강원권·전북권·제주권
 */
export const ANALYTICS_ZONES = [
  "수도권",
  "충청권",
  "동남권",
  "대경권",
  "서남권",
  "강원권",
  "전북권",
  "제주권",
] as const;

export type AnalyticsZone = (typeof ANALYTICS_ZONES)[number];

export const ANALYTICS_ZONE_REGIONS: Record<AnalyticsZone, readonly string[]> = {
  수도권: ["서울", "경기", "인천"],
  충청권: ["대전", "세종", "충북", "충남"],
  동남권: ["부산", "울산", "경남"],
  대경권: ["대구", "경북"],
  서남권: ["광주", "전남"],
  강원권: ["강원"],
  전북권: ["전북"],
  제주권: ["제주"],
};

export const ANALYTICS_ZONE_SYSTEM_LABEL = "5극 3특";

export const ANALYTICS_ZONE_LIST_LABEL =
  "수도권·충청권·동남권·대경권·서남권·강원권·전북권·제주권";

export const ANALYTICS_ZONE_STROKES = [
  CHART_THEME.amber,
  "#3B82F6",
  CHART_THEME.violet,
  CHART_THEME.orange,
  CHART_THEME.emerald,
  CHART_THEME.rose,
  CHART_THEME.blue,
  CHART_THEME.yellow,
] as const;

export type AnalyticsZoneTrendPoint = {
  year: string;
} & Record<AnalyticsZone, number | null>;

export function sidoShortLabel(region: string): string {
  const matched = matchSidoRegion(region, region.trim());
  return matched?.shortLabel ?? region.trim();
}

export function zoneForSido(region: string): AnalyticsZone | null {
  const key = sidoShortLabel(region);
  for (const zone of ANALYTICS_ZONES) {
    if (ANALYTICS_ZONE_REGIONS[zone].includes(key)) return zone;
  }
  return null;
}

export function emptyZoneTrendPoint(year: string): AnalyticsZoneTrendPoint {
  const point = { year } as AnalyticsZoneTrendPoint;
  for (const zone of ANALYTICS_ZONES) {
    point[zone] = null;
  }
  return point;
}
