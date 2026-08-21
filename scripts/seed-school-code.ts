import fs from "fs";

import { ingestSchoolCodeUpload } from "@/lib/ingest/school-code-upload";

const FILE_PATH =
  "d:/바이브코딩/데이터관리/대학알리미/학교코드/(업로드)표준분류 학교코드.xlsx";

async function main() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`파일 없음: ${FILE_PATH}`);
    process.exit(1);
  }
  const buffer = fs.readFileSync(FILE_PATH);
  const result = await ingestSchoolCodeUpload(
    buffer,
    FILE_PATH.split(/[/\\]/).pop() ?? FILE_PATH,
  );
  console.log(
    `${result.rowCount}행 · 연도 ${result.years.join(", ")} · 신규 ${result.newYears.join(", ") || "없음"} · 덮어쓰기 ${result.overwrittenYears.join(", ") || "없음"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
