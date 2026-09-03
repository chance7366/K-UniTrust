import { buildEduSettlementGuidelines } from "./settlement-guidelines";
import {
  matchCountTable,
  schoolsOf,
  sumMetric,
  trendByCohort,
  yoyCohorts,
  yoyPct,
  yoyScale,
  yoySido,
  yoyZones,
} from "./aggregate-settlement-income";
import type { SettlementIncomeKey, SettlementIncomeReportData, SettlementYoyCell } from "./settlement-income-types";
import { SETTLEMENT_INCOME_LABEL } from "./settlement-income-types";

const PALETTE = ["#1F3864", "#1D7A74", "#2E9E97", "#8A99AC", "#C3CBD6"];

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 교비 원본 천원 → 억원 */
function eok(cheon: number): string {
  if (!Number.isFinite(cheon)) return "—";
  return (cheon / 100_000).toLocaleString("ko-KR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
}

function pct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function clsPct(n: number | null): string {
  if (n == null) return "";
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "";
}

function deltaInt(a: number, b: number): string {
  const d = b - a;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d.toLocaleString("ko-KR")}`;
}

let fig = 0;
let tbl = 0;
function nextFig(chapter: number): string {
  fig += 1;
  return `그림 ${chapter}-${fig}`;
}
function nextTbl(chapter: number): string {
  tbl += 1;
  return `표 ${chapter}-${tbl}`;
}
function resetCaptions(): void {
  fig = 0;
  tbl = 0;
}

function yoyTable(
  caption: string,
  note: string,
  rows: SettlementYoyCell[],
  y0: number,
  y1: number,
): string {
  const body = rows
    .map(
      (row) => `<tr>
        <td>${esc(row.label)}</td>
        <td>${eok(row.priorSum)}</td>
        <td>${eok(row.yearSum)}</td>
        <td>${row.priorN.toLocaleString("ko-KR")}</td>
        <td>${row.yearN.toLocaleString("ko-KR")}</td>
        <td>${row.pairedN.toLocaleString("ko-KR")}</td>
        <td class="col-sum ${clsPct(row.yoyPct)}">${pct(row.yoyPct)}</td>
      </tr>`,
    )
    .join("");
  const totPrior = rows.reduce((s, r) => s + r.priorSum, 0);
  const totYear = rows.reduce((s, r) => s + r.yearSum, 0);
  const totPairedPrior = rows.reduce((s, r) => s + r.pairedPrior, 0);
  const totPairedYear = rows.reduce((s, r) => s + r.pairedYear, 0);
  const totYoy = yoyPct(totPairedPrior, totPairedYear);
  return `<div class="keep-block">
    <div class="fig"><span class="fig-label">${esc(caption)}</span> 합계(억원) · 짝지은 증감률</div>
    <table class="t-c1 t-wide"><thead><tr>
      <th>구분</th><th>${y0}</th><th>${y1}</th><th>${y0}교</th><th>${y1}교</th><th>짝</th><th class="col-sum">증감률</th>
    </tr></thead><tbody>
      ${body}
      <tr class="row-total"><td>합계</td><td>${eok(totPrior)}</td><td>${eok(totYear)}</td>
        <td>${rows.reduce((s, r) => s + r.priorN, 0)}</td>
        <td>${rows.reduce((s, r) => s + r.yearN, 0)}</td>
        <td>${rows.reduce((s, r) => s + r.pairedN, 0)}</td>
        <td class="col-sum ${clsPct(totYoy)}">${pct(totYoy)}</td></tr>
    </tbody></table>
    <p class="fig-note">${esc(note)}</p>
  </div>`;
}

function chartBlock(id: string, caption: string, note: string): string {
  return `<div class="keep-block">
    <div class="fig"><span class="fig-label">${esc(caption)}</span></div>
    <div class="chart"><canvas id="${esc(id)}"></canvas></div>
    <p class="fig-note">${esc(note)}</p>
  </div>`;
}

function highlight(rows: SettlementYoyCell[]): string {
  const withRate = rows.filter((r) => r.yoyPct != null);
  if (!withRate.length) return "짝지은 증감률을 계산할 수 있는 구간이 없습니다.";
  const min = withRate.reduce((a, b) => ((a.yoyPct ?? 0) < (b.yoyPct ?? 0) ? a : b));
  const max = withRate.reduce((a, b) => ((a.yoyPct ?? 0) > (b.yoyPct ?? 0) ? a : b));
  return `${min.label} ${pct(min.yoyPct)}, ${max.label} ${pct(max.yoyPct)} (짝지은 학교 기준).`;
}

function metricChapter(
  data: SettlementIncomeReportData,
  chapter: number,
  metrics: SettlementIncomeKey[],
  intro: string,
): { html: string; charts: ChartSpec[] } {
  resetCaptions();
  const y0 = data.priorYear;
  const y1 = data.settlementYear;
  const charts: ChartSpec[] = [];
  const parts: string[] = [];

  for (const metric of metrics) {
    const cohort = yoyCohorts(data, metric);
    parts.push(`<h3><span class="sec-no">${chapter}.${metrics.indexOf(metric) + 1}</span> ${esc(SETTLEMENT_INCOME_LABEL[metric])}</h3>`);
    const uni = cohort.find((r) => r.label === "대학");
    const jr = cohort.find((r) => r.label === "전문대학");
    parts.push(
      `<p>${esc(SETTLEMENT_INCOME_LABEL[metric])} 합계는 대학 ${eok(uni?.yearSum ?? 0)}억원(${pct(uni?.yoyPct ?? null)}), 전문대학 ${eok(jr?.yearSum ?? 0)}억원(${pct(jr?.yoyPct ?? null)})이다. 증감률은 ${y0}·${y1}년에 모두 있는 학교만 짝지었다. 연도 합계·학교 수는 그 해 매칭교 기준이다.</p>`,
    );
    parts.push(
      yoyTable(
        nextTbl(chapter),
        `출처: 교비자금(수입) × 학교코드. 단위 억원(원본 천원÷100,000). ${SETTLEMENT_INCOME_LABEL[metric]}`,
        cohort,
        y0,
        y1,
      ),
    );

    const trend = trendByCohort(data, metric);
    const cid = `c${chapter}_${metric}`;
    charts.push({
      id: cid,
      type: "line",
      labels: trend.map((r) => String(r.year)),
      datasets: [
        { label: "대학", data: trend.map((r) => r.university / 100_000), color: PALETTE[0]! },
        { label: "전문대학", data: trend.map((r) => r.junior / 100_000), color: PALETTE[1]! },
      ],
    });
    parts.push(chartBlock(cid, nextFig(chapter), `5개년 합계(억원). 연도별 매칭교 합산이며 짝지은 패널이 아니다.`));

    const zonesU = yoyZones(data, metric, "university");
    const zonesJ = yoyZones(data, metric, "junior-college");
    parts.push(
      yoyTable(
        nextTbl(chapter),
        `대학 · 5극 3특 · ${SETTLEMENT_INCOME_LABEL[metric]}`,
        zonesU,
        y0,
        y1,
      ),
    );
    parts.push(
      yoyTable(
        nextTbl(chapter),
        `전문대학 · 5극 3특 · ${SETTLEMENT_INCOME_LABEL[metric]}`,
        zonesJ,
        y0,
        y1,
      ),
    );
    const zid = `z${chapter}_${metric}`;
    charts.push({
      id: zid,
      type: "bar",
      labels: zonesU.map((r) => r.label),
      datasets: [
        { label: "대학 증감률(%)", data: zonesU.map((r) => r.yoyPct), color: PALETTE[0]! },
        {
          label: "전문대학 증감률(%)",
          data: zonesU.map((r) => zonesJ.find((x) => x.label === r.label)?.yoyPct ?? null),
          color: PALETTE[1]!,
        },
      ],
    });
    parts.push(chartBlock(zid, nextFig(chapter), `권역별 짝지은 증감률(%). 값이 없으면 그리지 않는다.`));

    parts.push(
      yoyTable(
        nextTbl(chapter),
        `대학 · 17 시·도 · ${SETTLEMENT_INCOME_LABEL[metric]}`,
        yoySido(data, metric, "university"),
        y0,
        y1,
      ),
    );
    parts.push(
      yoyTable(
        nextTbl(chapter),
        `전문대학 · 17 시·도 · ${SETTLEMENT_INCOME_LABEL[metric]}`,
        yoySido(data, metric, "junior-college"),
        y0,
        y1,
      ),
    );
    parts.push(
      yoyTable(
        nextTbl(chapter),
        `대학 · 학생규모 · ${SETTLEMENT_INCOME_LABEL[metric]}`,
        yoyScale(data, metric, "university"),
        y0,
        y1,
      ),
    );
    parts.push(
      yoyTable(
        nextTbl(chapter),
        `전문대학 · 학생규모 · ${SETTLEMENT_INCOME_LABEL[metric]}`,
        yoyScale(data, metric, "junior-college"),
        y0,
        y1,
      ),
    );
    parts.push(
      `<div class="callout">진단: 권역 ${esc(highlight(zonesU))} 대학. 전문대학 ${esc(highlight(zonesJ))} 규모 ${esc(highlight(yoyScale(data, metric, "university")))} (대학).</div>`,
    );
  }

  return { html: `<p>${esc(intro)}</p>${parts.join("\n")}`, charts };
}

type ChartSpec = {
  id: string;
  type: "line" | "bar";
  labels: string[];
  datasets: { label: string; data: Array<number | null>; color: string }[];
};

function css(): string {
  return `:root {
      --ink: #1e293b; --navy: #1F3864; --teal: #1D7A74; --teal2: #2E9E97;
      --aux: #8A99AC; --aux2: #C3CBD6; --line: #D6DDE7; --zebra: #F4F7FB;
      --sum: #EDF2F8; --muted: #475569; --rose: #be123c;
    }
    * { box-sizing: border-box; }
    html, body, .cover, .cover-kpis div, th, .ch-badge, .fig-label {
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    body { margin: 0; font-family: Pretendard, "Malgun Gothic", sans-serif; color: var(--ink); background: #e2e8f0; }
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
    h2 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 20pt; color: var(--navy); font-weight: 700; border-bottom: 2pt solid var(--navy); padding-bottom: 5px; margin: 0 0 12px; }
    h2.keep { font-size: 18pt; }
    .ch-badge { display: inline-block; background: var(--navy); color: #fff; font-size: 12pt; font-weight: 700; padding: 2px 8px; border-radius: 3px; }
    h3 { font-size: 15pt; color: var(--navy); font-weight: 700; margin: 6mm 0 8px; }
    h3 .sec-no { color: var(--teal); margin-right: 6px; }
    p, li { font-size: 12pt; line-height: 2; color: var(--muted); text-align: justify; word-break: keep-all; }
    p { margin: 0 0 10px; }
    strong { color: var(--ink); }
    .fig { margin: 5mm 0 2mm; font-size: 10.5pt; font-weight: 700; color: var(--navy); }
    .fig-label { display: inline-block; background: var(--sum); color: var(--navy); font-weight: 700; padding: 1px 7px; margin-right: 6px; border-radius: 2px; }
    .fig-note { font-size: 9.3pt; color: #64748b; margin: 2mm 0 0; }
    .chart { position: relative; width: 100%; height: 58mm; margin: 0; border: 0.6pt solid var(--line); padding: 2.5mm; }
    .chart canvas { width: 100% !important; height: 100% !important; }
    table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 10.5pt; margin: 0 0 4mm; font-variant-numeric: tabular-nums; }
    table.t-wide { font-size: 9.5pt; }
    th, td { border: 0; padding: 2.4mm 2mm; vertical-align: middle; }
    th { background: var(--navy); color: #fff; font-weight: 700; text-align: center; border-right: 1px solid rgba(255,255,255,0.28); }
    th:last-child { border-right: 0; }
    td { text-align: right; border-bottom: 0.6pt solid var(--line); }
    tbody tr:nth-child(even) td { background: var(--zebra); }
    tbody tr:last-child td { border-bottom: 1.6pt solid var(--navy); }
    tbody tr.row-total td { background: var(--sum); font-weight: 700; border-top: 1.2pt solid var(--navy); }
    td.col-sum { border-left: 1pt solid var(--line); font-weight: 700; color: var(--navy); }
    th.col-sum { color: #fff; }
    table.t-c1 td:first-child { text-align: center; }
    .up { color: var(--teal); } .down { color: var(--rose); }
    .callout { background: var(--zebra); border-left: 3pt solid var(--teal); padding: 10px 12px; margin: 12px 0 16px; font-size: 9.8pt; line-height: 1.7; }
    .toc a { color: var(--navy); text-decoration: none; display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dotted #e2e8f0; font-size: 12pt; }
    .toc .sec { font-weight: 700; }
    .meta { font-size: 10pt; color: #64748b; margin-bottom: 16px; }
    .guide { white-space: pre-wrap; font-size: 9.5pt; line-height: 1.55; background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 8px; }
    .keep-block { break-inside: avoid; page-break-inside: avoid; width: 100%; margin: 0 0 5mm; }
    .keep-block + .keep-block { margin-top: 5mm; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .doc { margin: 0; box-shadow: none; }
      .page { min-height: auto; padding: 25mm 22mm 22mm; }
      .cover { break-after: page; }
      #toc, #ch1, #ch2, #ch3, #ch4, #ch5, #guide { break-before: page; }
    }`;
}

export function buildSettlementReportHtml(data: SettlementIncomeReportData): string {
  const y = data.settlementYear;
  const y0 = data.priorYear;
  const match = matchCountTable(data);
  const matchY = schoolsOf(data, y).length;
  const matchU = schoolsOf(data, y, "university").length;
  const matchJ = schoolsOf(data, y, "junior-college").length;
  const tuition = yoyCohorts(data, "tuition");
  const under = yoyCohorts(data, "undergradFee");
  const grad = yoyCohorts(data, "gradFee");
  const gift = yoyCohorts(data, "transferGift");
  const grant = yoyCohorts(data, "grant");
  function pairedYoy(cells: SettlementYoyCell[]): number | null {
    return yoyPct(
      cells.reduce((a, b) => a + b.pairedPrior, 0),
      cells.reduce((a, b) => a + b.pairedYear, 0),
    );
  }
  const totTuition = pairedYoy(tuition);
  const statsY = data.matchByYear[y];
  const stats0 = data.matchByYear[y0];

  resetCaptions();
  const ch2 = metricChapter(
    data,
    2,
    ["tuition", "undergradFee", "gradFee"],
    `${y0}→${y} 등록금수입은 학부·대학원 수업료로 나눈다. 합계는 그 해 매칭교, 증감률은 양쪽 연도에 있는 학교만 짝짓는다.`,
  );
  const ch3 = metricChapter(
    data,
    3,
    ["transferGift", "transfer", "donation", "grant"],
    `전입및기부수입[1013]을 전입금·기부금·국고보조금으로 나눈다.`,
  );
  const ch4 = metricChapter(
    data,
    4,
    ["ancillary", "otherEdu"],
    `교육부대수입은 헤더 [1060]을 쓰고 없으면 [1006]이다. 교육외수입은 [1071]이다.`,
  );

  const opY = sumMetric(schoolsOf(data, y), "operating");
  const tuY = sumMetric(schoolsOf(data, y), "tuitionAndFees");
  const gfY = sumMetric(schoolsOf(data, y), "transferGift");
  const anY = sumMetric(schoolsOf(data, y), "ancillary");
  const otY = sumMetric(schoolsOf(data, y), "otherEdu");
  const share = (n: number) => (opY ? `${((n / opY) * 100).toFixed(1)}%` : "—");

  const allCharts = [...ch2.charts, ...ch3.charts, ...ch4.charts];
  const issued = new Date(data.generatedAt);
  const issuedLabel = `${issued.getFullYear()}년 ${issued.getMonth() + 1}월`;

  const matchRows = match
    .map((row) => {
      const d = row.year - row.prior;
      return `<tr><td>${esc(row.label)}</td><td>${row.prior}</td><td>${row.year}</td><td class="${d < 0 ? "down" : d > 0 ? "up" : ""}">${deltaInt(row.prior, row.year)}</td></tr>`;
    })
    .join("");
  const matchTot0 = match.reduce((s, r) => s + r.prior, 0);
  const matchTot1 = match.reduce((s, r) => s + r.year, 0);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${y} 교비회계 결산 종합보고서 · 수입분석</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
  <style>${css()}</style>
</head>
<body>
  <div class="toolbar">
    <span>${y}회계연도 교비회계 결산 · 수입분석 1차 · A4 세로 · 디자인 표준 v2.2</span>
    <button type="button" onclick="window.print()">인쇄 / PDF 저장</button>
  </div>
  <div class="doc">
    <section class="cover" id="cover">
      <div>
        <div class="kicker">K-UniTrust · 교비회계 결산 종합보고서</div>
        <h1>${y}회계연도<br />교비회계 결산 분석<br /><span style="font-size:22px;font-weight:700">수입분석 (1차)</span></h1>
        <p class="sub">사립 대학(일반·산업대학) 및 전문대학 · 학교코드 매칭<br />교비자금(수입) 계정코드 집계 · ${y0}→${y} 증감 · ${data.trendYears[0] ?? y0}–${y} 추세<br />학제 · 5극 3특 · 17개 시·도 · 학생규모</p>
        <div class="cover-kpis">
          <div>매칭 대상교<b>대학 ${matchU} · 전문 ${matchJ}</b></div>
          <div>등록금수입[1002] 짝 증감<b>${pct(totTuition)}</b></div>
          <div>학부수업료[1008] 짝 증감<b>${pct(pairedYoy(under))}</b></div>
          <div>대학원수업료[1009] 짝 증감<b>${pct(pairedYoy(grad))}</b></div>
          <div>전입·기부[1013] 짝 증감<b>${pct(pairedYoy(gift))}</b></div>
          <div>국고보조금[1048] 짝 증감<b>${pct(pairedYoy(grant))}</b></div>
        </div>
      </div>
      <div class="cover-foot">
        발행: ${esc(issuedLabel)} · K-UniTrust 교비회계 결산분석<br />
        출처: 재정알리미 교비자금(수입) · 대학알리미 학교코드 · 재적학생 재학생(A)<br />
        매칭 ${matchY}교 · ${y}년 자금 ${statsY?.fundRows ?? 0}행 중 ${statsY?.matchedRows ?? 0}행 · 서식: A4 세로 · 디자인 표준 v2.2.
      </div>
    </section>

    <section class="page" id="toc">
      <h2 class="keep">목 차</h2>
      <p class="meta">수입 분석 1차. 쪽번호는 제1장 첫 쪽을 1로 한다. 소절은 목차에 넣지 않는다.</p>
      <nav class="toc">
        <a class="sec" href="#ch1"><span>제1장 서론 및 분석 개요</span><span>1</span></a>
        <a class="sec" href="#ch2"><span>제2장 등록금수입 분석</span><span></span></a>
        <a class="sec" href="#ch3"><span>제3장 전입 및 기부수입 분석</span><span></span></a>
        <a class="sec" href="#ch4"><span>제4장 교육부대수입·교육외수입 분석</span><span></span></a>
        <a class="sec" href="#ch5"><span>제5장 1차 종합 진단</span><span></span></a>
        <a class="sec" href="#guide"><span>부록. 생성 지침</span><span></span></a>
      </nav>
    </section>

    <section class="page" id="ch1">
      <h2><span class="ch-badge">제1장</span> 서론 및 분석 개요</h2>
      <h3><span class="sec-no">1.1</span> 분석 배경 및 목적</h3>
      <p>${y}회계연도 교비회계 결산의 수입 구조를 계정코드 단위로 집계한다. 비교는 <strong>${y0}년 대비 ${y}년 증감</strong>과 <strong>${data.trendYears[0] ?? y - 4}–${y}년 추세</strong>다. 금액 합계는 합산, 학교당 평균은 매칭된 학교 수의 단순평균이다. 매칭 실패 학교는 0으로 채우지 않고 제외한다.</p>
      <h3><span class="sec-no">1.2</span> 대상 및 조인</h3>
      <p>분석 단위는 재정알리미 교비자금(수입) 행이다. 설립·학제·학종·지역·학교대표는 대학알리미 학교코드와 맞춘다. 코드가 없으면 학교명으로 다시 맞춘다. 사립만 넣으며 대학원·사이버·각종학교는 제외한다. 학생규모는 재적학생 재학생(A) 계·소계를 대표학교코드로 합산한다. 대학은 1만/5천, 전문대학은 4천/2천 기준이다. ${y}년 이름 매칭 ${statsY?.matchedByName ?? 0}행, ${y0}년 ${stats0?.matchedByName ?? 0}행.</p>
      <div class="keep-block">
        <div class="fig"><span class="fig-label">표 1-1</span> 매칭 대상교 수</div>
        <table class="t-c1"><thead><tr><th>구분</th><th>${y0}</th><th>${y}</th><th>증감</th></tr></thead>
          <tbody>
            ${matchRows}
            <tr class="row-total"><td>합계</td><td>${matchTot0}</td><td>${matchTot1}</td><td class="col-sum">${deltaInt(matchTot0, matchTot1)}</td></tr>
          </tbody>
        </table>
        <p class="fig-note">출처: 교비자금(수입) × 학교코드(사립·대학·전문대학). 공시 없는 학교는 제외.</p>
      </div>
      <h3><span class="sec-no">1.3</span> 계정 체계와 분석 차원</h3>
      <p>자금수입총계[1135]는 운영수입[1086], 자산및부채수입[1126], 미사용전기이월자금[1127]의 합이다. ${y}년 매칭교 운영수입 ${eok(opY)}억원 중 등록금및수강료 ${share(tuY)}, 전입및기부 ${share(gfY)}, 교육부대 ${share(anY)}, 교육외 ${share(otY)}이다. 모든 표는 학제, 5극 3특, 17개 시·도, 규모를 넣는다.</p>
      <div class="callout">진단: 학교 수가 바뀌면 합계 증감만으로 교당 수입을 단정하지 않는다. 증감률은 양쪽 연도에 모두 있는 학교만 짝지어 계산한다. ${esc(data.warnings[0] ?? "매칭·규모 안내는 부록과 생성 화면을 본다.")}</div>
    </section>

    <section class="page" id="ch2">
      <h2><span class="ch-badge">제2장</span> 등록금수입 분석</h2>
      ${ch2.html}
    </section>
    <section class="page" id="ch3">
      <h2><span class="ch-badge">제3장</span> 전입 및 기부수입 분석</h2>
      ${ch3.html}
    </section>
    <section class="page" id="ch4">
      <h2><span class="ch-badge">제4장</span> 교육부대수입·교육외수입 분석</h2>
      ${ch4.html}
    </section>
    <section class="page" id="ch5">
      <h2><span class="ch-badge">제5장</span> 1차 종합 진단</h2>
      <h3><span class="sec-no">5.1</span> 핵심 지표 요약</h3>
      <p>등록금수입[1002] 짝 증감 ${pct(totTuition)}, 전입및기부[1013] ${pct(pairedYoy(gift))}, 국고[1048] ${pct(pairedYoy(grant))}이다. ${y}년 매칭 ${matchY}교(대학 ${matchU}·전문 ${matchJ}).</p>
      <h3><span class="sec-no">5.2</span> 학제·권역·규모 교차</h3>
      <p>등록금 권역(대학) ${esc(highlight(yoyZones(data, "tuition", "university")))} 규모 ${esc(highlight(yoyScale(data, "tuition", "university")))} 전입·기부 권역 ${esc(highlight(yoyZones(data, "transferGift", "university")))}</p>
      <h3><span class="sec-no">5.3</span> 후속 분석 범위</h3>
      <p>지출·대차·운영계산서 장은 이후 붙인다. 이번 부는 수입 1차만 다룬다.</p>
      <div class="callout">${data.warnings.map((w) => esc(w)).join("<br/>") || "검증 주의 사항이 없습니다."}</div>
    </section>
    <section class="page" id="guide">
      <h2 class="keep">부록. 생성 지침</h2>
      <pre class="guide">${esc(buildEduSettlementGuidelines(y))}</pre>
    </section>
  </div>
  <script>
    const CHARTS = ${JSON.stringify(allCharts)};
    const paletteSkip = (v) => v == null || !Number.isFinite(v);
    CHARTS.forEach((spec) => {
      const el = document.getElementById(spec.id);
      if (!el || typeof Chart === "undefined") return;
      new Chart(el, {
        type: spec.type,
        data: {
          labels: spec.labels,
          datasets: spec.datasets.map((ds) => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.color,
            backgroundColor: spec.type === "bar" ? ds.color : "transparent",
            borderWidth: 2,
            tension: 0.25,
            spanGaps: true,
            pointRadius: 3,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { font: { size: 10 }, color: "#475569" } } },
          scales: {
            x: { ticks: { font: { size: 9 }, color: "#64748b" }, grid: { display: false } },
            y: { ticks: { font: { size: 9 }, color: "#64748b" }, grid: { color: "#e2e8f0" } },
          },
        },
      });
    });
  </script>
</body>
</html>`;
}
