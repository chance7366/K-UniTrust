import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import type { CsvFileKey } from "@/lib/csv/paths";
import { DROPOUT_RATE_TEMPLATE_HEADER } from "@/lib/ingest/dropout-rate-config";
import {
  ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW1,
  ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2,
} from "@/lib/ingest/enrolled-enrollment-config";
import {
  FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW1,
  FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW2,
  FRESHMAN_ENROLLMENT_DB_EXPORT_HEADER_ROW1,
  FRESHMAN_ENROLLMENT_DB_EXPORT_HEADER_ROW2,
} from "@/lib/ingest/freshman-enrollment-config";
import { FUND_SECURE_RATE_TEMPLATE_HEADER } from "@/lib/ingest/fund-secure-rate-config";
import { TUITION_DEPENDENCY_RATE_TEMPLATE_HEADER } from "@/lib/ingest/tuition-dependency-rate-config";
import { FINANCIAL_SUPPORT_BENEFIT_RATE_DB_EXPORT_HEADER } from "@/lib/ingest/financial-support-benefit-rate-config";
import { CORP_TRANSFER_RATIO_TEMPLATE_HEADER } from "@/lib/ingest/corp-transfer-ratio-config";
import {
  INCOME_PROPERTY_SECURE_RATE_EXPORT_HEADER,
} from "@/lib/ingest/income-property-secure-rate-config";
import {
  enrichIncomePropertyRows,
  exportRecordToRow,
  padSchoolCodeStd,
  toExportRecord,
  tuitionMapKey,
} from "@/lib/analysis/income-property-secure-rate-analytics";
import { SCHOOL_CODE_TEMPLATE_HEADER } from "@/lib/ingest/school-code-config";
import { buildSchoolCodeWorkbookBuffer } from "@/lib/ingest/school-code-upload";
import {
  enrichRowsWithSchoolDivision,
  loadSchoolDivisionLookup,
} from "@/lib/ingest/school-code-lookup";

export type FinanceAnalysisDbExportVariant = "campus" | "consolidated";

function num(v: string | undefined): number | "" {
  if (v == null || v.trim() === "") return "";
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : "";
}

function writeXlsxBuffer(
  aoa: (string | number | null)[][],
  merges?: XLSX.Range[],
): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (merges?.length) ws["!merges"] = merges;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

async function readRowsOrThrow(
  key: CsvFileKey,
  emptyMessage: string,
): Promise<Record<string, string>[]> {
  const rows = await readCsvFile(key).catch(() => []);
  if (rows.length === 0) throw new Error(emptyMessage);
  return rows;
}

function schoolCodeCsvToRow(row: Record<string, string>): (string | number)[] {
  return [
    num(row.year),
    row.school_code_std ?? "",
    row.school_name ?? "",
    row.main_branch_name ?? "",
    row.school_division ?? "",
    row.school_rep_code ?? "",
    row.school_rep_name ?? "",
    row.school_kind ?? "",
    row.region ?? "",
    row.estb ?? "",
    row.related_law ?? "",
    row.corp_name ?? "",
    row.status ?? "",
    row.parent_school_name ?? "",
  ];
}

function freshmanCampusCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_kind ?? "",
    row.estb ?? "",
    row.school_division ?? "",
    row.region ?? "",
    row.status ?? "",
    row.school_code_std ?? "",
    row.school_name ?? "",
    num(row.admission_quota),
    num(row.recruit_total),
    num(row.recruit_within),
    num(row.recruit_outside),
    num(row.enrolled_total),
    num(row.enrolled_within),
    num(row.enrolled_outside),
    num(row.fill_rate_within),
    num(row.fill_rate_within_outside),
  ];
}

const FRESHMAN_CONSOLIDATED_HEADER_ROW1 = [
  "기준연도",
  "학교종류",
  "설립구분",
  "학교구분",
  "지역",
  "상태",
  "학교대표코드",
  "학교대표명",
  "캠퍼스수",
  "입학정원",
  "모집인원",
  "",
  "",
  "입학자",
  "",
  "",
  "신입생충원율",
  "",
] as const;

