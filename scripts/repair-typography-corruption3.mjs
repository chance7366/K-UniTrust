/** Fix remaining quote/backtick mixups from typography migration */
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
  [/toLocaleString\(`ko-KR"\)/g, 'toLocaleString("ko-KR")'],
  [/type=`button"/g, 'type="button"'],
  [/"—`}/g, '"—"}'],
  [/hover:text-foreground`/g, 'hover:text-foreground"'],
  [/text-foreground`/g, 'text-foreground"'],
  [/p-3`\s*\n/g, 'p-3"\n'],
  [/className="([^"]*?)`\s*\n/g, 'className="$1"\n'],
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
