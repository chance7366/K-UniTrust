import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/components/analysis");
for (const file of fs.readdirSync(root)) {
  if (!file.endsWith("Dashboard.tsx")) continue;
  const p = path.join(root, file);
  const data = fs.readFileSync(p);
  try {
    const t = data.toString("utf8");
    const bad =
      t.includes('return "??') ||
      t.includes("?�") ||
      t.includes("mx-auto flex max-w-7xl");
    if (bad) console.log("needs fix:", file);
  } catch (e) {
    console.log("invalid:", file, e.message);
  }
}
