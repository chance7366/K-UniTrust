import fs from "fs";

import { ingestSchoolCodeUpload } from "../src/lib/ingest/school-code-upload.ts";

const filePath =
  "d:/대학DB/학교코드/(업로드)표준분류_학교코드.xlsx";

const buffer = fs.readFileSync(filePath);
const result = await ingestSchoolCodeUpload(
  buffer,
  "(업로드)표준분류_학교코드.xlsx",
);

console.log(result);
