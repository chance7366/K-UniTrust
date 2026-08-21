import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(".");
const nextDir = path.join(projectRoot, ".next");
const outDir = path.join(projectRoot, "src/components/analysis");

const recovered = new Map();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".map")) processMap(full);
  }
}

function processMap(mapPath) {
  let raw;
  try {
    raw = fs.readFileSync(mapPath, "utf8");
  } catch {
    return;
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return;
  }

  for (const section of json.sections ?? []) {
    const map = section.map ?? section;
    const sources = map.sources ?? [];
    const contents = map.sourcesContent ?? [];
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const content = contents[i];
      if (!source || !content) continue;
      if (!source.includes("src/components/analysis/")) continue;
      if (!source.endsWith("Dashboard.tsx")) continue;
      const name = path.basename(source);
      const prev = recovered.get(name);
      if (!prev || content.length > prev.length) {
        recovered.set(name, content);
      }
    }
  }

  // Some maps use top-level sources/sourcesContent
  if (json.sources && json.sourcesContent) {
    for (let i = 0; i < json.sources.length; i++) {
      const source = json.sources[i];
      const content = json.sourcesContent[i];
      if (!source || !content) continue;
      if (!source.includes("src/components/analysis/")) continue;
      if (!source.endsWith("Dashboard.tsx")) continue;
      const name = path.basename(source);
      const prev = recovered.get(name);
      if (!prev || content.length > prev.length) {
        recovered.set(name, content);
      }
    }
  }
}

walk(nextDir);

for (const [name, content] of recovered) {
  const fixed = content
    .replace(
      /className="mx-auto flex max-w-7xl flex-col gap-4 pb-10"/g,
      'className="flex w-full flex-col gap-4 pb-10"',
    )
    .replace(
      /className="mx-auto flex max-w-\[1600px\] flex-col gap-4 pb-10"/g,
      'className="flex w-full flex-col gap-4 pb-10"',
    );
  const target = path.join(outDir, name);
  if (!fs.existsSync(target)) continue;
  fs.writeFileSync(target, fixed, "utf8");
  console.log("recovered", name, fixed.length);
}

console.log("total", recovered.size);
