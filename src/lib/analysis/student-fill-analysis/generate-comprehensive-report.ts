import { readFile } from "fs/promises";
import path from "path";

import { aggregateStudentFillCohort } from "./aggregate-cohort";
import {
  buildComprehensiveActions,
  buildComprehensiveDiagnosis,
} from "./build-comprehensive-report";
import {
  comprehensiveFilterKey,
  comprehensiveFilterLabel,
  filterStudentFillSchools,
  type SfaComprehensiveFilter,
} from "./comprehensive-filter";
import { SFA_COMPREHENSIVE_GUIDELINES_VERSION } from "./comprehensive-guidelines";
import type { StudentFillComprehensiveReport } from "./comprehensive-report-types";
import {
  listStudentFillEditionYears,
  readStudentFillEdition,
} from "./store";

export async function generateStudentFillComprehensiveReport(
  filter: SfaComprehensiveFilter,
): Promise<StudentFillComprehensiveReport | null> {
  const years = (await listStudentFillEditionYears())
    .filter((year) => year <= filter.analysisYear)
    .sort((a, b) => a - b)
    .slice(-5);

  const trend = [];
  for (const year of years) {
    const edition = await readStudentFillEdition(year);
    if (!edition) continue;
    const rows = filterStudentFillSchools(edition.schools, filter);
    trend.push(aggregateStudentFillCohort(rows, year));
  }

  const current =
    trend.find((row) => row.year === filter.analysisYear) ?? trend[trend.length - 1];
  if (!current) return null;

  const diagnosis = buildComprehensiveDiagnosis(current, trend);
  const actions = buildComprehensiveActions(current);
  const generatedAt = new Date().toLocaleString("ko-KR");
  const html = await readFile(
    path.join(process.cwd(), "public/reports/sfa-gemini-comprehensive.html"),
    "utf8",
  );

  return {
    analysisYear: filter.analysisYear,
    filterKey: comprehensiveFilterKey(filter),
    filter,
    filterLabel: comprehensiveFilterLabel(filter),
    schoolCount: current.schoolCount,
    generatedAt,
    guidelinesVersion: SFA_COMPREHENSIVE_GUIDELINES_VERSION,
    current,
    trend,
    diagnosis,
    actions,
    html,
  };
}