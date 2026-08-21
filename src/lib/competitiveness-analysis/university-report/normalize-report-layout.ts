/**
 * Gemini 본문 → A4 페이지 분할 · 제3부 레이아웃 정규화
 */

import type { UniversityReportSectionId } from "@/lib/competitiveness-analysis/university-report/generation-guidelines";
import type { ReportSectionPageMap } from "@/lib/competitiveness-analysis/university-report/build-report-cover-html";
import {
  mergeGroupArticleClass,
  REPORT_CHUNK_MERGE_GROUPS,
} from "@/lib/competitiveness-analysis/university-report/report-page-merge-config";

const PAGE_BREAK_RE = /<div\s+class="page-break"\s*>\s*<\/div>/gi;
const PART3_HEADING_RE =
  /<h[12]\s+class="section-title">제3부[^<]*<\/h[12]>/i;
const APPENDIX_HEADING_RE =
  /<h[12]\s+class="section-title">부록[^<]*<\/h[12]>/i;

/** page-break · 제3부 정규화 · 페이지 번호 · 목차용 섹션 페이지 매핑 */
export function paginateReportBody(bodyHtml: string): {
  html: string;
  sectionPages: ReportSectionPageMap;
} {
  const stripped = stripPaginationArtifacts(bodyHtml.trim());
  const prepared = sanitizePageBreaks(
    ensureGranularA4PageBreaks(
      ensureMajorPartPageBreaks(denormalizePart3Layout(stripped)),
    ),
  );
  const normalized = normalizePart3InHtml(prepared);
  const chunks = normalized
    .split(PAGE_BREAK_RE)
    .map((chunk) => chunk.trim())
    .filter(isMeaningfulChunk);

  const sectionPages: ReportSectionPageMap = {};
  const sectionDetectors: Array<{
    id: UniversityReportSectionId;
    test: (chunk: string) => boolean;
  }> = [
    {
      id: "executive-summary",
      test: (chunk) =>
        /report-v2-screen|Executive Summary|exec-report-header/i.test(chunk),
    },
    {
      id: "dashboard",
      test: (chunk) => /<h[12]\s+class="section-title">제1부/i.test(chunk),
    },
    {
      id: "indicator-deep",
      test: (chunk) => /<h[12]\s+class="section-title">제2부/i.test(chunk),
    },
    {
      id: "strategy-roadmap",
      test: (chunk) => /<h[12]\s+class="section-title">제3부/i.test(chunk),
    },
    {
      id: "appendix",
      test: (chunk) => /<h[12]\s+class="section-title">부록/i.test(chunk),
    },
  ];

  if (chunks.length <= 1) {
    const single = normalized;
    const isPart3 = PART3_HEADING_RE.test(single);
    const partClass = isPart3 ? " report-page-part3" : "";
    detectSectionPages(single, 1, sectionDetectors, sectionPages);
    return {
      html: `<article class="report-page report-page-body${partClass}">${single}${buildPageFooter(1)}</article>`,
      sectionPages,
    };
  }

  const mergedChunks = mergePageChunks(chunks);
  const html = mergedChunks
    .map((item, index) => {
      const pageNum = index + 1;
      detectSectionPages(item.content, pageNum, sectionDetectors, sectionPages);
      const partClass = item.part3 ? " report-page-part3" : "";
      return `<article class="report-page report-page-body${partClass}${item.mergeClass}" data-page-chunk="${pageNum}">${item.content}${buildPageFooter(pageNum)}</article>`;
    })
    .join("\n");

  return { html, sectionPages };
}

/** @deprecated paginateReportBody 사용 */
export function splitReportBodyIntoPages(bodyHtml: string): string {
  return paginateReportBody(bodyHtml).html;
}

function buildPageFooter(pageNum: number): string {
  return `\n<footer class="report-page-footer" aria-label="페이지 번호"><span class="report-page-num">${pageNum}</span></footer>`;
}

