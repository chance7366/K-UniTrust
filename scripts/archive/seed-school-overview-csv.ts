import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ingestSchoolOverviewUpload } from "@/lib/ingest/school-overview-upload";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const sourceExcel = path.join(
  projectRoot,
  "data/source/school-overview/학교 개황 정보(2026.7.22.기준).xlsx",
);

async function main() {
  if (!fs.existsSync(sourceExcel)) {
    throw new Error(`Source Excel not found: ${sourceExcel}`);
  }

  const buffer = fs.readFileSync(sourceExcel);
  const result = await ingestSchoolOverviewUpload(
    buffer,
    path.basename(sourceExcel),
  );

  console.log(`Seeded ${result.rowCount} rows to univ_map_school_overview.csv`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
