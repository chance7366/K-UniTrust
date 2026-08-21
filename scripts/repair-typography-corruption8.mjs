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
  [/=== `Enter"/g, '=== "Enter"'],
  [/viewMode = `campus",/g, 'viewMode = "campus",'],
  [/viewMode === `consolidated"/g, 'viewMode === "consolidated"'],
  [/viewMode === `campus"/g, 'viewMode === "campus"'],
  [/viewMode !== `consolidated"/g, 'viewMode !== "consolidated"'],
  [/width: `4\.5rem" \}\}/g, 'width: "4.5rem" }}'],
  [/text-muted`\s*\n/g, 'text-muted"\n'],
  [/text-muted`\s*\}/g, 'text-muted" }'],
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
