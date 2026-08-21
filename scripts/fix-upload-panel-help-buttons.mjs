import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/components/analysis");
const files = fs
  .readdirSync(root)
  .filter((f) => f.endsWith("Dashboard.tsx"))
  .filter((f) => {
    const content = fs.readFileSync(path.join(root, f), "utf8");
    return content.includes('onClick={() => setHelpOpen((prev) => !prev)}') &&
      content.includes("도움말") &&
      content.includes('className={`rounded-lg border px-4 py-2 text-sm');
  });

const helpButtonRe =
  /<button\s+type="button"\s+onClick=\{\(\) => setHelpOpen\(\(prev\) => !prev\)\}\s+className=\{`rounded-lg border px-4 py-2 text-sm \$\{[\s\S]*?\}`\}\s+aria-expanded=\{helpOpen\}\s*>\s*도움말\s*<\/button>/g;

for (const file of files) {
  const filePath = path.join(root, file);
  let content = fs.readFileSync(filePath, "utf8");
  const next = content.replace(
    helpButtonRe,
    `<UploadPanelHelpButton active={helpOpen} onClick={() => setHelpOpen((prev) => !prev)} />`,
  );
  if (next !== content) {
    fs.writeFileSync(filePath, next);
    console.log("fixed help", file);
  }
}
