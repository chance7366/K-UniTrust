import {
  FP_REPORT_NARRATIVE_SLOTS,
  type FpNarrativeSlotId,
} from "./generation-guidelines";

/** Gemini 출력에서 서술 슬롯별 문단 HTML 추출 */
export function extractFpNarratives(
  geminiText: string,
): Map<FpNarrativeSlotId, string> {
  const out = new Map<FpNarrativeSlotId, string>();
  const re =
    /<section[^>]*data-fp-narrative="([a-z-]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(geminiText)) !== null) {
    const id = match[1] as FpNarrativeSlotId;
    const body = sanitizeNarrativeHtml(match[2]);
    if (body) out.set(id, body);
  }
  return out;
}

/**
 * 강조 태그와 뒤따르는 조사 사이의 공백을 제거한다.
 * ("소진되는 <strong>2032년</strong> 에" → "… <strong>2032년</strong>에")
 * 조사 뒤에 한글이 이어지면 일반 단어이므로("2032년 이후에는") 손대지 않는다.
 */
const JOSA_AFTER_EMPHASIS =
  "으로서|으로써|으로|이라는|라는|에서|에게|부터|까지|은|는|이|가|을|를|에|의|와|과|도";

function stripSpaceBeforeJosa(html: string): string {
  return html.replace(
    new RegExp(
      `</(strong|em)>[ \\t]+(${JOSA_AFTER_EMPHASIS})(도|만|는|은)?(?![가-힣])`,
      "g",
    ),
    "</$1>$2$3",
  );
}

/** 서술 슬롯 본문 정제 — p/strong/em/br만 허용 */
function sanitizeNarrativeHtml(raw: string): string {
  let html = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .trim();

  html = html.replace(/<(?!\/?(?:p|strong|em|br)\b)[^>]*>/gi, "");

  html = stripSpaceBeforeJosa(html);

  if (!/<p[\s>]/i.test(html)) {
    const text = html.trim();
    if (!text) return "";
    html = text
      .split(/\n{2,}/)
      .map((para) => `<p>${para.trim()}</p>`)
      .join("\n");
  }
  return html.trim();
}

/**
 * 스켈레톤의 서술 placeholder에 Gemini 문단을 주입.
 * 슬롯 3개 이상 누락 시 실패 처리 (품질 보증).
 */
export function injectFpNarratives(
  skeletonHtml: string,
  narratives: Map<FpNarrativeSlotId, string>,
): string {
  const missing = FP_REPORT_NARRATIVE_SLOTS.filter(
    (slot) => !narratives.has(slot.id),
  ).map((slot) => slot.id);

  if (missing.length >= 3) {
    throw new Error(
      `Gemini 서술 슬롯 ${missing.length}개가 누락되었습니다 (${missing.join(", ")}). 보고서 생성을 다시 시도해 주세요.`,
    );
  }

  let html = skeletonHtml;
  for (const slot of FP_REPORT_NARRATIVE_SLOTS) {
    const body =
      narratives.get(slot.id) ??
      "<p>해당 서술을 생성하지 못했습니다. 보고서를 재생성해 주세요.</p>";
    html = html.replace(`<!--NARRATIVE:${slot.id}-->`, body);
  }
  return html;
}
