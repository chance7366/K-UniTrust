import fs from "fs";

import { ingestFreshmanEnrollmentUpload } from "../src/lib/ingest/freshman-enrollment-upload.ts";

const filePath =
  "d:/대학DB/학생충원/신입생충원/(업로드)신입생 충원 현황_학교별자료.xlsx";

const buffer = fs.readFileSync(filePath);
const result = await ingestFreshmanEnrollmentUpload(
  buffer,
  "(업로드)신입생 충원 현황_학교별자료.xlsx",
  { replaceAll: true },
);

console.log(result);