/** page-break 청크 배열을 지정 그룹대로 병합 (0-based 인덱스) */
function mergePageChunks(chunks: string[]): Array<{
  content: string;
  mergeClass: string;
  part3: boolean;
}> {
  const groupByFirstIndex = new Map<number, readonly number[]>();
  for (const group of REPORT_CHUNK_MERGE_GROUPS) {
    groupByFirstIndex.set(group[0], group);
  }

  const merged: Array<{ content: string; mergeClass: string; part3: boolean }> =
    [];
  let i = 0;
  while (i < chunks.length) {
    const group = groupByFirstIndex.get(i);
    if (
      group &&
      group.length > 1 &&
      group.every(
        (chunkIdx, offset) =>
          i + offset === chunkIdx && chunks[i + offset] != null,
      )
    ) {
      const contents = group.map((_, offset) => chunks[i + offset]);
      merged.push({
        content: contents.join("\n"),
        mergeClass: mergeGroupArticleClass(group),
        part3: contents.some((c) => PART3_HEADING_RE.test(c)),
      });
      i += group.length;
    } else {
      merged.push({
        content: chunks[i],
        mergeClass: "",
        part3: PART3_HEADING_RE.test(chunks[i]),
      });
      i += 1;
    }
  }
  return merged;
}

function detectSectionPages(
  chunk: string,
  pageNum: number,
  detectors: Array<{ id: UniversityReportSectionId; test: (chunk: string) => boolean }>,
  sectionPages: ReportSectionPageMap,
): void {
  for (const { id, test } of detectors) {
    if (sectionPages[id] == null && test(chunk)) {
      sectionPages[id] = pageNum;
    }
  }
}

function insertPageBreakBefore(html: string, headingRe: RegExp): string {
  const probe = new RegExp(
    `<div class="page-break">\\s*</div>\\s*[\\s\\S]{0,160}${headingRe.source}`,
    "i",
  );
  if (probe.test(html)) return html;
  return html.replace(headingRe, '<div class="page-break"></div>\n$&');
}

/** probe 없이 page-break 삽입 (표·표 직전 등 반드시 분할) */
function insertPageBreakBeforeForced(html: string, headingRe: RegExp): string {
  return html.replace(headingRe, '<div class="page-break"></div>\n$&');
}

/** 제1·2·3부 및 부록 — 각각 새 A4 페이지에서 시작 */
function ensureMajorPartPageBreaks(html: string): string {
  let out = html;
  out = insertPageBreakBefore(
    out,
    /<h[12]\s+class="section-title">제1부[^<]*<\/h[12]>/i,
  );
  out = insertPageBreakBefore(
    out,
    /<h[12]\s+class="section-title">제2부[^<]*<\/h[12]>/i,
  );
  out = insertPageBreakBefore(out, APPENDIX_HEADING_RE);
  return out;
}

/**
 * A4 1장 단위 세분 분할
 * - v2 Executive Dashboard: 패널(Executive Summary / Deep-Dive / Decision / SWOT / Roadmap)별
 * - 제1·2부: 소절(1.2+, 2.2+)·지표(h4)·차트 그리드별
 * - 부록: major h3 절별
 */
function ensureGranularA4PageBreaks(html: string): string {
  let out = html;

  // v2 Executive Dashboard — 패널 단위 (§2는 continued section 앞 page-break로 분할)
  out = insertPageBreakBeforeForced(out, /<div class="exec-table-wrap">/i);
  out = insertPageBreakBefore(out, /<div class="exec-panel exec-panel-dark">/i);
  out = insertPageBreakBefore(
    out,
    /<div class="exec-panel">\s*<div class="exec-panel-head">\s*<span class="exec-eyebrow">Strategic Orientation<\/span>/is,
  );
  out = insertPageBreakBefore(
    out,
    /<div class="exec-panel">\s*<div class="exec-panel-head">\s*<span class="exec-eyebrow">Action Roadmap<\/span>/is,
  );

  // 제1·2부 — 소절 1.2 / 2.2 이상은 새 페이지
  out = out.replace(
    /(<h3 class="subsection-title"[^>]*>[12]\.([2-9]|[1-9]\d+)[^<]*<\/h3>)/gi,
    (match, _g1, _g2, offset, whole) =>
      hasRecentPageBreak(whole, offset) ? match : `<div class="page-break"></div>\n${match}`,
  );

  // 부문 추세 차트 4종 — 별도 페이지
  out = insertPageBreakBefore(out, /<div class="report-chart-grid">/i);

  // 지표별 심층(표+차트) — h4 소제목마다 새 페이지 (소절 직후 첫 h4는 intro와 동일 페이지)
  out = out.replace(
    /(<h4 class="subsubsection-title"[^>]*>[^<]*<\/h4>)/gi,
    (match, _g1, offset, whole) => {
      if (hasRecentPageBreak(whole, offset)) return match;
      const before = whole.slice(Math.max(0, offset - 500), offset);
      if (
        /<h3 class="subsection-title"[^>]*>[^<]*<\/h3>(?:\s|<!--[\s\S]*?-->|<p>[\s\S]*?<\/p>)*\s*$/i.test(
          before,
        )
      ) {
        return match;
      }
      return `<div class="page-break"></div>\n${match}`;
    },
  );

  // 부록 — 2절 이상은 새 페이지
  out = out.replace(
    /(<h3 class="subsection-title"[^>]*>(?!1[\.\)])([2-9]|[1-9]\d+)[\.\)][^<]*<\/h3>)/gi,
    (match, _g1, _g2, offset, whole) => {
      if (!/<h[12]\s+class="section-title">부록/i.test(whole.slice(0, offset))) {
        return match;
      }
      return hasRecentPageBreak(whole, offset)
        ? match
        : `<div class="page-break"></div>\n${match}`;
    },
  );

  return out;
}

