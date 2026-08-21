/** 다캠퍼스 본교통합 상세 샘플 출력 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readCsvFile } from "../src/lib/csv/read.ts";
import {
  FUND_SECURE_MAIN_CAMPUS_SPEC,
  rollupRowsToMainCampus,
} from "../src/lib/ingest/main-campus-rollup.ts";
import {
  buildSchoolCampusIndex,
  padSchoolCode,
} from "../src/lib/ingest/school-code-campus-index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, ".."));

const year = Number(process.argv.find((a) => a.startsWith("--year="))?.split("=")[1] ?? 2025);

async function main() {
  const fundSecureRaw = await readCsvFile("financeAnalysisFundSecureRate");
  const schoolCodeRows = await readCsvFile("financeAnalysisSchoolCode");
  const campusIndex = buildSchoolCampusIndex(schoolCodeRows);

  const yearRows = fundSecureRaw.filter((r) => Number(r.year) === year);
  const rolled = rollupRowsToMainCampus(
    yearRows,
    campusIndex,
    FUND_SECURE_MAIN_CAMPUS_SPEC,
  );

  console.log(`\n=== ${year}년 자금확보율 다캠퍼스 본교통합 샘플 ===\n`);

  let shown = 0;
  for (const row of rolled) {
    const std = padSchoolCode(row.school_code_std ?? "");
    const campusRows = yearRows.filter((raw) => {
      const campus =
        campusIndex.resolve(year, raw.school_code_std ?? "", raw.school_name ?? "") ??
        null;
      const rep = campus?.schoolRepCode ?? padSchoolCode(raw.school_code_std ?? "");
      return rep === std || padSchoolCode(raw.school_code_std ?? "") === std;
    });
    if (campusRows.length < 2) continue;

    shown += 1;
    console.log(`[${shown}] ${row.school_name} (${std}) — 캠퍼스 ${campusRows.length}개`);
    let sumFunds = 0;
    let sumTuition = 0;
    for (const c of campusRows) {
      const campus =
        campusIndex.resolve(year, c.school_code_std ?? "", c.school_name ?? "") ??
        null;
      const branch = campus?.mainBranchName ?? "—";
      const carry = Number(c.school_funds_carryover ?? 0);
      const endow = Number(c.school_funds_endowment ?? 0);
      const indC = Number(c.industry_carryover ?? 0);
      const indE = Number(c.industry_endowment ?? 0);
      const tuition = Number(c.tuition_revenue ?? 0);
      const funds = carry + endow + indC + indE;
      sumFunds += funds;
      sumTuition += tuition;
      console.log(
        `  · ${c.school_name} [${branch}] code=${c.school_code_std} 자금=${funds.toLocaleString()} 등록금=${tuition.toLocaleString()}`,
      );
    }
    const manual =
      sumTuition > 0 ? Math.round((sumFunds / sumTuition) * 1000) / 10 : 0;
    console.log(
      `  → 합산: 자금=${sumFunds.toLocaleString()} / 등록금=${sumTuition.toLocaleString()} = ${manual}%`,
    );
    console.log(`  → rollup 결과: ${row.fund_secure_rate}% (일치: ${manual === Number(row.fund_secure_rate)})\n`);
    if (shown >= 5) break;
  }

  if (!shown) console.log("다캠퍼스 학교 없음");
}

main().catch(console.error);
