import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/components/analysis");
const files = fs
  .readdirSync(root)
  .filter((f) => f.endsWith("Dashboard.tsx"))
  .filter((f) => {
    const content = fs.readFileSync(path.join(root, f), "utf8");
    return content.includes("엑셀 파일 선택");
  });

const importLine = `import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";
`;

for (const file of files) {
  const filePath = path.join(root, file);
  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes("UploadPanelTemplateLink")) {
    content = content.replace(
      /^("use client";\r?\n\r?\n)/,
      `$1${importLine}\n`,
    );
  }

  content = content.replace(
    /<a\s+href="([^"]+)"\s+download="([^"]+)"\s+className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-center text-sm hover:bg-accent\/10 hover:text-accent"\s*>\s*양식down\s*<\/a>/g,
    `<UploadPanelTemplateLink href="$1" download="$2" />`,
  );

  content = content.replace(
    /<button\s+type="button"\s+disabled=\{pending\}\s+onClick=\{\(\) => inputRef\.current\?\.click\(\)\}\s+className="rounded-lg border border-accent\/40 bg-surface-2 px-4 py-2 text-sm hover:bg-accent\/10 hover:text-accent disabled:opacity-60"\s*>\s*\{pending \? "업로드 중…" : "엑셀 파일 선택"\}\s*<\/button>/g,
    `<UploadPanelSelectButton disabled={pending} pending={pending} onClick={() => inputRef.current?.click()} />`,
  );

  content = content.replace(
    /<button\s+type="button"\s+onClick=\{onClose\}\s+className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-center text-sm text-muted hover:bg-surface hover:text-foreground"\s*>\s*숨기기\s*<\/button>/g,
    `<UploadPanelHideButton onClick={onClose} />`,
  );

  content = content.replace(
    /<button type="button" onClick=\{onClose\} className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-center text-sm text-muted hover:bg-surface hover:text-foreground">\s*숨기기\s*<\/button>/g,
    `<UploadPanelHideButton onClick={onClose} />`,
  );

  content = content.replace(
    /<button\s+type="button"\s+onClick=\{\(\) => setHelpOpen\(\(prev\) => !prev\)\}\s+className=\{`rounded-lg border px-4 py-2 text-sm \$\{helpOpen \? "border-accent bg-accent\/15 text-accent" : "border-border bg-surface-2 text-muted hover:bg-surface hover:text-foreground"\}`\}\s+aria-expanded=\{helpOpen\}\s*>\s*도움말\s*<\/button>/g,
    `<UploadPanelHelpButton active={helpOpen} onClick={() => setHelpOpen((prev) => !prev)} />`,
  );

  fs.writeFileSync(filePath, content);
  console.log("updated", file);
}

console.log(`done: ${files.length} files`);
