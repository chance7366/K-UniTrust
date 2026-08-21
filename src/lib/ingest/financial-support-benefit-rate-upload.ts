import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  consolidateFinancialSupportBenefitRateRows,
  type RawFinancialSupportCampusRow,
} from "@/lib/ingest/financial-support-benefit-rate-consolidate";
import {
  FINANCIAL_SUPPORT_BENEFIT_RATE_CSV_COLUMNS,
  FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_HEADER,
  FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_SAMPLES,
} from "@/lib/ingest/financial-support-benefit-rate-config";

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function sheetToAoa(buffer: Buffer, fileName: string): unknown[][] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const wb = XLSX.read(text, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]!];
    return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });
  }

  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName =
    wb.SheetNames.find((n) => n === "Sheet1") ?? wb.SheetNames[0]!;
  const sheet = wb.Sheets[sheetName]!;
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
}

function validateHeaders(row0: unknown[]) {
  const h0 = row0.map((c) => s(c));
  const expected = [...FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_HEADER];

  const mismatches = expected.filter((label, i) => h0[i] !== label);
  if (mismatches.length) {
    throw new Error(
      `헤더가 올바르지 않습니다. 양식down 파일의 1행 헤더를 그대로 사용하세요. (불일치: ${mismatches.join(", ")})`,
    );
  }
}

function parseCampusRows(aoa: unknown[][]): RawFinancialSupportCampusRow[] {
  if (aoa.length < 2) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  validateHeaders(aoa[0] ?? []);

  const parsed: RawFinancialSupportCampusRow[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const year = num(row[0]);
    const schoolName = s(row[2]);
    if (!year || !schoolName) continue;

    parsed.push({
      year,
      schoolCodeStd: s(row[1]),
      schoolName,
      estb: s(row[3]),
      region: s(row[4]),
      schoolDivision: s(row[5]),
      ministryOfEducation: num(row[6]) ?? 0,
      nationalScholarship: num(row[7]) ?? 0,
      ministryOfScienceIct: num(row[8]) ?? 0,
      ministryOfEmployment: num(row[9]) ?? 0,
      ministryOfTrade: num(row[10]) ?? 0,
      ministryOfHealth: num(row[11]) ?? 0,
      ministryOfCulture: num(row[12]) ?? 0,
      ministryOfSme: num(row[13]) ?? 0,
      ministryOfAgriculture: num(row[14]) ?? 0,
      otherMinistries: num(row[15]) ?? 0,
      localGovernment: num(row[16]) ?? 0,
      totalSupport: num(row[17]) ?? 0,
      tuitionRevenueWon: num(row[18]) ?? 0,
      benefitRate: num(row[19]),
    });
  }

  return parsed;
}

export type FinancialSupportBenefitRateUploadResult = {
  rowCount: number;
  consolidatedRowCount: number;
  skippedCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestFinancialSupportBenefitRateUpload(
  buffer: Buffer,
  fileName: string,
  options?: { replaceAll?: boolean },
): Promise<FinancialSupportBenefitRateUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const campusRows = parseCampusRows(aoa);

  if (!campusRows.length) {
    throw new Error(
      "?�효???�이???�을 찾�? 못했?�니?? ?�도·?�교코드_?��?·?�?�명???�인?�세??",
    );
  }

  const { rows: consolidated, skippedCount } =
    await consolidateFinancialSupportBenefitRateRows(campusRows, uploadedAt);

  if (!consolidated.length) {
    throw new Error(
      "본교?�합 ???�?�할 ?�이?��? ?�습?�다. ?�교코드 DB�?먼�? ?�로?�했?��? ?�인?�세??",
    );
  }

  const uploadYears = [
    ...new Set(consolidated.map((r) => Number(r.year)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);

  const existing = options?.replaceAll
    ? []
    : await readCsvFile("financeAnalysisFinancialSupportBenefitRate").catch(
        () => [],
      );
  const existingYears = new Set(
    existing.map((r) => Number(r.year)).filter(Number.isFinite),
  );

  const overwrittenYears = uploadYears.filter((y) => existingYears.has(y));
  const newYears = uploadYears.filter((y) => !existingYears.has(y));

  const uploadYearSet = new Set(uploadYears.map(String));
  const kept = options?.replaceAll
    ? []
    : existing.filter((r) => !uploadYearSet.has(r.year));
  const merged = [...kept, ...consolidated];

  await writeCsvFile(
    "financeAnalysisFinancialSupportBenefitRate",
    merged,
    [...FINANCIAL_SUPPORT_BENEFIT_RATE_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "finance-analysis",
    submenuId: "financial-support-benefit-rate",
    rows: campusRows.map((row) => ({
      year: String(row.year),
      school_code_std: row.schoolCodeStd,
      school_name: row.schoolName,
      estb: row.estb,
      region: row.region,
      school_division: row.schoolDivision,
      total_support: String(row.totalSupport),
    })),
  });


  return {
    rowCount: campusRows.length,
    consolidatedRowCount: consolidated.length,
    skippedCount,
    years: uploadYears,
    overwrittenYears,
    newYears,
    bronzePath,
  };
}

function templateSampleToRow(
  row: (typeof FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_HEADER.map((key) => row[key as keyof typeof row]);
}

export function buildFinancialSupportBenefitRateTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_HEADER],
    ...FINANCIAL_SUPPORT_BENEFIT_RATE_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}
