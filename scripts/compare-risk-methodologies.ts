/**
 * 위험군 산정 대안별 2026 edition 비교
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCompetitivenessIndicators } from "../src/lib/analysis/competitiveness-indicators.ts";
import {
  CORP_TRANSFER_RISK_PROFILE,
  INCOME_PROPERTY_PROPERTY_SECURE_RISK_PROFILE,
  isAdvancedChartHighRiskRate,
  isAdvancedChartRiskRate,
} from "../src/lib/analysis/advanced-chart-risk-profile.ts";
import { DIAGNOSTIC_GRADE_CUTOFFS } from "../src/lib/competitiveness-analysis/diagnostic-grade.ts";
import { runStep2Analysis } from "../src/lib/competitiveness-analysis/compute-step2.ts";
import { getEditionFull } from "../src/lib/competitiveness-analysis/editions-db.ts";
import { STEP1_INDICATOR_LABELS } from "../src/lib/competitiveness-analysis/step1-indicators.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

type Rule = {
  risk: (raw: number) => boolean;
  high: (raw: number) => boolean;
};

const ABSOLUTE_RULES: Record<string, Rule> = {
  "freshman-enrollment-rate": {
    risk: (r) => r < 100,
    high: (r) => r < 80,
  },
  "enrolled-enrollment-rate": {
    risk: (r) => r < 100,
    high: (r) => r < 80,
  },
  "dropout-rate": {
    risk: (r) => r >= 5,
    high: (r) => r >= 8,
  },
  "fund-secure-rate": {
    risk: (r) => r < 100,
    high: (r) => r < 80,
  },
  "financial-support-benefit-rate": {
    risk: (r) => r < 70,
    high: (r) => r < 50,
  },
  "tuition-dependency-rate": {
    risk: (r) => r >= 50,
    high: (r) => r >= 70,
  },
  "income-property-secure-rate": {
    risk: (r) =>
      isAdvancedChartRiskRate(r, INCOME_PROPERTY_PROPERTY_SECURE_RISK_PROFILE),
    high: (r) =>
      isAdvancedChartHighRiskRate(
        r,
        INCOME_PROPERTY_PROPERTY_SECURE_RISK_PROFILE,
      ),
  },
  "corp-transfer-ratio": {
    risk: (r) => isAdvancedChartRiskRate(r, CORP_TRANSFER_RISK_PROFILE),
    high: (r) => isAdvancedChartHighRiskRate(r, CORP_TRANSFER_RISK_PROFILE),
  },
};

function pct(n: number, d: number): string {
  return d ? `${((100 * n) / d).toFixed(1)}%` : "—";
}

async function main() {
  const indicators = getCompetitivenessIndicators();
  const edition = await getEditionFull(2026);
  if (!edition) throw new Error("2026 edition 없음");

  const step2 = await runStep2Analysis(edition.settings, indicators);
  const ids = Object.keys(STEP1_INDICATOR_LABELS);

  console.log("=== 2026 대상대학(272) · 산정 방법별 위험군 비교 ===\n");
  console.log(
    [
      "지표",
      "데이터",
      "지수<50",
      "지수<25",
      "절대 위험",
      "절대 고위험",
      "AND(<25+절대)",
      "AND(<25+절대)고",
    ].join("\t"),
  );

  for (const id of ids) {
    let data = 0;
    let idx50 = 0;
    let idx25 = 0;
    let absRisk = 0;
    let absHigh = 0;
    let dualRisk = 0;
    let dualHigh = 0;
    const rule = ABSOLUTE_RULES[id]!;

    for (const rawRow of step2.rawResults) {
      const rawCell = rawRow.indicators.find((c) => c.financeTabId === id);
      if (!rawCell?.found || rawCell.rawValue == null) continue;
      data++;

      const indexRow = step2.indexResults.find(
        (r) => r.schoolCodeStd === rawRow.schoolCodeStd,
      );
      const indexCell = indexRow?.indicators.find((c) => c.financeTabId === id);
      const score = indexCell?.indexScore ?? 0;
      const raw = rawCell.rawValue;

      if (score < 50) idx50++;
      if (score < 25) idx25++;
      if (rule.risk(raw)) absRisk++;
      if (rule.high(raw)) absHigh++;
      if (score < 25 && rule.risk(raw)) dualRisk++;
      if (score < 25 && rule.high(raw)) dualHigh++;
    }

    console.log(
      [
        STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS],
        data,
        `${idx50} (${pct(idx50, data)})`,
        `${idx25} (${pct(idx25, data)})`,
        `${absRisk} (${pct(absRisk, data)})`,
        `${absHigh} (${pct(absHigh, data)})`,
        `${dualRisk} (${pct(dualRisk, data)})`,
        `${dualHigh} (${pct(dualHigh, data)})`,
      ].join("\t"),
    );
  }

  // composite: 2+ indicators absolute risk
  let compositeRisk = 0;
  let compositeHigh = 0;
  const target = step2.rawResults.length;
  for (const rawRow of step2.rawResults) {
    let riskHits = 0;
    let highHits = 0;
    for (const id of ids) {
      const rawCell = rawRow.indicators.find((c) => c.financeTabId === id);
      if (!rawCell?.found || rawCell.rawValue == null) continue;
      const rule = ABSOLUTE_RULES[id]!;
      if (rule.risk(rawCell.rawValue)) riskHits++;
      if (rule.high(rawCell.rawValue)) highHits++;
    }
    if (riskHits >= 2) compositeRisk++;
    if (highHits >= 2) compositeHigh++;
  }

  console.log("\n--- 복합 ---");
  console.log(
    `절대기준 2개 이상 위험: ${compositeRisk}/${target} (${pct(compositeRisk, target)})`,
  );
  console.log(
    `절대기준 2개 이상 고위험: ${compositeHigh}/${target} (${pct(compositeHigh, target)})`,
  );

  // grade D/E from run results
  const grades = edition.results.runResults ?? [];
  const de = grades.filter(
    (r) => r.compositeIndex < DIAGNOSTIC_GRADE_CUTOFFS.D,
  ).length;
  console.log(`종합등급 E (<${DIAGNOSTIC_GRADE_CUTOFFS.D}): ${de}/${grades.length}`);

  // grade D+E
  let dGrade = 0;
  let eGrade = 0;
  for (const row of grades) {
    if (row.compositeIndex < DIAGNOSTIC_GRADE_CUTOFFS.D) eGrade++;
    else if (row.compositeIndex < DIAGNOSTIC_GRADE_CUTOFFS.C) dGrade++;
  }
  console.log(`종합등급 D: ${dGrade}, E: ${eGrade}, D+E: ${dGrade + eGrade}/${grades.length}`);

  // cohort bottom 15% / 7% by index
  console.log("\n--- 동종(4년제/전문대) 지수 하위 15% / 7% ---");
  for (const id of ids) {
    const byKind: Record<"uni" | "jc", number[]> = { uni: [], jc: [] };
    for (const row of step2.indexResults) {
      const cell = row.indicators.find((c) => c.financeTabId === id);
      if (cell?.indexScore == null) continue;
      const uni = edition.settings.targetUniversities.find(
        (u) => u.schoolCodeStd === row.schoolCodeStd,
      );
      if (!uni) continue;
      const bucket = uni.schoolKind.includes("전문") ? "jc" : "uni";
      byKind[bucket].push(cell.indexScore);
    }
    let risk = 0;
    let high = 0;
    let total = 0;
    for (const row of step2.indexResults) {
      const cell = row.indicators.find((c) => c.financeTabId === id);
      if (cell?.indexScore == null) continue;
      const uni = edition.settings.targetUniversities.find(
        (u) => u.schoolCodeStd === row.schoolCodeStd,
      );
      if (!uni) continue;
      total++;
      const bucket = uni.schoolKind.includes("전문") ? "jc" : "uni";
      const arr = [...byKind[bucket]].sort((a, b) => a - b);
      const p15 = arr[Math.floor(arr.length * 0.15)] ?? 0;
      const p7 = arr[Math.floor(arr.length * 0.07)] ?? 0;
      if (cell.indexScore <= p15) risk++;
      if (cell.indexScore <= p7) high++;
    }
    console.log(
      `${STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS]}: 위험(하위15%) ${risk}/${total}, 고위험(하위7%) ${high}/${total}`,
    );
  }
}

main().catch(console.error);
