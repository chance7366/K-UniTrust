import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import {
  SCHOOL_CODE_CSV_COLUMNS,
  SCHOOL_CODE_TEMPLATE_HEADER,
  SCHOOL_CODE_TEMPLATE_SAMPLES,
  SCHOOL_CODE_TEXT_COLUMNS,
  detectSchoolCodeHeaderFormat,
  padSchoolCodeText,
  type SchoolCodeHeaderFormat,
} from "@/lib/ingest/school-code-config";

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

function csvRow(
  year: number,
  schoolCodeStd: string,
  schoolName: string,
  fields: {
    mainBranchName: string;
    schoolRepCode: string;
    schoolRepName: string;
    parentSchoolName: string;
    schoolDivision: string;
    schoolKind: string;
    region: string;
    estb: string;
    relatedLaw: string;
    corpName: string;
    status: string;
  },
  uploadedAt: string,
): Record<string, string> {
  return {
    year: String(year),
    school_code_std: padSchoolCodeText(schoolCodeStd),
    school_name: schoolName,
    main_branch_name: fields.mainBranchName,
    school_rep_code: padSchoolCodeText(fields.schoolRepCode),
    school_rep_name: fields.schoolRepName,
    parent_school_name: fields.parentSchoolName,
    school_division: fields.schoolDivision,
    school_kind: fields.schoolKind,
    region: fields.region,
    estb: fields.estb,
    related_law: fields.relatedLaw,
    corp_name: fields.corpName,
    status: fields.status,
    uploaded_at: uploadedAt,
  };
}

function parseRowByFormat(
  row: unknown[],
  format: SchoolCodeHeaderFormat,
  uploadedAt: string,
): Record<string, string> | null {
  const year = num(row[0]);
  const schoolCodeStd = s(row[1]);
  const schoolName = s(row[2]);
  if (!year || !schoolCodeStd || !schoolName) return null;

  if (format === "current") {
    return csvRow(
      year,
      schoolCodeStd,
      schoolName,
      {
        mainBranchName: s(row[3]),
        schoolDivision: s(row[4]),
        schoolRepCode: s(row[5]),
        schoolRepName: s(row[6]),
        schoolKind: s(row[7]),
        region: s(row[8]),
        estb: s(row[9]),
        relatedLaw: s(row[10]),
        corpName: s(row[11]),
        status: s(row[12]),
        parentSchoolName: s(row[13]),
      },
      uploadedAt,
    );
  }

  if (format === "legacy-v2") {
    return csvRow(
      year,
      schoolCodeStd,
      schoolName,
      {
        mainBranchName: s(row[3]),
        schoolRepCode: s(row[4]),
        schoolRepName: s(row[5]),
        parentSchoolName: s(row[6]),
        schoolDivision: s(row[8]),
        schoolKind: s(row[12]),
        region: s(row[9]),
        estb: s(row[10]),
        relatedLaw: "",
        corpName: "",
        status: s(row[11]),
      },
      uploadedAt,
    );
  }

  return csvRow(
    year,
    schoolCodeStd,
    schoolName,
    {
      mainBranchName: s(row[3]),
      schoolRepCode: s(row[4]),
      schoolRepName: s(row[5]),
      parentSchoolName: s(row[6]),
      schoolDivision: s(row[8]),
      schoolKind: s(row[9]),
      region: s(row[10]),
      estb: s(row[11]),
      relatedLaw: "",
      corpName: "",
      status: s(row[12]),
    },
    uploadedAt,
  );
}

function parseRows(
  aoa: unknown[][],
  uploadedAt: string,
): Record<string, string>[] {
  if (aoa.length < 2) {
    throw new Error("업로드 파일에 데이터가 없습니다.");
  }

  const format = detectSchoolCodeHeaderFormat(aoa[0] ?? []);

  const parsed: Record<string, string>[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const row = parseRowByFormat(aoa[i] ?? [], format, uploadedAt);
    if (row) parsed.push(row);
  }

  return parsed;
}

export type SchoolCodeUploadResult = {
  rowCount: number;
  years: number[];
  overwrittenYears: number[];
  newYears: number[];
  bronzePath: string;
};

export async function ingestSchoolCodeUpload(
  buffer: Buffer,
  fileName: string,
): Promise<SchoolCodeUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 필수 열 값을 확인하세요.",
    );
  }

  const uploadYears = [
    ...new Set(parsed.map((r) => Number(r.year)).filter(Number.isFinite)),
  ].sort((a, b) => a - b);

  const existing = await readCsvFile("financeAnalysisSchoolCode").catch(
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
    "financeAnalysisSchoolCode",
    merged,
    [...SCHOOL_CODE_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "finance-analysis",
    submenuId: "school-code",
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
  row: (typeof SCHOOL_CODE_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return SCHOOL_CODE_TEMPLATE_HEADER.map((key) => row[key as keyof typeof row]);
}

function applySchoolCodeTextFormat(ws: XLSX.WorkSheet, rowCount: number) {
  const textCols = SCHOOL_CODE_TEXT_COLUMNS.map((label) =>
    SCHOOL_CODE_TEMPLATE_HEADER.indexOf(label),
  ).filter((i) => i >= 0);

  for (let r = 1; r < rowCount; r++) {
    for (const c of textCols) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) continue;
      cell.t = "s";
      cell.z = "@";
      cell.v = padSchoolCodeText(String(cell.v ?? ""));
    }
  }
}

function writeSchoolCodeXlsx(aoa: (string | number)[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  applySchoolCodeTextFormat(ws, aoa.length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

export function buildSchoolCodeTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...SCHOOL_CODE_TEMPLATE_HEADER],
    ...SCHOOL_CODE_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];
  return writeSchoolCodeXlsx(aoa);
}

export function buildSchoolCodeWorkbookBuffer(
  aoa: (string | number)[][],
): Buffer {
  return writeSchoolCodeXlsx(aoa);
}
