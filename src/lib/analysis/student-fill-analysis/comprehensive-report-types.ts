import type { StudentFillCohortSnapshot } from "./aggregate-cohort";
import type {
  ComprehensiveAction,
  ComprehensiveFinding,
} from "./build-comprehensive-report";
import type { SfaComprehensiveFilter } from "./comprehensive-filter";

export type StudentFillComprehensiveReport = {
  analysisYear: number;
  filterKey: string;
  filter: SfaComprehensiveFilter;
  filterLabel: string;
  schoolCount: number;
  generatedAt: string;
  guidelinesVersion: string;
  current: StudentFillCohortSnapshot;
  trend: StudentFillCohortSnapshot[];
  diagnosis: ComprehensiveFinding[];
  actions: ComprehensiveAction[];
  html: string;
};