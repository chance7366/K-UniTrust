import path from "path";

/** Project-root relative CSV store (file-based DB for now). */
export const CSV_DIR = path.join(process.cwd(), "data", "csv");

export const CSV_FILES = {
  financeAnalysisRegionalDecline: "finance_analysis_regional_decline.csv",
  financeAnalysisSchoolAgePopulation: "finance_analysis_school_age_population.csv",
  univMapSchoolAgePopulationSigungu:
    "univ_map_school_age_population_sigungu.csv",
  financeAnalysisOriginRegion: "finance_analysis_origin_region.csv",
  financeAnalysisFreshmanEnrollment: "finance_analysis_freshman_enrollment.csv",
  financeAnalysisFreshmanEnrollmentConsolidated:
    "finance_analysis_freshman_enrollment_consolidated.csv",
  financeAnalysisFreshmanEnrollmentUndergrad:
    "finance_analysis_freshman_enrollment_undergrad.csv",
  financeAnalysisFreshmanEnrollmentGrad:
    "finance_analysis_freshman_enrollment_grad.csv",
  financeAnalysisFreshmanEnrollmentRep:
    "finance_analysis_freshman_enrollment_rep.csv",
  financeAnalysisEnrolledEnrollment: "finance_analysis_enrolled_enrollment.csv",
  financeAnalysisEnrolledEnrollmentConsolidated:
    "finance_analysis_enrolled_enrollment_consolidated.csv",
  financeAnalysisEnrolledEnrollmentRep:
    "finance_analysis_enrolled_enrollment_rep.csv",
  financeAnalysisDropoutRate: "finance_analysis_dropout_rate.csv",
  financeAnalysisDropoutRateConsolidated:
    "finance_analysis_dropout_rate_consolidated.csv",
  financeAnalysisDropoutRateRep: "finance_analysis_dropout_rate_rep.csv",
  financeAnalysisSchoolCode: "finance_analysis_school_code.csv",
  financeAnalysisFundSecureRate: "finance_analysis_fund_secure_rate.csv",
  financeAnalysisFundSecureRateRep: "finance_analysis_fund_secure_rate_rep.csv",
  financeAnalysisTuitionDependencyRate:
    "finance_analysis_tuition_dependency_rate.csv",
  financeAnalysisTuitionDependencyRateRep:
    "finance_analysis_tuition_dependency_rate_rep.csv",
  financeAnalysisFinancialSupportBenefitRate:
    "finance_analysis_financial_support_benefit_rate.csv",
  financeAnalysisFinancialSupportBenefitRateRep:
    "finance_analysis_financial_support_benefit_rate_rep.csv",
  financeAnalysisCorpTransferRatio: "finance_analysis_corp_transfer_ratio.csv",
  financeAnalysisCorpTransferRatioRep:
    "finance_analysis_corp_transfer_ratio_rep.csv",
  financeAnalysisIncomePropertySecureRate:
    "finance_analysis_income_property_secure_rate.csv",
  financeAnalysisIncomePropertySecureRateRep:
    "finance_analysis_income_property_secure_rate_rep.csv",
  univMapSchoolOverview: "univ_map_school_overview.csv",
  univMapAddressGeocode: "univ_map_address_geocode.csv",
  univMapUniversityLocations: "univ_map_university_locations.csv",
  univMapEnrolledEnrollmentUndergrad:
    "univ_map_enrolled_enrollment_undergrad.csv",
  univMapEnrolledEnrollmentGrad: "univ_map_enrolled_enrollment_grad.csv",
  univMapDropoutRateUndergrad: "univ_map_dropout_rate_undergrad.csv",
  univMapDropoutRateGrad: "univ_map_dropout_rate_grad.csv",
  univMapEnrolledStudentsUndergrad: "univ_map_enrolled_students_undergrad.csv",
  univMapEnrolledStudentsGrad: "univ_map_enrolled_students_grad.csv",
  univMapOriginSchoolUndergrad: "univ_map_origin_school_undergrad.csv",
  univMapAvgTuitionUndergrad: "univ_map_avg_tuition_undergrad.csv",
  univMapAvgTuitionGrad: "univ_map_avg_tuition_grad.csv",
  univMapEduFund: "univ_map_edu_fund.csv",
  univMapEduFundExpense: "univ_map_edu_fund_expense.csv",
  univMapEduBalance: "univ_map_edu_balance.csv",
  univMapEduOperation: "univ_map_edu_operation.csv",
  univMapTuitionFund: "univ_map_tuition_fund.csv",
  univMapTuitionFundExpense: "univ_map_tuition_fund_expense.csv",
  univMapTuitionBalance: "univ_map_tuition_balance.csv",
  univMapTuitionOperation: "univ_map_tuition_operation.csv",
  univMapNonTuitionFund: "univ_map_non_tuition_fund.csv",
  univMapNonTuitionFundExpense: "univ_map_non_tuition_fund_expense.csv",
  univMapNonTuitionBalance: "univ_map_non_tuition_balance.csv",
  univMapNonTuitionOperation: "univ_map_non_tuition_operation.csv",
  univMapCorpFund: "univ_map_corp_fund.csv",
  univMapCorpFundExpense: "univ_map_corp_fund_expense.csv",
  univMapCorpBalance: "univ_map_corp_balance.csv",
  univMapCorpOperation: "univ_map_corp_operation.csv",
  univMapIndustryCash: "univ_map_industry_cash.csv",
  univMapIndustryBalance: "univ_map_industry_balance.csv",
  univMapIndustryOperation: "univ_map_industry_operation.csv",
  univMapIncomeProperty: "univ_map_income_property.csv",
  univMapFinancialSupport: "univ_map_financial_support.csv",
  univMapAnalysisTarget: "univ_map_analysis_target.csv",
  competitivenessAnalysisTargetUniversities:
    "competitiveness_analysis_target_universities.csv",
  competitivenessAnalysisEditions:
    "competitiveness_analysis_editions.csv",
} as const;

export type CsvFileKey = keyof typeof CSV_FILES;

export function csvPath(key: CsvFileKey): string {
  return path.join(CSV_DIR, CSV_FILES[key]);
}