const FRESHMAN_CONSOLIDATED_HEADER_ROW2 = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "계",
  "정원내",
  "정원외",
  "계",
  "정원내",
  "정원외",
  "정원내",
  "정원내외",
] as const;

function freshmanConsolidatedCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_kind ?? "",
    row.estb ?? "",
    row.school_division ?? "",
    row.region ?? "",
    row.status ?? "",
    row.school_rep_code ?? "",
    row.school_rep_name ?? "",
    num(row.campus_count),
    num(row.admission_quota),
    num(row.recruit_total),
    num(row.recruit_within),
    num(row.recruit_outside),
    num(row.enrolled_total),
    num(row.enrolled_within),
    num(row.enrolled_outside),
    num(row.fill_rate_within),
    num(row.fill_rate_within_outside),
  ];
}

function enrolledCampusCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.half ?? "",
    row.school_kind ?? "",
    row.estb ?? "",
    row.region ?? "",
    row.status ?? "",
    row.school_code_std ?? "",
    row.school_name ?? "",
    num(row.student_quota),
    num(row.recruitment_suspension),
    num(row.enrolled_total),
    num(row.enrolled_within),
    num(row.enrolled_outside),
    num(row.fill_rate),
    num(row.fill_rate_within),
  ];
}

const ENROLLED_CONSOLIDATED_HEADER_ROW1 = [
  "기준연도",
  "상하반기",
  "학교종류",
  "설립구분",
  "지역",
  "상태",
  "학교대표코드",
  "학교대표명",
  "캠퍼스수",
  "학생정원",
  "학생모집정지인원",
  "재학생",
  "",
  "",
  "재학생충원율",
  "정원내 재학생 충원율",
] as const;

const ENROLLED_CONSOLIDATED_HEADER_ROW2 = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "계",
  "정원내",
  "정원외",
  "",
  "",
] as const;

function enrolledConsolidatedCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.half ?? "",
    row.school_kind ?? "",
    row.estb ?? "",
    row.region ?? "",
    row.status ?? "",
    row.school_rep_code ?? "",
    row.school_rep_name ?? "",
    num(row.campus_count),
    num(row.student_quota),
    num(row.recruitment_suspension),
    num(row.enrolled_total),
    num(row.enrolled_within),
    num(row.enrolled_outside),
    num(row.fill_rate),
    num(row.fill_rate_within),
  ];
}

function dropoutCampusCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_kind ?? "",
    row.estb ?? "",
    row.region ?? "",
    row.status ?? "",
    row.school_code_std ?? "",
    row.school_name ?? "",
    num(row.enrolled_students),
    num(row.enrolled_dropouts),
    num(row.enrolled_dropout_rate),
    num(row.freshman_students),
    num(row.freshman_dropouts),
    num(row.freshman_dropout_rate),
  ];
}

const DROPOUT_CONSOLIDATED_HEADER = [
  "기준연도",
  "학교종류",
  "설립구분",
  "지역",
  "상태",
  "학교대표코드",
  "학교대표명",
  "캠퍼스수",
  "재적학생",
  "재적학생중도탈락",
  "재적학생중도탈락비율",
  "재적학생_신입생",
  "신입생중도탈락",
  "신입생중도탈락비율",
] as const;

function dropoutConsolidatedCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_kind ?? "",
    row.estb ?? "",
    row.region ?? "",
    row.status ?? "",
    row.school_rep_code ?? "",
    row.school_rep_name ?? "",
    num(row.campus_count),
    num(row.enrolled_students),
    num(row.enrolled_dropouts),
    num(row.enrolled_dropout_rate),
    num(row.freshman_students),
    num(row.freshman_dropouts),
    num(row.freshman_dropout_rate),
  ];
}

function fundSecureRateCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_code_std ?? "",
    row.school_name ?? "",
    row.school_division ?? "",
    row.school_kind ?? "",
    row.region ?? "",
    row.estb ?? "",
    num(row.school_funds_carryover),
    num(row.school_funds_endowment),
    num(row.industry_carryover),
    num(row.industry_endowment),
    num(row.total_funds),
    num(row.tuition_revenue),
    num(row.fund_secure_rate),
  ];
}

export async function buildFundSecureRateDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readRowsOrThrow(
    "financeAnalysisFundSecureRate",
    "다운로드할 자금확보율 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...FUND_SECURE_RATE_TEMPLATE_HEADER],
    ...rows.map(fundSecureRateCsvToRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "fund_secure_rate_db_export.xlsx",
  };
}

function tuitionDependencyRateCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_code_std ?? "",
    row.school_name ?? "",
    row.school_division ?? "",
    row.school_kind ?? "",
    row.region ?? "",
    row.estb ?? "",
    num(row.tuition_revenue),
    num(row.school_operating_revenue),
    num(row.industry_operating_revenue),
    num(row.total_operating_revenue),
    num(row.tuition_dependency_rate),
  ];
}

export async function buildTuitionDependencyRateDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readRowsOrThrow(
    "financeAnalysisTuitionDependencyRate",
    "다운로드할 등록금의존율 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...TUITION_DEPENDENCY_RATE_TEMPLATE_HEADER],
    ...rows.map(tuitionDependencyRateCsvToRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "tuition_dependency_rate_db_export.xlsx",
  };
}

function financialSupportBenefitRateCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_code_std ?? "",
    row.school_name ?? "",
    row.school_division ?? "",
    row.school_kind ?? "",
    row.region ?? "",
    row.estb ?? "",
    num(row.campus_count),
    num(row.ministry_of_education),
    num(row.national_scholarship),
    num(row.ministry_of_science_ict),
    num(row.ministry_of_employment),
    num(row.ministry_of_trade),
    num(row.ministry_of_health),
    num(row.ministry_of_culture),
    num(row.ministry_of_sme),
    num(row.ministry_of_agriculture),
    num(row.other_ministries),
    num(row.local_government),
    num(row.total_support),
    num(row.tuition_revenue),
    num(row.benefit_rate),
  ];
}

export async function buildFinancialSupportBenefitRateDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readRowsOrThrow(
    "financeAnalysisFinancialSupportBenefitRate",
    "다운로드할 재정지원수혜율 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...FINANCIAL_SUPPORT_BENEFIT_RATE_DB_EXPORT_HEADER],
    ...rows.map(financialSupportBenefitRateCsvToRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "financial_support_benefit_rate_db_export.xlsx",
  };
}

function corpTransferRatioCsvToRow(
  row: Record<string, string>,
): (string | number)[] {
  return [
    num(row.year),
    row.school_code_std ?? "",
    row.school_name ?? "",
    row.school_division ?? "",
    row.school_kind ?? "",
    row.region ?? "",
    row.estb ?? "",
    num(row.ordinary_expense_transfer),
    num(row.legal_obligation_transfer),
    num(row.asset_transfer),
    num(row.total_transfer),
    num(row.tuition_revenue),
    num(row.transfer_ratio),
  ];
}

export async function buildCorpTransferRatioDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readRowsOrThrow(
    "financeAnalysisCorpTransferRatio",
    "다운로드할 법인전입금비율 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...CORP_TRANSFER_RATIO_TEMPLATE_HEADER],
    ...rows.map(corpTransferRatioCsvToRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "corp_transfer_ratio_db_export.xlsx",
  };
}

export async function buildSchoolCodeDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readRowsOrThrow(
    "financeAnalysisSchoolCode",
    "다운로드할 학교코드 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...SCHOOL_CODE_TEMPLATE_HEADER],
    ...rows.map(schoolCodeCsvToRow),
  ];
  return {
    buffer: buildSchoolCodeWorkbookBuffer(aoa),
    filename: "school_code_db_export.xlsx",
  };
}