function hasRecentPageBreak(html: string, offset: number): boolean {
  const before = html.slice(Math.max(0, offset - 120), offset);
  return /<div class="page-break">\s*<\/div>\s*$/i.test(before);
}

function stripPaginationArtifacts(html: string): string {
  return html
    .replace(/<footer class="report-page-footer"[\s\S]*?<\/footer>/gi, "")
    .replace(/<\/?article[^>]*class="[^"]*report-page-body[^"]*"[^>]*>/gi, "");
}

function denormalizePart3Layout(html: string): string {
  return html
    .replace(/<section class="report-part report-part-3">\s*<\/article>/gi, "")
    .replace(/<section class="report-part report-part-3">\s*<\/section>/gi, "")
    .replace(/<div class="report-part report-part-3-continued">\s*/gi, "")
    .replace(/<div class="report-part report-part-3">\s*/gi, "")
    .replace(/<\/div>\s*(?=<div class="report-part report-part-3-continued">)/gi, "");
}

function sanitizePageBreaks(html: string): string {
  return html.replace(
    /<div class="page-break">(?!\s*<\/div>)/gi,
    '<div class="page-break"></div>',
  );
}

function isMeaningfulChunk(chunk: string): boolean {
  const stripped = chunk
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<\/?div[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  return stripped.length > 15;
}

function normalizePart3InHtml(html: string): string {
  if (!PART3_HEADING_RE.test(html)) {
    return html;
  }

  const part3Start = html.search(PART3_HEADING_RE);
  if (part3Start < 0) return html;

  const appendixStart = html.slice(part3Start).search(APPENDIX_HEADING_RE);
  const part3End =
    appendixStart >= 0 ? part3Start + appendixStart : html.length;

  const before = html.slice(0, part3Start).trimEnd();
  let part3 = html.slice(part3Start, part3End).trim();
  let after = html.slice(part3End).trimStart();

  // 부록 직전 Gemini 주석·page-break 잔여물 제거
  after = after.replace(/^<!--[\s\S]*?-->\s*/i, "").trimStart();
  part3 = part3
    .replace(/<!--[\s\S]*?부록[\s\S]*?-->\s*$/i, "")
    .replace(/<div class="page-break">\s*<\/div>\s*$/i, "")
    .trim();

  part3 = transformPart3Content(part3);

  const segments = [before, part3, after].filter(Boolean);
  return segments.join('\n<div class="page-break"></div>\n');
}

function transformPart3Content(part3: string): string {
  let out = part3;

  out = convertPart3SwotMatrixTable(out);
  out = convertPart3SwotBullets(out);
  out = convertPart3RoadmapTable(out);
  out = convertPart3RoadmapNarrative(out);

  const part33Idx = out.search(/<h[23]\s+class="subsection-title">3\.3/i);
  if (part33Idx >= 0) {
    const before33 = out.slice(0, part33Idx).trim();
    const from33 = out.slice(part33Idx).trim();
    return `<div class="report-part report-part-3">\n${before33}\n</div>\n<div class="page-break"></div>\n<div class="report-part report-part-3-continued">\n${from33}\n</div>`;
  }

  return `<div class="report-part report-part-3">\n${out}\n</div>`;
}

/** 3.2 SWOT 매트릭스 표 → 2×2 카드 */
function convertPart3SwotMatrixTable(html: string): string {
  const blockRe =
    /(<h[23]\s+class="subsection-title">3\.2[\s\S]*?<\/h[23]>)\s*<table class="data-table">([\s\S]*?)<\/table>/i;
  const match = html.match(blockRe);
  if (!match || !/(?:강점|Strength|약점|Weakness)/i.test(match[2])) {
    return html;
  }

  const strategyBlock = html.match(
    /<h4 class="subsubsection-title">\[(?:전략적 방향성|SO|SWOT)/i,
  );
  const strategyHtml = strategyBlock
    ? html.slice(html.indexOf(strategyBlock[0])).match(
        /<h4 class="subsubsection-title">[\s\S]*?(?=<h[23]\s+class="subsection-title">3\.3|$)/i,
      )?.[0] ?? ""
    : "";

  const cardsFromBullets = strategyHtml ? buildSwotCardsFromBullets(strategyHtml) : [];
  if (cardsFromBullets.length >= 2) {
    return html.replace(
      blockRe,
      `$1\n<div class="swot-grid report-part3-swot">${cardsFromBullets.join("")}</div>\n${strategyHtml ? "" : ""}`,
    ).replace(strategyHtml, "");
  }

  return html.replace(
    blockRe,
    `$1\n<p class="report-part3-note">SWOT 매트릭스는 Executive Dashboard(v2) SWOT 패널과 연계됩니다. 아래 전략 방향성을 참조하십시오.</p>`,
  );
}

/** • SO / • ST … 불릿 → SWOT 카드 */
function convertPart3SwotBullets(html: string): string {
  if (html.includes("report-part3-swot")) return html;

  const blockRe =
    /(<h[23]\s+class="subsection-title">3\.2[\s\S]*?<\/h[23]>)([\s\S]*?)(<h[23]\s+class="subsection-title">3\.3)/i;
  const match = html.match(blockRe);
  if (!match || !/(?:\(SO\)|\(ST\)|\(WO\)|\(WT\)|\[SO|\[ST|\[WO|\[WT|[•·]\s*(?:SO|ST|WO|WT))/i.test(match[2])) {
    return html;
  }

  const cards = buildSwotCardsFromBullets(match[2]);
  if (cards.length < 2) return html;

  const intro = match[2].match(/^\s*(<p>(?![\s\S]*[•·]\s*(?:SO|ST|WO|WT))[\s\S]*?<\/p>)/i)?.[1] ?? "";
  const cleaned = match[2].replace(
    /<p>\s*<strong>(?:\[[^\]]*\((?:SO|ST|WO|WT)\)|\[?\s*(?:SO|ST|WO|WT))[\s\S]*?<\/p>/gi,
    "",
  );

  return html.replace(
    blockRe,
    `$1\n${intro}${cleaned}\n<div class="swot-grid report-part3-swot">${cards.join("")}</div>\n$3`,
  );
}

function buildSwotCardsFromBullets(body: string): string[] {
  const cards: string[] = [];
  const toneMap: Record<string, string> = {
    SO: "swot-so",
    ST: "swot-st",
    WO: "swot-wo",
    WT: "swot-wt",
  };

  for (const key of ["SO", "ST", "WO", "WT"] as const) {
    const paraRe = new RegExp(
      `<p>\\s*<strong>\\[[^<]*\\(${key}\\)[^<]*<\\/strong>\\s*([^<]*(?:<(?!\\/p>)[^<]*)*)<\\/p>|<p>\\s*<strong>\\[?\\s*${key}[^<]*<\\/strong>\\s*([^<]*(?:<(?!\\/p>)[^<]*)*)<\\/p>`,
      "i",
    );
    const para = body.match(paraRe);
    if (!para) continue;

    const title = stripTags(para[0].match(/<strong>([\s\S]*?)<\/strong>/i)?.[1] ?? key);
    const action = stripTags(para[1] ?? para[2] ?? "");

    cards.push(`<article class="swot-card ${toneMap[key]}">
      <div class="swot-tag">${escapeHtml(key)}</div>
      <h3 class="swot-title">${escapeHtml(title.replace(/^[•·]\s*/, ""))}</h3>
      <p class="swot-body">${escapeHtml(action)}</p>
    </article>`);
  }

  return cards;
}

/** 3.2 로드맵 표(구분·과제명) → roadmap-list */
function convertPart3RoadmapTable(html: string): string {
  const blockRe =
    /(<h[23]\s+class="subsection-title">3\.2[\s\S]*?<\/h[23]>)\s*<table class="data-table">([\s\S]*?)<\/table>/i;
  const match = html.match(blockRe);
  if (!match || !/(?:과제명|주요 실행|구분)/.test(match[2])) {
    return html;
  }

  const items = buildRoadmapItemsFromRows([...match[2].matchAll(/<tr>\s*([\s\S]*?)<\/tr>/gi)]);
  if (!items.length) return html;

  return html.replace(
    blockRe,
    `$1\n<div class="roadmap-list report-part3-roadmap">${items.join("")}</div>`,
  );
}

/** 3.3 서술형 로드맵 → roadmap-list */
function convertPart3RoadmapNarrative(html: string): string {
  if (html.includes("report-part3-roadmap")) return html;

  const blockRe =
    /(<h[23]\s+class="subsection-title">3\.3[\s\S]*?<\/h[23]>)([\s\S]*?)$/i;
  const match = html.match(blockRe);
  if (!match) return html;

  const body = match[2];
  const items: string[] = [];

  const bracketItems = [
    ...body.matchAll(
      /<p>\s*<strong>\[([\s\S]*?)\]<\/strong>(?:<br\s*\/?>)?\s*([\s\S]*?)<\/p>/gi,
    ),
  ];
  if (bracketItems.length > 0) {
    for (const para of bracketItems) {
      pushRoadmapItem(items, stripTags(para[1]), stripTags(para[2]));
    }
  } else {
    const shortBlock = body.match(
      /<p>\s*<strong>단기[^<]*<\/strong>\s*<\/p>([\s\S]*?)(?=<p>\s*<strong>중장기|$)/i,
    );
    const midBlock = body.match(
      /<p>\s*<strong>중장기[^<]*<\/strong>\s*<\/p>([\s\S]*?)$/i,
    );
    if (shortBlock) {
      pushRoadmapItem(items, "단기 과제 (1년 이내)", collectParagraphText(shortBlock[1]));
    }
    if (midBlock) {
      pushRoadmapItem(items, "중장기 과제 (2~3년)", collectParagraphText(midBlock[1]));
    }
  }

  if (!items.length) return html;

  const intro = body.match(/^\s*(<p>(?!\s*<strong>(?:\[|단기|중장기))[\s\S]*?<\/p>)/i)?.[1] ?? "";
  return html.replace(
    blockRe,
    `$1\n${intro}\n<div class="roadmap-list report-part3-roadmap">${items.join("")}</div>`,
  );
}

function collectParagraphText(fragment: string): string {
  return [...fragment.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean)
    .join(" ");
}

function pushRoadmapItem(items: string[], phaseLabel: string, bodyText: string): void {
  if (!bodyText.trim()) return;
  const isShort = /단기|1~2|1년|2년/.test(phaseLabel);
  items.push(`<article class="roadmap-item ${isShort ? "roadmap-short" : "roadmap-mid"}">
      <div class="roadmap-head">
        <span class="roadmap-phase${isShort ? "" : " roadmap-phase-mid"}">${escapeHtml(isShort ? "단기 긴급 (1~2년)" : "중장기 구조 (3~5년)")}</span>
        <h3 class="roadmap-title">${escapeHtml(phaseLabel)}</h3>
      </div>
      <p class="roadmap-body">${escapeHtml(bodyText)}</p>
    </article>`);
}

function buildRoadmapItemsFromRows(rows: RegExpMatchArray[]): string[] {
  const items: string[] = [];

  for (const row of rows) {
    if (row[1].includes("<th>")) continue;
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
      stripTags(c[1]).trim(),
    );
    if (cells.length < 3) continue;

    const phaseRaw = cells[0];
    const isShort = /단기|1년/.test(phaseRaw);
    const phase = isShort ? "단기 긴급 (1년 이내)" : "중장기 구조 (2~3년)";

    items.push(`<article class="roadmap-item ${isShort ? "roadmap-short" : "roadmap-mid"}">
      <div class="roadmap-head">
        <span class="roadmap-phase${isShort ? "" : " roadmap-phase-mid"}">${escapeHtml(phase)}</span>
        <h3 class="roadmap-title">${escapeHtml(cells[1] ?? "")}</h3>
      </div>
      <p class="roadmap-body">${escapeHtml(cells[2] ?? "")}</p>
      ${cells[3] ? `<p class="roadmap-kpi"><strong>관련 지표:</strong> ${escapeHtml(cells[3])}</p>` : ""}
    </article>`);
  }

  return items;
}

function stripTags(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
