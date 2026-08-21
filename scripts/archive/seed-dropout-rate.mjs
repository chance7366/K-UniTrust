import fs from "fs";

import { ingestDropoutRateUpload } from "../src/lib/ingest/dropout-rate-upload.ts";

const filePath =
  "d:/대학DB/학생충원/중도탈락율/(업로드)중도탈락 학생 현황_학교별자료.xlsx";

const buffer = fs.readFileSync(filePath);
const result = await ingestDropoutRateUpload(
  buffer,
  "(업로드)중도탈락 학생 현황_학교별자료.xlsx",
  { replaceAll: true },
);

console.log(result);
