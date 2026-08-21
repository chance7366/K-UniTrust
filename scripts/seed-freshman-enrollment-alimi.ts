import fs from "fs";

import { ingestFreshmanEnrollmentAlimiUpload } from "@/lib/ingest/freshman-enrollment-alimi-upload";

const FILES = {
  undergrad:
    "d:/바이브코딩/데이터관리/대학알리미/신입생충원/(업로드)신입생충원_대학전문.xlsx",
  grad: "d:/바이브코딩/데이터관리/대학알리미/신입생충원/(업로드)신입생충원_대학원.xlsx",
} as const;

async function main() {
  for (const [kind, filePath] of Object.entries(FILES)) {
    if (!fs.existsSync(filePath)) {
      console.error(`파일 없음: ${filePath}`);
      process.exitCode = 1;
      continue;
    }
    const buffer = fs.readFileSync(filePath);
    const result = await ingestFreshmanEnrollmentAlimiUpload(
      kind as "undergrad" | "grad",
      buffer,
      filePath.split(/[/\\]/).pop() ?? filePath,
    );
    console.log(
      `[${kind}] ${result.rowCount}행 · 연도 ${result.years.join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
