import type {
  IncomePropertySecureRateDisplayRow,
  IncomePropertySecureRateRow,
} from "@/lib/ingest/income-property-secure-rate-config";

/** 천원 → 백만원 (반올림) */
export function toMillionWon(
  thousandWon: number | null | undefined,
): number | null {
  if (thousandWon == null || Number.isNaN(thousandWon)) return null;
  return Math.round(thousandWon / 1000);
}

export function fmtMillionWon(thousandWon: number | null | undefined): string {
  const v = toMillionWon(thousandWon);
  if (v == null) return "—";
  return v.toLocaleString("ko-KR");
}

/** 소수점 2자리에서 반올림 → 1자리 */
export function roundRatio1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 소수점 3자리에서 반올림 → 2자리 */
export function roundRatio2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function fmtRatio1(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function fmtRatio2(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function padSchoolCodeStd(value: string): string {
  const s = value.trim();
  if (!s) return "";
  return s.padStart(7, "0");
}

export function tuitionMapKey(year: number, schoolCodeStd: string): string {
  return `${year}:${padSchoolCodeStd(schoolCodeStd)}`;
}

/** 자금확보율 등록금수입: 조사년도 Y → Y-1년 데이터 사용 */
export function priorTuitionYear(surveyYear: number): number {
  return surveyYear - 1;
}

export function enrichIncomePropertyRow(
  row: IncomePropertySecureRateRow,
  tuitionByYearCode: Map<string, number>,
): IncomePropertySecureRateDisplayRow {
  const tuitionYear = priorTuitionYear(row.year);
  const tuitionRevenue =
    tuitionByYearCode.get(tuitionMapKey(tuitionYear, row.schoolCodeStd)) ??
    null;
  const tuitionRevenueMillion = toMillionWon(tuitionRevenue);

  let propertySecureRate: number | null = null;
  if (
    tuitionRevenue != null &&
    tuitionRevenue > 0 &&
    row.totalAppraised != null
  ) {
    propertySecureRate = roundRatio1(
      (row.totalAppraised / tuitionRevenue) * 100,
    );
  }

  let revenueRate: number | null = null;
  if (
    row.totalAppraised != null &&
    row.totalAppraised > 0 &&
    row.totalNetIncome != null
  ) {
    revenueRate = roundRatio2(
      (row.totalNetIncome / row.totalAppraised) * 100,
    );
  }

  return {
    ...row,
    tuitionRevenue,
    tuitionRevenueMillion,
    propertySecureRate,
    revenueRate,
  };
}

export function enrichIncomePropertyRows(
  rows: IncomePropertySecureRateRow[],
  tuitionByYearCode: Map<string, number>,
): IncomePropertySecureRateDisplayRow[] {
  return rows.map((row) => enrichIncomePropertyRow(row, tuitionByYearCode));
}

/** DB down / export용 — 백만원 + 계산 컬럼 포함 */
export function toExportRecord(row: IncomePropertySecureRateDisplayRow) {
  return {
    조사년도: row.year,
    학교코드_표준: row.schoolCodeStd,
    학교명: row.schoolName,
    법인명: row.corpName,
    토지_평가액: toMillionWon(row.landAppraised),
    토지_순수입액: toMillionWon(row.landNetIncome),
    건물_평가액: toMillionWon(row.buildingAppraised),
    건물_순수입액: toMillionWon(row.buildingNetIncome),
    "유가증권-평가액": toMillionWon(row.securitiesAppraised),
    유가증권_순수입액: toMillionWon(row.securitiesNetIncome),
    예금_평가액: toMillionWon(row.depositAppraised),
    예금_순수입액: toMillionWon(row.depositNetIncome),
    기타재산_평가액: toMillionWon(row.otherAppraised),
    기타재산_순수입액: toMillionWon(row.otherNetIncome),
    "(담보차감액)": toMillionWon(row.collateralDeduction),
    "평가액 합계": toMillionWon(row.totalAppraised),
    "순수입액 합계": toMillionWon(row.totalNetIncome),
    등록금수입: row.tuitionRevenueMillion,
    재산확보율: row.propertySecureRate,
    수익율: row.revenueRate,
  };
}

export function exportRecordToRow(
  record: ReturnType<typeof toExportRecord>,
): (string | number | null)[] {
  return [
    record.조사년도,
    record.학교코드_표준,
    record.학교명,
    record.법인명,
    record.토지_평가액 ?? "",
    record.토지_순수입액 ?? "",
    record.건물_평가액 ?? "",
    record.건물_순수입액 ?? "",
    record["유가증권-평가액"] ?? "",
    record.유가증권_순수입액 ?? "",
    record.예금_평가액 ?? "",
    record.예금_순수입액 ?? "",
    record.기타재산_평가액 ?? "",
    record.기타재산_순수입액 ?? "",
    record["(담보차감액)"] ?? "",
    record["평가액 합계"] ?? "",
    record["순수입액 합계"] ?? "",
    record.등록금수입 ?? "",
    record.재산확보율 ?? "",
    record.수익율 ?? "",
  ];
}
