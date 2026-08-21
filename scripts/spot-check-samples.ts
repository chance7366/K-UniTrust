import { getEditionFull } from "../src/lib/competitiveness-analysis/editions-db.ts";
import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import {
  loadIndicatorSourceData,
  loadStep1RawIndicatorResults,
} from "../src/lib/competitiveness-analysis/indicator-value-loader.ts";
import { parseEnrolledIndicatorYearLabels } from "../src/lib/competitiveness-analysis/parse-indicator-year.ts";

async function spot(code: string, name: string) {
  const edition = await getEditionFull(2026);
  const indicators = getCompetitivenessIndicators();
  const settings = edition!.settings;
  const raw = await loadStep1RawIndicatorResults(settings, indicators);
  const sources = await loadIndicatorSourceData();
  const row = raw.find((r) => r.schoolCodeStd === code);
  const uni = settings.targetUniversities.find((u) => u.schoolCodeStd === code);
  console.log(`\n=== ${name} (${code}) ${uni?.schoolKind} ===`);
  for (const cell of row?.indicators ?? []) {
    const yl = settings.indicatorYears[cell.financeTabId] ?? "";
    console.log(
      `  ${cell.label}: ${yl} => ${cell.rawValue ?? "—"} ${cell.found ? "✓" : cell.note}`,
    );
  }
  const fsYear = 2025;
  console.log(
    "  [검증] DB 자금확보율:",
    sources.dataset.fundSecureRate.get(`${fsYear}:${code}`),
  );
  const enSel = parseEnrolledIndicatorYearLabels(
    settings.indicatorYears["enrolled-enrollment-rate"] ?? "",
  );
  for (const sel of enSel) {
    const rep = sources.dataset.repLookup.resolveRepCode(code, sel.year);
    console.log(
      `  [검증] DB 재학생 ${sel.year} ${sel.half} rep=${rep} =>`,
      sources.dataset.enrolled.get(`${sel.year}:${sel.half}:${rep}`),
    );
  }
}

async function main() {
  await spot("0000188", "포항공과대학교");
  await spot("0000570", "한국승강기대학교");
  await spot("0000069", "고려대학교");
  await spot("0000441", "농협대학교");
}

main().catch(console.error);
