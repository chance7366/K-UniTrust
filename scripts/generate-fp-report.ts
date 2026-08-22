/**
 * CLI: 개별대학 재정추계 보고서 생성
 * Usage: npx tsx scripts/generate-fp-report.ts --year=2025 --school=0000032
 */
import "dotenv/config";

import { generateFpReport } from "@/lib/competitiveness-analysis/financial-projection/report/generate-fp-report";

function parseArgs() {
  let analysisYear = 2025;
  let schoolCodeStd = "0000032";

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--year=")) {
      analysisYear = Number(arg.slice("--year=".length));
    } else if (arg.startsWith("--school=")) {
      schoolCodeStd = arg.slice("--school=".length);
    }
  }

  return { analysisYear, schoolCodeStd };
}

async function main() {
  const { analysisYear, schoolCodeStd } = parseArgs();

  console.log(
    `Generating financial projection report: year=${analysisYear}, school=${schoolCodeStd}`,
  );

  const result = await generateFpReport({ analysisYear, schoolCodeStd });

  console.log("Done.");
  console.log(`School: ${result.meta.schoolName}`);
  console.log(`Generated at: ${result.meta.generatedAt}`);
  console.log(`Model: ${result.meta.model}`);
  console.log(`HTML length: ${result.html.length} chars`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
