/**
 * 종합보고서 HTML 부록에 운영 지침(v2.1.0)을 넣고, 생성 전 검증을 한 번 돌린다.
 * Usage: npx tsx scripts/inject-sfa-comprehensive-guide.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStudentFillComprehensiveGuidelines } from "../src/lib/analysis/student-fill-analysis/build-comprehensive-guidelines";
import { validateStudentFillComprehensivePreflight } from "../src/lib/analysis/student-fill-analysis/validate-comprehensive-preflight";

function injectGuideAppendix(html: string, title: string, meta: string, text: string) {
  const sectionStart = html.indexOf('<section class="page" id="guide">');
  const sectionEnd = html.indexOf("</section>", sectionStart);
  if (sectionStart < 0 || sectionEnd < 0) throw new Error("guide section missing");
  let section = html.slice(sectionStart, sectionEnd);
  section = section.replace(/<h2>부록\. 보고서 작성 지침[^<]*<\/h2>/, `<h2>${title}</h2>`);
  section = section.replace(/<p class="meta">[^<]*<\/p>/, `<p class="meta">${meta}</p>`);
  html = html.slice(0, sectionStart) + section + html.slice(sectionEnd);

  const marker = 'document.getElementById("guide-text").textContent = `';
  const start = html.indexOf(marker);
  const end = html.indexOf("`;", start);
  if (start < 0 || end < 0) throw new Error("guide-text marker missing");
  const escaped = text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return html.slice(0, start) + marker + escaped + html.slice(end);
}

async function main() {
  const filter = {
    analysisYear: 2026,
    metro: "all" as const,
    estb: "all" as const,
    schoolKind: "all" as const,
  };
  const preflight = await validateStudentFillComprehensivePreflight(filter);
  console.log(preflight.summary);
  if (!preflight.ok) process.exitCode = 1;

  const guideText = buildStudentFillComprehensiveGuidelines(2026);
  const title = "부록. 보고서 작성 지침 (v2.2.1)";
  const meta =
    "생성 전 검증 필수. 이상치(누락·데이터 오류)는 생성 화면에 안내한다. 표·차트는 분석실행(본교 합산) 숫자로 채운다.";

  for (const rel of [
    "public/reports/sfa-gemini-comprehensive.html",
    "public/mockups/sfa-comprehensive-report-v2.html",
  ]) {
    const file = path.join(process.cwd(), rel);
    const next = injectGuideAppendix(await readFile(file, "utf8"), title, meta, guideText);
    await writeFile(file, next, "utf8");
    console.log("updated", rel);
  }
}

void main();
