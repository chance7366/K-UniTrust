import fs from "node:fs";

import { ingestOriginRegionUpload } from "../src/lib/ingest/origin-region-upload";

const filePath =
  "d:/대학DB/지역인구/출신지역/(업로드)신입생의 출신 고등학교 유형별 현황_학교별자료.xlsx";

async function main() {
  const buffer = fs.readFileSync(filePath);
  const fileName = filePath.split(/[/\\]/).pop() ?? "upload.xlsx";
  const result = await ingestOriginRegionUpload(buffer, fileName);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
