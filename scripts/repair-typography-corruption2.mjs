/** Repair remaining string corruption from typography migration */
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
  [/\{`\s*"\}/g, '{" "}'],
  [/:\s*`"\s*\}/g, ': ""}'],
  [/:\s*`"\s*:/g, ': "":'],
  [/!==\s*`";/g, '!== "";'],
  [/addEventListener\(`mousedown"/g, 'addEventListener("mousedown"'],
  [/py-4`>/g, 'py-4">'],
  [/type="button`\s+onClick/g, 'type="button" onClick'],
  [/:\s*`"\)/g, ': "")'],
  [/:\s*`"\s*\)/g, ': "")'],
  [/:\s*"—`}/g, ': "—"}'],
  [/\?\s*`"\s*:/g, '? "":'],
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
