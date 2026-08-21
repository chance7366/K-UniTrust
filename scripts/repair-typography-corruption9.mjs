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
  [/"campus`/g, '"campus"'],
  [/"bg-surface-2\/30`/g, '"bg-surface-2/30"'],
  [/text-muted" \}/g, "text-muted` }"],
  [/type=`button`/g, 'type="button"'],
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
