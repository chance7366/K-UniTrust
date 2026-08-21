/** 재정지원수혜율 CSV — 등록금수입·수혜율 단위 마이그레이션 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = join(
  root,
  "data/csv/finance_analysis_financial_support_benefit_rate.csv",
);

function wonToEok(won) {
  return Math.round(Number(won) / 100_000_000);
}

function calcBenefitRate(totalSupportWon, tuitionEok) {
  const supportEok = wonToEok(totalSupportWon);
  if (supportEok <= 0 || tuitionEok <= 0) return 0;
  return Math.round((supportEok / tuitionEok) * 100 * 10) / 10;
}

const text = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const lines = text.trim().split(/\r?\n/);
const header = lines[0].split(",");
const idx = Object.fromEntries(header.map((h, i) => [h, i]));

const out = [lines[0]];
let updated = 0;

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(",");
  const totalSupport = cols[idx.total_support];
  let tuition = Number(cols[idx.tuition_revenue]);

  // 이전 저장값(천원÷1,000) → 억원(÷100,000) 변환
  if (tuition > 1000) {
    tuition = Math.round(tuition / 100);
    cols[idx.tuition_revenue] = String(tuition);
    updated += 1;
  }

  cols[idx.benefit_rate] = String(
    calcBenefitRate(totalSupport, Number(cols[idx.tuition_revenue])),
  );
  out.push(cols.join(","));
}

writeFileSync(csvPath, "\uFEFF" + out.join("\n"), "utf8");
console.log(`Migrated ${updated} tuition rows in ${csvPath}`);
