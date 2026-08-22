/**
 * 기존 재정추계 HTML 보고서 → PDF 생성
 * Usage: npx tsx scripts/generate-fp-report-pdf.ts --year=2025 --school=0000032
 */
import "dotenv/config";

import { ensureFpReportPdf } from "@/lib/competitiveness-analysis/financial-projection/report/ensure-fp-report-pdf";
import { closePdfBrowser } from "@/lib/competitiveness-analysis/university-report/html-to-pdf";

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
  const pdf = await ensureFpReportPdf(analysisYear, schoolCodeStd);
  console.log(`FP PDF saved: ${schoolCodeStd} (${pdf.length} bytes)`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(closePdfBrowser);
