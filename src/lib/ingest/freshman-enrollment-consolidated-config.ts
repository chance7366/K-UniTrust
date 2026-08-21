import type { FreshmanEnrollmentRow } from "@/lib/ingest/freshman-enrollment-config";

/** 본교통합(학교대표코드) 집계 행 */
export type FreshmanEnrollmentConsolidatedRow = FreshmanEnrollmentRow & {
  campusCount: number;
};

export const FRESHMAN_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS = [
  "year",
  "school_kind",
  "estb",
  "school_division",
  "region",
  "status",
  "school_rep_code",
  "school_rep_name",
  "campus_count",
  "admission_quota",
  "recruit_total",
  "recruit_within",
  "recruit_outside",
  "enrolled_total",
  "enrolled_within",
  "enrolled_outside",
  "fill_rate_within",
  "fill_rate_within_outside",
  "consolidated_at",
] as const;

export type FreshmanEnrollmentConsolidatedCsvRow = Record<
  (typeof FRESHMAN_ENROLLMENT_CONSOLIDATED_CSV_COLUMNS)[number],
  string
>;
