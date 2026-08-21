import { TARGET_UNIVERSITY_TEMPLATE_HEADER } from "@/lib/analysis/competitiveness-indicators";
import { MOCK_TARGET_UNIVERSITIES } from "@/lib/competitiveness-analysis/config";

export { TARGET_UNIVERSITY_TEMPLATE_HEADER };

export const TARGET_UNIVERSITIES_CSV_COLUMNS = [
  "school_code_std",
  "school_name",
  "estb",
  "school_division",
  "school_kind",
  "region",
  "crisis",
  "no_accreditation",
  "provisional_board",
  "fund_shortage",
  "uploaded_at",
] as const;

export const TARGET_UNIVERSITY_TEMPLATE_SAMPLES = MOCK_TARGET_UNIVERSITIES.map(
  (row) => ({
    학교코드: row.schoolCodeStd,
    학교명: row.schoolName,
    설립구분: row.estb,
    학교구분: row.schoolDivision,
    학교종류: row.schoolKind,
    지역: row.region,
    경영위기대학: row.crisis,
    미인증대학: row.noAccreditation,
    임시이사: row.provisionalBoard,
  }),
);
