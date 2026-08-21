/** Fix col width, consolidated quotes, nested filter template literals */
import fs from "node:fs";
import path from "node:path";

const ANALYSIS = path.resolve(import.meta.dirname, "..", "src/components/analysis");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

const REPAIRS = [
  [/width: `5\.5rem" \}\}/g, 'width: "5.5rem" }}'],
  [/"consolidated`/g, '"consolidated"'],
  [/exportHref\(exportBasePath, `consolidated`\)/g, 'exportHref(exportBasePath, "consolidated")'],
  [
    /hasActiveFilter \? " \(전체 \$\{yearRowCount\.toLocaleString\("ko-KR"\)\}개 중\)`/g,
    'hasActiveFilter ? ` (전체 ${yearRowCount.toLocaleString("ko-KR")}개 중)`',
  ],
  [
    /hasActiveFilter \? " \(전체 \$\{data\.stats\.total\.toLocaleString\("ko-KR"\)\}건 중\)`/g,
    'hasActiveFilter ? ` (전체 ${data.stats.total.toLocaleString("ko-KR")}건 중)`',
  ],
  [
    /hasActiveFilter \? " \(전체 \$\{displayYearStatus\.consolidatedRowCount\.toLocaleString\("ko-KR"\)\}개 중\)`/g,
    'hasActiveFilter ? ` (전체 ${displayYearStatus.consolidatedRowCount.toLocaleString("ko-KR")}개 중)`',
  ],
  [
    /hasActiveFilter \? " \(전체 \$\{currentPeriodStatus\.consolidatedRowCount\.toLocaleString\("ko-KR"\)\}개 중\)`/g,
    'hasActiveFilter ? ` (전체 ${currentPeriodStatus.consolidatedRowCount.toLocaleString("ko-KR")}개 중)`',
  ],
];

let changed = 0;
for (const file of walk(ANALYSIS)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [re, rep] of REPAIRS) {
    content = content.replace(re, rep);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    changed++;
    console.log("fixed:", path.relative(ANALYSIS, file));
  }
}

console.log(`Fixed ${changed} file(s).`);
