/** Second-pass typography: footnotes, table cells, chart panels */
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

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;
  const m = content.match(/^("use client";\r?\n\r?\n)?/);
  if (m?.[0]) return content.replace(m[0], `${m[0]}${importLine}\n`);
  const firstImport = content.indexOf("import ");
  if (firstImport >= 0) {
    const lineEnd = content.indexOf("\n", firstImport);
    return `${content.slice(0, lineEnd + 1)}${importLine}\n${content.slice(lineEnd + 1)}`;
  }
  return `${importLine}\n${content}`;
}

const REPLACEMENTS = [
  [/className="border-t border-border\/40 px-3 py-2 text-\[11px\] text-muted"/g, 'className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}'],
  [/className="mt-2 text-\[11px\] text-muted"/g, 'className={`mt-2 ${FDB_TYPO.legend}`}'],
  [/className="mt-2 text-xs text-muted"/g, 'className={`mt-2 ${FDB_TYPO.legend}`}'],
  [/className="text-xs text-muted"/g, "className={FDB_TYPO.legend}"],
  [/className="mt-1 text-xs text-muted"/g, 'className={`mt-1 ${FDB_TYPO.legend}`}'],
  [/className="text-\[11px\] text-muted"/g, "className={FDB_TYPO.legend}"],
  [/className="mt-1 text-\[11px\] text-muted"/g, 'className={`mt-1 ${FDB_TYPO.legend}`}'],
  [/className="mt-0\.5 truncate text-\[11px\] text-muted"/g, 'className={`mt-0.5 truncate ${FDB_TYPO.legend}`}'],
  [/font-mono text-xs text-muted/g, 'font-mono ${FDB_TYPO.tableCode} text-muted'],
  [/font-mono text-xs/g, 'font-mono ${FDB_TYPO.tableCode}'],
  [/className="overflow-hidden border-r border-border\/40 px-2\.5 py-2\.5 text-sm font-medium"/g, 'className={`overflow-hidden border-r border-border/40 px-2.5 py-2.5 ${FDB_TYPO.tableEmphasis}`}'],
  [/className="sticky left-\[5\.5rem\] z-\[1\] border-r border-border\/40 bg-inherit px-2\.5 py-2\.5 text-sm font-medium"/g, 'className={`sticky left-[5.5rem] z-[1] border-r border-border/40 bg-inherit px-2.5 py-2.5 ${FDB_TYPO.tableEmphasis}`}'],
  [/className="rounded-lg border border-border px-3 py-1\.5 text-xs text-muted hover:text-foreground"/g, 'className={`rounded-lg border border-border px-3 py-1.5 hover:text-foreground ${FDB_TYPO.toolbarControl} text-muted`}'],
  [/className="rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"/g, 'className={`rounded-lg bg-accent-2 px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 ${FDB_TYPO.toolbarControl}`}'],
  [/className="rounded-lg border border-accent-orange\/50 bg-accent-orange\/10 px-4 py-2 text-sm font-medium text-accent-orange hover:bg-accent-orange\/20 disabled:opacity-60"/g, 'className={`rounded-lg border border-accent-orange/50 bg-accent-orange/10 px-4 py-2 text-accent-orange hover:bg-accent-orange/20 disabled:opacity-60 ${FDB_TYPO.toolbarControl}`}'],
  [/px-4 py-3 text-xs text-muted/g, 'px-4 py-3 ${FDB_TYPO.legend}'],
  [/text-\[11px\] font-bold text-muted/g, '${FDB_TYPO.legend} font-bold'],
  [/text-\[11px\] font-medium/g, '${FDB_TYPO.legend} font-medium'],
];

let changed = 0;
for (const file of walk(ANALYSIS)) {
  if (file.includes("FreshmanEnrollmentDataTable")) continue;
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  const needsFdb = REPLACEMENTS.some(([re]) => re.test(content)) && !content.includes("FDB_TYPO");
  if (needsFdb) {
    content = ensureImport(content, 'import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";');
  }

  for (const [re, rep] of REPLACEMENTS) {
    content = content.replace(re, rep);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    changed++;
    console.log("updated:", path.relative(ROOT, file));
  }
}

console.log(`\nPass 2 done. ${changed} file(s) updated.`);
