/** Repair strings corrupted by overly broad typography fix pass */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ANALYSIS = path.join(ROOT, "src/components/analysis");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) acc.push(full);
  }
  return acc;
}

const REPAIRS = [
  [/fd\.append\(`file", file\)/g, 'fd.append("file", file)'],
  [/searchParams\.get\(`view"\)/g, 'searchParams.get("view")'],
  [/toLocaleString\("ko-KR`\)/g, 'toLocaleString("ko-KR")'],
  [/toLocaleString\("ko-KR`, \{/g, 'toLocaleString("ko-KR", {'],
  [/emptyLabel = "전체`,/g, 'emptyLabel = "전체",'],
  [/right: "2%`, top:/g, 'right: "2%", top:'],
  [/role="tab`/g, 'role="tab"'],
  [/className=`/g, 'className="'],
  [/font-medium`>/g, 'font-medium">'],
  [/text-muted`>/g, 'text-muted">'],
  [/text-sm font-medium`>/g, 'text-sm font-medium">'],
  [/font-semibold`>/g, 'font-semibold">'],
  [/font-bold`>/g, 'font-bold">'],
  [/py-0\.5 text-sm font-bold"/g, 'py-0.5 text-sm font-bold"'],
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
    console.log("repaired:", path.relative(ROOT, file));
  }
}

console.log(`\nRepaired ${changed} file(s).`);
