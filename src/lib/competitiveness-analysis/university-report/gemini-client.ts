const DEFAULT_MODEL = "gemini-3.6-flash";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number };
};

export type GeminiGenerateResult = {
  text: string;
  model: string;
};

function extractText(response: GeminiGenerateResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? "").join("").trim();
  if (!text) {
    const reason = response.candidates?.[0]?.finishReason ?? "UNKNOWN";
    throw new Error(`Gemini 응답 본문이 비어 있습니다. (finishReason: ${reason})`);
  }
  return text;
}

export async function generateGeminiText(args: {
  systemInstruction: string;
  userPrompt: string;
  model?: string;
}): Promise<GeminiGenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const model = args.model ?? DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: {
      parts: [{ text: args.systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: args.userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 65536,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as GeminiGenerateResponse;

  if (!res.ok) {
    const message =
      json.error?.message ??
      `Gemini API 오류 (HTTP ${res.status})`;
    throw new Error(message);
  }

  return {
    text: extractText(json),
    model,
  };
}

import { reportA4Styles } from "@/lib/competitiveness-analysis/university-report/report-a4-styles";

/** Gemini가 markdown fence로 감싼 HTML을 반환할 때 본문만 추출 */
export function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:html)?\s*([\s\S]*?)```\s*$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

/** Gemini가 전체 HTML 문서를 반환한 경우 body 내부만 사용 */
export function extractReportBodyHtml(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1].trim() : html;

  const bodyChunks = extractReportPageBodyChunks(content);
  if (bodyChunks.length > 0) {
    return bodyChunks.join('\n<div class="page-break"></div>\n');
  }

  return content
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .trim();
}

/** reinject 시 v2·Insights 재주입 대상 — Gemini 본문 청크만 유지 */
function isGeminiBodyChunk(chunk: string): boolean {
  if (/report-part-3|제3부/.test(chunk)) return true;
  if (
    /report-v2-insights|report-v2-screen|report-v2-continued|exec-report-header|Indicator Deep-Dive|Decision Insight|Strategic Orientation|Action Roadmap|<!-- §[23]/i.test(
      chunk,
    )
  ) {
    return false;
  }
  if (/^<div class="exec-panel"/i.test(chunk.trim())) return false;
  return true;
}

/** report-page-body article 내부만 추출 (swot-card 등 중첩 article 무시) */
function extractReportPageBodyChunks(content: string): string[] {
  const results: string[] = [];
  const openRe = /<article[^>]*class="[^"]*report-page-body[^"]*"[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = openRe.exec(content)) !== null) {
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;

    while (i < content.length && depth > 0) {
      const nextOpen = content.indexOf("<article", i);
      const nextClose = content.indexOf("</article>", i);
      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 8;
        continue;
      }

      depth -= 1;
      if (depth === 0) {
        results.push(content.slice(start, nextClose).trim());
        openRe.lastIndex = nextClose + 10;
        break;
      }
      i = nextClose + 10;
    }
  }

  return results.filter(isGeminiBodyChunk);
}

export function wrapReportHtml(args: {
  title: string;
  coverHtml: string;
  bodyHtml: string;
  generatedAt: string;
}): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(args.title)}</title>
  <style>${reportA4Styles()}</style>
</head>
<body>
  <div class="report-shell">
    <article class="report-page report-page-cover">
      ${args.coverHtml}
    </article>
    ${args.bodyHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
