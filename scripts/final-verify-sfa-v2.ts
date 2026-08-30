/**
 * 최종: run.json 커버리지 + 프로덕션 HTML 전 표 셀 대조
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { isStudentFillPublicEstb } from "../src/lib/analysis/student-fill-analysis/cohort-rules";
import type { StudentFillEdition, StudentFillSchoolRow } from "../src/lib/analysis/student-fill-analysis/types";

const YEARS = [2022, 2023, 2024, 2025, 2026] as const;
const ZONES = ["수도권", "충청권", "서남권", "동남권", "대경권", "강원권", "전북권", "제주권"] as const;
const r1 = (n: number | null) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10) / 10);
const fmt = (n: number | null) => (n == null || !Number.isFinite(n) ? "—" : n.toFixed(1));
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

function mean(rows: StudentFillSchoolRow[], pick: (r: StudentFillSchoolRow) => number | null) {
  const vals = rows.map(pick).filter((n): n is number => n != null && Number.isFinite(n));
  if (!vals.length) return null;
  return r1(vals.reduce((a, b) => a + b, 0) / vals.length);
}
function median(rows: StudentFillSchoolRow[], pick: (r: StudentFillSchoolRow) => number | null) {
  const vals = rows.map(pick).filter((n): n is number => n != null && Number.isFinite(n)).sort((a, b) => a - b);
  if (!vals.length) return null;
  const mid = Math.floor(vals.length / 2);
  return r1(vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2);
}
function sum(rows: StudentFillSchoolRow[], pick: (r: StudentFillSchoolRow) => number | null) {
  return rows.reduce((a, r) => a + (pick(r) ?? 0), 0);
}
function pub(r: StudentFillSchoolRow) {
  return isStudentFillPublicEstb(r.estb) ? "국공립" : "사립";
}
function g4(r: StudentFillSchoolRow) {
  return `${pub(r)} ${r.schoolDivision === "전문대학" ? "전문대학" : "대학"}`;
}

function parseTable(html: string, fig: string) {
  const figIdx = html.indexOf(`<div class="fig">${fig}`);
  if (figIdx < 0) return null;
  const tbodyStart = html.indexOf("<tbody>", figIdx);
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  const body = html.slice(tbodyStart, tbodyEnd);
  return [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) =>
    [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").trim()),
  );
}

function eq(a: string, b: string) {
  const na = a.replace(/,/g, "").replace("−", "-");
  const nb = b.replace(/,/g, "").replace("−", "-");
  if (na === nb) return true;
  const fa = Number(na);
  const fb = Number(nb);
  return Number.isFinite(fa) && Number.isFinite(fb) && Math.abs(fa - fb) < 0.05;
}

async function load(year: number) {
  return JSON.parse(
    await readFile(path.join(process.cwd(), `data/json/student-fill-analysis/${year}/run.json`), "utf8"),
  ) as StudentFillEdition;
}

async function main() {
  const editions = new Map<number, StudentFillEdition>();
  for (const y of YEARS) editions.set(y, await load(y));
  const by = (y: number) => editions.get(y)!.schools;
  const s22 = by(2022);
  const s26 = by(2026);
  const html = await readFile(path.join(process.cwd(), "public/reports/sfa-gemini-comprehensive.html"), "utf8");

  const fails: string[] = [];
  const ok = (cond: boolean, msg: string) => {
    console.log(`${cond ? "OK  " : "FAIL"} ${msg}`);
    if (!cond) fails.push(msg);
  };

  console.log("=== A. run.json 필드 커버리지 ===");
  const keys = [
    "rateIn",
    "rateAll",
    "outShare",
    "freshmanDropoutRate",
    "enrolledFillRate",
    "enrolledFillRateIn",
    "dropoutRate",
    "foreignTotal",
    "foreignShare",
    "langAbilityRate",
    "foreignDropRate",
    "leaveShare",
  ] as const;
  for (const y of YEARS) {
    const s = by(y);
    const row: Record<string, string> = { year: String(y), n: String(s.length) };
    for (const k of keys) {
      const nn = s.filter((r) => r[k] != null).length;
      row[k] = `${nn}/${s.length}`;
      if (k === "rateIn" || k === "enrolledFillRate") {
        ok(nn === s.length, `${y} ${k} ${nn}/${s.length}`);
      }
    }
    const dropNn = s.filter((r) => r.dropoutRate != null).length;
    const forNn = s.filter((r) => r.foreignTotal != null).length;
    const frNn = s.filter((r) => r.freshmanDropoutRate != null).length;
    ok(dropNn >= s.length * 0.9, `${y} dropoutRate ${dropNn}/${s.length}`);
    ok(frNn >= s.length * 0.9, `${y} freshmanDropout ${frNn}/${s.length}`);
    ok(forNn >= s.length * 0.85, `${y} foreignTotal ${forNn}/${s.length}`);
    console.log("   ", row);
  }

  console.log("\n=== B. 표 전수 대조 ===");
  const m = (y: number, p: (r: StudentFillSchoolRow) => number | null) => mean(by(y), p);

  const t11 = parseTable(html, "표 1-1.");
  ok(!!t11 && t11.length === 5, `표1-1 행 ${t11?.length}`);
  ok(t11![4][5] === "313", `표1-1 2026합계 ${t11?.[4][5]}`);
  ok(t11![4][1] === "321", `표1-1 2022합계 ${t11?.[4][1]}`);
  ok(Number(t11![0][5]) === s26.filter((r) => g4(r) === "국공립 대학").length, "표1-1 국대26");

  const t31 = parseTable(html, "표 3-1.");
  ok(t31![0][5] === fmt(m(2026, (r) => r.rateIn)), `표3-1 정원내26 ${t31?.[0][5]} vs ${fmt(m(2026, (r) => r.rateIn))}`);
  ok(t31![1][5] === fmt(median(s26, (r) => r.rateIn)), `표3-1 중앙26`);
  ok(t31![2][5] === fmt(m(2026, (r) => r.rateAll)), `표3-1 내외26`);
  ok(t31![4][5] === fmt(m(2026, (r) => r.outShare)), `표3-1 외비중26`);
  ok(t31![5][5] === fmt(m(2026, (r) => r.freshmanDropoutRate)), `표3-1 신입탈락26`);
  ok(t31![0][1] === fmt(m(2022, (r) => r.rateIn)), `표3-1 정원내22`);

  const top = (
    pick: (r: StudentFillSchoolRow) => number | null,
  ) =>
    s26
      .map((r) => ({ r, v: pick(r) }))
      .filter((x): x is { r: StudentFillSchoolRow; v: number } => x.v != null)
      .sort((a, b) => b.v - a.v)
      .slice(0, 10);

  const t31b = parseTable(html, "표 3-1b.");
  const e31b = top((r) => (r.rateIn != null && r.rateAll != null ? r.rateIn - r.rateAll : null));
  ok(t31b?.length === 10, "표3-1b 10행");
  for (let i = 0; i < 10; i++) {
    ok(t31b![i][1] === e31b[i].r.schoolName, `표3-1b ${i + 1} ${t31b![i][1]}`);
    ok(eq(t31b![i][7], fmt(e31b[i].r.rateIn)), `표3-1b ${i + 1} 정원내`);
  }

  const t32 = parseTable(html, "표 3-2.");
  ok(t32?.length === 8, "표3-2 8권역");
  for (let i = 0; i < 8; i++) {
    const z = ZONES[i];
    const v = mean(s26.filter((r) => r.zone === z), (r) => r.rateIn);
    ok(t32![i][0] === z, `표3-2 권역명 ${t32![i][0]}`);
    ok(eq(t32![i][2], fmt(v)), `표3-2 ${z} 내26 ${t32![i][2]} vs ${fmt(v)}`);
  }

  const t32b = parseTable(html, "표 3-2b.");
  const e32b = top((r) => r.outShare);
  ok(t32b?.length === 10, "표3-2b 10행");
  for (let i = 0; i < 10; i++) ok(t32b![i][1] === e32b[i].r.schoolName && eq(t32b![i][7], fmt(e32b[i].r.outShare)), `표3-2b ${i + 1}`);

  const t33 = parseTable(html, "표 3-3.");
  const groups = ["국공립 대학", "국공립 전문대학", "사립 대학", "사립 전문대학"] as const;
  ok(t33?.length === 4, "표3-3 4행");
  groups.forEach((g, i) => {
    const v = mean(s26.filter((r) => g4(r) === g), (r) => r.freshmanDropoutRate);
    ok(eq(t33![i][2], fmt(v)), `표3-3 ${g} 26 ${t33![i][2]} vs ${fmt(v)}`);
  });

  const t34 = parseTable(html, "표 3-4.");
  const e34 = top((r) => r.freshmanDropoutRate);
  ok(t34?.length === 10, "표3-4 10행");
  for (let i = 0; i < 10; i++) ok(t34![i][1] === e34[i].r.schoolName && eq(t34![i][7], fmt(e34[i].r.freshmanDropoutRate)), `표3-4 ${i + 1}`);

  const t41 = parseTable(html, "표 4-1.");
  ok(t41?.length === 8, "표4-1 8권역");
  for (let i = 0; i < 8; i++) {
    const z = ZONES[i];
    const v = mean(s26.filter((r) => r.zone === z), (r) => r.enrolledFillRate);
    ok(eq(t41![i][4], fmt(v)), `표4-1 ${z} 재충원26`);
  }

  const t41b = parseTable(html, "표 4-1b.");
  const e41b = top((r) =>
    r.enrolledFillRate != null && r.enrolledFillRateIn != null ? r.enrolledFillRate - r.enrolledFillRateIn : null,
  );
  ok(t41b?.length === 10, "표4-1b 10행");
  for (let i = 0; i < 10; i++) ok(t41b![i][1] === e41b[i].r.schoolName, `표4-1b ${i + 1} ${t41b![i][1]}`);

  const t42 = parseTable(html, "표 4-2.");
  const e42 = top((r) => (r.leaveShare != null && r.deferShare != null ? r.leaveShare + r.deferShare : r.leaveShare));
  ok(t42?.length === 10, "표4-2 10행");
  for (let i = 0; i < 10; i++) ok(t42![i][1] === e42[i].r.schoolName, `표4-2 ${i + 1}`);

  const t43 = parseTable(html, "표 4-3.");
  ok(t43?.length === 3, "표4-3 3규모");
  (["대규모", "중규모", "소규모"] as const).forEach((sc, i) => {
    const v = mean(s26.filter((r) => (r.scale ?? "소규모") === sc), (r) => r.enrolledFillRateIn);
    ok(eq(t43![i][2], fmt(v)), `표4-3 ${sc} 정원내26`);
  });

  const t44 = parseTable(html, "표 4-4.");
  const e44 = top((r) => r.dropoutRate);
  ok(t44?.length === 10, "표4-4 10행");
  for (let i = 0; i < 10; i++) ok(t44![i][1] === e44[i].r.schoolName && eq(t44![i][7], fmt(e44[i].r.dropoutRate)), `표4-4 ${i + 1}`);

  const t51 = parseTable(html, "표 5-1.");
  ok(eq(t51![0][5], fmtInt(sum(s26, (r) => r.foreignTotal))), `표5-1 외인26 ${t51?.[0][5]}`);
  ok(eq(t51![0][1], fmtInt(sum(s22, (r) => r.foreignTotal))), `표5-1 외인22 ${t51?.[0][1]}`);
  ok(t51![2][5] === fmt(m(2026, (r) => r.foreignShare)), `표5-1 비중26`);
  ok(t51![3][5] === fmt(m(2026, (r) => r.langAbilityRate)), `표5-1 언어26`);
  ok(t51![4][5] === fmt(m(2026, (r) => r.foreignDropRate)), `표5-1 외탈26`);
  ok(t51![6][5] === fmt(m(2026, (r) => r.dropoutRate)), `표5-1 중탈26`);

  const t51b = parseTable(html, "표 5-1b.");
  ok(t51b?.length === 4, "표5-1b 4행");
  groups.forEach((g, i) => {
    const n = sum(s26.filter((r) => g4(r) === g), (r) => r.foreignTotal);
    ok(eq(t51b![i][2], fmtInt(n)), `표5-1b ${g} 인원26`);
  });

  const t51c = parseTable(html, "표 5-1c.");
  ok(t51c?.length === 8, "표5-1c 8행");
  ZONES.forEach((z, i) => {
    const n = sum(s26.filter((r) => r.zone === z), (r) => r.foreignTotal);
    ok(eq(t51c![i][1], fmtInt(n)), `표5-1c ${z} 인원`);
  });

  const t52 = parseTable(html, "표 5-2.");
  const e52 = top((r) => r.foreignShare);
  ok(t52?.length === 10, "표5-2 10행");
  for (let i = 0; i < 10; i++) ok(t52![i][1] === e52[i].r.schoolName && eq(t52![i][8], fmt(e52[i].r.foreignShare)), `표5-2 ${i + 1}`);

  const t53 = parseTable(html, "표 5-3.");
  const e53 = top((r) => r.foreignDropRate);
  ok(t53?.length === 10, "표5-3 10행");
  for (let i = 0; i < 10; i++) ok(t53![i][1] === e53[i].r.schoolName && eq(t53![i][9], fmt(e53[i].r.foreignDropRate)), `표5-3 ${i + 1}`);

  const t61 = parseTable(html, "표 6-1.");
  ok(t61![0][2] === fmt(m(2026, (r) => r.rateIn)), "표6-1 정원내26");
  ok(t61![5][2] === fmt(m(2026, (r) => r.enrolledFillRate)), "표6-1 재충원26");
  ok(t61![7][2] === fmt(m(2026, (r) => r.foreignShare)), "표6-1 외비중26");

  const t62 = parseTable(html, "표 6-2.");
  ok(!!t62 && t62.length >= 8, `표6-2 행 ${t62?.length}`);
  const seoul = mean(s26.filter((r) => r.region === "서울" || r.region.startsWith("서울")), (r) => r.rateIn);
  ok(eq(t62![0][2], fmt(seoul)), `표6-2 서울26 ${t62?.[0][2]} vs ${fmt(seoul)}`);

  const t51e = parseTable(html, "표 5-1e.");
  ok(!!t51e && t51e.length === 9, `표5-1e 9행(17시도) ${t51e?.length}`);
  const t51f = parseTable(html, "표 5-1f.");
  ok(!!t51f && t51f.length === 4, `표5-1f ${t51f?.length}`);
  const t51g = parseTable(html, "표 5-1g.");
  ok(!!t51g && t51g.length === 4, `표5-1g ${t51g?.length}`);
  const t71 = parseTable(html, "표 7-1.");
  const t72 = parseTable(html, "표 7-2.");
  ok(t71?.length === 4, "표7-1 4유형");
  ok(t72?.length === 8, "표7-2 8권역");

  console.log("\n=== C. 표지·본문 잔여 시안 숫자 ===");
  ok(html.includes("321 → 313교"), `표지 학교수 ${html.includes("321 → 313교")}`);
  ok(html.includes("89.0% → 95.4%"), "표지 정원내");
  ok(!html.includes("327교"), "본문 327교 잔존");
  ok(!html.includes("142,000"), "본문 142000 잔존");
  ok(!/\b76\.1\b/.test(html), "본문 76.1 잔존");

  const stale = [
    ["327교", (html.match(/327교/g) ?? []).length],
    ["14교", (html.match(/14교/g) ?? []).length],
    ["89.4", (html.match(/89\.4/g) ?? []).length],
    ["95.5%", (html.match(/95\.5%/g) ?? []).length],
    ["76.1", (html.match(/76\.1/g) ?? []).length],
    ["46.2", (html.match(/46\.2/g) ?? []).length],
    ["142,000", (html.match(/142,000/g) ?? []).length],
  ] as const;
  for (const [k, n] of stale) {
    console.log(`   leftover ${k}: ${n}`);
    if (n > 0 && (k === "327교" || k === "142,000" || k === "76.1")) ok(false, `잔여 ${k} ${n}건`);
  }

  const missFigs = [
    "표 1-1", "표 3-1.", "표 3-1b", "표 3-2.", "표 3-2b", "표 3-3", "표 3-4",
    "표 4-1.", "표 4-1b", "표 4-2", "표 4-3", "표 4-4",
    "표 5-1.", "표 5-1b", "표 5-1c", "표 5-1d", "표 5-1e", "표 5-1f", "표 5-1g", "표 5-2", "표 5-3",
    "표 6-1", "표 6-2", "표 7-1", "표 7-2",
  ];
  for (const f of missFigs) ok(html.includes(`<div class="fig">${f}`), `캡션 ${f}`);

  console.log(`\nFAILS ${fails.length}`);
  if (fails.length) {
    console.log(fails.join("\n"));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
