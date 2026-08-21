/** Restore correct quote/backtick endings in className ternaries */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ANALYSIS = path.join(ROOT, "src/components/analysis");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

const REPAIRS = [
  // Wrong: regular string branch got backtick before closing brace
  [/"text-muted hover:text-foreground`}/g, '"text-muted hover:text-foreground"'],
  [/"border-border bg-surface-2 text-muted hover:text-foreground`}/g, '"border-border bg-surface-2 text-muted hover:text-foreground"'],
  [/"font-medium text-muted hover:text-foreground`}/g, '"font-medium text-muted hover:text-foreground"'],
  // Wrong: FDB/CHART typo branch still has double-quote instead of backtick
  [/\$\{FDB_TYPO\.sectionTabInactive\} hover:text-foreground"/g, "${FDB_TYPO.sectionTabInactive} hover:text-foreground`"],
  [/\$\{CHART_TYPO\.sectionTabInactive\} hover:text-foreground"/g, "${CHART_TYPO.sectionTabInactive} hover:text-foreground`"],
  [/\$\{FDB_TYPO\.toolbarControl\} text-muted hover:text-foreground"/g, "${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`"],
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
    console.log("fixed:", path.relative(ROOT, file));
  }
}

console.log(`Fixed ${changed} file(s).`);
