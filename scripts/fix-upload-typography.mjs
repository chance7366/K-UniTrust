import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "src/components/analysis");

const replacements = [
  [
    'className="text-xs font-medium uppercase tracking-wide text-accent-cyan"',
    'className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}',
  ],
  [
    'className="mt-2 text-xs text-warning"',
    'className={`mt-2 ${FDB_TYPO.legend} text-warning`}',
  ],
  [
    'className="mt-2 text-xs text-accent"',
    'className={`mt-2 ${FDB_TYPO.legend} text-accent`}',
  ],
  [
    'className="mt-2 text-xs text-accent-orange"',
    'className={`mt-2 ${FDB_TYPO.legend} text-accent-orange`}',
  ],
  [
    'className="rounded-lg border border-border/60 bg-surface-2/50 p-4 text-sm text-muted"',
    'className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}',
  ],
  [
    'className="w-full basis-full rounded-lg border border-border/60 bg-surface-2/50 p-4 text-sm text-muted"',
    'className={`w-full basis-full rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}',
  ],
  [
    /className="([^"]*border-collapse text-left) text-xs"/g,
    'className={`$1 ${FDB_TYPO.tableBody}`}',
  ],
  [
    'className="mt-2 max-w-xl text-sm text-muted"',
    'className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}',
  ],
  [
    'className="px-2 py-6 text-center text-sm text-muted"',
    'className={`px-2 py-6 text-center ${FDB_TYPO.bodyText}`}',
  ],
];

function walk(p) {
  for (const name of fs.readdirSync(p)) {
    const full = path.join(p, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (name.endsWith("Dashboard.tsx")) {
      let text = fs.readFileSync(full, "utf8");
      if (!text.includes("FDB_TYPO")) continue;
      const before = text;
      for (const [from, to] of replacements) {
        if (from instanceof RegExp) text = text.replace(from, to);
        else text = text.split(from).join(to);
      }
      if (text !== before) {
        fs.writeFileSync(full, text);
        console.log("updated", path.relative(root, full));
      }
    }
  }
}

walk(dir);
