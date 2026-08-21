import fs from "fs";

function dedupe(filePath, buildFn) {
  let c = fs.readFileSync(filePath, "utf8");
  const marker = `export function ${buildFn}`;
  const first = c.indexOf(marker);
  const second = c.indexOf(marker, first + 1);
  if (second < 0) {
    // remove duplicate import block after first templateSampleToRow
    const dup = c.indexOf('port * as XLSX from "xlsx";');
    if (dup < 0) return;
    const buildAt = c.indexOf(marker);
    c = c.slice(0, dup) + c.slice(buildAt);
    fs.writeFileSync(filePath, c, "utf8");
    console.log("trimmed duplicate:", filePath);
    return;
  }
  c = c.slice(0, first) + c.slice(second);
  fs.writeFileSync(filePath, c, "utf8");
  console.log("deduped:", filePath);
}

dedupe(
  "src/lib/ingest/freshman-enrollment-upload.ts",
  "buildFreshmanEnrollmentTemplateBuffer",
);
dedupe(
  "src/lib/ingest/enrolled-enrollment-upload.ts",
  "buildEnrolledEnrollmentTemplateBuffer",
);
