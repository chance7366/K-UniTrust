import type { EnrolledEnrollmentRow } from "@/lib/ingest/enrolled-enrollment-config";

/** 본교통합(학교대표코드) 집계 행 */
export type EnrolledEnrollmentConsolidatedRow = EnrolledEnrollmentRow & {
  campusCount: number;
};

export const ENROLLED_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS = [
  "year",
  "half",
  "school_kind",
  "estb",
  "school_division",
  "region",
  "status",
  "school_rep_code",
  "school_rep_name",
  "campus_count",
  "student_quota",
  "recruitment_suspension",
  "enrolled_total",
  "enrolled_within",
  "enrolled_outside",
  "fill_rate",
  "fill_rate_within",
  "consolidated_at",
] as const;

export type EnrolledEnrollmentConsolidatedCsvRow = Record<
  (typeof ENROLLED_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS)[number],
  string
>;
