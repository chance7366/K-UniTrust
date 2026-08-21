import fs from "fs";

import { ingestEnrolledEnrollmentUpload } from "../src/lib/ingest/enrolled-enrollment-upload.ts";

const filePath =
  "d:/대학DB/학생충원/재학생충원/(업로드)재학생 충원율_학교별자료.xlsx";

const buffer = fs.readFileSync(filePath);
const result = await ingestEnrolledEnrollmentUpload(
  buffer,
  "(업로드)재학생 충원율_학교별자료.xlsx",
  { replaceAll: true },
);

console.log(result);
