import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import { SCHOOL_AGE_AGES, schoolAgeKey } from "@/lib/ingest/school-age-population-config";
import {
  SCHOOL_AGE_SIGUNGU_CSV_COLUMNS,
  SCHOOL_AGE_SIGUNGU_TEMPLATE_SAMPLES,
  SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS,
  classifySchoolAgeSigunguAdmin,
} from "@/lib/ingest/school-age-population-sigungu-config";

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
  const sheetName =
    wb.SheetNames.find((n) => n === "연령별인구현황") ?? wb.SheetNames[0]!;
  const sheet = wb.Sheets[sheetName]!;
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
  const expected = [...SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS];
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
  if (aoa.length < 2) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  validateHeaders(aoa);

  const parsed: Record<string, string>[] = [];
  const seenSido = new Set<string>();

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const year = num(row[0]);
    const code = s(row[1]);
    const fullName = s(row[2]);
    if (!year || !fullName) continue;

    const classified = classifySchoolAgeSigunguAdmin(fullName);
    if (!classified) continue;

    if (classified.geoLevel === "sido") {
      const sidoKey = `${year}|${classified.sidoShort}`;
      if (seenSido.has(sidoKey)) continue;
      seenSido.add(sidoKey);
    }

    const mapped: Record<string, string> = {
      year: String(year),
      region_code: code,
      region: classified.label,
      region_full: fullName,
      sido: classified.sidoShort,
      geo_level: classified.geoLevel,
      uploaded_at: uploadedAt,
    };

    let hasAge = false;
    SCHOOL_AGE_AGES.forEach((age, idx) => {
      const v = num(row[3 + idx]);
      mapped[schoolAgeKey(age)] = v == null ? "" : String(Math.round(v));
      if (v != null) hasAge = true;
    });

    if (hasAge) parsed.push(mapped);
  }

  return parsed;
}

export type SchoolAgeSigunguUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestSchoolAgeSigunguUpload(
  buffer: Buffer,
  fileName: string,
): Promise<SchoolAgeSigunguUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 기준연도·행정기관·연령별 인구를 확인하세요.",
    );
  }

  const uploadYears = [
    ...new Set(parsed.map((r) => Number(r.year)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);

  const existing = await readCsvFile("univMapSchoolAgePopulationSigungu").catch(
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
    "univMapSchoolAgePopulationSigungu",
    merged,
    [...SCHOOL_AGE_SIGUNGU_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "univ-map",
    submenuId: "school-age-population-sigungu",
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

export function buildSchoolAgeSigunguTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS],
    ...SCHOOL_AGE_SIGUNGU_TEMPLATE_SAMPLES,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "연령별인구현황");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}
