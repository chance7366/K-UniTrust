/** Fix broken className strings and add missing tableHeadClass */
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

function fixQuotedTemplateClassNames(content) {
  return content.replace(
    /className="([^"]*\$\{FDB_TYPO[^"]*)"/g,
    "className={`$1`}",
  );
}

function fixQuotedConstStrings(content) {
  return content.replace(
    /"([^"]*\$\{FDB_TYPO[^"]*)"/g,
    (match, inner) => {
      if (match.startsWith('import ') || match.includes('from "')) return match;
      return `\`${inner}\``;
    },
  );
}

function addTableHeadClass(content) {
  if (!content.includes("tableHeadClass")) return content;
  if (content.includes("const tableHeadClass")) return content;
  if (!content.includes("FDB_TYPO")) return content;

  return content.replace(
    /(import \{ FDB_TYPO \} from "@\/lib\/analysis\/finance-db-typography";\r?\n)/,
    `$1\nconst tableHeadClass = \`text-table-head \${FDB_TYPO.tableHead}\`;\n`,
  );
}

let changed = 0;
for (const file of walk(ANALYSIS)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  content = fixQuotedTemplateClassNames(content);
  content = fixQuotedConstStrings(content);
  content = addTableHeadClass(content);

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    changed++;
    console.log("fixed:", path.relative(ROOT, file));
  }
}

console.log(`\nFixed ${changed} file(s).`);
