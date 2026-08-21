import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  INCOME_PROPERTY_SECURE_RATE_CSV_COLUMNS,
  INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER,
  INCOME_PROPERTY_TEMPLATE_SAMPLES,
} from "@/lib/ingest/income-property-secure-rate-config";
import {
  INCOME_PROPERTY_MAIN_CAMPUS_SPEC,
  rollupCsvRowsToMainCampus,
} from "@/lib/ingest/main-campus-rollup";

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function padSchoolCode(v: string): string {
  if (!v) return "";
  return v.padStart(7, "0");
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
  const expected = [...INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER];
  const mismatches = expected.filter((label, i) => h0[i] !== label);
  if (mismatches.length) {
    throw new Error(
      `헤더가 올바르지 않습니다. 양식down 파일의 1행 헤더를 그대로 사용하세요. (불일치: ${mismatches.join(", ")})`,
    );
  }
}

function parseRows(
  aoa: unknown[][],
  uploadedAt: string,
): Record<string, string>[] {
  if (aoa.length < 2) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  validateHeaders(aoa[0] ?? []);

  const parsed: Record<string, string>[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const year = num(row[0]);
    const schoolCodeStd = padSchoolCode(s(row[1]));
    const schoolName = s(row[2]);
    if (!year || !schoolCodeStd || !schoolName) continue;

    parsed.push({
      year: String(year),
      school_code_std: schoolCodeStd,
      school_name: schoolName,
      corp_name: s(row[3]),
      school_division: s(row[4]),
      region: s(row[5]),
      estb: s(row[6]),
      school_status: s(row[7]),
      land_appraised: String(num(row[8]) ?? 0),
      land_net_income: String(num(row[9]) ?? 0),
      building_appraised: String(num(row[10]) ?? 0),
      building_net_income: String(num(row[11]) ?? 0),
      securities_appraised: String(num(row[12]) ?? 0),
      securities_net_income: String(num(row[13]) ?? 0),
      deposit_appraised: String(num(row[14]) ?? 0),
      deposit_net_income: String(num(row[15]) ?? 0),
      other_appraised: String(num(row[16]) ?? 0),
      other_net_income: String(num(row[17]) ?? 0),
      collateral_deduction: String(num(row[18]) ?? 0),
      total_appraised: String(num(row[19]) ?? 0),
      total_net_income: String(num(row[20]) ?? 0),
      uploaded_at: uploadedAt,
    });
  }

  return parsed;
}

export type IncomePropertySecureRateUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestIncomePropertySecureRateUpload(
  buffer: Buffer,
  fileName: string,
  options?: { replaceAll?: boolean },
): Promise<IncomePropertySecureRateUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 필수 열 값을 확인하세요.",
    );
  }

  const consolidated = await rollupCsvRowsToMainCampus(
    parsed,
    INCOME_PROPERTY_MAIN_CAMPUS_SPEC,
  );

  const uploadYears = [
    ...new Set(consolidated.map((r) => Number(r.year)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);

  const existing = options?.replaceAll
    ? []
    : await readCsvFile("financeAnalysisIncomePropertySecureRate").catch(
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
    "financeAnalysisIncomePropertySecureRate",
    merged,
    [...INCOME_PROPERTY_SECURE_RATE_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "finance-analysis",
    submenuId: "income-property-secure-rate",
    rows: parsed,
  });


  return {
    rowCount: consolidated.length,
    years: uploadYears,
    overwrittenYears,
    newYears,
    bronzePath,
  };
}

function templateSampleToRow(
  row: (typeof INCOME_PROPERTY_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER.map((key) => row[key as keyof typeof row]);
}

export function buildIncomePropertySecureRateTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...INCOME_PROPERTY_SECURE_RATE_TEMPLATE_HEADER],
    ...INCOME_PROPERTY_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}
