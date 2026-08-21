import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import { writeCsvFile } from "@/lib/csv/write";
import { writeBronzeSnapshot } from "@/lib/db/bronze";
import { consolidateEnrolledEnrollmentPeriods } from "@/lib/ingest/enrolled-enrollment-consolidate";
import {
  ENROLLED_ENROLLMENT_CSV_COLUMNS,
  ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW1,
  ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2,
  ENROLLED_ENROLLMENT_TEMPLATE_SAMPLES,
} from "@/lib/ingest/enrolled-enrollment-config";

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
  const expected0 = [...ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW1];
  const expected1 = [...ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2];
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
    const half = s(row[1]);
    const schoolName = s(row[7]);
    if (!year || !half || !schoolName) continue;

    parsed.push({
      year: String(year),
      half,
      school_kind: s(row[2]),
      estb: s(row[3]),
      region: s(row[4]),
      status: s(row[5]),
      school_code_std: s(row[6]),
      school_name: schoolName,
      student_quota: String(num(row[8]) ?? ""),
      recruitment_suspension: String(num(row[9]) ?? ""),
      enrolled_total: String(num(row[10]) ?? ""),
      enrolled_within: String(num(row[11]) ?? ""),
      enrolled_outside: String(num(row[12]) ?? ""),
      fill_rate: String(num(row[13]) ?? ""),
      fill_rate_within: String(num(row[14]) ?? ""),
      uploaded_at: uploadedAt,
    });
  }

  return parsed;
}

export type EnrolledEnrollmentUploadResult = {
  rowCount: number;
  periods: string[];
  overwrittenPeriods: string[];
  newPeriods: string[];
  bronzePath: string;
  consolidated?: {
    periods: string[];
    totalRows: number;
    skippedPeriods: string[];
  };
};

function periodKey(year: string, half: string) {
  return `${year}:${half}`;
}

export async function ingestEnrolledEnrollmentUpload(
  buffer: Buffer,
  fileName: string,
  options?: { replaceAll?: boolean },
): Promise<EnrolledEnrollmentUploadResult> {
  const aoa = sheetToAoa(buffer, fileName);
  const uploadedAt = new Date().toISOString();
  const parsed = parseWideRows(aoa, uploadedAt);

  if (!parsed.length) {
    throw new Error(
      "유효한 데이터 행을 찾지 못했습니다. 필수 열 값을 확인하세요.",
    );
  }

  const uploadPeriods = [
    ...new Set(
      parsed.map((r) => periodKey(r.year ?? "", r.half ?? "")),
    ),
  ].sort();

  const existing = options?.replaceAll
    ? []
    : await readCsvFile("financeAnalysisEnrolledEnrollment").catch(() => []);
  const existingPeriods = new Set(
    existing.map((r) => periodKey(r.year ?? "", r.half ?? "")),
  );

  const overwrittenPeriods = uploadPeriods.filter((p) =>
    existingPeriods.has(p),
  );
  const newPeriods = uploadPeriods.filter((p) => !existingPeriods.has(p));

  const uploadPeriodSet = new Set(uploadPeriods);
  const kept = options?.replaceAll
    ? []
    : existing.filter(
        (r) =>
          !uploadPeriodSet.has(periodKey(r.year ?? "", r.half ?? "")),
      );
  const merged = [...kept, ...parsed];

  await writeCsvFile(
    "financeAnalysisEnrolledEnrollment",
    merged,
    [...ENROLLED_ENROLLMENT_CSV_COLUMNS],
  );

  const bronzePath = await writeBronzeSnapshot({
    domainId: "finance-analysis",
    submenuId: "enrolled-enrollment-rate",
    rows: parsed,
  });

  let consolidated: EnrolledEnrollmentUploadResult["consolidated"];
  try {
    const consolidateResult = await consolidateEnrolledEnrollmentPeriods(
      uploadPeriods,
    );
    consolidated = {
      periods: consolidateResult.periods
        .filter((p) => !p.skipped)
        .map((p) => periodKey(String(p.year), p.half ?? "")),
      totalRows: consolidateResult.totalRows,
      skippedPeriods: consolidateResult.periods
        .filter((p) => p.skipped)
        .map((p) => periodKey(String(p.year), p.half ?? "")),
    };
  } catch {
    consolidated = {
      periods: [],
      totalRows: 0,
      skippedPeriods: uploadPeriods,
    };
  }

  return {
    rowCount: parsed.length,
    periods: uploadPeriods,
    overwrittenPeriods,
    newPeriods,
    bronzePath,
    consolidated,
  };
}

function templateSampleToRow(
  row: (typeof ENROLLED_ENROLLMENT_TEMPLATE_SAMPLES)[number],
): (string | number)[] {
  return [
    row["기준연도" as keyof typeof row] as number,
    row["상하반기" as keyof typeof row] as string,
    row["학교종류" as keyof typeof row] as string,
    row["설립구분" as keyof typeof row] as string,
    row["지역" as keyof typeof row] as string,
    row["상태" as keyof typeof row] as string,
    row["학교코드_표준" as keyof typeof row] as string,
    row["학교" as keyof typeof row] as string,
    row["학생정원" as keyof typeof row] as number,
    row["학생모집정지인원" as keyof typeof row] as number,
    row["재학생_계" as keyof typeof row] as number,
    row["재학생_정원내" as keyof typeof row] as number,
    row["재학생_정원외" as keyof typeof row] as number,
    row["재학생충원율" as keyof typeof row] as number,
    row["정원내재학생충원율" as keyof typeof row] as number,
  ];
}

export function buildEnrolledEnrollmentTemplateBuffer(): Buffer {
  const aoa: (string | number)[][] = [
    [...ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW1],
    [...ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2],
    ...ENROLLED_ENROLLMENT_TEMPLATE_SAMPLES.map(templateSampleToRow),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [{ s: { r: 0, c: 10 }, e: { r: 0, c: 12 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}
