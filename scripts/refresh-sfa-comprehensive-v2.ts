/**
 * 분석실행 run.json → 종합보고서 v2 표·차트·표지 KPI 재생성 + 검증
 * Usage: npx tsx scripts/refresh-sfa-comprehensive-v2.ts
 */
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { isStudentFillPublicEstb } from "../src/lib/analysis/student-fill-analysis/cohort-rules";
import type { StudentFillEdition, StudentFillSchoolRow } from "../src/lib/analysis/student-fill-analysis/types";

const YEARS = [2022, 2023, 2024, 2025, 2026] as const;
const ZONES = ["수도권", "충청권", "서남권", "동남권", "대경권", "강원권", "전북권", "제주권"] as const;
const SIDOS = [
  "서울", "경기", "인천", "세종", "대전", "충남", "충북", "광주", "전남", "전북",
  "부산", "울산", "경남", "대구", "경북", "강원", "제주",
] as const;

const r1 = (n: number | null) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10) / 10);
const fmt = (n: number | null, digits = 1) =>
  n == null || !Number.isFinite(n) ? "—" : n.toFixed(digits);
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
const signed = (n: number | null) => {
  if (n == null || !Number.isFinite(n)) return "—";
  const v = Math.round(n * 10) / 10;
  const t = (v > 0 ? "+" : "") + v.toFixed(1);
  return t.replace("-", "−");
};

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
function dClass(delta: number | null, lowerIsBetter = false) {
  if (delta == null || delta === 0) return "";
  const good = lowerIsBetter ? delta < 0 : delta > 0;
  return good ? "up" : "down";
}
function tdDelta(delta: number | null, lowerIsBetter = false) {
  const cls = dClass(delta, lowerIsBetter);
  return `<td${cls ? ` class="${cls}"` : ""}>${signed(delta)}</td>`;
}

function estbLabel(r: StudentFillSchoolRow) {
  return isStudentFillPublicEstb(r.estb) ? "국공립" : "사립";
}
function kindLabel(r: StudentFillSchoolRow) {
  return r.schoolDivision === "전문대학" ? "전문" : "대학";
}
function kindLong(r: StudentFillSchoolRow) {
  return r.schoolDivision === "전문대학" ? "전문대학" : "대학";
}
function group4(r: StudentFillSchoolRow) {
  return `${estbLabel(r)} ${kindLong(r)}`;
}
function scaleShort(r: StudentFillSchoolRow) {
  if (r.scale === "대규모") return "대";
  if (r.scale === "중규모") return "중";
  return "소";
}
function zoneShort(z: string | null) {
  if (!z) return "—";
  return z.replace(/권$/, "");
}
function scaleOf(r: StudentFillSchoolRow) {
  return r.scale ?? "소규모";
}

function top10(
  rows: StudentFillSchoolRow[],
  score: (r: StudentFillSchoolRow) => number | null,
) {
  return rows
    .map((r) => ({ r, v: score(r) }))
    .filter((x): x is { r: StudentFillSchoolRow; v: number } => x.v != null && Number.isFinite(x.v))
    .sort((a, b) => b.v - a.v)
    .slice(0, 10);
}

function schRow(rank: number, r: StudentFillSchoolRow, extra: (string | number)[]) {
  const cells = [
    rank,
    r.schoolName,
    estbLabel(r),
    kindLabel(r),
    zoneShort(r.zone),
    r.region,
    scaleShort(r),
    ...extra,
  ];
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
}

function replaceTbody(html: string, figStart: string, rowsHtml: string) {
  const figIdx = html.indexOf(`<div class="fig">${figStart}`);
  if (figIdx < 0) throw new Error(`fig not found: ${figStart}`);
  const tableStart = html.indexOf("<table", figIdx);
  const tbodyStart = html.indexOf("<tbody>", tableStart);
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  if (tbodyStart < 0 || tbodyEnd < 0) throw new Error(`tbody not found: ${figStart}`);
  return (
    html.slice(0, tbodyStart + "<tbody>".length) +
    "\n          " +
    rowsHtml +
    "\n        " +
    html.slice(tbodyEnd)
  );
}

async function loadEdition(year: number): Promise<StudentFillEdition> {
  const raw = await readFile(
    path.join(process.cwd(), "data/json/student-fill-analysis", String(year), "run.json"),
    "utf8",
  );
  return JSON.parse(raw) as StudentFillEdition;
}

