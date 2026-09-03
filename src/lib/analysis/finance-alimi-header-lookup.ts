export function parseFinanceAlimiCells(raw: string | undefined): string[] {
  try {
    const cells = JSON.parse(raw ?? "[]") as unknown;
    return Array.isArray(cells) ? cells.map((c) => String(c ?? "")) : [];
  } catch {
    return [];
  }
}

export function parseFinanceAlimiNum(value: string | undefined): number {
  if (value == null) return 0;
  const text = value.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!text || text === "-" || text === "—" || text === "–") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

export function financeAlimiHeaderRow(
  meta: { headerRows?: string[][] } | null | undefined,
): string[] {
  const row = meta?.headerRows?.[0];
  return Array.isArray(row) ? row.map((c) => String(c ?? "")) : [];
}

export function indexByAccountCode(headers: string[], code: string): number {
  const token = String(code).replace(/[\[\]]/g, "");
  if (!token) return -1;
  const re = new RegExp(`\\[${token}\\]`);
  return headers.findIndex((h) => re.test(h));
}

export function indexByHeaderLabel(headers: string[], label: string): number {
  const exact = headers.findIndex((h) => h === label);
  if (exact >= 0) return exact;
  return headers.findIndex((h) => h.includes(label));
}

function pickIndex(
  headers: string[],
  found: number,
  fallback: number,
): number {
  return found >= 0 ? found : fallback;
}

export function numByAccountCode(
  cells: string[],
  headers: string[],
  code: string,
  fallbackIndex: number,
): number {
  const index = pickIndex(headers, indexByAccountCode(headers, code), fallbackIndex);
  return parseFinanceAlimiNum(cells[index]);
}

/** 헤더에 있는 첫 계정코드를 쓴다. 없으면 fallback 열. */
export function numByAccountCodes(
  cells: string[],
  headers: string[],
  codes: readonly string[],
  fallbackIndex: number,
): number {
  for (const code of codes) {
    const found = indexByAccountCode(headers, code);
    if (found >= 0) return parseFinanceAlimiNum(cells[found]);
  }
  return parseFinanceAlimiNum(cells[fallbackIndex]);
}

export function numByHeaderLabel(
  cells: string[],
  headers: string[],
  label: string,
  fallbackIndex: number,
): number {
  const index = pickIndex(headers, indexByHeaderLabel(headers, label), fallbackIndex);
  return parseFinanceAlimiNum(cells[index]);
}
