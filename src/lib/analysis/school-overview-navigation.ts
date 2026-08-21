import type { SchoolOverviewQuery } from "@/lib/data/school-overview";

export function buildSchoolOverviewHref(
  query: SchoolOverviewQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", "school-overview");

  if (!query.resetFilters) {
    if (query.establishment) params.set("establishment", query.establishment);
    if (query.schoolType) params.set("schoolType", query.schoolType);
    if (query.schoolKind) params.set("schoolKind", query.schoolKind);
    if (query.region) params.set("region", query.region);
    if (query.schoolStatus) params.set("schoolStatus", query.schoolStatus);
    if (query.q) params.set("q", query.q);
  }

  return `/analysis/univ-map?${params.toString()}`;
}
