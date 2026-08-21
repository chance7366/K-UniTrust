/** Restore template literals broken by ? " ${ → ? ` ${ */
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

function fixImports(content) {
  return content.replace(
    /import \{ FDB_TYPO \} from "@\/lib\/analysis\/finance-db-typography";\r?\n\r?\nconst tableHeadClass = `text-table-head \$\{FDB_TYPO\.tableHead\}`;\r?\n(import )/g,
    'import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";\n$1',
  ).replace(
    /(import \{ FDB_TYPO \} from "@\/lib\/analysis\/finance-db-typography";\r?\n)(import[\s\S]*?\n\n)(const tableHeadClass = `text-table-head \$\{FDB_TYPO\.tableHead\}`;\r?\n)/g,
    '$1$2',
  ).replace(
    /(import[\s\S]*?from "@\/lib\/ingest\/[^"]+";\r?\n\n)(const TABLE|const METRIC|function toMillion|function fmt)/,
    (m, imports, next) => {
      if (imports.includes('const tableHeadClass')) return m;
      if (!m.includes('FDB_TYPO')) return m;
      return `${imports}const tableHeadClass = \`text-table-head \${FDB_TYPO.tableHead}\`;\n\n${next}`;
    },
  );
}

const REPAIRS = [
  [/\? "\$\{/g, '? `${'],
  [/parts\.length \? " · \$\{/g, 'parts.length ? ` · ${'],
  [/건 저장됨\$\{parts\.length \? " · \$\{/g, '건 저장됨${parts.length ? ` · ${'],
  [/toLocaleString\("ko-KR"\)\}`/g, 'toLocaleString("ko-KR")}`'],
];

let changed = 0;
for (const file of walk(ANALYSIS)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // Move tableHeadClass after all imports
  if (content.includes('const tableHeadClass') && /const tableHeadClass[\s\S]*?\nimport /.test(content)) {
    const fdbImport = content.match(/import \{ FDB_TYPO \}[^\n]+\n/)?.[0] ?? '';
    content = content.replace(/\nconst tableHeadClass = `text-table-head \$\{FDB_TYPO\.tableHead\}`;\n/, '\n');
    if (fdbImport && !content.includes('const tableHeadClass')) {
      const lastImport = content.lastIndexOf('\nimport ');
      const endOfLastImport = content.indexOf('\n', content.indexOf('\n', lastImport) + 1);
      const insertAt = content.indexOf('\n\n', endOfLastImport);
      if (insertAt > 0) {
        content =
          content.slice(0, insertAt + 2) +
          'const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;\n\n' +
          content.slice(insertAt + 2);
      }
    }
  }

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
