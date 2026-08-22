import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const file =
  process.argv[2] ?? "data/reports/competitiveness/2025/0000032/report.html";
const html = fs.readFileSync(file, "utf8");

const pages = html.match(/<article class="report-page[ "]/g) || [];
console.log("total pages:", pages.length);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
await page.goto("file://" + path.resolve(file));
await page.waitForTimeout(400);

const metrics = await page.evaluate(() => {
  const mmToPx = (mm) => {
    const el = document.createElement("div");
    el.style.height = mm + "mm";
    document.body.appendChild(el);
    const px = el.getBoundingClientRect().height;
    el.remove();
    return px;
  };
  const a4 = mmToPx(297);
  return [...document.querySelectorAll("article.report-page")].map((el, i) => {
    const firstTitle =
      el.querySelector("h1, h2, .exec-eyebrow, .cover-main-title")?.textContent?.trim().slice(0, 40) ?? "";
    const contentH = [...el.children].reduce(
      (acc, c) => acc + c.getBoundingClientRect().height,
      0,
    );
    return {
      idx: i + 1,
      heightPx: Math.round(el.getBoundingClientRect().height),
      a4: Math.round(a4),
      fillPct: Math.round((contentH / (a4 - mmToPx(43))) * 100),
      firstTitle,
    };
  });
});

for (const m of metrics) {
  const over = m.heightPx > m.a4 + 2 ? ` OVERFLOW+${m.heightPx - m.a4}px` : "";
  console.log(
    `p${String(m.idx).padStart(2)}: h=${m.heightPx}px fill=${String(m.fillPct).padStart(3)}%${over} | ${m.firstTitle}`,
  );
}

const shotIdx = process.argv[3]
  ? process.argv[3].split(",").map(Number)
  : [];
for (const i of shotIdx) {
  const el = page.locator(`article.report-page`).nth(i - 1);
  await el.screenshot({ path: `scripts/comp-report-p${i}.png` });
}
if (shotIdx.length) console.log("screenshots saved");

await browser.close();
