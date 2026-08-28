import type { FreshmanEnrollmentDatasetKind } from "@/lib/analysis/freshman-enrollment-alimi/types";

export const FRESHMAN_ENROLLMENT_ALIMI_CSV_COLUMNS = [
  "year_text",
  "school_code_std",
  "school_kind",
  "estb",
  "region",
  "status",
  "school_name",
  "cells_json",
  "uploaded_at",
] as const;

export const FRESHMAN_ENROLLMENT_ALIMI_CSV_KEY: Record<
  FreshmanEnrollmentDatasetKind,
  "financeAnalysisFreshmanEnrollmentUndergrad" | "financeAnalysisFreshmanEnrollmentGrad"
> = {
  undergrad: "financeAnalysisFreshmanEnrollmentUndergrad",
  grad: "financeAnalysisFreshmanEnrollmentGrad",
};

export const FRESHMAN_ENROLLMENT_ALIMI_META_FILE: Record<
  FreshmanEnrollmentDatasetKind,
  string
> = {
  undergrad: "finance_analysis_freshman_enrollment_undergrad.meta.json",
  grad: "finance_analysis_freshman_enrollment_grad.meta.json",
};

export const FRESHMAN_ENROLLMENT_ALIMI_BRONZE_ID: Record<
  FreshmanEnrollmentDatasetKind,
  string
> = {
  undergrad: "freshman-enrollment-rate-undergrad",
  grad: "freshman-enrollment-rate-grad",
};

export function isAlimiSchoolCodeHeader(value: string): boolean {
  const header = value.trim();
  return header === "학교코드_표준" || header === "학교코드";
}

export function validateAlimiHeaderRow0(
  kind: FreshmanEnrollmentDatasetKind,
  row0: string[],
): void {
  const h0 = row0.map((c) => c.trim());
  if (h0[0] !== "기준연도") {
    throw new Error("1행 A열은 '기준연도'여야 합니다.");
  }
  if (!isAlimiSchoolCodeHeader(h0[1] ?? "")) {
    throw new Error(
      "1행 B열은 '학교코드_표준' 또는 '학교코드'여야 합니다.",
    );
  }
  if (kind === "grad") {
    if (h0[2] !== "학교대표") {
      throw new Error("대학원 양식 1행 C열은 '학교대표'여야 합니다.");
    }
    if (h0[3] !== "본분교") {
      throw new Error("대학원 양식 1행 D열은 '본분교'여야 합니다.");
    }
    if (!h0.includes("대학원명")) {
      throw new Error("대학원 양식에 '대학원명' 컬럼이 필요합니다.");
    }
    return;
  }
  if (h0[6] !== "학교") {
    throw new Error("대학전문 양식 1행 G열은 '학교'여야 합니다.");
  }
}
