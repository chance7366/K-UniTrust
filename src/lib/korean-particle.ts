/**
 * 한글 조사 선택 유틸.
 * 대학명 등 동적으로 끼워 넣는 명사 뒤에 붙는 조사를 받침 유무에 따라 고른다.
 */

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** 마지막 글자에 받침(종성)이 있는지 판정. 한글이 아니면 null */
function hasFinalConsonant(word: string): boolean | null {
  const trimmed = word.trim();
  if (!trimmed) return null;

  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code >= HANGUL_START && code <= HANGUL_END) {
    return (code - HANGUL_START) % 28 !== 0;
  }

  // 숫자로 끝나면 읽는 소리의 받침을 따른다 (1·3·6·7·8·0 → 받침 있음)
  const digit = trimmed.slice(-1);
  if (/[0-9]/.test(digit)) {
    return ["1", "3", "6", "7", "8", "0"].includes(digit);
  }

  return null;
}

/**
 * 받침 유무에 맞는 조사를 반환한다.
 * 판정할 수 없는 경우(영문·기호 등)에는 `withFinal`을 쓴다.
 */
export function particle(
  word: string,
  withFinal: string,
  withoutFinal: string,
): string {
  const final = hasFinalConsonant(word);
  if (final == null) return withFinal;
  return final ? withFinal : withoutFinal;
}

/** `${word}은/는` */
export function topicParticle(word: string): string {
  return particle(word, "은", "는");
}

/** `${word}이/가` */
export function subjectParticle(word: string): string {
  return particle(word, "이", "가");
}
