import type { DropoutRateRow } from "@/lib/ingest/dropout-rate-config";

/** 본교통합(학교대표코드) 집계 행 */
export type DropoutRateConsolidatedRow = DropoutRateRow & {
  campusCount: number;
};

export const DROPOUT_RATE_CONSOLIDATED_CSV_COLUMNS = [
  "year",
  "school_kind",
  "estb",
  "school_division",
  "region",
  "status",
  "school_rep_code",
  "school_rep_name",
  "campus_count",
  "enrolled_students",
  "enrolled_dropouts",
  "enrolled_dropout_rate",
  "freshman_students",
  "freshman_dropouts",
  "freshman_dropout_rate",
  "consolidated_at",
] as const;

export type DropoutRateConsolidatedCsvRow = Record<
  (typeof DROPOUT_RATE_CONSOLIDATED_CSV_COLUMNS)[number],
  string
>;
