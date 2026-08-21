import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import type { TargetUniversityRow } from "@/lib/competitiveness-analysis/config";

import {
  TARGET_UNIVERSITIES_CSV_COLUMNS,
  TARGET_UNIVERSITY_TEMPLATE_HEADER,
  TARGET_UNIVERSITY_TEMPLATE_SAMPLES,
} from "@/lib/ingest/target-universities-config";

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function parseAbsoluteFlag(v: unknown): "" | "해당" {
  return s(v) === "해당" ? "해당" : "";
}

function normalizeSchoolCode(v: unknown): string {
  const raw = s(v);
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return raw.padStart(7, "0");
  return raw;
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
  const expected = [...TARGET_UNIVERSITY_TEMPLATE_HEADER];
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
): { rows: TargetUniversityRow[]; csvRows: Record<string, string>[] } {
  if (aoa.length < 2) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  validateHeaders(aoa[0] ?? []);

  const rows: TargetUniversityRow[] = [];
  const csvRows: Record<string, string>[] = [];
  const seenCodes = new Set<string>();

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    const schoolCodeStd = normalizeSchoolCode(row[0]);
    const schoolName = s(row[1]);
    if (!schoolCodeStd && !schoolName) continue;
    if (!schoolCodeStd || !schoolName) {
      throw new Error(
        `${i + 1}행: 학교코드와 학교명은 필수입니다. (학교코드=${schoolCodeStd || "—"}, 학교명=${schoolName || "—"})`,
      );
    }
    if (seenCodes.has(schoolCodeStd)) {
      throw new Error(
        `${i + 1}행: 학교코드 ${schoolCodeStd}가 중복되었습니다.`,
      );
    }
    seenCodes.add(schoolCodeStd);

    const parsed: TargetUniversityRow = {
      schoolCodeStd,
      schoolName,
      estb: s(row[2]),
      schoolDivision: s(row[3]),
      schoolKind: s(row[4]),
      region: s(row[5]),
      crisis: parseAbsoluteFlag(row[6]),
      noAccreditation: parseAbsoluteFlag(row[7]),
      provisionalBoard: parseAbsoluteFlag(row[8]),
      fundShortage: "",
    };

    rows.push(parsed);
    csvRows.push({
      school_code_std: parsed.schoolCodeStd,
      school_name: parsed.schoolName,
      estb: parsed.estb,
      school_division: parsed.schoolDivision,
      school_kind: parsed.schoolKind,
      region: parsed.region,
      crisis: parsed.crisis,
      no_accreditation: parsed.noAccreditation,
      provisional_board: parsed.provisionalBoard,
      fund_shortage: parsed.fundShortage,
      uploaded_at: uploadedAt,
    });
  }

  return { rows, csvRows };
}

export type TargetUniversitiesUploadResult = {
  rowCount: number;
  uploadedAt: string;
  rows: TargetUniversityRow[];
};

export async function parseTargetUniversitiesUpload(
  buffer: Buffer,
  fileName: string,
): Promise<TargetUniversitiesUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const { rows } = parseRows(aoa, uploadedAt);

  if (!rows.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 필수 열(학교코드·학교명)을 확인하세요.",
    );
  }

  return { rowCount: rows.length, uploadedAt, rows };
}

/** @deprecated edition DB 사용 — parseTargetUniversitiesUpload + saveEditionTargetUniversities */
export async function ingestTargetUniversitiesUpload(
  buffer: Buffer,
  fileName: string,
): Promise<TargetUniversitiesUploadResult> {
  const result = await parseTargetUniversitiesUpload(buffer, fileName);
  const uploadedAt = result.uploadedAt;
  const csvRows = result.rows.map((parsed) => ({
    school_code_std: parsed.schoolCodeStd,
    school_name: parsed.schoolName,
    estb: parsed.estb,
    school_division: parsed.schoolDivision,
    school_kind: parsed.schoolKind,
    region: parsed.region,
    crisis: parsed.crisis,
    no_accreditation: parsed.noAccreditation,
    provisional_board: parsed.provisionalBoard,
    fund_shortage: parsed.fundShortage,
    uploaded_at: uploadedAt,
  }));

  await writeCsvFile(
    "competitivenessAnalysisTargetUniversities",
    csvRows,
    [...TARGET_UNIVERSITIES_CSV_COLUMNS],
  );

  return result;
}

export function csvRecordToTargetUniversity(
  row: Record<string, string>,
): TargetUniversityRow {
  return {
    schoolCodeStd: normalizeSchoolCode(row.school_code_std),
    schoolName: s(row.school_name),
    estb: s(row.estb),
    schoolDivision: s(row.school_division),
    schoolKind: s(row.school_kind),
    region: s(row.region),
    crisis: parseAbsoluteFlag(row.crisis),
    noAccreditation: parseAbsoluteFlag(row.no_accreditation),
    provisionalBoard: parseAbsoluteFlag(row.provisional_board),
    fundShortage: parseAbsoluteFlag(row.fund_shortage),
  };
}

export async function loadTargetUniversitiesFromCsv(): Promise<{
  rows: TargetUniversityRow[];
  uploadedAt: string | null;
}> {
  try {
    const records = await readCsvFile("competitivenessAnalysisTargetUniversities");
    if (!records.length) {
      return { rows: [], uploadedAt: null };
    }
    const rows = records.map(csvRecordToTargetUniversity);
    const uploadedAt =
      records
        .map((r) => s(r.uploaded_at))
        .filter(Boolean)
        .sort()
        .at(-1) ?? null;
    return { rows, uploadedAt };
  } catch {
    return { rows: [], uploadedAt: null };
  }
}

function templateSampleToRow(
  row: (typeof TARGET_UNIVERSITY_TEMPLATE_SAMPLES)[number],
): string[] {
  return TARGET_UNIVERSITY_TEMPLATE_HEADER.map(
    (key) => row[key as keyof typeof row] ?? "",
  );
}

function targetUniversityToExportRow(row: TargetUniversityRow): string[] {
  return [
    row.schoolCodeStd,
    row.schoolName,
    row.estb,
    row.schoolDivision,
    row.schoolKind,
    row.region,
    row.crisis,
    row.noAccreditation,
    row.provisionalBoard,
  ];
}

function writeXlsxBuffer(aoa: (string | number)[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

export function buildTargetUniversitiesTemplateBuffer(): Buffer {
  const aoa: string[][] = [
    [...TARGET_UNIVERSITY_TEMPLATE_HEADER],
    ...TARGET_UNIVERSITY_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];
  return writeXlsxBuffer(aoa);
}

export async function buildTargetUniversitiesDbExport(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const { rows } = await loadTargetUniversitiesFromCsv();
  if (!rows.length) {
    throw new Error("다운로드할 대상대학 데이터가 없습니다.");
  }
  const aoa: string[][] = [
    [...TARGET_UNIVERSITY_TEMPLATE_HEADER],
    ...rows.map(targetUniversityToExportRow),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "competitiveness_target_universities_db_export.xlsx",
  };
}
