/**
 * 대학/전문대학 샘플 추출 + 지표값 이상치 감사
 * Usage: npx tsx scripts/audit-competitiveness-outliers.ts [--year=2026] [--from=2021 --to=2026]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import { resolveStep12IndicatorIds } from "../src/lib/competitiveness-analysis/analysis-policy.ts";
import { computeRunResultsFromRaw } from "../src/lib/competitiveness-analysis/compute-run.ts";
import {
  computeIndexResultsFromRaw,
  loadNationalDistributionsForSettings,
} from "../src/lib/competitiveness-analysis/compute-step2.ts";
import { getEditionFull } from "../src/lib/competitiveness-analysis/editions-db.ts";
import { loadStep1RawIndicatorResults } from "../src/lib/competitiveness-analysis/indicator-value-loader.ts";
import {
  matchesSchoolKindFilter,
  STEP1_INDICATOR_LABELS,
  type SchoolKindFilter,
} from "../src/lib/competitiveness-analysis/step1-indicators.ts";
import type {
  UniversityRawResult,
  UniversityRunResult,
} from "../src/lib/competitiveness-analysis/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

const SAMPLE_PER_KIND = 5;

type OutlierFlag = {
  kind: "iqr_low" | "iqr_high" | "domain_low" | "domain_high" | "missing";
  message: string;
};

type SampleRow = {
  analysisYear: number;
  schoolKindFilter: SchoolKindFilter;
  schoolCodeStd: string;
  schoolName: string;
  schoolKind: string;
  indicatorId: string;
  indicatorLabel: string;
  yearLabel: string;
  rawValue: number | null;
  indexScore: number | null;
  compositeIndex: number | null;
  compositeRank: number | null;
  flags: OutlierFlag[];
};

function parseYears(): number[] {
  const single = process.argv.find((a) => a.startsWith("--year="));
  const from = process.argv.find((a) => a.startsWith("--from="));
  const to = process.argv.find((a) => a.startsWith("--to="));
  if (single) return [Number(single.split("=")[1])];
  if (from) {
    const start = Number(from.split("=")[1]);
    const end = to ? Number(to.split("=")[1]) : 2026;
    const years: number[] = [];
    for (let y = start; y <= end; y += 1) years.push(y);
    return years;
  }
  return [2026];
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! * (1 - (idx - lo)) + sorted[hi]! * (idx - lo);
}

function domainFlags(indicatorId: string, value: number | null): OutlierFlag[] {
  if (value == null) {
    return [{ kind: "missing", message: "DB 값 없음" }];
  }
  const flags: OutlierFlag[] = [];

  const pct0to100 = new Set([
    "freshman-enrollment-rate",
    "enrolled-enrollment-rate",
    "dropout-rate",
    "tuition-dependency-rate",
  ]);

  if (pct0to100.has(indicatorId)) {
    if (value < 0) flags.push({ kind: "domain_low", message: `음수 ${value}` });
    if (value > 100) flags.push({ kind: "domain_high", message: `100% 초과 ${value}` });
  }

  if (indicatorId === "fund-secure-rate") {
    if (value < -20) flags.push({ kind: "domain_low", message: `자금합계 음수 수준 ${value}%` });
    if (value > 300) flags.push({ kind: "domain_high", message: `300% 초과 ${value}%` });
  }

  if (indicatorId === "financial-support-benefit-rate") {
    if (value < 0) flags.push({ kind: "domain_low", message: `음수 ${value}%` });
    if (value > 200) flags.push({ kind: "domain_high", message: `200% 초과 ${value}%` });
  }

  if (indicatorId === "income-property-secure-rate") {
    if (value < 0) flags.push({ kind: "domain_low", message: `음수 ${value}%` });
    if (value > 500) flags.push({ kind: "domain_high", message: `500% 초과 ${value}%` });
  }

  if (indicatorId === "corp-transfer-ratio") {
    if (value < 0) flags.push({ kind: "domain_low", message: `음수 ${value}%` });
    if (value > 150) flags.push({ kind: "domain_high", message: `150% 초과 ${value}%` });
  }

  return flags;
}

function iqrFlags(values: number[], value: number): OutlierFlag[] {
  if (values.length < 8) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  if (iqr <= 0) return [];
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  const flags: OutlierFlag[] = [];
  if (value < low) {
    flags.push({
      kind: "iqr_low",
      message: `IQR 하위 이상치 (${value.toFixed(1)} < ${low.toFixed(1)})`,
    });
  }
  if (value > high) {
    flags.push({
      kind: "iqr_high",
      message: `IQR 상위 이상치 (${value.toFixed(1)} > ${high.toFixed(1)})`,
    });
  }
  return flags;
}

function kindLabel(filter: SchoolKindFilter): string {
  return filter === "university" ? "대학" : "전문대학";
}

async function auditYear(analysisYear: number) {
  const indicators = getCompetitivenessIndicators();
  const edition = await getEditionFull(analysisYear);
  if (!edition) {
    console.log(`\n[${analysisYear}] edition 없음 — 스킵`);
    return { samples: [] as SampleRow[], outlierCount: 0 };
  }

  const settings = edition.settings;
  const ids = resolveStep12IndicatorIds(settings, indicators);
  const rawResults = await loadStep1RawIndicatorResults(
    settings,
    indicators,
    ids,
  );
  const nationalDists = await loadNationalDistributionsForSettings(
    settings,
    indicators,
    ids,
  );
  const indexResults = computeIndexResultsFromRaw(
    settings,
    indicators,
    rawResults,
    nationalDists,
    ids,
  );
  const runResults = computeRunResultsFromRaw(
    settings,
    indicators,
    rawResults,
    nationalDists,
  );

  const indexByCode = new Map(
    indexResults.map((r) => [r.schoolCodeStd, r]),
  );
  const runByCode = new Map(runResults.map((r) => [r.schoolCodeStd, r]));

  console.log(`\n${"=".repeat(70)}`);
  console.log(`=== ${analysisYear}년 · 대학/전문대학 샘플 & 이상치 감사 ===`);

  const allSamples: SampleRow[] = [];
  let totalOutliers = 0;

  for (const filter of ["university", "junior-college"] as SchoolKindFilter[]) {
    const targets = settings.targetUniversities.filter((u) =>
      matchesSchoolKindFilter(u.schoolKind, filter),
    );
    console.log(`\n--- ${kindLabel(filter)} ${targets.length}교 ---`);

    for (const indicatorId of ids) {
      const label =
        STEP1_INDICATOR_LABELS[
          indicatorId as keyof typeof STEP1_INDICATOR_LABELS
        ] ?? indicatorId;
      const yearLabel =
        settings.indicatorYears[indicatorId] ??
        indicators.find((i) => i.financeTabId === indicatorId)
          ?.defaultYearLabel ??
        "—";

      const cohortValues: number[] = [];
      const rows: SampleRow[] = [];

      for (const uni of targets) {
        const rawRow = rawResults.find(
          (r) => r.schoolCodeStd === uni.schoolCodeStd,
        );
        const cell = rawRow?.indicators.find(
          (c) => c.financeTabId === indicatorId,
        );
        const rawValue = cell?.found ? (cell.rawValue ?? null) : null;
        if (rawValue != null) cohortValues.push(rawValue);

        const idxRow = indexByCode.get(uni.schoolCodeStd);
        const idxCell = idxRow?.indicators.find(
          (c) => c.financeTabId === indicatorId,
        );
        const runRow = runByCode.get(uni.schoolCodeStd);

        const flags = [
          ...domainFlags(indicatorId, rawValue),
          ...(rawValue != null ? iqrFlags(cohortValues, rawValue) : []),
        ];
        // Recompute IQR after full cohort collected — fix below
        rows.push({
          analysisYear,
          schoolKindFilter: filter,
          schoolCodeStd: uni.schoolCodeStd,
          schoolName: uni.schoolName,
          schoolKind: uni.schoolKind,
          indicatorId,
          indicatorLabel: label,
          yearLabel,
          rawValue,
          indexScore: idxCell?.indexScore ?? null,
          compositeIndex: runRow?.compositeIndex ?? null,
          compositeRank: runRow?.compositeRank ?? null,
          flags: [],
        });
      }

      // Second pass: IQR with full cohort
      for (const row of rows) {
        if (row.rawValue != null) {
          row.flags = [
            ...domainFlags(indicatorId, row.rawValue),
            ...iqrFlags(cohortValues, row.rawValue),
          ];
        } else {
          row.flags = domainFlags(indicatorId, null);
        }
      }

      const outliers = rows.filter((r) =>
        r.flags.some((f) => f.kind !== "missing"),
      );
      const missing = rows.filter((r) =>
        r.flags.some((f) => f.kind === "missing"),
      );
      totalOutliers += outliers.length;

      const sorted = [...cohortValues].sort((a, b) => a - b);
      const stats =
        sorted.length > 0
          ? `n=${sorted.length} min=${sorted[0]!.toFixed(1)} P50=${percentile(sorted, 50).toFixed(1)} max=${sorted[sorted.length - 1]!.toFixed(1)}`
          : "n=0";

      console.log(
        `\n  [${label}] ${yearLabel} · ${stats} · 이상치 ${outliers.length}건 · 결측 ${missing.length}건`,
      );

      if (outliers.length) {
        const show = outliers
          .sort((a, b) => (b.rawValue ?? 0) - (a.rawValue ?? 0))
          .slice(0, 8);
        for (const o of show) {
          console.log(
            `    ⚠ ${o.schoolName} (${o.schoolCodeStd}): 원값=${o.rawValue ?? "—"} 지수=${o.indexScore ?? "—"} | ${o.flags.map((f) => f.message).join("; ")}`,
          );
        }
        if (outliers.length > 8) {
          console.log(`    … 외 ${outliers.length - 8}건`);
        }
      }

      // Representative samples: top/bottom/median-ish + random from middle
      const withValue = rows.filter((r) => r.rawValue != null);
      withValue.sort((a, b) => (a.rawValue ?? 0) - (b.rawValue ?? 0));

      const pickSet = new Set<string>();
      const picks: SampleRow[] = [];
      function addPick(row: SampleRow | undefined) {
        if (!row || pickSet.has(row.schoolCodeStd)) return;
        pickSet.add(row.schoolCodeStd);
        picks.push(row);
      }

      if (withValue.length) {
        addPick(withValue[0]);
        addPick(withValue[Math.floor(withValue.length / 2)]);
        addPick(withValue[withValue.length - 1]);
        addPick(outliers[0]);
        addPick(outliers[outliers.length - 1]);
        for (const row of withValue) {
          if (picks.length >= SAMPLE_PER_KIND) break;
          addPick(row);
        }
      }

      if (picks.length) {
        console.log(`    샘플 ${Math.min(picks.length, SAMPLE_PER_KIND)}교:`);
        for (const s of picks.slice(0, SAMPLE_PER_KIND)) {
          const flagNote =
            s.flags.length && s.flags[0]!.kind !== "missing"
              ? ` · ${s.flags.map((f) => f.message).join(", ")}`
              : "";
          console.log(
            `      · ${s.schoolName} | 원값=${s.rawValue?.toFixed(1) ?? "—"} 지수=${s.indexScore?.toFixed(1) ?? "—"} 종합=${s.compositeIndex?.toFixed(1) ?? "—"}(${s.compositeRank || "—"}위)${flagNote}`,
          );
        }
      }

      allSamples.push(...picks.slice(0, SAMPLE_PER_KIND));
    }
  }

  return { samples: allSamples, outlierCount: totalOutliers };
}

async function main() {
  const years = parseYears();
  console.log(`감사 대상 분석연도: ${years.join(", ")}`);

  let grandOutliers = 0;
  const summary: { year: number; outliers: number }[] = [];

  for (const year of years) {
    const { outlierCount } = await auditYear(year);
    summary.push({ year, outliers: outlierCount });
    grandOutliers += outlierCount;
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("=== 이상치 요약 (IQR·도메인 규칙) ===");
  for (const s of summary) {
    console.log(`${s.year}년: ${s.outliers}건`);
  }
  console.log(`\n총 이상치 플래그: ${grandOutliers}건`);
  console.log(
    "\n※ IQR 이상치 = 동종(대학/전문대) 분포 대비 통계적 극단값 (오류 아닐 수 있음)",
  );
  console.log(
    "※ 도메인 이상치 = 음수·100% 초과 등 명백히 비정상 범위 (우선 확인 필요)",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