async function main() {
  const editions = new Map<number, StudentFillEdition>();
  for (const y of YEARS) editions.set(y, await loadEdition(y));
  const byYear = (y: number) => editions.get(y)!.schools;
  const s22 = byYear(2022);
  const s26 = byYear(2026);

  const counts = YEARS.map((y) => {
    const s = byYear(y);
    return {
      y,
      n: s.length,
      "국공립 대학": s.filter((r) => group4(r) === "국공립 대학").length,
      "국공립 전문대학": s.filter((r) => group4(r) === "국공립 전문대학").length,
      "사립 대학": s.filter((r) => group4(r) === "사립 대학").length,
      "사립 전문대학": s.filter((r) => group4(r) === "사립 전문대학").length,
    };
  });

  const m = (y: number, pick: (r: StudentFillSchoolRow) => number | null) => mean(byYear(y), pick);
  const med = (y: number, pick: (r: StudentFillSchoolRow) => number | null) => median(byYear(y), pick);

  const rateIn = YEARS.map((y) => m(y, (r) => r.rateIn));
  const rateInMed = YEARS.map((y) => med(y, (r) => r.rateIn));
  const rateAll = YEARS.map((y) => m(y, (r) => r.rateAll));
  const gapInAll = YEARS.map((_, i) =>
    rateIn[i] != null && rateAll[i] != null ? r1(rateIn[i]! - rateAll[i]!) : null,
  );
  const outShare = YEARS.map((y) => m(y, (r) => r.outShare));
  const frDrop = YEARS.map((y) => m(y, (r) => r.freshmanDropoutRate));
  const enr = YEARS.map((y) => m(y, (r) => r.enrolledFillRate));
  const enrIn = YEARS.map((y) => m(y, (r) => r.enrolledFillRateIn));
  const drop = YEARS.map((y) => m(y, (r) => r.dropoutRate));
  const forShare = YEARS.map((y) => m(y, (r) => r.foreignShare));
  const lang = YEARS.map((y) => m(y, (r) => r.langAbilityRate));
  const fDrop = YEARS.map((y) => m(y, (r) => r.foreignDropRate));
  const fDropAll = YEARS.map((y) => m(y, (r) => r.foreignDropAllRate));
  const foreignN = YEARS.map((y) => sum(byYear(y), (r) => r.foreignTotal));
  const recIn = YEARS.map((y) => sum(byYear(y), (r) => r.recruitWithin));
  const recOut = YEARS.map((y) => sum(byYear(y), (r) => r.recruitOutside));
  const quota = YEARS.map((y) => sum(byYear(y), (r) => r.studentQuota));

  const d5 = (arr: (number | null)[]) =>
    arr[0] != null && arr[4] != null ? r1(arr[4]! - arr[0]!) : null;

  let html = await readFile(
    path.join(process.cwd(), "public/mockups/sfa-comprehensive-report-v2.html"),
    "utf8",
  );

  const coverN22 = counts[0].n;
  const coverN26 = counts[4].n;
  html = html.replace(
    /<div>본교 대상교\(2026\)<b>[\s\S]*?<\/b><\/div>/,
    `<div>본교 대상교(2026)<b>${coverN26}교</b></div>`,
  );
  html = html.replace(
    /<div>5년 학교수 변화<b>[\s\S]*?<\/b><\/div>/,
    `<div>5년 학교수 변화<b>${coverN22} → ${coverN26}교 (${coverN26 - coverN22})</b></div>`,
  );
  html = html.replace(
    /<div>신입생 정원내충원율 평균<b>[\s\S]*?<\/b><\/div>/,
    `<div>신입생 정원내충원율 평균<b>${fmt(rateIn[0])}% → ${fmt(rateIn[4])}%</b></div>`,
  );
  html = html.replace(
    /<div>재학생 정원내충원율 평균<b>[\s\S]*?<\/b><\/div>/,
    `<div>재학생 정원내충원율 평균<b>${fmt(enrIn[0])}% → ${fmt(enrIn[4])}%</b></div>`,
  );
  html = html.replace(
    /<div>외국인 재적대비비중<b>[\s\S]*?<\/b><\/div>/,
    `<div>외국인 재적대비비중<b>${fmt(forShare[0])}% → ${fmt(forShare[4])}%</b></div>`,
  );
  html = html.replace(
    /<div>언어능력충족율 평균<b>[\s\S]*?<\/b><\/div>/,
    `<div>언어능력충족율 평균<b>${fmt(lang[0])}% → ${fmt(lang[4])}%</b></div>`,
  );
  html = html.replace(
    /발행: 2026년 8월 · K-UniTrust 학생충원분석<br \/>\s*출처:[\s\S]*?목업 시안<br \/>/,
    `발행: 2026년 8월 · K-UniTrust 학생충원분석<br />\n        출처: 대학알리미 · 분석실행 ${editions.get(2026)!.lastRunAt} · 분교·캠퍼스 본교 합산 후 율 재계산<br />`,
  );

  const countRows = ["국공립 대학", "국공립 전문대학", "사립 대학", "사립 전문대학"]
    .map((k) => {
      const vals = counts.map((c) => c[k as keyof (typeof counts)[0]] as number);
      const d = vals[4] - vals[0];
      return `<tr><td>${k}</td>${vals.map((v) => `<td>${v}</td>`).join("")}${tdDelta(d, true)}</tr>`;
    })
    .join("\n          ");
  const tot = counts.map((c) => c.n);
  html = replaceTbody(
    html,
    "표 1-1.",
    countRows +
      `\n          <tr><td><strong>본교 합계</strong></td>${tot.map((v, i) => `<td>${i === 0 || i === 4 ? `<strong>${v}</strong>` : v}</td>`).join("")}${tdDelta(tot[4] - tot[0], true).replace("<td", "<td><strong>").replace("</td>", "</strong></td>")}</tr>`,
  );

  html = replaceTbody(
    html,
    "표 3-1.",
    [
      ["정원내충원율 평균", rateIn, false],
      ["정원내충원율 중앙값", rateInMed, false],
      ["정원내외충원율 평균", rateAll, false],
      ["내−내외 격차", gapInAll, true],
      ["정원외비중 평균", outShare, true],
      ["신입생탈락율 평균", frDrop, true],
    ]
      .map(([label, arr, worse]) => {
        const a = arr as (number | null)[];
        return `<tr><td>${label}</td>${a.map((v) => `<td>${fmt(v)}</td>`).join("")}${tdDelta(d5(a), worse as boolean)}</tr>`;
      })
      .join("\n          "),
  );

  const t31b = top10(s26, (r) =>
    r.rateIn != null && r.rateAll != null ? r.rateIn - r.rateAll : null,
  );
  html = replaceTbody(
    html,
    "표 3-1b.",
    t31b
      .map(({ r, v }, i) =>
        schRow(i + 1, r, [fmt(r.rateIn), fmt(r.rateAll), signed(v)]),
      )
      .join("\n          "),
  );

  const zoneRows = (pick: (r: StudentFillSchoolRow) => number | null) =>
    ZONES.map((z) => ({
      z,
      v22: mean(s22.filter((r) => r.zone === z), pick),
      v26: mean(s26.filter((r) => r.zone === z), pick),
    }));

  html = replaceTbody(
    html,
    "표 3-2.",
    zoneRows((r) => r.rateIn)
      .map((a, i) => {
        const out = zoneRows((r) => r.outShare)[i];
        const dIn = a.v22 != null && a.v26 != null ? r1(a.v26 - a.v22) : null;
        const dOut = out.v22 != null && out.v26 != null ? r1(out.v26 - out.v22) : null;
        return `<tr><td>${a.z}</td><td>${fmt(a.v22)}</td><td>${fmt(a.v26)}</td>${tdDelta(dIn)}<td>${fmt(out.v22)}</td><td>${fmt(out.v26)}</td>${tdDelta(dOut, true)}</tr>`;
      })
      .join("\n          "),
  );

  const t32b = top10(s26, (r) => r.outShare);
  html = replaceTbody(
    html,
    "표 3-2b.",
    t32b.map(({ r }, i) => schRow(i + 1, r, [fmt(r.outShare), fmt(r.rateIn)])).join("\n          "),
  );

  const g4 = ["국공립 대학", "국공립 전문대학", "사립 대학", "사립 전문대학"] as const;
  html = replaceTbody(
    html,
    "표 3-3.",
    g4
      .map((g) => {
        const a = mean(s22.filter((r) => group4(r) === g), (r) => r.freshmanDropoutRate);
        const b = mean(s26.filter((r) => group4(r) === g), (r) => r.freshmanDropoutRate);
        const d = a != null && b != null ? r1(b - a) : null;
        return `<tr><td>${g}</td><td>${fmt(a)}</td><td>${fmt(b)}</td>${tdDelta(d, true)}</tr>`;
      })
      .join("\n          "),
  );

  const t34 = top10(s26, (r) => r.freshmanDropoutRate);
  html = replaceTbody(
    html,
    "표 3-4.",
    t34.map(({ r }, i) => schRow(i + 1, r, [fmt(r.freshmanDropoutRate), fmt(r.dropoutRate)])).join("\n          "),
  );

  html = replaceTbody(
    html,
    "표 4-1.",
    zoneRows((r) => r.enrolledFillRateIn)
      .map((a, i) => {
        const en = zoneRows((r) => r.enrolledFillRate)[i];
        const g22 = a.v22 != null && en.v22 != null ? r1(en.v22 - a.v22) : null;
        const g26 = a.v26 != null && en.v26 != null ? r1(en.v26 - a.v26) : null;
        return `<tr><td>${a.z}</td><td>${fmt(a.v22)}</td><td>${fmt(a.v26)}</td><td>${fmt(en.v22)}</td><td>${fmt(en.v26)}</td><td>${fmt(g22)}</td><td>${fmt(g26)}</td></tr>`;
      })
      .join("\n          "),
  );

  const t41b = top10(s26, (r) =>
    r.enrolledFillRate != null && r.enrolledFillRateIn != null
      ? r.enrolledFillRate - r.enrolledFillRateIn
      : null,
  );
  html = replaceTbody(
    html,
    "표 4-1b.",
    t41b
      .map(({ r, v }, i) =>
        schRow(i + 1, r, [fmt(r.enrolledFillRate), fmt(r.enrolledFillRateIn), fmt(v)]),
      )
      .join("\n          "),
  );

  const t42 = top10(s26, (r) =>
    r.leaveShare != null && r.deferShare != null ? r.leaveShare + r.deferShare : r.leaveShare,
  );
  html = replaceTbody(
    html,
    "표 4-2.",
    t42
      .map(({ r }, i) =>
        schRow(i + 1, r, [
          fmt(r.leaveShare),
          fmt(r.deferShare),
          fmt(
            r.leaveShare != null && r.deferShare != null ? r1(r.leaveShare + r.deferShare) : r.leaveShare,
          ),
        ]),
      )
      .join("\n          "),
  );

  const scales = ["대규모", "중규모", "소규모"] as const;
  html = replaceTbody(
    html,
    "표 4-3.",
    scales
      .map((sc) => {
        const a22 = s22.filter((r) => scaleOf(r) === sc);
        const a26 = s26.filter((r) => scaleOf(r) === sc);
        return `<tr><td>${sc}</td><td>${fmt(mean(a22, (r) => r.enrolledFillRateIn))}</td><td>${fmt(mean(a26, (r) => r.enrolledFillRateIn))}</td><td>${fmt(mean(a22, (r) => r.enrolledFillRate))}</td><td>${fmt(mean(a26, (r) => r.enrolledFillRate))}</td><td>${fmt(mean(a22, (r) => r.dropoutRate))}</td><td>${fmt(mean(a26, (r) => r.dropoutRate))}</td></tr>`;
      })
      .join("\n          "),
  );

  const t44 = top10(s26, (r) => r.dropoutRate);
  html = replaceTbody(
    html,
    "표 4-4.",
    t44.map(({ r }, i) => schRow(i + 1, r, [fmt(r.dropoutRate), fmt(r.freshmanDropoutRate)])).join("\n          "),
  );

  const yoy = foreignN.map((n, i) => (i === 0 || foreignN[i - 1] === 0 ? null : r1(((n - foreignN[i - 1]) / foreignN[i - 1]) * 100)));
  html = replaceTbody(
    html,
    "표 5-1.",
    [
      `<tr><td>외국인 총원(명)</td>${foreignN.map((n) => `<td>${fmtInt(n)}</td>`).join("")}${tdDelta(foreignN[4] - foreignN[0], true).replace(signed(foreignN[4] - foreignN[0]), (foreignN[4] - foreignN[0] > 0 ? "+" : "") + fmtInt(foreignN[4] - foreignN[0]))}</tr>`,
      `<tr><td>전년 대비 증가율</td>${yoy.map((v) => `<td>${v == null ? "—" : fmt(v)}</td>`).join("")}<td>—</td></tr>`,
      `<tr><td>재적대비비중 평균</td>${forShare.map((v) => `<td>${fmt(v)}</td>`).join("")}${tdDelta(d5(forShare), true)}</tr>`,
      `<tr><td>언어능력충족율 평균</td>${lang.map((v) => `<td>${fmt(v)}</td>`).join("")}${tdDelta(d5(lang))}</tr>`,
      `<tr><td>외국인탈락율 평균</td>${fDrop.map((v) => `<td>${fmt(v)}</td>`).join("")}${tdDelta(d5(fDrop), true)}</tr>`,
      `<tr><td>외국인중도탈락율 평균</td>${fDropAll.map((v) => `<td>${fmt(v)}</td>`).join("")}${tdDelta(d5(fDropAll), true)}</tr>`,
      `<tr><td>전체중도탈락율 평균</td>${drop.map((v) => `<td>${fmt(v)}</td>`).join("")}${tdDelta(d5(drop), true)}</tr>`,
    ].join("\n          "),
  );

  html = replaceTbody(
    html,
    "표 5-1b.",
    g4
      .map((g) => {
        const a22 = s22.filter((r) => group4(r) === g);
        const a26 = s26.filter((r) => group4(r) === g);
        const n22 = sum(a22, (r) => r.foreignTotal);
        const n26 = sum(a26, (r) => r.foreignTotal);
        const gr = n22 > 0 ? r1(((n26 - n22) / n22) * 100) : null;
        return `<tr><td>${g === "국공립 전문대학" ? "국공립 전문" : g === "사립 전문대학" ? "사립 전문" : g}</td><td>${fmtInt(n22)}</td><td>${fmtInt(n26)}</td><td>${gr == null ? "—" : signed(gr)}</td><td>${fmt(mean(a22, (r) => r.foreignShare))}</td><td>${fmt(mean(a26, (r) => r.foreignShare))}</td></tr>`;
      })
      .join("\n          "),
  );

  html = replaceTbody(
    html,
    "표 5-1c.",
    ZONES.map((z) => {
      const a22 = s22.filter((r) => r.zone === z);
      const a26 = s26.filter((r) => r.zone === z);
      const n22 = sum(a22, (r) => r.foreignTotal);
      const n26 = sum(a26, (r) => r.foreignTotal);
      const gr = n22 > 0 ? Math.round(((n26 - n22) / n22) * 100) : null;
      return `<tr><td>${z}</td><td>${fmtInt(n26)}</td><td>${gr == null ? "—" : signed(gr)}</td><td>${fmt(mean(a22, (r) => r.foreignShare))}</td><td>${fmt(mean(a26, (r) => r.foreignShare))}</td><td>${fmt(mean(a26, (r) => r.foreignDropRate))}</td><td>${fmt(mean(a26, (r) => r.foreignDropAllRate))}</td><td>${fmt(mean(a26, (r) => r.dropoutRate))}</td></tr>`;
    }).join("\n          "),
  );

  html = replaceTbody(
    html,
    "표 5-1d.",
    scales
      .map((sc) => {
        const a22 = s22.filter((r) => scaleOf(r) === sc);
        const a26 = s26.filter((r) => scaleOf(r) === sc);
        const n22 = sum(a22, (r) => r.foreignTotal);
        const n26 = sum(a26, (r) => r.foreignTotal);
        const gr = n22 > 0 ? Math.round(((n26 - n22) / n22) * 100) : null;
        return `<tr><td>${sc}</td><td>${fmtInt(n26)}</td><td>${gr == null ? "—" : signed(gr)}</td><td>${fmt(mean(a22, (r) => r.foreignShare))}</td><td>${fmt(mean(a26, (r) => r.foreignShare))}</td><td>${fmt(mean(a26, (r) => r.foreignDropRate))}</td><td>${fmt(mean(a26, (r) => r.foreignDropAllRate))}</td><td>${fmt(mean(a26, (r) => r.dropoutRate))}</td></tr>`;
      })
      .join("\n          "),
  );

  const sidoStats = SIDOS.map((sido) => {
    const a22 = s22.filter((r) => r.region === sido || r.region.startsWith(sido));
    const a26 = s26.filter((r) => r.region === sido || r.region.startsWith(sido));
    const n22 = sum(a22, (r) => r.foreignTotal);
    const n26 = sum(a26, (r) => r.foreignTotal);
    const gr = n22 > 0 ? Math.round(((n26 - n22) / n22) * 100) : null;
    return {
      sido,
      sh22: mean(a22, (r) => r.foreignShare),
      sh26: mean(a26, (r) => r.foreignShare),
      gr,
      rate22: mean(a22, (r) => r.rateIn),
      rate26: mean(a26, (r) => r.rateIn),
    };
  });
  const sidoPairs: string[] = [];
  for (let i = 0; i < sidoStats.length; i += 2) {
    const a = sidoStats[i];
    const b = sidoStats[i + 1];
    const right = b
      ? `<td>${b.sido}</td><td>${fmt(b.sh22)}</td><td>${fmt(b.sh26)}</td><td>${b.gr == null ? "—" : signed(b.gr)}</td>`
      : `<td></td><td></td><td></td><td></td>`;
    sidoPairs.push(
      `<tr><td>${a.sido}</td><td>${fmt(a.sh22)}</td><td>${fmt(a.sh26)}</td><td>${a.gr == null ? "—" : signed(a.gr)}</td>${right}</tr>`,
    );
  }
  html = replaceTbody(html, "표 5-1e.", sidoPairs.join("\n          "));

  const dim = (
    label: string,
    pred: (r: StudentFillSchoolRow) => boolean,
  ) => [
    label,
    mean(s22.filter(pred), (r) => r.langAbilityRate),
    mean(s26.filter(pred), (r) => r.langAbilityRate),
  ] as const;
  const dims = [
    dim("국공립", (r) => estbLabel(r) === "국공립"),
    dim("사립", (r) => estbLabel(r) === "사립"),
    dim("대학", (r) => r.schoolDivision === "대학"),
    dim("전문대", (r) => r.schoolDivision === "전문대학"),
    dim("대규모", (r) => scaleOf(r) === "대규모"),
    dim("소규모", (r) => scaleOf(r) === "소규모"),
    dim("수도권", (r) => r.metro === "수도권"),
    dim("비수도권", (r) => r.metro === "비수도권"),
  ];
  const dimRows: string[] = [];
  for (let i = 0; i < dims.length; i += 2) {
    const a = dims[i];
    const b = dims[i + 1];
    dimRows.push(
      `<tr><td>${a[0]}</td><td>${fmt(a[1])}</td><td>${fmt(a[2])}</td><td>${b[0]}</td><td>${fmt(b[1])}</td><td>${fmt(b[2])}</td></tr>`,
    );
  }
  html = replaceTbody(html, "표 5-1f.", dimRows.join("\n          "));

  const t52 = top10(s26, (r) => r.foreignShare);
  html = replaceTbody(
    html,
    "표 5-2.",
    t52.map(({ r }, i) => schRow(i + 1, r, [fmt(r.rateIn), fmt(r.foreignShare), fmt(r.foreignDropRate)])).join("\n          "),
  );

  html = replaceTbody(
    html,
    "표 5-1g.",
    g4
      .map((g) => {
        const a = s26.filter((r) => group4(r) === g);
        const fd = mean(a, (r) => r.foreignDropRate);
        const fa = mean(a, (r) => r.foreignDropAllRate);
        const dr = mean(a, (r) => r.dropoutRate);
        const diff = fd != null && dr != null ? r1(fd - dr) : null;
        return `<tr><td>${g === "국공립 전문대학" ? "국공립 전문" : g === "사립 전문대학" ? "사립 전문" : g}</td><td>${fmt(fd)}</td><td>${fmt(fa)}</td><td>${fmt(dr)}</td><td>${signed(diff)}</td></tr>`;
      })
      .join("\n          "),
  );

  const t53 = top10(s26, (r) => r.foreignDropRate);
  html = replaceTbody(
    html,
    "표 5-3.",
    t53.map(({ r }, i) => schRow(i + 1, r, [fmt(r.rateIn), fmt(r.foreignShare), fmt(r.foreignDropRate)])).join("\n          "),
  );

  const diag = (d: number | null, worseUp: boolean, good: string, bad: string) => {
    if (d == null) return "—";
    if (worseUp) return d > 0 ? bad : good;
    return d > 0 ? good : bad;
  };
  html = replaceTbody(
    html,
    "표 6-1.",
    [
      ["신입생 정원내충원율", rateIn, false, "개선", "악화"],
      ["신입생 정원내외충원율", rateAll, false, "개선", "악화"],
      ["신입생 정원외비중", outShare, true, "의존 완화", "의존 심화"],
      ["신입생탈락율", frDrop, true, "소폭 개선", "악화"],
      ["재학생 정원내충원율", enrIn, false, "개선", "악화"],
      ["재학생충원율", enr, false, "초과 운영 확대", "하락"],
      ["중도탈락율", drop, true, "소폭 개선", "악화"],
      ["외국인 재적대비비중", forShare, true, "의존 축소", "의존 확대"],
      ["언어능력충족율", lang, false, "질 개선", "질 하락"],
    ]
      .map(([lab, arr, worse, g, b]) => {
        const a = arr as (number | null)[];
        const d = d5(a);
        return `<tr><td>${lab}</td><td>${fmt(a[0])}</td><td>${fmt(a[4])}</td>${tdDelta(d, worse as boolean)}<td>${diag(d, worse as boolean, g as string, b as string)}</td></tr>`;
      })
      .join("\n          "),
  );

  const sido6: string[] = [];
  for (let i = 0; i < sidoStats.length; i += 2) {
    const a = sidoStats[i];
    const b = sidoStats[i + 1];
    const right = b
      ? `<td>${b.sido}</td><td>${fmt(b.rate22)}</td><td>${fmt(b.rate26)}</td>`
      : `<td></td><td></td><td></td>`;
    sido6.push(`<tr><td>${a.sido}</td><td>${fmt(a.rate22)}</td><td>${fmt(a.rate26)}</td>${right}</tr>`);
  }
  html = replaceTbody(html, "표 6-2.", sido6.join("\n          "));

  const zone26RateIn = ZONES.map((z) => mean(s26.filter((r) => r.zone === z), (r) => r.rateIn));
  const zone26Gap = ZONES.map((z) => {
    const rows = s26.filter((r) => r.zone === z);
    const a = mean(rows, (r) => r.rateIn);
    const b = mean(rows, (r) => r.rateAll);
    return a != null && b != null ? r1(a - b) : null;
  });
  const zoneEnrGap22 = ZONES.map((z) => {
    const rows = s22.filter((r) => r.zone === z);
    const a = mean(rows, (r) => r.enrolledFillRateIn);
    const b = mean(rows, (r) => r.enrolledFillRate);
    return a != null && b != null ? r1(b - a) : null;
  });
  const zoneEnrGap26 = ZONES.map((z) => {
    const rows = s26.filter((r) => r.zone === z);
    const a = mean(rows, (r) => r.enrolledFillRateIn);
    const b = mean(rows, (r) => r.enrolledFillRate);
    return a != null && b != null ? r1(b - a) : null;
  });
  const leaveLarge = ZONES.map((z) =>
    mean(s26.filter((r) => r.zone === z && scaleOf(r) === "대규모"), (r) => r.leaveShare),
  );
  const leaveSmall = ZONES.map((z) =>
    mean(s26.filter((r) => r.zone === z && scaleOf(r) === "소규모"), (r) => r.leaveShare),
  );
  const dropG4_22 = g4.map((g) => mean(s22.filter((r) => group4(r) === g), (r) => r.dropoutRate));
  const dropG4_26 = g4.map((g) => mean(s26.filter((r) => group4(r) === g), (r) => r.dropoutRate));
  const fDropG4 = g4.map((g) => mean(s26.filter((r) => group4(r) === g), (r) => r.foreignDropRate));
  const outByScale = scales.map((sc) =>
    YEARS.map((y) => mean(byYear(y).filter((r) => scaleOf(r) === sc), (r) => r.outShare)),
  );
  const langPub = YEARS.map((y) => mean(byYear(y).filter((r) => estbLabel(r) === "국공립"), (r) => r.langAbilityRate));
  const langPri = YEARS.map((y) => mean(byYear(y).filter((r) => estbLabel(r) === "사립"), (r) => r.langAbilityRate));
  const enrChgZone = ZONES.map((z) => {
    const n22 = sum(s22.filter((r) => r.zone === z), (r) => r.enrolledTotal);
    const n26 = sum(s26.filter((r) => r.zone === z), (r) => r.enrolledTotal);
    return n22 > 0 ? r1(((n26 - n22) / n22) * 100) : null;
  });
  const forChgZone = ZONES.map((z) => {
    const n22 = sum(s22.filter((r) => r.zone === z), (r) => r.foreignTotal);
    const n26 = sum(s26.filter((r) => r.zone === z), (r) => r.foreignTotal);
    return n22 > 0 ? Math.round(((n26 - n22) / n22) * 100) : null;
  });
  const sidoChart = ["서울", "경기", "인천", "대구", "부산", "광주", "전남", "전북", "강원", "제주"].map((name) =>
    sidoStats.find((s) => s.sido === name)!,
  );
  const medShare = median(s26, (r) => r.foreignShare) ?? 0;
  const medFdrop = median(s26, (r) => r.foreignDropRate) ?? 0;
  let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
  for (const r of s26) {
    if (r.foreignShare == null || r.foreignDropRate == null) continue;
    const hiS = r.foreignShare >= medShare;
    const hiD = r.foreignDropRate >= medFdrop;
    if (hiS && hiD) q1 += 1;
    else if (!hiS && hiD) q2 += 1;
    else if (hiS && !hiD) q3 += 1;
    else q4 += 1;
  }
  const medRate = median(s26, (r) => r.rateIn) ?? 95;
  const medFs = median(s26, (r) => r.foreignShare) ?? 5;
  let A = 0, B = 0, C = 0, D = 0;
  for (const r of s26) {
    if (r.rateIn == null || r.foreignShare == null) continue;
    const ok = r.rateIn >= medRate;
    const hiF = r.foreignShare >= medFs;
    if (ok && !hiF) A += 1;
    else if (ok && hiF) B += 1;
    else if (!ok && !hiF) C += 1;
    else D += 1;
  }
  const idx = (arr: (number | null)[]) =>
    arr.map((v) => (arr[0] && v != null ? Math.round((v / arr[0]) * 100) : null));

  const nn = (arr: (number | null)[]) => arr.map((v) => v ?? 0);
  // Compute school-count change by scale/metro from actual sets
  const lostBy = (pred: (r: StudentFillSchoolRow) => boolean) => {
    const a = s22.filter(pred).length;
    const b = s26.filter(pred).length;
    return Math.max(0, a - b);
  };
  const c22data = [
    lostBy((r) => scaleOf(r) === "대규모"),
    lostBy((r) => scaleOf(r) === "중규모"),
    lostBy((r) => scaleOf(r) === "소규모"),
    lostBy((r) => r.metro === "수도권"),
    lostBy((r) => r.metro === "비수도권"),
  ];

  const c21 = [
    counts.map((c) => c["국공립 대학"]),
    counts.map((c) => c["국공립 전문대학"]),
    counts.map((c) => c["사립 대학"]),
    counts.map((c) => c["사립 전문대학"]),
  ];

  const start = html.indexOf("    const years = ");
  const end = html.indexOf("    document.getElementById(\"guide-text\")");
  if (start < 0 || end < 0) throw new Error("chart script markers missing");
  const newCharts = `    const years = ["2022", "2023", "2024", "2025", "2026"];
    const opt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } } };

    new Chart(document.getElementById("c22"), {
      type: "bar",
      data: { labels: ["대규모", "중규모", "소규모", "수도권", "지방권"], datasets: [
        { label: "5년 누적 감축 본교 수", data: ${JSON.stringify(c22data)}, backgroundColor: ["#0f766e", "#d97706", "#be123c", "#0369a1", "#be123c"] }
      ]},
      options: { ...opt, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: "교" } } } }
    });

    new Chart(document.getElementById("c21"), {
      type: "line",
      data: { labels: years, datasets: [
        { label: "국공립 대학", data: ${JSON.stringify(c21[0])}, borderColor: "#0f766e", borderWidth: 2, fill: false },
        { label: "국공립 전문", data: ${JSON.stringify(c21[1])}, borderColor: "#0369a1", borderWidth: 2, fill: false },
        { label: "사립 대학", data: ${JSON.stringify(c21[2])}, borderColor: "#d97706", borderWidth: 2, fill: false },
        { label: "사립 전문", data: ${JSON.stringify(c21[3])}, borderColor: "#be123c", borderWidth: 2, fill: false }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: false } } }
    });

    new Chart(document.getElementById("c31"), {
      type: "bar",
      data: { labels: years, datasets: [
        { label: "정원내 모집(천명)", data: ${JSON.stringify(recIn.map((n) => r1(n / 1000)))}, backgroundColor: "#1e3a5f" },
        { label: "정원외 모집(천명)", data: ${JSON.stringify(recOut.map((n) => r1(n / 1000)))}, backgroundColor: "#be123c" }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true, title: { display: true, text: "천 명" } } } }
    });

    new Chart(document.getElementById("c34"), {
      type: "line",
      data: { labels: years, datasets: [
        { label: "대규모 정원외비중", data: ${JSON.stringify(nn(outByScale[0]))}, borderColor: "#0f766e", borderWidth: 2, fill: false },
        { label: "중규모 정원외비중", data: ${JSON.stringify(nn(outByScale[1]))}, borderColor: "#d97706", borderWidth: 2, fill: false },
        { label: "소규모 정원외비중", data: ${JSON.stringify(nn(outByScale[2]))}, borderColor: "#be123c", borderWidth: 2, fill: false }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("c32"), {
      type: "bar",
      data: { labels: ${JSON.stringify(ZONES.map((z) => z.replace("권", "")))}, datasets: [
        { label: "정원내충원율(%)", data: ${JSON.stringify(nn(zone26RateIn))}, backgroundColor: "#0f766e" },
        { label: "내−내외 격차(%p)", data: ${JSON.stringify(nn(zone26Gap))}, backgroundColor: "#f59e0b" }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("c33"), {
      type: "line",
      data: { labels: years, datasets: [
        { label: "신입생탈락율", data: ${JSON.stringify(nn(frDrop))}, borderColor: "#be123c", borderWidth: 2, fill: false },
        { label: "중도탈락율", data: ${JSON.stringify(nn(drop))}, borderColor: "#0369a1", borderWidth: 2, fill: false }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("c41"), {
      type: "bar",
      data: { labels: years, datasets: [
        { label: "학생정원(만명)", data: ${JSON.stringify(quota.map((n) => r1(n / 10000)))}, backgroundColor: "#1e3a5f", yAxisID: "y" },
        { label: "재학생충원율(%)", data: ${JSON.stringify(nn(enr))}, type: "line", borderColor: "#be123c", borderWidth: 2, yAxisID: "y1", fill: false }
      ]},
      options: { ...opt, scales: {
        y: { position: "left", title: { display: true, text: "만 명" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "%" } }
      } }
    });

    new Chart(document.getElementById("c42"), {
      type: "bar",
      data: { labels: ${JSON.stringify(ZONES.map((z) => z.replace("권", "")))}, datasets: [
        { label: "격차 2022(%p)", data: ${JSON.stringify(nn(zoneEnrGap22))}, backgroundColor: "#94a3b8" },
        { label: "격차 2026(%p)", data: ${JSON.stringify(nn(zoneEnrGap26))}, backgroundColor: "#be123c" }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("c43"), {
      type: "bar",
      data: { labels: ${JSON.stringify(ZONES.map((z) => z.replace("권", "")))}, datasets: [
        { label: "대규모 휴학비중", data: ${JSON.stringify(nn(leaveLarge))}, backgroundColor: "#1e3a5f" },
        { label: "소규모 휴학비중", data: ${JSON.stringify(nn(leaveSmall))}, backgroundColor: "#0f766e" }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true, title: { display: true, text: "%" } } } }
    });

    new Chart(document.getElementById("c44"), {
      type: "bar",
      data: { labels: ["국공립대", "국공립전문", "사립대", "사립전문"], datasets: [
        { label: "중도탈락 2022", data: ${JSON.stringify(nn(dropG4_22))}, backgroundColor: "#94a3b8" },
        { label: "중도탈락 2026", data: ${JSON.stringify(nn(dropG4_26))}, backgroundColor: "#be123c" }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true, title: { display: true, text: "%" } } } }
    });

    new Chart(document.getElementById("c51"), {
      type: "bar",
      data: { labels: years, datasets: [
        { label: "외국인 총원(천명)", data: ${JSON.stringify(foreignN.map((n) => r1(n / 1000)))}, backgroundColor: "#0f766e", yAxisID: "y" },
        { label: "재적대비비중(%)", data: ${JSON.stringify(nn(forShare))}, type: "line", borderColor: "#d97706", borderWidth: 2, yAxisID: "y1", fill: false }
      ]},
      options: { ...opt, scales: {
        y: { beginAtZero: true, title: { display: true, text: "천 명" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "%" } }
      } }
    });

    new Chart(document.getElementById("c53"), {
      type: "bar",
      data: { labels: ${JSON.stringify(ZONES.map((z) => z.replace("권", "")))}, datasets: [
        { label: "재학생 증감율(%)", data: ${JSON.stringify(nn(enrChgZone))}, backgroundColor: "#94a3b8" },
        { label: "외국인 증가율(%)", data: ${JSON.stringify(nn(forChgZone))}, backgroundColor: "#0f766e" }
      ]},
      options: { ...opt, scales: { y: { title: { display: true, text: "%" } } } }
    });

    new Chart(document.getElementById("c54"), {
      type: "bar",
      data: { labels: ${JSON.stringify(sidoChart.map((s) => s.sido))}, datasets: [
        { label: "비중 2022", data: ${JSON.stringify(sidoChart.map((s) => s.sh22 ?? 0))}, backgroundColor: "#94a3b8" },
        { label: "비중 2026", data: ${JSON.stringify(sidoChart.map((s) => s.sh26 ?? 0))}, backgroundColor: "#d97706" }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true, title: { display: true, text: "%" } } } }
    });

    new Chart(document.getElementById("c55"), {
      type: "bar",
      data: { labels: ["국공립대", "국공립전문", "사립대", "사립전문"], datasets: [
        { label: "외국인탈락율", data: ${JSON.stringify(nn(fDropG4))}, backgroundColor: "#be123c" },
        { label: "전체중도탈락율", data: ${JSON.stringify(nn(dropG4_26))}, backgroundColor: "#1e3a5f" }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true, title: { display: true, text: "%" } } } }
    });

    new Chart(document.getElementById("c56"), {
      type: "bar",
      data: { labels: ["1 고위험", "2 관심", "3 양호", "4 일반"], datasets: [
        { label: "본교 수", data: ${JSON.stringify([q1, q2, q3, q4])}, backgroundColor: ["#be123c", "#d97706", "#0f766e", "#94a3b8"] }
      ]},
      options: { ...opt, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("c52"), {
      type: "line",
      data: { labels: years, datasets: [
        { label: "국공립 언어충족", data: ${JSON.stringify(nn(langPub))}, borderColor: "#0f766e", borderWidth: 2, fill: false },
        { label: "사립 언어충족", data: ${JSON.stringify(nn(langPri))}, borderColor: "#d97706", borderWidth: 2, borderDash: [5, 4], fill: false }
      ]},
      options: { ...opt, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("c62"), {
      type: "bar",
      data: { labels: ["A 충원양호·외낮음", "B 충원양호·외높음", "C 충원취약·외낮음", "D 충원취약·외높음"], datasets: [
        { label: "본교 수", data: ${JSON.stringify([A, B, C, D])}, backgroundColor: ["#0f766e", "#0369a1", "#d97706", "#be123c"] }
      ]},
      options: { ...opt, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    new Chart(document.getElementById("c61"), {
      type: "line",
      data: { labels: years, datasets: [
        { label: "정원내충원율(지수)", data: ${JSON.stringify(nn(idx(rateIn)))}, borderColor: "#0f766e", borderWidth: 2, fill: false },
        { label: "정원외비중(지수)", data: ${JSON.stringify(nn(idx(outShare)))}, borderColor: "#d97706", borderWidth: 2, fill: false },
        { label: "외국인비중(지수)", data: ${JSON.stringify(nn(idx(forShare)))}, borderColor: "#be123c", borderWidth: 2, fill: false },
        { label: "언어충족(지수)", data: ${JSON.stringify(nn(idx(lang)))}, borderColor: "#0369a1", borderWidth: 2, borderDash: [4, 3], fill: false }
      ]},
      options: { ...opt, scales: { y: { min: 70 } } }
    });

`;
  html = html.slice(0, start) + newCharts + html.slice(end);

  const mockPath = path.join(process.cwd(), "public/mockups/sfa-comprehensive-report-v2.html");
  await writeFile(mockPath, html, "utf8");

  let prod = html
    .replace("2026 학생충원 심층분석 보고서 (본교·5개년 목업)", "2026 학생충원 심층분석 보고서")
    .replace(
      "목업 · 프로덕션 미적용 · A4 세로 · 분교·캠퍼스 본교 합산 · 율 재계산 · 2022–2026",
      "종합보고서 · A4 세로 · 분교·캠퍼스 본교 합산 · 율 재계산 · 2022–2026",
    )
    .replace("K-UniTrust · 학생충원분석 종합보고서 시안", "K-UniTrust · 학생충원분석 종합보고서")
    .replace("부록. 보고서 작성 지침 (목업 v2.0.0)", "부록. 보고서 작성 지침 (v2.0.0)")
    .replace("프로덕션 지침(1.2.0)은 바꾸지 않았다. 아래는 이 시안을 생성할 때 쓸 지침이다.", "분석실행 결과(본교 합산)로 표·차트를 채운 종합보고서 지침이다.");
  const prodPath = path.join(process.cwd(), "public/reports/sfa-gemini-comprehensive.html");
  await writeFile(prodPath, prod, "utf8");

  // verify tables vs recompute
  const parseTable = (doc: string, fig: string) => {
    const figIdx = doc.indexOf(`<div class="fig">${fig}`);
    const tbodyStart = doc.indexOf("<tbody>", figIdx);
    const tbodyEnd = doc.indexOf("</tbody>", tbodyStart);
    const body = doc.slice(tbodyStart, tbodyEnd);
    return [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) =>
      [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
        c[1].replace(/<[^>]+>/g, "").trim(),
      ),
    );
  };

  let fails = 0;
  const check = (ok: boolean, msg: string) => {
    console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
    if (!ok) fails += 1;
  };

  const t11 = parseTable(html, "표 1-1.");
  check(t11[4][5] === String(coverN26), `표1-1 2026합계 ${t11[4][5]} == ${coverN26}`);
  check(Number(t11[0][5]) === counts[4]["국공립 대학"], `표1-1 국대 ${t11[0][5]}`);

  const t31 = parseTable(html, "표 3-1.");
  check(t31[0][5] === fmt(rateIn[4]), `표3-1 정원내26 ${t31[0][5]} == ${fmt(rateIn[4])}`);
  check(t31[1][5] === fmt(rateInMed[4]), `표3-1 중앙값26 ${t31[1][5]} == ${fmt(rateInMed[4])}`);
  check(t31[2][5] === fmt(rateAll[4]), `표3-1 내외26 ${t31[2][5]} == ${fmt(rateAll[4])}`);
  check(t31[4][5] === fmt(outShare[4]), `표3-1 외비중26 ${t31[4][5]} == ${fmt(outShare[4])}`);
  check(t31[5][5] === fmt(frDrop[4]), `표3-1 신입탈락26 ${t31[5][5]} == ${fmt(frDrop[4])}`);

  const t31bH = parseTable(html, "표 3-1b.");
  check(t31bH[0][1] === t31b[0].r.schoolName, `표3-1b 1위 ${t31bH[0][1]}`);
  check(t31bH.length === 10, "표3-1b 10행");

  const t32bH = parseTable(html, "표 3-2b.");
  check(t32bH[0][1] === t32b[0].r.schoolName, `표3-2b 1위 ${t32bH[0][1]} == ${t32b[0].r.schoolName}`);

  const t34H = parseTable(html, "표 3-4.");
  check(t34H[0][1] === t34[0].r.schoolName, `표3-4 1위 ${t34H[0][1]}`);
  check(t34H[0][7] === fmt(t34[0].r.freshmanDropoutRate), "표3-4 1위 율");

  const t41bH = parseTable(html, "표 4-1b.");
  check(t41bH[0][1] === t41b[0].r.schoolName, `표4-1b 1위 ${t41bH[0][1]}`);

  const t42H = parseTable(html, "표 4-2.");
  check(t42H[0][1] === t42[0].r.schoolName, `표4-2 1위 ${t42H[0][1]}`);

  const t44H = parseTable(html, "표 4-4.");
  check(t44H[0][1] === t44[0].r.schoolName, `표4-4 1위 ${t44H[0][1]}`);

  const t51 = parseTable(html, "표 5-1.");
  check(t51[0][5].replace(/,/g, "") === String(Math.round(foreignN[4])), `표5-1 외인26 ${t51[0][5]}`);
  check(t51[2][5] === fmt(forShare[4]), `표5-1 비중26 ${t51[2][5]}`);
  check(t51[3][5] === fmt(lang[4]), `표5-1 언어26 ${t51[3][5]}`);
  check(t51[4][5] === fmt(fDrop[4]), `표5-1 외탈26 ${t51[4][5]}`);

  const t52H = parseTable(html, "표 5-2.");
  check(t52H[0][1] === t52[0].r.schoolName, `표5-2 1위 ${t52H[0][1]}`);
  check(t52H[0][8] === fmt(t52[0].r.foreignShare), "표5-2 1위 비중");

  const t53H = parseTable(html, "표 5-3.");
  check(t53H[0][1] === t53[0].r.schoolName, `표5-3 1위 ${t53H[0][1]}`);
  check(t53H.length === 10, "표5-3 10행");

  const t61 = parseTable(html, "표 6-1.");
  check(t61[0][2] === fmt(rateIn[4]), "표6-1 정원내26");
  check(t61[5][2] === fmt(enr[4]), "표6-1 재충원26");

  const t32 = parseTable(html, "표 3-2.");
  const capZone = mean(s26.filter((r) => r.zone === "수도권"), (r) => r.rateIn);
  check(t32[0][2] === fmt(capZone), `표3-2 수도권 내충원26 ${t32[0][2]}`);

  console.log("\n=== 핵심 실측 ===");
  console.log({
    schools: `${coverN22}→${coverN26}`,
    rateIn: `${fmt(rateIn[0])}→${fmt(rateIn[4])}`,
    rateAll: `${fmt(rateAll[0])}→${fmt(rateAll[4])}`,
    outShare: `${fmt(outShare[0])}→${fmt(outShare[4])}`,
    frDrop: `${fmt(frDrop[0])}→${fmt(frDrop[4])}`,
    enrIn: `${fmt(enrIn[0])}→${fmt(enrIn[4])}`,
    enr: `${fmt(enr[0])}→${fmt(enr[4])}`,
    drop: `${fmt(drop[0])}→${fmt(drop[4])}`,
    foreignN: `${fmtInt(foreignN[0])}→${fmtInt(foreignN[4])}`,
    forShare: `${fmt(forShare[0])}→${fmt(forShare[4])}`,
    lang: `${fmt(lang[0])}→${fmt(lang[4])}`,
    top: {
      gap: t31b[0].r.schoolName,
      out: t32b[0].r.schoolName,
      fr: t34[0].r.schoolName,
      enrGap: t41b[0].r.schoolName,
      leave: t42[0].r.schoolName,
      drop: t44[0].r.schoolName,
      forShare: t52[0].r.schoolName,
      fDrop: t53[0].r.schoolName,
    },
  });
  console.log(`\nVERIFY fails=${fails}`);
  if (fails) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
