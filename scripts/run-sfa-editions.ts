/**
 * 학생충원분석 실행 (본교 합산 + aux 조인) 후 run.json 저장
 * Usage: npx tsx scripts/run-sfa-editions.ts [2022-2026]
 */
import { computeStudentFillEdition } from "../src/lib/analysis/student-fill-analysis/compute-run";
import { writeStudentFillEdition } from "../src/lib/analysis/student-fill-analysis/store";
import { isStudentFillPublicEstb } from "../src/lib/analysis/student-fill-analysis/cohort-rules";

const years = process.argv.slice(2).map(Number).filter((y) => y >= 2000);
const YEARS = years.length ? years : [2022, 2023, 2024, 2025, 2026];

function nz(rows: { [k: string]: unknown }[], key: string) {
  return rows.filter((r) => r[key] != null && r[key] !== 0).length;
}

async function main() {
  for (const year of YEARS) {
    console.log(`\n=== compute ${year} ===`);
    const t0 = Date.now();
    const edition = await computeStudentFillEdition(year);
    await writeStudentFillEdition(edition);
    const s = edition.schools;
    const pubUni = s.filter((r) => isStudentFillPublicEstb(r.estb) && r.schoolDivision === "대학").length;
    const pubJc = s.filter((r) => isStudentFillPublicEstb(r.estb) && r.schoolDivision === "전문대학").length;
    const priUni = s.filter((r) => !isStudentFillPublicEstb(r.estb) && r.schoolDivision === "대학").length;
    const priJc = s.filter((r) => !isStudentFillPublicEstb(r.estb) && r.schoolDivision === "전문대학").length;
    console.log(
      JSON.stringify({
        year,
        ms: Date.now() - t0,
        n: s.length,
        pubUni,
        pubJc,
        priUni,
        priJc,
        foreignTotal_nn: s.filter((r) => r.foreignTotal != null).length,
        foreignShare_nn: s.filter((r) => r.foreignShare != null).length,
        frDrop_nn: s.filter((r) => r.freshmanDropoutRate != null).length,
        drop_nn: s.filter((r) => r.dropoutRate != null).length,
        lang_nn: s.filter((r) => r.langAbilityRate != null).length,
        foreignSum: s.reduce((a, r) => a + (r.foreignTotal ?? 0), 0),
        lastRunAt: edition.lastRunAt,
      }),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
