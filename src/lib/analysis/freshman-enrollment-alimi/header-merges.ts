export type HeaderMergeRange = {
  s: { r: number; c: number };
  e: { r: number; c: number };
};

export type RenderHeaderCell = {
  label: string;
  colIndex: number;
  rowspan: number;
  colspan: number;
};

function colCount(headerRows: string[][]): number {
  return Math.max(0, ...headerRows.map((row) => row.length));
}

/** Excel !merges 없을 때 그리드 값으로 병합 추정 */
export function inferHeaderMerges(headerRows: string[][]): HeaderMergeRange[] {
  const rowCount = headerRows.length;
  const width = colCount(headerRows);
  const occupied = Array.from({ length: rowCount }, () =>
    Array<boolean>(width).fill(false),
  );
  const merges: HeaderMergeRange[] = [];

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < width; c++) {
      if (occupied[r]![c]) continue;

      const label = (headerRows[r]?.[c] ?? "").trim();
      if (!label) continue;

      let colspan = 1;
      while (
        c + colspan < width &&
        !(headerRows[r]?.[c + colspan] ?? "").trim()
      ) {
        colspan++;
      }

      let rowspan = 1;
      while (r + rowspan < rowCount) {
        let allEmpty = true;
        for (let dc = 0; dc < colspan; dc++) {
          if ((headerRows[r + rowspan]?.[c + dc] ?? "").trim()) {
            allEmpty = false;
            break;
          }
        }
        if (!allEmpty) break;
        rowspan++;
      }

      merges.push({
        s: { r, c },
        e: { r: r + rowspan - 1, c: c + colspan - 1 },
      });

      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          occupied[r + dr]![c + dc] = true;
        }
      }
    }
  }

  return merges;
}

export function buildHeaderRenderRows(
  headerRows: string[][],
  merges?: HeaderMergeRange[],
): RenderHeaderCell[][] {
  const rowCount = headerRows.length;
  if (rowCount === 0) return [];

  const width = colCount(headerRows);
  const ranges =
    merges && merges.length > 0 ? merges : inferHeaderMerges(headerRows);

  const covered = Array.from({ length: rowCount }, () =>
    Array<boolean>(width).fill(false),
  );
  const rows: RenderHeaderCell[][] = Array.from({ length: rowCount }, () => []);

  const sorted = [...ranges].sort(
    (a, b) => a.s.r - b.s.r || a.s.c - b.s.c,
  );

  for (const merge of sorted) {
    const { s, e } = merge;
    if (s.r >= rowCount || s.c >= width) continue;

    const rowspan = e.r - s.r + 1;
    const colspan = e.c - s.c + 1;
    const label = (headerRows[s.r]?.[s.c] ?? "").trim();

    rows[s.r]!.push({
      label,
      colIndex: s.c,
      rowspan,
      colspan,
    });

    for (let r = s.r; r <= e.r && r < rowCount; r++) {
      for (let c = s.c; c <= e.c && c < width; c++) {
        covered[r]![c] = true;
      }
    }
  }

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < width; c++) {
      if (covered[r]![c]) continue;
      const label = (headerRows[r]?.[c] ?? "").trim();
      if (!label) continue;
      let colspan = 1;
      while (
        c + colspan < width &&
        !covered[r]![c + colspan] &&
        !(headerRows[r]?.[c + colspan] ?? "").trim()
      ) {
        colspan++;
      }

      let rowspan = 1;
      while (r + rowspan < rowCount) {
        let canSpan = true;
        for (let dc = 0; dc < colspan; dc++) {
          if (
            covered[r + rowspan]![c + dc] ||
            (headerRows[r + rowspan]?.[c + dc] ?? "").trim()
          ) {
            canSpan = false;
            break;
          }
        }
        if (!canSpan) break;
        rowspan++;
      }

      rows[r]!.push({
        label,
        colIndex: c,
        rowspan,
        colspan,
      });
      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          covered[r + dr]![c + dc] = true;
        }
      }
    }
    rows[r]!.sort((a, b) => a.colIndex - b.colIndex);
  }

  return rows;
}
