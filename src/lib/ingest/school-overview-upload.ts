import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  loadGeocodeCacheMap,
  mergeLotAddressFromCache,
  rebuildUniversityLocationsCsv,
} from "@/lib/ingest/address-geocode-pipeline";
import {
  SCHOOL_OVERVIEW_CSV_COLUMNS,
  SCHOOL_OVERVIEW_TEMPLATE_HEADER,
  SCHOOL_OVERVIEW_TEMPLATE_SAMPLES,
} from "@/lib/ingest/school-overview-config";

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
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
    wb.SheetNames.find((n) => n.includes("?�교")) ?? wb.SheetNames[0]!;
  const sheet = wb.Sheets[sheetName]!;
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
}

function validateHeaders(row0: unknown[]) {
  const h0 = row0.map((c) => s(c));
  const expected = [...SCHOOL_OVERVIEW_TEMPLATE_HEADER];

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
    const schoolCodeStd = s(row[0]);
    const schoolName = s(row[1]);
    if (!schoolCodeStd || !schoolName) continue;

    parsed.push({
      school_code_std: schoolCodeStd,
      school_name: schoolName,
      main_branch: s(row[2]),
      school_type: s(row[3]),
      region: s(row[4]),
      establishment: s(row[5]),
      related_law: s(row[6]),
      corp_name: s(row[7]),
      school_status: s(row[8]),
      school_name_en: s(row[9]),
      road_address: s(row[10]),
      lot_address: s(row[11]),
      zip_code: s(row[12]),
      founded_date: s(row[13]),
      homepage: s(row[14]),
      uploaded_at: uploadedAt,
    });
  }

  return parsed;
}

export type SchoolOverviewUploadResult = {
  rowCount: number;
  bronzePath: string;
};

export async function ingestSchoolOverviewUpload(
  buffer: Buffer,
  fileName: string,
): Promise<SchoolOverviewUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 필수 열 값을 확인하세요.",
    );
  }

  const geocodeCache = await loadGeocodeCacheMap();
  const merged = mergeLotAddressFromCache(parsed, geocodeCache);

  await writeCsvFile(
    "univMapSchoolOverview",
    merged,
    [...SCHOOL_OVERVIEW_CSV_COLUMNS],
  );

  await rebuildUniversityLocationsCsv(merged, geocodeCache, uploadedAt);

  const bronzePath = await writeBronzeSnapshot({
    domainId: "univ-map",
    submenuId: "school-overview",
    rows: merged,
  });


  return {
    rowCount: parsed.length,
    bronzePath,
  };
}

function templateSampleToRow(
  row: (typeof SCHOOL_OVERVIEW_TEMPLATE_SAMPLES)[number],
): string[] {
  return SCHOOL_OVERVIEW_TEMPLATE_HEADER.map(
    (key) => String(row[key as keyof typeof row] ?? ""),
  );
}

export function buildSchoolOverviewTemplateBuffer(): Buffer {
  const aoa: string[][] = [
    [...SCHOOL_OVERVIEW_TEMPLATE_HEADER],
    ...SCHOOL_OVERVIEW_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

function csvToTemplateRow(row: Record<string, string>): string[] {
  return [
    row.school_code_std ?? "",
    row.school_name ?? "",
    row.main_branch ?? "",
    row.school_type ?? "",
    row.region ?? "",
    row.establishment ?? "",
    row.related_law ?? "",
    row.corp_name ?? "",
    row.school_status ?? "",
    row.school_name_en ?? "",
    row.road_address ?? "",
    row.lot_address ?? "",
    row.zip_code ?? "",
    row.founded_date ?? "",
    row.homepage ?? "",
  ];
}

export async function buildSchoolOverviewDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const rows = await readCsvFile("univMapSchoolOverview").catch(() => []);
  if (!rows.length) {
    throw new Error("?�운로드???�교개황 ?�이?��? ?�습?�다.");
  }

  const aoa: string[][] = [
    [...SCHOOL_OVERVIEW_TEMPLATE_HEADER],
    ...rows.map(csvToTemplateRow),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);

  return {
    buffer,
    filename: "school_overview_db_export.xlsx",
  };
}
