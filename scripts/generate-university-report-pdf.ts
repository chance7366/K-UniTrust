/**
 * 기존 HTML 보고서 → PDF 생성
 * Usage: npx tsx scripts/generate-university-report-pdf.ts --year=2025 --school=0000032
 */
import "dotenv/config";

import { generateUniversityReportPdf } from "@/lib/competitiveness-analysis/university-report/ensure-university-report-pdf";
import { closePdfBrowser } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";
import {
  loadUniversityReportMeta,
  universityReportPdfPath,
} from "@/lib/competitiveness-analysis/university-report/report-store";

function parseArgs() {
  let analysisYear = 2025;
  let schoolCodeStd = "0000032";
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--year=")) analysisYear = Number(arg.slice(7));
    if (arg.startsWith("--school=")) schoolCodeStd = arg.slice(9);
  }
  return { analysisYear, schoolCodeStd };
}

async function main() {
  const { analysisYear, schoolCodeStd } = parseArgs();
  const meta = await loadUniversityReportMeta(analysisYear, schoolCodeStd);
  if (!meta) {
    throw new Error("보고서 meta.json이 없습니다.");
  }

  const pdf = await generateUniversityReportPdf(analysisYear, schoolCodeStd);
  console.log(
    `PDF saved: ${universityReportPdfPath(analysisYear, schoolCodeStd)} (${pdf.length} bytes)`,
  );
  console.log(`School: ${meta.schoolName}`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(closePdfBrowser);
