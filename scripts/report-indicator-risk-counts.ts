/**
 * 지표별 2단계 지수(100점) 기준 위험군·고위험군 대학 수 산출
 * Usage: npx tsx scripts/report-indicator-risk-counts.ts [--year=2026]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import { runStep2Analysis } from "../src/lib/competitiveness-analysis/compute-step2.ts";
import {
  getEditionFull,
  listEditionSummaries,
} from "../src/lib/competitiveness-analysis/editions-db.ts";
import {
  resolveIndicatorPercentileBounds,
} from "../src/lib/competitiveness-analysis/indicator-percentile-bounds.ts";
import {
  getNationalValuesForScope,
} from "../src/lib/competitiveness-analysis/national-indicator-distribution.ts";
import {
  resolveAnalysisPolicy,
  resolveLowerIsBetterSet,
} from "../src/lib/competitiveness-analysis/analysis-policy.ts";
import {
  loadNationalDistributionsForSettings,
} from "../src/lib/competitiveness-analysis/compute-step2.ts";
import { loadStep1RawIndicatorResults } from "../src/lib/competitiveness-analysis/indicator-value-loader.ts";
import {
  matchesSchoolKindFilter,
  STEP1_INDICATOR_IDS,
  STEP1_INDICATOR_LABELS,
} from "../src/lib/competitiveness-analysis/step1-indicators.ts";
import {
  rawToLinearPercentileIndexScore,
} from "../src/lib/competitiveness-analysis/percentile-utils.ts";
import type { CompetitivenessSettings } from "../src/lib/competitiveness-analysis/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

function parseYearArg(): number | null {
  const arg = process.argv.find((a) => a.startsWith("--year="));
  if (!arg) return null;
  const year = Number(arg.split("=")[1]);
  return Number.isInteger(year) ? year : null;
}

type RowStats = {
  withData: number;
  risk50: number;
  risk25: number;
  index0: number;
  uni: { withData: number; risk50: number; risk25: number };
  jc: { withData: number; risk50: number; risk25: number };
  p10: number | null;
  p90: number | null;
};

function pct(n: number, d: number): string {
  if (!d) return "0.0%";
  return `${((100 * n) / d).toFixed(1)}%`;
}

async function main() {
  const indicators = getCompetitivenessIndicators();
  const summaries = await listEditionSummaries();
  const editionYear =
    parseYearArg() ??
    summaries.find((s) => s.hasRunResults)?.analysisYear ??
    summaries[0]?.analysisYear ??
    2026;

  const edition = await getEditionFull(editionYear);
  if (!edition) {
    console.error(`Edition ${editionYear} 없음`);
    process.exit(1);
  }

  const settings: CompetitivenessSettings = edition.settings;
  const step2 = await runStep2Analysis(settings, indicators);
  const rawResults = step2.rawResults;
  const nationalDists = await loadNationalDistributionsForSettings(
    settings,
    indicators,
  );
  const policy = resolveAnalysisPolicy(settings);
  const lowerIsBetter = resolveLowerIsBetterSet(policy);

  console.log(`\n=== 지표별 위험군 산출 (2단계 지수 100점 만점) ===`);
  console.log(`분석연도(설정): ${editionYear}년`);
  console.log(`대상대학: ${settings.targetUniversities.length}개교`);
  console.log(`비교 집단: ${policy.nationalComparisonScope === "same-school-kind" ? "동종(4년제/전문대 각각)" : "전체 통합"}`);
  console.log(`백분위: P10/P90 (기본 n=10%, 지표별 설정 반영)`);
  console.log(`위험군: 지수 < 50 · 고위험군: 지수 < 25 · (데이터 있는 대학만 집계)\n`);

  console.log("지표별 적용 원자료 연도:");
  for (const id of STEP1_INDICATOR_IDS) {
    console.log(
      `  · ${STEP1_INDICATOR_LABELS[id]}: ${settings.indicatorYears[id] ?? "—"}`,
    );
  }
  console.log("");

  const header = [
    "지표",
    "데이터",
    "위험<50",
    "비율",
    "고위험<25",
    "비율",
    "지수=0",
    "P10",
    "P90",
    "4년제<50",
    "4년제<25",
    "전문대<50",
    "전문대<25",
  ].join("\t");

  console.log(header);

  for (const id of STEP1_INDICATOR_IDS) {
    const nationalDist = nationalDists.get(id);
    const bounds = resolveIndicatorPercentileBounds(settings, id);
    const lowerIsBetterFlag = lowerIsBetter.has(id);

    const stats: RowStats = {
      withData: 0,
      risk50: 0,
      risk25: 0,
      index0: 0,
      uni: { withData: 0, risk50: 0, risk25: 0 },
      jc: { withData: 0, risk50: 0, risk25: 0 },
      p10: null,
      p90: null,
    };

    for (const uni of settings.targetUniversities) {
      const rawRow = rawResults.find((r) => r.schoolCodeStd === uni.schoolCodeStd);
      const rawCell = rawRow?.indicators.find((c) => c.financeTabId === id);
      if (!rawCell?.found || rawCell.rawValue == null) continue;

      const indexRow = step2.indexResults.find(
        (r) => r.schoolCodeStd === uni.schoolCodeStd,
      );
      const indexCell = indexRow?.indicators.find((c) => c.financeTabId === id);
      const score = indexCell?.indexScore ?? 0;

      stats.withData++;
      const bucket = matchesSchoolKindFilter(uni.schoolKind, "university")
        ? stats.uni
        : stats.jc;
      bucket.withData++;

      if (score < 50) {
        stats.risk50++;
        bucket.risk50++;
      }
      if (score < 25) {
        stats.risk25++;
        bucket.risk25++;
      }
      if (score === 0) stats.index0++;
    }

    const sampleUni = settings.targetUniversities.find((u) =>
      matchesSchoolKindFilter(u.schoolKind, "university"),
    );
    if (sampleUni && nationalDist) {
      const nationalValues = getNationalValuesForScope(
        nationalDist,
        sampleUni.schoolKind,
        policy.nationalComparisonScope,
      );
      if (nationalValues.length) {
        const sorted = [...nationalValues].sort((a, b) => a - b);
        const p = (rank: number) => {
          const index = (rank / 100) * (sorted.length - 1);
          const lo = Math.floor(index);
          const hi = Math.ceil(index);
          if (lo === hi) return sorted[lo]!;
          return sorted[lo]! * (1 - (index - lo)) + sorted[hi]! * (index - lo);
        };
        stats.p10 = Math.round(p(bounds.lowerTailPct) * 100) / 100;
        stats.p90 = Math.round(p(100 - bounds.upperTailPct) * 100) / 100;
      }
    }

    console.log(
      [
        STEP1_INDICATOR_LABELS[id],
        stats.withData,
        stats.risk50,
        pct(stats.risk50, stats.withData),
        stats.risk25,
        pct(stats.risk25, stats.withData),
        stats.index0,
        stats.p10 ?? "—",
        stats.p90 ?? "—",
        stats.uni.risk50,
        stats.uni.risk25,
        stats.jc.risk50,
        stats.jc.risk25,
      ].join("\t"),
    );
  }

  console.log("\n--- 해석 ---");
  console.log(
    "지수<50: 전국(동종) P10~P90 구간에서 하위 약 40%대 (중앙값 근처 이하)",
  );
  console.log("지수<25: 하위 약 20%대");
  console.log("지수=0: P10(정방향) 또는 P90(역방향) 밖 — 분석지침 §3 최하위");
  console.log(
    "\n※ 재정분석 통계분석 KPI(예: 신입생충원율 <100% 233개교)는 전국 본교통합 DB 전체 대학 기준이며,",
  );
  console.log(
    "  위 표는 경쟁력분석 대상대학 272개교 + 분석지침 지수화 기준입니다.",
  );

  await reportFinanceDbScope(indicators, settings, nationalDists, policy, lowerIsBetter);
}

async function reportFinanceDbScope(
  indicators: ReturnType<typeof getCompetitivenessIndicators>,
  settings: CompetitivenessSettings,
  nationalDists: Awaited<ReturnType<typeof loadNationalDistributionsForSettings>>,
  policy: ReturnType<typeof resolveAnalysisPolicy>,
  lowerIsBetter: ReturnType<typeof resolveLowerIsBetterSet>,
) {
  const { readCsvFile } = await import("../src/lib/csv/read.ts");

  type ScopeRow = { kind: string; value: number };
  const scopes: Record<string, () => Promise<ScopeRow[]>> = {
    "freshman-enrollment-rate": async () => {
      const rows = await readCsvFile("financeAnalysisFreshmanEnrollmentConsolidated");
      const year = 2025;
      return rows
        .filter((r) => Number(r.year) === year)
        .map((r) => ({
          kind: r.school_kind ?? "",
          value: Number(r.fill_rate_within),
        }))
        .filter((r) => Number.isFinite(r.value));
    },
    "enrolled-enrollment-rate": async () => {
      const rows = await readCsvFile("financeAnalysisEnrolledEnrollmentConsolidated");
      const year = 2025;
      return rows
        .filter((r) => Number(r.year) === year && r.half?.trim() === "상반기")
        .map((r) => ({
          kind: r.school_kind ?? "",
          value: Number(r.fill_rate_within),
        }))
        .filter((r) => Number.isFinite(r.value));
    },
    "dropout-rate": async () => {
      const rows = await readCsvFile("financeAnalysisDropoutRateConsolidated");
      const year = 2024;
      return rows
        .filter((r) => Number(r.year) === year)
        .map((r) => ({
          kind: r.school_kind ?? "",
          value: Number(r.enrolled_dropout_rate),
        }))
        .filter((r) => Number.isFinite(r.value));
    },
  };

  console.log("\n=== [참고] 재정분석 본교통합 DB 전체 — 동일 지수 기준 ===");
  console.log("지표\t전체\t<50\t%\t<25\t%\t절대위험(현행KPI)\n");

  for (const [id, loader] of Object.entries(scopes)) {
    const rows = await loader();
    const nationalDist = nationalDists.get(id);
    const bounds = resolveIndicatorPercentileBounds(settings, id);
    const lowerIsBetterFlag = lowerIsBetter.has(id);

    let risk50 = 0;
    let risk25 = 0;
    let absRisk = 0;

    for (const row of rows) {
      const nationalValues = getNationalValuesForScope(
        nationalDist,
        row.kind,
        policy.nationalComparisonScope,
      );
      const score = rawToLinearPercentileIndexScore(
        nationalValues,
        row.value,
        bounds.lowerTailPct,
        bounds.upperTailPct,
        lowerIsBetterFlag,
      );
      if (score < 50) risk50++;
      if (score < 25) risk25++;
      if (id === "freshman-enrollment-rate" || id === "enrolled-enrollment-rate") {
        if (row.value < 100) absRisk++;
      } else if (id === "dropout-rate") {
        if (row.value >= 5) absRisk++;
      }
    }

    const label = STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS];
    const absLabel =
      id === "dropout-rate" ? "≥5%" : "<100%";
    console.log(
      [
        label,
        rows.length,
        risk50,
        pct(risk50, rows.length),
        risk25,
        pct(risk25, rows.length),
        `${absLabel} ${absRisk} (${pct(absRisk, rows.length)})`,
      ].join("\t"),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
