import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  ORIGIN_REGION_CSV_COLUMNS,
  ORIGIN_REGION_REGION_CSV_KEYS,
  ORIGIN_REGION_REGION_GROUPS,
  ORIGIN_REGION_TEMPLATE_HEADER_ROW1,
  ORIGIN_REGION_TEMPLATE_HEADER_ROW2,
  ORIGIN_REGION_TEMPLATE_SAMPLES,
} from "@/lib/ingest/origin-region-config";

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

function validateHeaders(row0: unknown[], row1: unknown[]) {
  const h0 = row0.map((c) => s(c));
  const h1 = row1.map((c) => s(c));
  const expected0 = [...ORIGIN_REGION_TEMPLATE_HEADER_ROW1];
  const expected1 = [...ORIGIN_REGION_TEMPLATE_HEADER_ROW2];
  const mismatches0 = expected0.filter((label, i) => h0[i] !== label);
  const mismatches1 = expected1.filter((label, i) => h1[i] !== label);
  if (mismatches0.length || mismatches1.length) {
    throw new Error(
      "헤더가 올바르지 않습니다. 양식down 파일의 1·2행 헤더를 그대로 사용하세요.",
    );
  }
}

function parseWideRows(
  aoa: unknown[][],
  uploadedAt: string,
): Record<string, string>[] {
  if (aoa.length < 3) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  validateHeaders(aoa[0] ?? [], aoa[1] ?? []);

  const parsed: Record<string, string>[] = [];

  for (let i = 2; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const year = num(row[0]);
    const schoolName = s(row[6]);
    if (!year || !schoolName) continue;

    const mapped: Record<string, string> = {
      year: String(year),
      school_kind: s(row[1]),
      estb: s(row[2]),
      region: s(row[3]),
      status: s(row[4]),
      school_code_std: s(row[5]),
      school_name: schoolName,
      total_enrolled: String(num(row[7]) ?? ""),
      uploaded_at: uploadedAt,
    };

    let col = 8;
    for (const g of ORIGIN_REGION_REGION_GROUPS) {
      const keys = ORIGIN_REGION_REGION_CSV_KEYS[g.key];
      mapped[keys.count] = String(num(row[col]) ?? "");
      mapped[keys.ratio] = String(num(row[col + 1]) ?? "");
      col += 2;
    }

    parsed.push(mapped);
  }

  return parsed;
}

export type OriginRegionUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestOriginRegionUpload(
  buffer: Buffer,
  fileName: string,
): Promise<OriginRegionUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseWideRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 필수 열 값을 확인하세요.",
    );
  }

  const uploadYears = [
    ...new Set(parsed.map((r) => Number(r.year)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);

  const existing = await readCsvFile("financeAnalysisOriginRegion").catch(
    () => [],
  );
  const existingYears = new Set(
    existing.map((r) => Number(r.year)).filter(Number.isFinite),
  );

  const overwrittenYears = uploadYears.filter((y) => existingYears.has(y));
  const newYears = uploadYears.filter((y) => !existingYears.has(y));

  const uploadYearSet = new Set(uploadYears.map(String));
  const kept = existing.filter((r) => !uploadYearSet.has(r.year));
  const merged = [...kept, ...parsed];

  await writeCsvFile(
    "financeAnalysisOriginRegion",
    merged,
    [...ORIGIN_REGION_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "finance-analysis",
    submenuId: "origin-region",
    rows: parsed,
  });


  return {
    rowCount: parsed.length,
    years: uploadYears,
    overwrittenYears,
    newYears,
    bronzePath,
  };
}

function templateSampleToRow(
  row: (typeof ORIGIN_REGION_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return [
    row["기준연도" as keyof typeof row] as number,
    row["학교종류" as keyof typeof row] as string,
    row["설립구분" as keyof typeof row] as string,
    row["지역" as keyof typeof row] as string,
    row["상태" as keyof typeof row] as string,
    row["학교코드_표준" as keyof typeof row] as string,
    row["학교" as keyof typeof row] as string,
    row["총입학자수" as keyof typeof row] as number,
    ...ORIGIN_REGION_REGION_GROUPS.flatMap((g) => [
      row[`${g.label}_학생수` as keyof typeof row] as number,
      row[`${g.label}_비율` as keyof typeof row] as number,
    ]),
  ];
}

export function buildOriginRegionTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...ORIGIN_REGION_TEMPLATE_HEADER_ROW1],
    [...ORIGIN_REGION_TEMPLATE_HEADER_ROW2],
    ...ORIGIN_REGION_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const merges: XLSX.Range[] = [];
  let col = 8;
  for (const g of ORIGIN_REGION_REGION_GROUPS) {
    merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + 1 } });
    col += 2;
  }

  ws["!merges"] = merges;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}
