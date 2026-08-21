import fs from "fs";

import { ingestFinancialSupportBenefitRateUpload } from "../src/lib/ingest/financial-support-benefit-rate-upload.ts";

const filePath =
  "d:/대학DB/대학재정/재정지원/(업로드)재정지원.xlsx";

const buffer = fs.readFileSync(filePath);
const result = await ingestFinancialSupportBenefitRateUpload(
  buffer,
  "(업로드)재정지원.xlsx",
  { replaceAll: true },
);

console.log(result);
