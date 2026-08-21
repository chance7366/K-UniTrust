import { DEFAULT_REGION_CATALOG } from "@/lib/analysis/region-catalog-constants";

/** 지역 필터 — 강원/강원도, 대구/대구광역시 등 변형명 매칭 */
export function regionMatches(rowRegion: string, filterRegion: string): boolean {
  if (filterRegion === "전체") return true;
  const row = rowRegion.trim();
  const filter = filterRegion.trim();
  if (!row || !filter) return false;
  if (row === filter) return true;
  if (row.startsWith(filter) || filter.startsWith(row)) return true;
  return false;
}

export function buildRegionFilterOptions(rows: { region: string }[]): string[] {
  const inData = new Set(rows.map((r) => r.region.trim()).filter(Boolean));
  const catalog = [...DEFAULT_REGION_CATALOG];
  const extras = [...inData]
    .filter((name) => !catalog.some((c) => regionMatches(name, c)))
    .sort((a, b) => a.localeCompare(b, "ko"));
  return ["전체", ...catalog, ...extras];
}
