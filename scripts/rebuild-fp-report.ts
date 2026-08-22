/**
 * CLI: 저장된 재정추계 보고서의 레이아웃 재조립 (Gemini 재호출 없음)
 * 저장된 HTML에서 서술 문단을 추출해 최신 스켈레톤에 재주입합니다.
 * Usage: npx tsx scripts/rebuild-fp-report.ts --year=2025 --school=0000032
 */
import "dotenv/config";

import { writeFile } from "fs/promises";

import { buildFpReportPayload } from "@/lib/competitiveness-analysis/financial-projection/report/build-fp-report-payload";
import {
  buildFpReportSkeleton,
  wrapFpReportHtml,
} from "@/lib/competitiveness-analysis/financial-projection/report/build-fp-report-html";
import { injectFpNarratives } from "@/lib/competitiveness-analysis/financial-projection/report/finalize-fp-report-html";
import {
  fpReportHtmlPath,
  loadFpReportHtml,
} from "@/lib/competitiveness-analysis/financial-projection/report/fp-report-store";
import type { FpNarrativeSlotId } from "@/lib/competitiveness-analysis/financial-projection/report/generation-guidelines";

function parseArgs() {
  let analysisYear = 2025;
  let schoolCodeStd = "0000032";
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--year=")) analysisYear = Number(arg.slice(7));
    else if (arg.startsWith("--school=")) schoolCodeStd = arg.slice(9);
  }
  return { analysisYear, schoolCodeStd };
}

function extractSavedNarratives(html: string): Map<FpNarrativeSlotId, string> {
  const out = new Map<FpNarrativeSlotId, string>();
  const re =
    /<div class="fp-narrative" data-fp-narrative="([a-z-]+)">([\s\S]*?)<\/div>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const body = match[2].trim();
    if (body) out.set(match[1] as FpNarrativeSlotId, body);
  }
  return out;
}

async function main() {
  const { analysisYear, schoolCodeStd } = parseArgs();
  const saved = await loadFpReportHtml(analysisYear, schoolCodeStd);
  if (!saved) throw new Error("저장된 보고서가 없습니다.");

  const narratives = extractSavedNarratives(saved);
  console.log(`extracted narratives: ${narratives.size}`);

  const payload = await buildFpReportPayload({ analysisYear, schoolCodeStd });
  const generatedAt = new Date().toLocaleString("ko-KR");
  const skeleton = buildFpReportSkeleton(payload, generatedAt);
  const bodyHtml = injectFpNarratives(skeleton, narratives);
  const html = wrapFpReportHtml({
    title: `${payload.school.schoolName} ${analysisYear}년 대학별 재정추계 분석 보고서`,
    bodyHtml,
  });

  await writeFile(fpReportHtmlPath(analysisYear, schoolCodeStd), html, "utf8");
  console.log(`rebuilt: ${fpReportHtmlPath(analysisYear, schoolCodeStd)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
