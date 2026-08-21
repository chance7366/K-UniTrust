import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import { gradeFromExtinctionIndex } from "@/lib/analysis/regional-decline-grade";
import {
  REGIONAL_DECLINE_CSV_COLUMNS,
  REGIONAL_DECLINE_TEMPLATE_SAMPLES,
  REGIONAL_DECLINE_UPLOAD_HEADERS,
  REGIONAL_DECLINE_UPLOAD_SUBHEADERS,
  classifyRegionalDeclineAdmin,
} from "@/lib/ingest/regional-decline-config";

function s(v: unknown): string {
  return v == null ? "" : String(v).replace(/\s+/g, " ").trim();
}

function num(v: unknown): number | null {
  const t = s(v).replace(/,/g, "");
  if (!t) return null;
  const n = Number(t);
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
  const sheet = wb.Sheets[wb.SheetNames[0]!]!;
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
}

function normalizeHeaderRow(row: unknown[]): string[] {
  const h = row.map((c) => s(c));
  while (h.length && !h[h.length - 1]) h.pop();
  return h;
}

function validateHeaders(aoa: unknown[][]) {
  const h0 = normalizeHeaderRow(aoa[0] ?? []);
  const expected = [...REGIONAL_DECLINE_UPLOAD_HEADERS];
  const ok =
    h0.length >= expected.length &&
    expected.every((label, i) => h0[i] === label);
  if (!ok) {
    throw new Error(
      `헤더가 올바르지 않습니다. 1행은 ${expected.join(" · ")} 이어야 합니다. (받은 헤더: ${h0.join(", ") || "없음"})`,
    );
  }
}

function parseRows(
  aoa: unknown[][],
  uploadedAt: string,
): Record<string, string>[] {
  if (aoa.length < 3) {
    throw new Error("업로드 파일에 데이터가 없습니다. 2행 헤더 다음부터 데이터를 넣으세요.");
  }

  validateHeaders(aoa);

  const parsed: Record<string, string>[] = [];

  for (let i = 2; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const year = num(row[0]);
    const code = s(row[1]);
    const fullName = s(row[2]);
    const women = num(row[3]);
    const senior = num(row[4]);
    const index = num(row[5]);
    if (!year || !fullName || index == null) continue;

    const classified = classifyRegionalDeclineAdmin(fullName);
    if (!classified) continue;

    parsed.push({
      year: String(year),
      region_code: code,
      region: classified.label,
      region_full: fullName,
      sido: classified.sidoShort,
      geo_level: classified.geoLevel,
      women_20_39: women == null ? "" : String(women),
      senior_65_plus: senior == null ? "" : String(senior),
      extinction_index: String(index),
      extinction_grade: String(gradeFromExtinctionIndex(index)),
      uploaded_at: uploadedAt,
    });
  }

  return parsed;
}

export type RegionalDeclineUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestRegionalDeclineUpload(
  buffer: Buffer,
  fileName: string,
): Promise<RegionalDeclineUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 기준연도·행정기관·인구소멸지수를 확인하세요.",
    );
  }

  const uploadYears = [
    ...new Set(parsed.map((r) => Number(r.year)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);

  const existing = await readCsvFile("financeAnalysisRegionalDecline").catch(
    () => [],
  );
  const existingNew = existing.filter((r) => r.geo_level);
  const existingYears = new Set(
    existingNew.map((r) => Number(r.year)).filter(Number.isFinite),
  );

  const overwrittenYears = uploadYears.filter((y) => existingYears.has(y));
  const newYears = uploadYears.filter((y) => !existingYears.has(y));

  const uploadYearSet = new Set(uploadYears.map(String));
  const kept = existingNew.filter((r) => !uploadYearSet.has(r.year));
  const merged = [...kept, ...parsed];

  await writeCsvFile(
    "financeAnalysisRegionalDecline",
    merged,
    [...REGIONAL_DECLINE_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "univ-map",
    submenuId: "regional-decline",
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

export function buildRegionalDeclineTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...REGIONAL_DECLINE_UPLOAD_HEADERS],
    [...REGIONAL_DECLINE_UPLOAD_SUBHEADERS],
    ...REGIONAL_DECLINE_TEMPLATE_SAMPLES,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "연령별인구현황");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}
