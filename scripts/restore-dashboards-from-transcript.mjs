import fs from "node:fs";
import path from "node:path";

const transcriptPath =
  "C:/Users/yckim/.cursor/projects/d-K-UniTrust-Dashborad/agent-transcripts/9d65aa45-f1b8-4bde-9f11-685c6fc5477a/9d65aa45-f1b8-4bde-9f11-685c6fc5477a.jsonl";

const root = path.resolve("src/components/analysis");
const latest = new Map();

for (const line of fs.readFileSync(transcriptPath, "utf8").split("\n")) {
  if (!line.trim()) continue;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }
  const content = obj.message?.content;
  if (!Array.isArray(content)) continue;
  for (const part of content) {
    if (part.type !== "tool_use") continue;
    const input = part.input;
    if (!input?.path) continue;
    const normalized = input.path.replace(/\\/g, "/");
    if (!normalized.includes("src/components/analysis/")) continue;
    if (!normalized.endsWith("Dashboard.tsx")) continue;
    if (part.name === "Write" && typeof input.contents === "string") {
      latest.set(path.basename(normalized), input.contents);
    }
  }
}

console.log(`Found ${latest.size} dashboard writes in transcript`);
for (const [name, contents] of latest) {
  const target = path.join(root, name);
  if (!fs.existsSync(target)) {
    console.log("skip missing target", name);
    continue;
  }
  const fixed = contents.replace(
    /className="mx-auto flex max-w-7xl flex-col gap-4 pb-10"/g,
    'className="flex w-full flex-col gap-4 pb-10"',
  ).replace(
    /className="mx-auto flex max-w-\[1600px\] flex-col gap-4 pb-10"/g,
    'className="flex w-full flex-col gap-4 pb-10"',
  );
  fs.writeFileSync(target, fixed, "utf8");
  console.log("restored", name, fixed.length);
}
