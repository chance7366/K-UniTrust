/**
 * 기존 HTML 보고서에 표지·A4 서식·SVG 차트 재적용
 * Usage: npx tsx scripts/reinject-report-charts.ts --year=2025 --school=0000032
 */
import "dotenv/config";
import { readFile } from "fs/promises";

import {
  getEditionFull,
  loadEditionTrendSeries,
} from "@/lib/competitiveness-analysis/editions-db";
import { buildUniversityReportPayload } from "@/lib/competitiveness-analysis/university-report/build-university-report-payload";
import { finalizeUniversityReportHtml } from "@/lib/competitiveness-analysis/university-report/finalize-report-html";
import {
  loadUniversityReportMeta,
  saveUniversityReport,
  universityReportHtmlPath,
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
    throw new Error("기존 보고서 meta.json이 없습니다. 먼저 보고서를 생성하세요.");
  }

  const rawHtml = await readFile(
    universityReportHtmlPath(analysisYear, schoolCodeStd),
    "utf8",
  );

  const edition = await getEditionFull(analysisYear);
  if (!edition?.results.runResults?.length) {
    throw new Error(`${analysisYear}년 분석결과가 없습니다.`);
  }

  const series = await loadEditionTrendSeries();
  const payload = buildUniversityReportPayload({
    analysisYear,
    schoolCodeStd,
    series,
    settings: edition.settings,
    lastRunAt: edition.results.lastRunAt,
  });

  const generatedAt = new Date().toLocaleString("ko-KR");
  const html = finalizeUniversityReportHtml({
    rawBodyOrFullHtml: rawHtml,
    payload,
    generatedAt,
    title: `${payload.schoolName} ${analysisYear}년 대학별경쟁력 분석 보고서`,
  });

  await saveUniversityReport({
    analysisYear,
    schoolCodeStd,
    schoolName: payload.schoolName,
    html,
    model: meta.model,
  });

  const chartCount = (html.match(/class="report-chart"/g) ?? []).length;
  console.log(
    `Updated ${payload.schoolName} report (cover + A4 styles + ${chartCount} charts).`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
