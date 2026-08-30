/**
 * 종합보고서 인쇄 CSS(표지 색)와 표 1-1 마크업을 확인한다.
 * Usage: npx tsx scripts/verify-sfa-print.ts
 */
import { chromium } from "playwright";
import path from "node:path";
import { writeFile } from "node:fs/promises";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const htmlPath = path.join(process.cwd(), "public/reports/sfa-gemini-comprehensive.html");
  const fileUrl = "file:///" + encodeURI(htmlPath.replace(/\\/g, "/"));
  await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    (window as unknown as { sfaWrapKeeps?: () => void }).sfaWrapKeeps?.();
    (window as unknown as { sfaHeadingIds?: () => void }).sfaHeadingIds?.();
    (window as unknown as { sfaForceKeepBreaks?: () => void }).sfaForceKeepBreaks?.();
    (window as unknown as { sfaFillToc?: () => void }).sfaFillToc?.();
  });

  const checks = await page.evaluate(() => {
    const cover = document.querySelector(".cover") as HTMLElement | null;
    const cs = cover ? getComputedStyle(cover) : null;
    const tocPages = [...document.querySelectorAll(".toc-page")].map((el) => el.textContent);
    const keeps = document.querySelectorAll(".keep-block").length;
    const t11 = document.body.innerHTML.includes('class="up">−8.0');
    const t11Broken = document.body.innerHTML.includes("> class=\"up\">");
    const ch2subs = [...document.querySelectorAll('nav.toc a[href^="#ch2"]')].map((a) => a.textContent?.trim());
    return {
      coverBg: cs?.backgroundColor,
      coverImage: cs?.backgroundImage?.slice(0, 80),
      keeps,
      t11,
      t11Broken,
      tocSample: tocPages.slice(0, 8),
      tocCh2: ch2subs,
    };
  });
  console.log(checks);

  await page.emulateMedia({ media: "print" });
  const printCover = await page.evaluate(() => {
    const cover = document.querySelector(".cover") as HTMLElement | null;
    const cs = cover ? getComputedStyle(cover) : null;
    return { bg: cs?.backgroundColor, img: cs?.backgroundImage?.slice(0, 100), color: cs?.color };
  });
  console.log("print cover", printCover);

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  const out = path.join(process.cwd(), "tmp-sfa-print-verify.pdf");
  await writeFile(out, pdf);
  console.log("wrote", out, pdf.length);

  await page.setViewportSize({ width: 794, height: 1123 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(process.cwd(), "tmp-sfa-print-cover.png"),
    clip: { x: 0, y: 0, width: 794, height: 1123 },
  });
  await browser.close();
}

void main();
