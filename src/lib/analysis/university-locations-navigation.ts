import type { UniversityLocationsQuery } from "@/lib/data/university-locations";

export function buildUniversityLocationsHref(
  query: UniversityLocationsQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", "university-locations");

  if (!query.resetFilters) {
    if (query.sidoId) params.set("sido", query.sidoId);
    if (query.sigungu) params.set("sigungu", query.sigungu);
  }

  return `/analysis/univ-map?${params.toString()}`;
}
