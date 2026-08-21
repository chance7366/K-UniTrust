import fs from "fs";

import { ingestAnalysisTargetUpload } from "@/lib/ingest/analysis-target-upload";

const FILE_PATH =
  "d:/바이브코딩/데이터관리/대학알리미/분석대상/(업로드)분석대상학교_수정.xlsx";

async function main() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`파일 없음: ${FILE_PATH}`);
    process.exit(1);
  }
  const buffer = fs.readFileSync(FILE_PATH);
  const result = await ingestAnalysisTargetUpload(
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
