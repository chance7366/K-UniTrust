/** Fix template literal endings corrupted to double-quote */
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
  [/hover:text-foreground"\s*\n/g, "hover:text-foreground`}\n"],
  [/hover:text-foreground"\s*\}/g, "hover:text-foreground` }"],
  [/sectionTabInactive\} hover:text-foreground"/g, "sectionTabInactive} hover:text-foreground`"],
  [/toolbarControl\} text-muted hover:text-foreground"/g, "toolbarControl} text-muted hover:text-foreground`"],
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
