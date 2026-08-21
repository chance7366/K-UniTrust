import type { AnalysisTargetRow } from "@/lib/ingest/analysis-target-config";

export type AnalysisTargetViewMode = "campus" | "rep";
export type AnalysisTargetCohort = "university" | "junior-college" | "graduate";

export const ANALYSIS_TARGET_COHORT_DIVISION: Record<
  AnalysisTargetCohort,
  string
> = {
  university: "대학",
  "junior-college": "전문대학",
  graduate: "대학원",
};

export type AnalysisTargetRepRow = AnalysisTargetRow & {
  campusCount: number;
};

export type AnalysisTargetQuery = {
  year?: number | null;
  view?: AnalysisTargetViewMode;
  cohort?: AnalysisTargetCohort;
  estb?: string;
  mainBranch?: string;
  schoolDivision?: string;
  schoolKind?: string;
  region?: string;
  status?: string;
  q?: string;
};

export type AnalysisTargetFilterOptions = {
  estbs: string[];
  mainBranches: string[];
  schoolDivisions: string[];
  schoolKinds: string[];
  regions: string[];
  statuses: string[];
};

export type AnalysisTargetDashboardData = {
  years: number[];
  displayYear: number | null;
  viewMode: AnalysisTargetViewMode;
  cohort: AnalysisTargetCohort;
  rows: AnalysisTargetRow[];
  repRows: AnalysisTargetRepRow[];
  cohortCounts: Record<AnalysisTargetCohort, number>;
  filterOptions: AnalysisTargetFilterOptions;
  yearRowCount: number;
  filters: {
    estb: string;
    mainBranch: string;
    schoolDivision: string;
    schoolKind: string;
    region: string;
    status: string;
    q: string;
  };
  hasData: boolean;
  uploadedAt: string | null;
  rowCount: number;
};
