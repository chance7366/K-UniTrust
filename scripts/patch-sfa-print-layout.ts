/**
 * 종합보고서 HTML에 PDF 인쇄 규칙(표지 색, 목차 소절·쪽수, keep-together)을 넣는다.
 * Usage: npx tsx scripts/patch-sfa-print-layout.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PRINT_CSS = `
    .keep-block { break-inside: avoid; page-break-inside: avoid; }
    .keep-block > .fig { margin-bottom: 4px; }
    .keep-block > table, .keep-block > .chart { margin-top: 0; }
    html, body, .cover, .cover-kpis div, .guide, th {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4 portrait; margin: 14mm 14mm 18mm 14mm; }
    @page front {
      size: A4 portrait;
      margin: 0;
      @bottom-center { content: none; }
    }
    @page chapter {
      size: A4 portrait;
      margin: 14mm 14mm 18mm 14mm;
      @bottom-center {
        content: "- " counter(page) " -";
        font-family: Pretendard, "Noto Sans KR", sans-serif;
        font-size: 10pt;
        color: #475569;
      }
    }
    @media print {
      body { background: #fff; }
      .toolbar, .no-print, .report-view-toolbar { display: none !important; }
      .doc { margin: 0; box-shadow: none; max-width: none; }
      .cover {
        page: front;
        break-after: page;
        page-break-after: always;
        min-height: 297mm;
        height: 297mm;
        background-color: #0f172a !important;
        background-image: linear-gradient(180deg, #0f172a 0%, #1e3a5f 55%, #0f766e 100%) !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .cover h1, .cover .sub, .cover .kicker, .cover-foot, .cover-kpis, .cover-kpis b { color: #fff !important; }
      .cover-kpis div {
        background: rgba(255,255,255,0.12) !important;
        border-color: rgba(255,255,255,0.22) !important;
      }
      #toc { page: front; }
      #ch1 {
        page: chapter;
        break-before: page;
        page-break-before: always;
        counter-reset: page 1;
      }
      #ch2, #ch3, #ch4, #ch5, #ch6, #ch7, #ch8, #guide {
        page: chapter;
        break-before: page;
        page-break-before: always;
      }
      h2 { break-before: page; page-break-before: always; }
      h2.keep { break-before: auto; page-break-before: auto; }
      .keep-block, table, .chart {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
`;

const PRINT_JS = `
    function sfaWrapKeeps() {
      document.querySelectorAll(".fig").forEach((fig) => {
        if (fig.parentElement && fig.parentElement.classList.contains("keep-block")) return;
        const next = fig.nextElementSibling;
        if (!next) return;
        const isTable = next.tagName === "TABLE";
        const isChart = next.classList && next.classList.contains("chart");
        if (!isTable && !isChart) return;
        const wrap = document.createElement("div");
        wrap.className = "keep-block";
        fig.parentNode.insertBefore(wrap, fig);
        wrap.appendChild(fig);
        wrap.appendChild(next);
      });
    }
    function sfaHeadingIds() {
      document.querySelectorAll("section.page h3").forEach((h3) => {
        if (h3.id) return;
        const m = (h3.textContent || "").trim().match(/^(\\d+)\\.(\\d+)/);
        if (m) h3.id = "ch" + m[1] + "-" + m[2];
      });
    }
    function sfaPageHeightPx() {
      return (297 - 14 - 18) * (96 / 25.4);
    }
    function sfaEstimatePages() {
      const pageH = sfaPageHeightPx();
      const ids = ["ch1","ch2","ch3","ch4","ch5","ch6","ch7","ch8","guide"];
      const map = {};
      let page = 0;
      ids.forEach((id) => {
        const sec = document.getElementById(id);
        if (!sec) return;
        page += 1;
        map[id] = page;
        let used = 0;
        Array.from(sec.children).forEach((el) => {
          const h = el.getBoundingClientRect().height + 8;
          if (el.tagName === "H2") {
            used += h;
            return;
          }
          if (used + h > pageH && used > 40) {
            page += 1;
            used = 0;
          }
          used += h;
          if (el.id) map[el.id] = page;
          el.querySelectorAll("[id]").forEach((n) => { map[n.id] = page; });
        });
      });
      return map;
    }
    function sfaFillToc() {
      const map = sfaEstimatePages();
      document.querySelectorAll("nav.toc a[href^='#']").forEach((a) => {
        const id = a.getAttribute("href").slice(1);
        const page = map[id];
        const slot = a.querySelector(".toc-page");
        if (slot) slot.textContent = page != null ? String(page) : "";
      });
    }
    function sfaPrintReport() {
      sfaWrapKeeps();
      sfaHeadingIds();
      sfaFillToc();
      document.documentElement.classList.add("sfa-printing");
      window.print();
    }
    sfaWrapKeeps();
    sfaHeadingIds();
    window.addEventListener("load", function () { setTimeout(sfaFillToc, 400); });
    window.addEventListener("beforeprint", function () {
      sfaWrapKeeps();
      sfaHeadingIds();
      sfaFillToc();
    });
`;

const TOC = `      <nav class="toc">
        <a class="sec" href="#ch1"><span>제1장 서론 및 분석 개요</span><span class="toc-page"></span></a>
        <a class="sec" href="#ch2"><span>제2장 시장 구조 분석: 학교수 변화 진단</span><span class="toc-page"></span></a>
        <a class="sec" href="#ch3"><span>제3장 신입생 충원 심층 분석</span><span class="toc-page"></span></a>
        <a class="sec" href="#ch4"><span>제4장 재학생 충원 심층 분석</span><span class="toc-page"></span></a>
        <a class="sec" href="#ch5"><span>제5장 외국인 학생 심층 분석</span><span class="toc-page"></span></a>
        <a class="sec" href="#ch6"><span>제6장 종합 진단</span><span class="toc-page"></span></a>
        <a class="sec" href="#ch7"><span>제7장 진단 총평 및 대응전략</span><span class="toc-page"></span></a>
        <a class="sec" href="#ch8"><span>제8장 교육부 정책 제언</span><span class="toc-page"></span></a>
        <a class="sec" href="#guide"><span>부록. 보고서 작성 지침</span><span class="toc-page"></span></a>
      </nav>`;

function wrapKeeps(html: string): string {
  if (html.includes('class="keep-block"')) return html;
  return html.replace(
    /<div class="fig">([\s\S]*?)<\/div>\s*(<table[\s\S]*?<\/table>|<div class="chart">[\s\S]*?<\/div>)/g,
    `<div class="keep-block">\n      <div class="fig">$1</div>\n      $2\n      </div>`,
  );
}

function addH3Ids(html: string): string {
  return html.replace(/<h3>(\d+)\.(\d+)([^<]*)<\/h3>/g, `<h3 id="ch$1-$2">$1.$2$3</h3>`);
}

function replacePrintCss(html: string): string {
  return html.replace(
    /    @page \{ size: A4 portrait; margin: 12mm; \}[\s\S]*?    \}\n  <\/style>/,
    `${PRINT_CSS}  </style>`,
  );
}

function replaceToc(html: string): string {
  return html.replace(/<nav class="toc">[\s\S]*?<\/nav>/, TOC);
}

function fixTable11(html: string): string {
  return html.replace(
    /<td><strong> class="up">−8\.0<\/strong><\/td>/g,
    `<td><strong class="up">−8.0</strong></td>`,
  );
}

function wirePrintButton(html: string): string {
  return html
    .replace(
      `onclick="window.print()"`,
      `onclick="sfaPrintReport()"`,
    )
    .replace(
      /<\/script>\s*<\/body>/,
      `</script>\n  <script>\n${PRINT_JS}  </script>\n</body>`,
    );
}

async function patch(rel: string) {
  const file = path.join(process.cwd(), rel);
  let html = await readFile(file, "utf8");
  html = fixTable11(html);
  html = replacePrintCss(html);
  html = replaceToc(html);
  html = addH3Ids(html);
  html = wrapKeeps(html);
  html = wirePrintButton(html);
  await writeFile(file, html, "utf8");
  console.log("patched", rel, "keeps", (html.match(/keep-block/g) || []).length);
}

async function main() {
  await patch("public/reports/sfa-gemini-comprehensive.html");
  await patch("public/mockups/sfa-comprehensive-report-v2.html");
}

void main();