export async function buildFreshmanEnrollmentDbExport(
  variant: FinanceAnalysisDbExportVariant,
): Promise<{ buffer: Buffer; filename: string }> {
  const divisionLookup = await loadSchoolDivisionLookup();

  if (variant === "consolidated") {
    const raw = await readRowsOrThrow(
      "financeAnalysisFreshmanEnrollmentConsolidated",
      "다운로드할 본교통합 신입생충원율 데이터가 없습니다.",
    );
    const rows = enrichRowsWithSchoolDivision(raw, divisionLookup);
    const aoa: (string | number)[][] = [
      [...FRESHMAN_CONSOLIDATED_HEADER_ROW1],
      [...FRESHMAN_CONSOLIDATED_HEADER_ROW2],
      ...rows.map(freshmanConsolidatedCsvToRow),
    ];
    return {
      buffer: writeXlsxBuffer(aoa, [
        { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },
        { s: { r: 0, c: 13 }, e: { r: 0, c: 15 } },
        { s: { r: 0, c: 16 }, e: { r: 0, c: 17 } },
      ]),
      filename: "freshman_enrollment_consolidated_db_export.xlsx",
    };
  }

  const raw = await readRowsOrThrow(
    "financeAnalysisFreshmanEnrollment",
    "다운로드할 캠퍼스별 신입생충원율 데이터가 없습니다.",
  );
  const rows = enrichRowsWithSchoolDivision(raw, divisionLookup);
  const aoa: (string | number)[][] = [
    [...FRESHMAN_ENROLLMENT_DB_EXPORT_HEADER_ROW1],
    [...FRESHMAN_ENROLLMENT_DB_EXPORT_HEADER_ROW2],
    ...rows.map(freshmanCampusCsvToRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa, [
      { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } },
      { s: { r: 0, c: 12 }, e: { r: 0, c: 14 } },
      { s: { r: 0, c: 15 }, e: { r: 0, c: 16 } },
    ]),
    filename: "freshman_enrollment_campus_db_export.xlsx",
  };
}

export async function buildEnrolledEnrollmentDbExport(
  variant: FinanceAnalysisDbExportVariant,
): Promise<{ buffer: Buffer; filename: string }> {
  const divisionLookup = await loadSchoolDivisionLookup();

  if (variant === "consolidated") {
    const raw = await readRowsOrThrow(
      "financeAnalysisEnrolledEnrollmentConsolidated",
      "다운로드할 본교통합 재학생충원율 데이터가 없습니다.",
    );
    const rows = enrichRowsWithSchoolDivision(raw, divisionLookup);
    const aoa: (string | number)[][] = [
      [...ENROLLED_CONSOLIDATED_HEADER_ROW1],
      [...ENROLLED_CONSOLIDATED_HEADER_ROW2],
      ...rows.map(enrolledConsolidatedCsvToRow),
    ];
    return {
      buffer: writeXlsxBuffer(aoa, [
        { s: { r: 0, c: 11 }, e: { r: 0, c: 13 } },
      ]),
      filename: "enrolled_enrollment_consolidated_db_export.xlsx",
    };
  }

  const raw = await readRowsOrThrow(
    "financeAnalysisEnrolledEnrollment",
    "다운로드할 캠퍼스별 재학생충원율 데이터가 없습니다.",
  );
  const rows = enrichRowsWithSchoolDivision(raw, divisionLookup);
  const aoa: (string | number)[][] = [
    [...ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW1],
    [...ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2],
    ...rows.map(enrolledCampusCsvToRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa, [
      { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } },
    ]),
    filename: "enrolled_enrollment_campus_db_export.xlsx",
  };
}

