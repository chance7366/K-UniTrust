import type {
  AnalysisTargetCohort,
  AnalysisTargetQuery,
  AnalysisTargetViewMode,
} from "@/lib/analysis/analysis-target-view";

export function buildAnalysisTargetHref(
  query: AnalysisTargetQuery & { resetFilters?: boolean },
): string {
  const params = new URLSearchParams();
  params.set("tab", "analysis-target");

  if (query.year != null) {
    params.set("year", String(query.year));
  }

  const view: AnalysisTargetViewMode = query.view === "rep" ? "rep" : "campus";
  if (view === "rep") {
    params.set("view", "rep");
    const cohort: AnalysisTargetCohort =
      query.cohort === "junior-college" || query.cohort === "graduate"
        ? query.cohort
        : "university";
    if (cohort !== "university") {
      params.set("cohort", cohort);
    }
  }

  if (!query.resetFilters) {
    if (query.estb) params.set("estb", query.estb);
    if (view === "campus" && query.mainBranch) {
      params.set("mainBranch", query.mainBranch);
    }
    if (view === "campus" && query.schoolDivision) {
      params.set("schoolDivision", query.schoolDivision);
    }
    if (query.schoolKind) params.set("schoolKind", query.schoolKind);
    if (query.region) params.set("region", query.region);
    if (query.status) params.set("status", query.status);
    if (query.q) params.set("q", query.q);
  }

  return `/analysis/univ-map?${params.toString()}`;
}
