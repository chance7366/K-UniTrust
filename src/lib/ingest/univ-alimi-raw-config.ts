import type { CsvFileKey } from "@/lib/csv/paths";
import type {
  UnivAlimiDatasetKind,
  UnivAlimiIndicatorId,
} from "@/lib/analysis/univ-alimi-raw/types";

export const UNIV_ALIMI_CSV_COLUMNS = [
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

export const UNIV_ALIMI_CSV_KEY: Record<
  UnivAlimiIndicatorId,
  { undergrad: CsvFileKey; grad?: CsvFileKey }
> = {
  "enrolled-enrollment": {
    undergrad: "univMapEnrolledEnrollmentUndergrad",
    grad: "univMapEnrolledEnrollmentGrad",
  },
  "dropout-rate": {
    undergrad: "univMapDropoutRateUndergrad",
    grad: "univMapDropoutRateGrad",
  },
  "enrolled-students": {
    undergrad: "univMapEnrolledStudentsUndergrad",
    grad: "univMapEnrolledStudentsGrad",
  },
  "origin-school": {
    undergrad: "univMapOriginSchoolUndergrad",
  },
  "avg-tuition": {
    undergrad: "univMapAvgTuitionUndergrad",
    grad: "univMapAvgTuitionGrad",
  },
  "edu-fund": {
    undergrad: "univMapEduFund",
  },
  "edu-fund-expense": {
    undergrad: "univMapEduFundExpense",
  },
  "edu-balance": {
    undergrad: "univMapEduBalance",
  },
  "edu-operation": {
    undergrad: "univMapEduOperation",
  },
  "corp-fund": {
    undergrad: "univMapCorpFund",
  },
  "corp-fund-expense": {
    undergrad: "univMapCorpFundExpense",
  },
  "corp-balance": {
    undergrad: "univMapCorpBalance",
  },
  "corp-operation": {
    undergrad: "univMapCorpOperation",
  },
  "industry-cash": {
    undergrad: "univMapIndustryCash",
  },
  "industry-balance": {
    undergrad: "univMapIndustryBalance",
  },
  "industry-operation": {
    undergrad: "univMapIndustryOperation",
  },
  "income-property": {
    undergrad: "univMapIncomeProperty",
  },
  "financial-support": {
    undergrad: "univMapFinancialSupport",
  },
};

export const UNIV_ALIMI_META_FILE: Record<
  UnivAlimiIndicatorId,
  { undergrad: string; grad?: string }
> = {
  "enrolled-enrollment": {
    undergrad: "univ_map_enrolled_enrollment_undergrad.meta.json",
    grad: "univ_map_enrolled_enrollment_grad.meta.json",
  },
  "dropout-rate": {
    undergrad: "univ_map_dropout_rate_undergrad.meta.json",
    grad: "univ_map_dropout_rate_grad.meta.json",
  },
  "enrolled-students": {
    undergrad: "univ_map_enrolled_students_undergrad.meta.json",
    grad: "univ_map_enrolled_students_grad.meta.json",
  },
  "origin-school": {
    undergrad: "univ_map_origin_school_undergrad.meta.json",
  },
  "avg-tuition": {
    undergrad: "univ_map_avg_tuition_undergrad.meta.json",
    grad: "univ_map_avg_tuition_grad.meta.json",
  },
  "edu-fund": {
    undergrad: "univ_map_edu_fund.meta.json",
  },
  "edu-fund-expense": {
    undergrad: "univ_map_edu_fund_expense.meta.json",
  },
  "edu-balance": {
    undergrad: "univ_map_edu_balance.meta.json",
  },
  "edu-operation": {
    undergrad: "univ_map_edu_operation.meta.json",
  },
  "corp-fund": {
    undergrad: "univ_map_corp_fund.meta.json",
  },
  "corp-fund-expense": {
    undergrad: "univ_map_corp_fund_expense.meta.json",
  },
  "corp-balance": {
    undergrad: "univ_map_corp_balance.meta.json",
  },
  "corp-operation": {
    undergrad: "univ_map_corp_operation.meta.json",
  },
  "industry-cash": {
    undergrad: "univ_map_industry_cash.meta.json",
  },
  "industry-balance": {
    undergrad: "univ_map_industry_balance.meta.json",
  },
  "industry-operation": {
    undergrad: "univ_map_industry_operation.meta.json",
  },
  "income-property": {
    undergrad: "univ_map_income_property.meta.json",
  },
  "financial-support": {
    undergrad: "univ_map_financial_support.meta.json",
  },
};

export const UNIV_ALIMI_BRONZE_ID: Record<
  UnivAlimiIndicatorId,
  { undergrad: string; grad?: string }
> = {
  "enrolled-enrollment": {
    undergrad: "enrolled-enrollment-undergrad",
    grad: "enrolled-enrollment-grad",
  },
  "dropout-rate": {
    undergrad: "dropout-rate-undergrad",
    grad: "dropout-rate-grad",
  },
  "enrolled-students": {
    undergrad: "enrolled-students-undergrad",
    grad: "enrolled-students-grad",
  },
  "origin-school": {
    undergrad: "origin-school-undergrad",
  },
  "avg-tuition": {
    undergrad: "avg-tuition-undergrad",
    grad: "avg-tuition-grad",
  },
  "edu-fund": {
    undergrad: "edu-fund",
  },
  "edu-fund-expense": {
    undergrad: "edu-fund-expense",
  },
  "edu-balance": {
    undergrad: "edu-balance",
  },
  "edu-operation": {
    undergrad: "edu-operation",
  },
  "corp-fund": {
    undergrad: "corp-fund",
  },
  "corp-fund-expense": {
    undergrad: "corp-fund-expense",
  },
  "corp-balance": {
    undergrad: "corp-balance",
  },
  "corp-operation": {
    undergrad: "corp-operation",
  },
  "industry-cash": {
    undergrad: "industry-cash",
  },
  "industry-balance": {
    undergrad: "industry-balance",
  },
  "industry-operation": {
    undergrad: "industry-operation",
  },
  "income-property": {
    undergrad: "income-property",
  },
  "financial-support": {
    undergrad: "financial-support",
  },
};

export function validateUnivAlimiHeaderRow0(
  kind: UnivAlimiDatasetKind,
  row0: string[],
): void {
  const h0 = row0.map((c) => c.trim());
  if (
    h0[0] !== "기준연도" &&
    h0[0] !== "회계연도" &&
    h0[0] !== "조사년도" &&
    h0[0] !== "연도"
  ) {
    throw new Error(
      "1행 A열은 '기준연도', '회계연도', '조사년도' 또는 '연도'여야 합니다.",
    );
  }
  const hasSchoolCode = h0.some(
    (c) =>
      c === "표준학교코드" || c === "학교코드" || c === "학교코드_표준",
  );
  if (!hasSchoolCode) {
    throw new Error("1행에 '학교코드' 또는 '표준학교코드' 컬럼이 필요합니다.");
  }
  if (kind === "grad" && !h0.includes("대학원명") && !h0.includes("학교명")) {
    throw new Error("대학원 양식에 '대학원명' 또는 '학교명' 컬럼이 필요합니다.");
  }
  if (
    kind === "undergrad" &&
    !h0.includes("학교") &&
    !h0.includes("학교명") &&
    !h0.includes("대학명")
  ) {
    throw new Error(
      "대학전문 양식에 '학교', '학교명' 또는 '대학명' 컬럼이 필요합니다.",
    );
  }
}
