/**
 * (업로드)학교법인수익용기본재산.xlsx → CSV 전체 교체 업로드
 * Usage: npx tsx scripts/seed-income-property-secure-rate.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ingestIncomePropertySecureRateUpload } from "../src/lib/ingest/income-property-secure-rate-upload.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_PATH =
  "d:/대학DB/법인재정/수익용재산/(업로드)학교법인수익용기본재산.xlsx";

const buffer = fs.readFileSync(EXCEL_PATH);
const result = await ingestIncomePropertySecureRateUpload(
  buffer,
  path.basename(EXCEL_PATH),
  { replaceAll: true },
);

console.log(
  `Uploaded ${result.rowCount} rows · years ${result.years.join(", ")} · replaceAll`,
);
