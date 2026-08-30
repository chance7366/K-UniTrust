/**
 * 종합보고서 HTML에 디자인 표준 v2.2를 적용한다.
 * Usage: npx tsx scripts/apply-sfa-design-v22.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CSS = `
    :root {
      --ink: #1e293b;
      --navy: #1F3864;
      --teal: #1D7A74;
      --teal2: #2E9E97;
      --aux: #8A99AC;
      --aux2: #C3CBD6;
      --line: #D6DDE7;
      --zebra: #F4F7FB;
      --sum: #EDF2F8;
      --grid: #E4E9F0;
      --axis: #B9C2CE;
      --muted: #475569;
      --rose: #be123c;
    }
    * { box-sizing: border-box; }
    html, body, .cover, .cover-kpis div, th, .ch-badge, .fig-label {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      font-family: Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif;
      color: var(--ink);
      background: #e2e8f0;
    }
    .toolbar { position: sticky; top: 0; z-index: 20; display: flex; gap: 8px; align-items: center; justify-content: space-between; padding: 8px 16px; background: #0f172a; color: #fff; font-size: 12px; }
    .toolbar button { border: 0; border-radius: 6px; padding: 6px 12px; background: var(--teal); color: #fff; cursor: pointer; font-weight: 600; }
    .doc { width: 210mm; max-width: 210mm; margin: 16px auto 48px; background: #fff; box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12); }
    .page { width: 210mm; min-height: 297mm; padding: 25mm 22mm 22mm; }
    .cover {
      width: 210mm; min-height: 297mm; height: 297mm;
      display: flex; flex-direction: column; justify-content: space-between;
      background-color: #0f172a;
      background-image: linear-gradient(180deg, #0f172a 0%, #1F3864 55%, #1D7A74 100%);
      color: #fff; padding: 22mm 18mm;
    }
    .cover .kicker { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.8; }
    .cover h1 { font-size: 34px; line-height: 1.25; margin: 18px 0 10px; font-weight: 800; border: 0; }
    .cover .sub { font-size: 16px; opacity: 0.92; line-height: 1.6; }
    .cover-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 28px; }
    .cover-kpis div { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; padding: 10px 12px; }
    .cover-kpis b { display: block; font-size: 20px; margin-top: 4px; }
    .cover-foot { font-size: 12px; opacity: 0.85; line-height: 1.7; }
    h2 {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      font-size: 20pt; color: var(--navy); font-weight: 700;
      border-bottom: 2pt solid var(--navy); padding-bottom: 5px; margin: 0 0 12px;
    }
    h2.keep { font-size: 18pt; }
    .ch-badge {
      display: inline-block; background: var(--navy); color: #fff; font-size: 12pt;
      font-weight: 700; padding: 2px 8px; border-radius: 3px; letter-spacing: 0.02em;
    }
    h3 { font-size: 15pt; color: var(--navy); font-weight: 700; margin: 6mm 0 8px; }
    h3 .sec-no { color: var(--teal); margin-right: 6px; }
    p, li {
      font-size: 12pt; line-height: 2; color: var(--muted);
      text-align: justify; word-break: keep-all;
    }
    p { margin: 0 0 10px; }
    strong { color: var(--ink); }
    .fig {
      margin: 5mm 0 2mm; font-size: 10.5pt; font-weight: 700; color: var(--navy);
      text-align: left; width: 100%;
    }
    .fig-label {
      display: inline-block; background: var(--sum); color: var(--navy);
      font-weight: 700; padding: 1px 7px; margin-right: 6px; border-radius: 2px;
    }
    .fig-note { font-size: 9.3pt; color: #64748b; margin: 2mm 0 0; text-align: left; }
    .chart {
      position: relative; width: 100%; height: 58mm; margin: 0;
      border: 0.6pt solid var(--line); padding: 2.5mm;
    }
    .chart canvas { width: 100% !important; height: 100% !important; }
    table {
      width: 100%; table-layout: fixed; border-collapse: collapse;
      font-size: 10.5pt; margin: 0 0 4mm; font-variant-numeric: tabular-nums;
    }
    table.t-wide { font-size: 9.5pt; }
    thead { display: table-header-group; }
    th, td { border: 0; padding: 2.4mm 2mm; vertical-align: middle; }
    th {
      background: var(--navy); color: #fff; font-weight: 700; text-align: center;
      border-right: 1px solid rgba(255,255,255,0.28);
    }
    th:last-child { border-right: 0; }
    td { text-align: right; border-bottom: 0.6pt solid var(--line); }
    tbody tr:nth-child(even) td { background: var(--zebra); }
    tbody tr:last-child td { border-bottom: 1.6pt solid var(--navy); }
    tbody tr.row-total td {
      background: var(--sum); font-weight: 700;
      border-top: 1.2pt solid var(--navy);
    }
    th.col-sum, td.col-sum {
      border-left: 1pt solid var(--line); font-weight: 700; color: var(--navy);
    }
    table:has(thead th:nth-child(3).col-sum) td:nth-child(3),
    table:has(thead th:nth-child(4).col-sum) td:nth-child(4),
    table:has(thead th:nth-child(5).col-sum) td:nth-child(5),
    table:has(thead th:nth-child(6).col-sum) td:nth-child(6),
    table:has(thead th:nth-child(7).col-sum) td:nth-child(7),
    table:has(thead th:nth-child(8).col-sum) td:nth-child(8),
    table:has(thead th:nth-child(9).col-sum) td:nth-child(9),
    table:has(thead th:nth-child(10).col-sum) td:nth-child(10) {
      border-left: 1pt solid var(--line); font-weight: 700; color: var(--navy);
    }
    table.t-c1 td:first-child { text-align: center; }
    table.t-dual td:nth-child(1),
    table.t-dual td:nth-child(4) { text-align: center; }
    table.t-sido8 td:nth-child(1),
    table.t-sido8 td:nth-child(5) { text-align: center; }
    table.t-sch td:nth-child(1) { text-align: center; }
    table.t-sch td:nth-child(2) { text-align: left; }
    table.t-sch td:nth-child(n+3):nth-child(-n+7) { text-align: center; }
    table.t-61 td:first-child { text-align: center; }
    table.t-61 td:last-child { text-align: left; }
    table.t-71 td:nth-child(1) { text-align: center; }
    table.t-71 td:nth-child(2),
    table.t-71 td:nth-child(3),
    table.t-71 td:nth-child(4) { text-align: left; }
    table.t-72 td:nth-child(1) { text-align: center; }
    table.t-72 td:nth-child(2),
    table.t-72 td:nth-child(3) { text-align: left; }
    .up { color: var(--teal); } .down { color: var(--rose); }
    .callout {
      background: var(--zebra); border-left: 3pt solid var(--teal);
      padding: 10px 12px; margin: 12px 0 16px; font-size: 9.8pt; line-height: 1.7;
    }
    .warn { border-left-color: var(--rose); background: #fff1f2; }
    .toc a { color: var(--navy); text-decoration: none; display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dotted #e2e8f0; font-size: 12pt; }
    .toc .sec { font-weight: 700; margin-top: 4px; }
    .toc-page { min-width: 2.2em; text-align: right; font-variant-numeric: tabular-nums; }
    .meta { font-size: 10pt; color: #64748b; margin-bottom: 16px; }
    .guide { white-space: pre-wrap; font-size: 9.5pt; line-height: 1.55; background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 8px; overflow: auto; width: 100%; }
    .keep-block { break-inside: avoid; page-break-inside: avoid; width: 100%; margin: 0 0 5mm; }
    .keep-block + .keep-block { margin-top: 5mm; }
    .keep-block > .fig { margin: 5mm 0 2mm; }
    .keep-block > table, .keep-block > .chart { margin: 0; width: 100%; }
    @page { size: A4 portrait; margin: 0; }
    @page front { size: A4 portrait; margin: 0; @bottom-center { content: none; } }
    @page chapter {
      size: A4 portrait;
      margin: 25mm 22mm 22mm 22mm;
      @bottom-center {
        content: "- " counter(page) " -";
        font-family: Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif;
        font-size: 9pt;
        color: #6B7280;
      }
    }
    @media print {
      body { background: #fff; }
      .toolbar, .no-print, .report-view-toolbar { display: none !important; }
      .doc { margin: 0; box-shadow: none; width: 210mm; max-width: none; }
      .page { width: 210mm; min-height: auto; padding: 0; }
      #toc.page { padding: 25mm 22mm 22mm; }
      .cover {
        page: front; break-after: page; page-break-after: always;
        width: 210mm; min-height: 297mm; height: 297mm;
        background-color: #0f172a !important;
        background-image: linear-gradient(180deg, #0f172a 0%, #1F3864 55%, #1D7A74 100%) !important;
        color: #fff !important;
      }
      .cover h1, .cover .sub, .cover .kicker, .cover-foot, .cover-kpis, .cover-kpis b { color: #fff !important; }
      #toc { page: front; break-after: page; page-break-after: always; }
      #ch1, #ch2, #ch3, #ch4, #ch5, #ch6, #ch7, #ch8, #guide {
        page: chapter;
        break-before: page;
        page-break-before: always;
        break-inside: auto;
      }
      #ch1 { counter-reset: page 1; }
      h2 { break-before: auto; page-break-before: auto; }
      h2.keep { break-before: auto; page-break-before: auto; }
      .keep-block { break-inside: avoid; page-break-inside: avoid; break-before: auto; page-break-before: auto; }
    }
`;

const SUM_RE = /^(5년|증감|격차|변화|합|외탈)/;

function colWidths(n: number, cls: string): number[] {
  if (cls.includes("t-sch") && n === 10) return [6, 20, 8, 8, 8, 8, 7, 9, 8, 8];
  if (cls.includes("t-sch") && n === 9) return [6, 22, 8, 8, 8, 8, 8, 12, 12];
  if (cls.includes("t-71")) return [14, 22, 32, 32];
  if (cls.includes("t-72")) return [16, 42, 42];
  if (cls.includes("t-61")) return [22, 14, 14, 16, 34];
  if (cls.includes("t-dual")) return [14, 18, 18, 14, 18, 18];
  if (cls.includes("t-sido8")) return Array.from({ length: 8 }, () => 12.5);
  const first = n >= 7 ? 20 : n >= 5 ? 22 : 28;
  const rest = (100 - first) / Math.max(1, n - 1);
  return [first, ...Array.from({ length: n - 1 }, () => Math.round(rest * 10) / 10)];
}

function transform(html: string): string {
  html = html.replace(/<style>[\s\S]*?<\/style>/, `<style>${CSS}  </style>`);

  html = html.replace(
    /<div class="fig">(표|그림)\s+([0-9]+-[0-9]+[a-z]?)\.\s*([^<]+)<\/div>/g,
    `<div class="fig"><span class="fig-label">$1 $2</span> $3</div>`,
  );

  html = html.replace(
    /<h2>(제\d+장)\s+([^<]+)<\/h2>/g,
    `<h2><span class="ch-badge">$1</span> $2</h2>`,
  );
  html = html.replace(
    /<h2>부록\.\s*([^<]+)<\/h2>/g,
    `<h2><span class="ch-badge">부록</span> $1</h2>`,
  );

  html = html.replace(
    /<h3([^>]*)>(\d+\.\d+)\s+([^<]+)<\/h3>/g,
    `<h3$1><span class="sec-no">$2</span> $3</h3>`,
  );

  html = html.replace(/<table class="([^"]+)">\s*<thead>/g, (full, cls) => {
    if (full.includes("<colgroup>")) return full;
    return `<table class="${cls}"><thead>`;
  });

  html = html.replace(/<table class="([^"]+)"(?:[^>]*)>\s*<thead><tr>([\s\S]*?)<\/tr><\/thead>/g, (m, cls, cells) => {
    if (m.includes("<colgroup>")) return m;
    const ths = [...cells.matchAll(/<th([^>]*)>([\s\S]*?)<\/th>/g)];
    const n = ths.length;
    const wide = n >= 10 ? " t-wide" : "";
    const widths = colWidths(n, cls);
    const cols = widths.map((w) => `<col style="width:${w}%" />`).join("");
    const nextThs = ths
      .map((th, i) => {
        const text = th[2].replace(/<[^>]+>/g, "").trim();
        const extra = SUM_RE.test(text) ? ` class="col-sum"` : th[1];
        const attr = SUM_RE.test(text) ? extra : th[1];
        return `<th${attr}>${th[2]}</th>`;
      })
      .join("");
    return `<table class="${cls}${wide}"><colgroup>${cols}</colgroup><thead><tr>${nextThs}</tr></thead>`;
  });

  html = html.replace(
    /<tr>(<td[^>]*>\s*<strong>본교 합계)/g,
    `<tr class="row-total">$1`,
  );

  html = html.replace(
    /<div class="chart">(<canvas[^>]*><\/canvas>)<\/div>/g,
    `<div class="chart">$1</div>\n      <p class="fig-note">출처: 대학알리미 · 본교 합산 후 율 재계산</p>`,
  );

  const colors: [RegExp, string][] = [
    [/#0f766e/gi, "#1D7A74"],
    [/#d97706/gi, "#8A99AC"],
    [/#be123c/gi, "#1F3864"],
    [/#0369a1/gi, "#2E9E97"],
    [/#f59e0b/gi, "#8A99AC"],
    [/#94a3b8/gi, "#C3CBD6"],
    [/#1e3a5f/gi, "#1F3864"],
  ];
  const scriptStart = html.indexOf("<script>\n    const years");
  if (scriptStart >= 0) {
    let head = html.slice(0, scriptStart);
    let tail = html.slice(scriptStart);
    for (const [re, to] of colors) tail = tail.replace(re, to);
    tail = tail.replace(
      `const opt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } } };`,
      `const opt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, font: { size: 11, family: "Pretendard" } } } }, scales: { x: { ticks: { font: { size: 11 } }, grid: { color: "#E4E9F0" }, border: { color: "#B9C2CE" } }, y: { ticks: { font: { size: 11 } }, grid: { color: "#E4E9F0" }, border: { color: "#B9C2CE" } } } };`,
    );
    html = head + tail;
  }

  return html;
}

async function main() {
  for (const rel of [
    "public/reports/sfa-gemini-comprehensive.html",
    "public/mockups/sfa-comprehensive-report-v2.html",
  ]) {
    const file = path.join(process.cwd(), rel);
    const next = transform(await readFile(file, "utf8"));
    await writeFile(file, next, "utf8");
    console.log("applied v2.2", rel);
  }
}

void main();
