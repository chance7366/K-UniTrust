import fs from "node:fs";
import path from "node:path";

const ANALYSIS = path.resolve(import.meta.dirname, "..", "src/components/analysis");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith("DataTable.tsx")) acc.push(full);
  }
  return acc;
}

for (const file of walk(ANALYSIS)) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("tableHeadClass") || content.includes("const tableHeadClass")) continue;

  if (!content.includes("FDB_TYPO")) {
    content = `import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";\n${content}`;
  }

  const insert = "const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;\n\n";
  content = content.replace(/(\nimport[^\n]+\n)(\n(?:const|function|export ))/, `$1\n${insert}$2`);

  fs.writeFileSync(file, content, "utf8");
  console.log("added tableHeadClass:", path.basename(file));
}