export async function buildDropoutRateDbExport(
  variant: FinanceAnalysisDbExportVariant,
): Promise<{ buffer: Buffer; filename: string }> {
  const divisionLookup = await loadSchoolDivisionLookup();

  if (variant === "consolidated") {
    const raw = await readRowsOrThrow(
      "financeAnalysisDropoutRateConsolidated",
      "다운로드할 본교통합 중도탈락율 데이터가 없습니다.",
    );
    const rows = enrichRowsWithSchoolDivision(raw, divisionLookup);
    const aoa: (string | number)[][] = [
      [...DROPOUT_CONSOLIDATED_HEADER],
      ...rows.map(dropoutConsolidatedCsvToRow),
    ];
    return {
      buffer: writeXlsxBuffer(aoa),
      filename: "dropout_rate_consolidated_db_export.xlsx",
    };
  }

  const raw = await readRowsOrThrow(
    "financeAnalysisDropoutRate",
    "다운로드할 캠퍼스별 중도탈락율 데이터가 없습니다.",
  );
  const rows = enrichRowsWithSchoolDivision(raw, divisionLookup);
  const aoa: (string | number)[][] = [
    [...DROPOUT_RATE_TEMPLATE_HEADER],
    ...rows.map(dropoutCampusCsvToRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "dropout_rate_campus_db_export.xlsx",
  };
}

function parseIncomePropertyCsvRow(
  row: Record<string, string>,
): Parameters<typeof enrichIncomePropertyRows>[0][number] | null {
  const year = Number(row.year);
  const schoolCodeStd = padSchoolCodeStd(row.school_code_std ?? "");
  const schoolName = row.school_name?.trim();
  if (!Number.isFinite(year) || !schoolCodeStd || !schoolName) return null;

  const numField = (v: string | undefined) => {
    if (v == null || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    year,
    schoolCodeStd,
    schoolName,
    corpName: row.corp_name ?? "",
    schoolDivision: row.school_division ?? "",
    schoolKind: row.school_kind ?? "",
    region: row.region ?? "",
    estb: row.estb ?? "",
    schoolStatus: row.school_status ?? "",
    landAppraised: numField(row.land_appraised),
    landNetIncome: numField(row.land_net_income),
    buildingAppraised: numField(row.building_appraised),
    buildingNetIncome: numField(row.building_net_income),
    securitiesAppraised: numField(row.securities_appraised),
    securitiesNetIncome: numField(row.securities_net_income),
    depositAppraised: numField(row.deposit_appraised),
    depositNetIncome: numField(row.deposit_net_income),
    otherAppraised: numField(row.other_appraised),
    otherNetIncome: numField(row.other_net_income),
    collateralDeduction: numField(row.collateral_deduction),
    totalAppraised: numField(row.total_appraised),
    totalNetIncome: numField(row.total_net_income),
  };
}

async function loadTuitionByYearCodeForExport(): Promise<Map<string, number>> {
  const raw = await readCsvFile("financeAnalysisFundSecureRate").catch(() => []);
  const map = new Map<string, number>();
  for (const r of raw) {
    const year = Number(r.year);
    const code = padSchoolCodeStd(r.school_code_std ?? "");
    const tuition = Number(r.tuition_revenue);
    if (!Number.isFinite(year) || !code || !Number.isFinite(tuition)) continue;
    map.set(tuitionMapKey(year, code), tuition);
  }
  return map;
}

export async function buildIncomePropertySecureRateDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const raw = await readRowsOrThrow(
    "financeAnalysisIncomePropertySecureRate",
    "다운로드할 수익용재산확보율 데이터가 없습니다.",
  );
  const tuitionMap = await loadTuitionByYearCodeForExport();

  const parsed = raw
    .map(parseIncomePropertyCsvRow)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const enriched = enrichIncomePropertyRows(parsed, tuitionMap);
  enriched.sort(
    (a, b) =>
      a.year - b.year ||
      a.schoolName.localeCompare(b.schoolName, "ko") ||
      a.schoolCodeStd.localeCompare(b.schoolCodeStd),
  );

  const aoa: (string | number | null)[][] = [
    [...INCOME_PROPERTY_SECURE_RATE_EXPORT_HEADER],
    ...enriched.map((row) => exportRecordToRow(toExportRecord(row))),
  ];

  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "income_property_secure_rate_db_export.xlsx",
  };
}
