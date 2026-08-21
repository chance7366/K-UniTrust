import fs from "fs";

const csvPath = "data/csv/finance_analysis_freshman_enrollment.csv";
const text = fs.readFileSync(csvPath, "utf8");
const lines = text.trim().split(/\r?\n/);
const headers = lines[0].split(",");

function parseRow(line) {
  const parts = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  const o = {};
  headers.forEach((h, i) => {
    o[h.trim()] = (parts[i] ?? "").trim();
  });
  return o;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function resolveSchoolDivision(row) {
  const div = row.school_division?.trim() ?? "";
  if (div) {
    if (div.includes("대학원")) return null;
    if (div.includes("전문")) return "전문대학";
    if (div.includes("대학")) return "대학";
  }
  const kind = row.school_kind ?? "";
  if (kind.includes("대학원")) return null;
  if (kind.includes("전문")) return "전문대학";
  if (kind.includes("대학")) return "대학";
  return null;
}

const EXCLUDED = new Set(["특별법국립", "특별법법인"]);
const INCLUDED = new Set(["사립", "국립", "공립", "국립대법인"]);

function normalizeEstb(estb) {
  if (EXCLUDED.has(estb)) return null;
  if (!INCLUDED.has(estb)) return null;
  return estb === "사립" ? "사립" : "국공립";
}

const rows = lines.slice(1).map(parseRow).filter((r) => r.year && r.school_name);
const jc = rows.filter(
  (r) => resolveSchoolDivision(r) === "전문대학" && normalizeEstb(r.estb),
);

function yearRate(yearRows) {
  let enrolled = 0;
  let recruit = 0;
  for (const row of yearRows) {
    enrolled += num(row.enrolled_within);
    recruit += num(row.recruit_within);
  }
  return recruit ? Math.round((enrolled / recruit) * 10000) / 100 : null;
}

function schoolRate(row) {
  const recruit = num(row.recruit_within);
  const enrolled = num(row.enrolled_within);
  return recruit ? Math.round((enrolled / recruit) * 10000) / 100 : null;
}

console.log("=== 전문대학 전체 정원내 충원율 (합산 방식) ===");
for (const y of [2022, 2023, 2024, 2025]) {
  const yr = jc.filter((r) => Number(r.year) === y);
  const recruit = yr.reduce((s, r) => s + num(r.recruit_within), 0);
  const enrolled = yr.reduce((s, r) => s + num(r.enrolled_within), 0);
  console.log(
    `${y}: ${yearRate(yr)}% (${yr.length}교, 모집정원내 ${recruit}, 입학정원내 ${enrolled})`,
  );
}

const byKey = new Map();
for (const row of jc) {
  const key = `${row.school_code_std}|${row.school_name}`;
  if (!byKey.has(key)) {
    byKey.set(key, { name: row.school_name, years: {} });
  }
  byKey.get(key).years[row.year] = row;
}

const changes2423 = [];
const changes2524 = [];
for (const school of byKey.values()) {
  const r23 = school.years["2023"] ? schoolRate(school.years["2023"]) : null;
  const r24 = school.years["2024"] ? schoolRate(school.years["2024"]) : null;
  const r25 = school.years["2025"] ? schoolRate(school.years["2025"]) : null;
  if (r23 != null && r24 != null) {
    changes2423.push({
      name: school.name,
      r23,
      r24,
      d: r24 - r23,
      rec23: num(school.years["2023"].recruit_within),
      rec24: num(school.years["2024"].recruit_within),
      en23: num(school.years["2023"].enrolled_within),
      en24: num(school.years["2024"].enrolled_within),
    });
  }
  if (r24 != null && r25 != null) {
    changes2524.push({
      name: school.name,
      r24,
      r25,
      d: r25 - r24,
      rec24: num(school.years["2024"].recruit_within),
      rec25: num(school.years["2025"].recruit_within),
      en24: num(school.years["2024"].enrolled_within),
      en25: num(school.years["2025"].enrolled_within),
    });
  }
}

console.log("\n=== 2023→2024: 5%p 이상 하락 교 수 ===");
const drop2423 = changes2423.filter((s) => s.d <= -5);
console.log(`${drop2423.length} / ${changes2423.length}교`);
drop2423.sort((a, b) => a.d - b.d).slice(0, 12).forEach((s) => {
  console.log(
    `  ${s.d.toFixed(1)}%p ${s.name} | ${s.r23}%→${s.r24}% | 모집 ${s.rec23}→${s.rec24} | 입학 ${s.en23}→${s.en24}`,
  );
});

console.log("\n=== 2024→2025: 5%p 이상 상승 교 수 ===");
const rise2524 = changes2524.filter((s) => s.d >= 5);
console.log(`${rise2524.length} / ${changes2524.length}교`);
rise2524.sort((a, b) => b.d - a.d).slice(0, 12).forEach((s) => {
  console.log(
    `  +${s.d.toFixed(1)}%p ${s.name} | ${s.r24}%→${s.r25}% | 모집 ${s.rec24}→${s.rec25} | 입학 ${s.en24}→${s.en25}`,
  );
});

console.log("\n=== 연도별 교별 충원율 중앙값 ===");
for (const y of [2023, 2024, 2025]) {
  const rates = [...byKey.values()]
    .map((s) => s.years[String(y)])
    .filter(Boolean)
    .map(schoolRate)
    .filter((r) => r != null)
    .sort((a, b) => a - b);
  const mid = rates[Math.floor(rates.length / 2)];
  const avg =
    rates.reduce((a, b) => a + b, 0) / (rates.length || 1);
  console.log(`${y}: 중앙값 ${mid?.toFixed(2)}%, 단순평균 ${avg.toFixed(2)}%, n=${rates.length}`);
}

function aggregateWithout(excludeNames, year) {
  const yr = jc.filter(
    (r) => Number(r.year) === year && !excludeNames.has(r.school_name),
  );
  return {
    rate: yearRate(yr),
    count: yr.length,
    recruit: yr.reduce((s, r) => s + num(r.recruit_within), 0),
  };
}

const topDroppers2423 = new Set(
  changes2423.sort((a, b) => a.d - b.d).slice(0, 10).map((s) => s.name),
);
const topRisers2524 = new Set(
  changes2524.sort((a, b) => b.d - a.d).slice(0, 10).map((s) => s.name),
);

console.log("\n=== 민감도: 특정 교 제외 시 전체 충원율 ===");
console.log(`2024 전체: ${yearRate(jc.filter((r) => Number(r.year) === 2024))}%`);
console.log(
  `2024 (2023→24 하락 상위10교 제외): ${aggregateWithout(topDroppers2423, 2024).rate}%`,
);
console.log(`2025 전체: ${yearRate(jc.filter((r) => Number(r.year) === 2025))}%`);
console.log(
  `2025 (2024→25 상승 상위10교 제외): ${aggregateWithout(topRisers2524, 2025).rate}%`,
);

console.log("\n=== 2024 급락 기여도 (모집규모×충원율변화) ===");
const totalRec24 = jc
  .filter((r) => Number(r.year) === 2024)
  .reduce((s, r) => s + num(r.recruit_within), 0);
changes2423
  .map((c) => ({
    ...c,
    weight: (c.rec24 / totalRec24) * 100,
    impact: c.d * (c.rec24 / totalRec24),
  }))
  .sort((a, b) => a.impact - b.impact)
  .slice(0, 10)
  .forEach((c) => {
    console.log(
      `  impact ${c.impact.toFixed(2)}%p weight ${c.weight.toFixed(1)}% ${c.name} ${c.r23}%→${c.r24}%`,
    );
  });

console.log("\n=== 2025 급등 기여도 ===");
const totalRec25 = jc
  .filter((r) => Number(r.year) === 2025)
  .reduce((s, r) => s + num(r.recruit_within), 0);
changes2524
  .map((c) => ({
    ...c,
    weight: (c.rec25 / totalRec25) * 100,
    impact: c.d * (c.rec25 / totalRec25),
  }))
  .sort((a, b) => b.impact - a.impact)
  .slice(0, 10)
  .forEach((c) => {
    console.log(
      `  impact +${c.impact.toFixed(2)}%p weight ${c.weight.toFixed(1)}% ${c.name} ${c.r24}%→${c.r25}%`,
    );
  });

// New/disappeared schools
const names2024 = new Set(jc.filter((r) => Number(r.year) === 2024).map((r) => r.school_name));
const names2023 = new Set(jc.filter((r) => Number(r.year) === 2023).map((r) => r.school_name));
const names2025 = new Set(jc.filter((r) => Number(r.year) === 2025).map((r) => r.school_name));
const new2024 = [...names2024].filter((n) => !names2023.has(n));
const gone2024 = [...names2023].filter((n) => !names2024.has(n));
const new2025 = [...names2025].filter((n) => !names2024.has(n));
const gone2025 = [...names2024].filter((n) => !names2025.has(n));
console.log("\n=== 편입/퇴출 교 ===");
console.log(`2024 신규(${new2024.length}):`, new2024.slice(0, 8).join(", ") || "-");
console.log(`2024 미포함(${gone2024.length}):`, gone2024.slice(0, 8).join(", ") || "-");
console.log(`2025 신규(${new2025.length}):`, new2025.slice(0, 8).join(", ") || "-");
console.log(`2025 미포함(${gone2025.length}):`, gone2025.slice(0, 8).join(", ") || "-");
