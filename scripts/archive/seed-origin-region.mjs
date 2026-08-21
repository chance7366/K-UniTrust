import fs from "fs";

import { ingestOriginRegionUpload } from "../src/lib/ingest/origin-region-upload.ts";

const filePath =
  "d:/대학DB/출신지역/(업로드)신입생의 출신 고등학교 유형별 현황_학교별자료.xlsx";

const buffer = fs.readFileSync(filePath);
const result = await ingestOriginRegionUpload(
  buffer,
  "(업로드)신입생의 출신 고등학교 유형별 현황_학교별자료.xlsx",
);

console.log(result);
