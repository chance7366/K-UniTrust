import * as XLSX from "xlsx";

import { readCsvFile } from "@/lib/csv/read";
import type { CsvFileKey } from "@/lib/csv/paths";
import {
  REGIONAL_DECLINE_UPLOAD_HEADERS,
  REGIONAL_DECLINE_UPLOAD_SUBHEADERS,
} from "@/lib/ingest/regional-decline-config";
import {
  SCHOOL_AGE_AGES,
  SCHOOL_AGE_UPLOAD_HEADERS,
  schoolAgeKey,
} from "@/lib/ingest/school-age-population-config";
import { SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS } from "@/lib/ingest/school-age-population-sigungu-config";

function writeXlsxBuffer(aoa: (string | number)[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

function numCell(v: string | undefined): string | number {
  if (v == null || v.trim() === "") return "";
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : v;
}

async function readOrThrow(key: CsvFileKey, emptyMessage: string) {
  const rows = await readCsvFile(key).catch(() => []);
  if (!rows.length) throw new Error(emptyMessage);
  return rows;
}

export async function buildRegionalDeclineDbExport() {
  const rows = await readOrThrow(
    "financeAnalysisRegionalDecline",
    "다운로드할 지역인구 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...REGIONAL_DECLINE_UPLOAD_HEADERS],
    [...REGIONAL_DECLINE_UPLOAD_SUBHEADERS],
    ...rows.map((row) => [
      numCell(row.year),
      row.region_code ?? "",
      row.region_full || row.region || "",
      numCell(row.women_20_39),
      numCell(row.senior_65_plus),
      numCell(row.extinction_index),
    ]),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "regional_decline_db_export.xlsx",
  };
}

export async function buildSchoolAgeSidoDbExport() {
  const rows = await readOrThrow(
    "financeAnalysisSchoolAgePopulation",
    "다운로드할 학령인구(시도) 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...SCHOOL_AGE_UPLOAD_HEADERS],
    ...rows.map((row) => [
      numCell(row.year),
      row.region_code ?? "",
      row.region_full || row.region || "",
      numCell(row.admission_weight),
      ...SCHOOL_AGE_AGES.map((age) => numCell(row[schoolAgeKey(age)])),
    ]),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "school_age_population_sido_db_export.xlsx",
  };
}

export async function buildSchoolAgeSigunguDbExport() {
  const rows = await readOrThrow(
    "univMapSchoolAgePopulationSigungu",
    "다운로드할 학령인구(시군구) 데이터가 없습니다.",
  );
  const aoa: (string | number)[][] = [
    [...SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS],
    ...rows.map((row) => [
      numCell(row.year),
      row.region_code ?? "",
      row.region_full || row.region || "",
      ...SCHOOL_AGE_AGES.map((age) => numCell(row[schoolAgeKey(age)])),
    ]),
  ];
  return {
    buffer: writeXlsxBuffer(aoa),
    filename: "school_age_population_sigungu_db_export.xlsx",
  };
}
