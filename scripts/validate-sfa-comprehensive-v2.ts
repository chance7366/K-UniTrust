/**
 * 종합보고서 v2 숫자 vs 학생충원분석 run.json(본교) 대조
 * Usage: npx tsx scripts/validate-sfa-comprehensive-v2.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { aggregateStudentFillCohort } from "../src/lib/analysis/student-fill-analysis/aggregate-cohort";
import type { StudentFillEdition, StudentFillSchoolRow } from "../src/lib/analysis/student-fill-analysis/types";

const YEARS = [2022, 2023, 2024, 2025, 2026] as const;

function mean(rows: StudentFillSchoolRow[], pick: (r: StudentFillSchoolRow) => number | null): number | null {
  const vals = rows.map(pick).filter((n): n is number => n != null && Number.isFinite(n));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function median(rows: StudentFillSchoolRow[], pick: (r: StudentFillSchoolRow) => number | null): number | null {
  const vals = rows
    .map(pick)
    .filter((n): n is number => n != null && Number.isFinite(n))
    .sort((a, b) => a - b);
  if (!vals.length) return null;
  const mid = Math.floor(vals.length / 2);
  const v = vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  return Math.round(v * 10) / 10;
}

function isPublic(estb: string) {
  return /국립|공립|국립대법인|특별법/.test(estb);
}

function estbKind(row: StudentFillSchoolRow) {
  const pub = isPublic(row.estb) ? "국공립" : "사립";
  const kind = row.schoolDivision === "전문대학" ? "전문대학" : "대학";
  return `${pub} ${kind}`;
}

function top10(
  rows: StudentFillSchoolRow[],
  score: (r: StudentFillSchoolRow) => number | null,
  desc = true,
) {
  return rows
    .map((r) => ({ name: r.schoolName, v: score(r) }))
    .filter((x): x is { name: string; v: number } => x.v != null && Number.isFinite(x.v))
    .sort((a, b) => (desc ? b.v - a.v : a.v - b.v))
    .slice(0, 10);
}

function cmp(label: string, reported: number, actual: number | null, tol = 0.6) {
  if (actual == null) {
    console.log(`  FAIL  ${label}: report=${reported} actual=null`);
    return false;
  }
  const ok = Math.abs(reported - actual) <= tol;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${label}: report=${reported} actual=${actual}`);
  return ok;
}

function cmpInt(label: string, reported: number, actual: number, tol = 2) {
  const ok = Math.abs(reported - actual) <= tol;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${label}: report=${reported} actual=${actual}`);
  return ok;
}

async function load(year: number): Promise<StudentFillEdition> {
  const raw = await readFile(
    path.join(process.cwd(), "data/json/student-fill-analysis", String(year), "run.json"),
    "utf8",
  );
  return JSON.parse(raw) as StudentFillEdition;
}

async function main() {
  const editions = new Map<number, StudentFillEdition>();
  for (const y of YEARS) editions.set(y, await load(y));

  let fails = 0;
  const check = (ok: boolean) => {
    if (!ok) fails += 1;
  };

  console.log("=== 학교수 (표 1-1) ===");
  const counts: Record<number, Record<string, number>> = {};
  for (const y of YEARS) {
    const schools = editions.get(y)!.schools;
    const bag: Record<string, number> = {
      "국공립 대학": 0,
      "국공립 전문대학": 0,
      "사립 대학": 0,
      "사립 전문대학": 0,
    };
    for (const r of schools) {
      const k = estbKind(r);
      if (k === "국공립 대학") bag["국공립 대학"] += 1;
      else if (k === "국공립 전문대학") bag["국공립 전문대학"] += 1;
      else if (k === "사립 대학") bag["사립 대학"] += 1;
      else bag["사립 전문대학"] += 1;
    }
    counts[y] = bag;
    console.log(
      `  ${y} n=${schools.length} 국대=${bag["국공립 대학"]} 국전=${bag["국공립 전문대학"]} 사대=${bag["사립 대학"]} 사전=${bag["사립 전문대학"]}`,
    );
  }
  check(cmpInt("2022 본교합계", 327, editions.get(2022)!.schools.length));
  check(cmpInt("2026 본교합계", 313, editions.get(2026)!.schools.length));
  check(cmpInt("2026 국공립 대학", 40, counts[2026]["국공립 대학"]));
  check(cmpInt("2026 국공립 전문", 4, counts[2026]["국공립 전문대학"]));
  check(cmpInt("2026 사립 대학", 149, counts[2026]["사립 대학"]));
  check(cmpInt("2026 사립 전문", 120, counts[2026]["사립 전문대학"]));
  check(cmpInt("2022 국공립 대학", 43, counts[2022]["국공립 대학"]));
  check(cmpInt("2022 국공립 전문", 8, counts[2022]["국공립 전문대학"]));

  console.log("\n=== 가중 합산 (분자÷분모) vs 보고서 합계·율 ===");
  const snap: Record<number, ReturnType<typeof aggregateStudentFillCohort>> = {};
  for (const y of YEARS) {
    snap[y] = aggregateStudentFillCohort(editions.get(y)!.schools, y);
    console.log(
      `  ${y} recIn=${snap[y].recruitWithin} admIn=${snap[y].admitWithin} recOut=${snap[y].recruitOutside} rateIn=${snap[y].rateIn} rateAll=${snap[y].rateAll} outShare=${snap[y].outShare} frDrop=${snap[y].freshmanDropoutRate} enrIn=${snap[y].enrolledFillRateIn} enr=${snap[y].enrolledFillRate} drop=${snap[y].dropoutRate} forN=${snap[y].foreignTotal} forSh=${snap[y].foreignShare} lang=${snap[y].langAbilityRate} fDrop=${snap[y].foreignDropRate} leave=${snap[y].leaveCount}`,
    );
  }

  console.log("\n--- 합계(본문) ---");
  check(cmpInt("2026 정원내모집", 444608, snap[2026].recruitWithin, 50));
  check(cmpInt("2022 정원내모집", 458000, snap[2022].recruitWithin, 2000));
  check(cmpInt("2026 정원외모집", 126327, snap[2026].recruitOutside, 50));
  check(cmpInt("2022 정원외모집", 108000, snap[2022].recruitOutside, 2000));
  check(cmpInt("2026 외국인총원", 234975, snap[2026].foreignTotal, 200));
  check(cmpInt("2022 외국인총원", 142000, snap[2022].foreignTotal, 3000));
  check(cmpInt("2026 휴학", 524793, snap[2026].leaveCount, 200));
  check(cmpInt("2022 휴학", 561000, snap[2022].leaveCount, 5000));

  console.log("\n--- 가중율 vs 표 3-1/6-1 (보고서는 '평균') ---");
  check(cmp("2026 정원내충원 가중", 95.5, snap[2026].rateIn, 1.5));
  check(cmp("2022 정원내충원 가중", 89.4, snap[2022].rateIn, 2));
  check(cmp("2026 정원내외 가중", 91.2, snap[2026].rateAll, 1.5));
  check(cmp("2026 정원외비중 가중(입학기준 outShare)", 18.5, snap[2026].outShare, 3));
  check(cmp("2026 신입탈락 가중", 10.3, snap[2026].freshmanDropoutRate, 1.5));
  check(cmp("2026 재학생충원 가중", 115.4, snap[2026].enrolledFillRate, 3));
  check(cmp("2026 재학생정원내 가중", 87.2, snap[2026].enrolledFillRateIn, 3));
  check(cmp("2026 중탈 가중", 7.8, snap[2026].dropoutRate, 1.5));
  check(cmp("2026 외비중 가중", 9.6, snap[2026].foreignShare, 1.5));
  check(cmp("2026 언어충족 가중", 39.7, snap[2026].langAbilityRate, 3));
  check(cmp("2026 외탈락 가중", 8.16, snap[2026].foreignDropRate, 2));

  console.log("\n--- 학교 단순평균·중앙값 (표 3-1이 평균이면 이쪽) ---");
  for (const y of [2022, 2026] as const) {
    const s = editions.get(y)!.schools;
    console.log(
      `  ${y} mean rateIn=${mean(s, (r) => r.rateIn)} med=${median(s, (r) => r.rateIn)} mean rateAll=${mean(s, (r) => r.rateAll)} mean outShare=${mean(s, (r) => r.outShare)} mean frDrop=${mean(s, (r) => r.freshmanDropoutRate)} mean enr=${mean(s, (r) => r.enrolledFillRate)} mean enrIn=${mean(s, (r) => r.enrolledFillRateIn)} mean drop=${mean(s, (r) => r.dropoutRate)} mean forSh=${mean(s, (r) => r.foreignShare)} mean lang=${mean(s, (r) => r.langAbilityRate)} mean fDrop=${mean(s, (r) => r.foreignDropRate)}`,
    );
  }
  const s26 = editions.get(2026)!.schools;
  const s22 = editions.get(2022)!.schools;
  check(cmp("2026 정원내 단순평균", 95.5, mean(s26, (r) => r.rateIn), 1.2));
  check(cmp("2026 정원내 중앙값", 99.9, median(s26, (r) => r.rateIn), 1.2));
  check(cmp("2022 정원내 단순평균", 89.4, mean(s22, (r) => r.rateIn), 2));
  check(cmp("2022 정원내 중앙값", 98.2, median(s22, (r) => r.rateIn), 2));
  check(cmp("2026 정원내외 단순평균", 91.2, mean(s26, (r) => r.rateAll), 1.5));
  check(cmp("2026 외비중 단순평균", 18.5, mean(s26, (r) => r.outShare), 2));
  check(cmp("2026 신입탈락 단순평균", 10.3, mean(s26, (r) => r.freshmanDropoutRate), 1.5));
  check(cmp("2026 재충원 단순평균", 115.4, mean(s26, (r) => r.enrolledFillRate), 4));
  check(cmp("2026 재정원내 단순평균", 87.2, mean(s26, (r) => r.enrolledFillRateIn), 3));
  check(cmp("2026 중탈 단순평균", 7.8, mean(s26, (r) => r.dropoutRate), 1.5));
  check(cmp("2026 외비중재적 단순평균", 9.6, mean(s26, (r) => r.foreignShare), 2));
  check(cmp("2026 언어 단순평균", 39.7, mean(s26, (r) => r.langAbilityRate), 3));
  check(cmp("2026 외탈락 단순평균", 8.16, mean(s26, (r) => r.foreignDropRate), 2));

  console.log("\n=== 2026 상위 10교 (보고서 명단 vs 본교 재계산) ===");
  const lists = {
    gapInAll: top10(s26, (r) =>
      r.rateIn != null && r.rateAll != null ? r.rateIn - r.rateAll : null,
    ),
    outShare: top10(s26, (r) => r.outShare),
    frDrop: top10(s26, (r) => r.freshmanDropoutRate),
    enrGap: top10(s26, (r) =>
      r.enrolledFillRate != null && r.enrolledFillRateIn != null
        ? r.enrolledFillRate - r.enrolledFillRateIn
        : null,
    ),
    leave: top10(s26, (r) =>
      r.leaveShare != null && r.deferShare != null ? r.leaveShare + r.deferShare : r.leaveShare,
    ),
    drop: top10(s26, (r) => r.dropoutRate),
    forShare: top10(s26, (r) => r.foreignShare),
    forDrop: top10(s26, (r) => r.foreignDropRate),
  };
  const reported = {
    "3-1b 격차": [
      "제주국제대학교",
    ],
    "3-2b 외비중": ["칼빈대학교"],
    "3-4 신입탈락": ["강원도립대학교"],
    "4-1b 재격차": ["서정대학교"],
    "4-2 휴학": ["한국방송통신대학교"],
    "4-4 중탈": ["송곡대학교"],
    "5-2 외비중": [
      "칼빈대학교",
      "대신대학교",
      "제주국제대학교",
      "대구예술대학교",
      "서울기독대학교",
      "서울장신대학교",
      "예원예술대학교",
      "서정대학교",
      "서울한영대학교",
      "신안산대학교",
    ],
    "5-3 외탈락": [
      "대구공업대학교",
      "경북전문대학교",
      "국립목포해양대학교",
      "강원도립대학교",
      "부산경상대학교",
      "중앙승가대학교",
      "협성대학교",
      "국립목포대학교",
      "인천가톨릭대학교",
      "명지전문대학",
    ],
  };
  console.log("  3-1b actual:", lists.gapInAll.map((x) => `${x.name}(${x.v})`).join(", "));
  console.log("  3-2b actual:", lists.outShare.map((x) => `${x.name}(${x.v})`).join(", "));
  console.log("  3-4  actual:", lists.frDrop.map((x) => `${x.name}(${x.v})`).join(", "));
  console.log("  4-1b actual:", lists.enrGap.map((x) => `${x.name}(${x.v})`).join(", "));
  console.log("  4-2  actual:", lists.leave.map((x) => `${x.name}(${x.v})`).join(", "));
  console.log("  4-4  actual:", lists.drop.map((x) => `${x.name}(${x.v})`).join(", "));
  console.log("  5-2  actual:", lists.forShare.map((x) => `${x.name}(${x.v})`).join(", "));
  console.log("  5-3  actual:", lists.forDrop.map((x) => `${x.name}(${x.v})`).join(", "));

  const overlap = (a: string[], b: { name: string }[]) => {
    const names = b.map((x) => x.name);
    const hit = a.filter((n) => names.includes(n)).length;
    return `${hit}/${a.length} overlap first=${names[0]}`;
  };
  console.log("  5-2 vs report:", overlap(reported["5-2 외비중"], lists.forShare));
  console.log("  5-3 vs report:", overlap(reported["5-3 외탈락"], lists.forDrop));
  check(lists.forShare[0]?.name === "칼빈대학교");
  check(lists.frDrop[0]?.name === "강원도립대학교");
  check(lists.leave[0]?.name === "한국방송통신대학교");
  check(lists.drop[0]?.name === "송곡대학교");
  check(lists.enrGap[0]?.name === "서정대학교");
  check(lists.outShare[0]?.name === "칼빈대학교");

  console.log("\n=== 권역 2026 정원내 단순평균 ===");
  const byZone = new Map<string, StudentFillSchoolRow[]>();
  for (const r of s26) {
    const z = r.zone ?? "미분류";
    if (!byZone.has(z)) byZone.set(z, []);
    byZone.get(z)!.push(r);
  }
  for (const [z, rows] of [...byZone.entries()].sort()) {
    console.log(`  ${z} n=${rows.length} rateIn=${mean(rows, (r) => r.rateIn)} enr=${mean(rows, (r) => r.enrolledFillRate)}`);
  }

  console.log(`\nFAIL count (loose checks): ${fails}`);
  if (fails > 8) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
