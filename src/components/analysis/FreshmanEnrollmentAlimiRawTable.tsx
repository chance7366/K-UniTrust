"use client";

import { useRef } from "react";

import {
  VIRTUALIZE_MIN_ROWS,
  VIRTUAL_ROW_HEIGHT,
  useVirtualRowRange,
} from "@/components/analysis/use-virtual-row-range";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FRESHMAN_ENROLLMENT_ALIMI_COL } from "@/lib/analysis/freshman-enrollment-alimi/column-map";
import {
  alimiIdentityWidthClass,
  displayAlimiHeaderLabel,
  hiddenAlimiIdentityCols,
  isAlimiIdentityCenterCol,
  UNIV_ALIMI_IDENTITY_WIDTH_CSS,
} from "@/lib/analysis/univ-alimi-raw/table-chrome";
import { buildHeaderRenderRows } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type {
  FreshmanEnrollmentDatasetKind,
  RawEnrollmentRow,
} from "@/lib/analysis/freshman-enrollment-alimi/types";

import "./freshman-enrollment-alimi-table.css";

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;

const headerThBase =
  "border-r border-border/50 bg-surface-2 text-center align-middle px-2 py-1.5";

const METRIC_COL = "feam-freshman-metric-col";

function fmtDisplay(value: string): string {
  if (!value) return "—";
  const n = Number(value.replace(/,/g, ""));
  if (
    value !== "" &&
    Number.isFinite(n) &&
    /^-?\d[\d,]*(\.\d+)?$/.test(value.replace(/,/g, ""))
  ) {
    if (value.includes(".")) {
      return n.toLocaleString("ko-KR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      });
    }
    return n.toLocaleString("ko-KR");
  }
  return value;
}

/** 입학정원(A)·정원내(B)처럼 짧은 괄호 표기는 한 줄 */
function isSingleLetterParenLabel(label: string): boolean {
  return /\([A-D]\)/.test(label) && !label.includes("/");
}

function displayHeaderLabel(label: string): string {
  return label.replace(/\s+(\([A-D]\))/g, "$1");
}

/** 긴 헤더 라벨을 2줄로 (괄호 앞 / 괄호식). (A)~(D)는 한 줄 유지 */
function renderHeaderLabel(label: string): React.ReactNode {
  const text = displayAlimiHeaderLabel(label);
  if (!text) return " ";

  if (isSingleLetterParenLabel(text)) {
    return displayHeaderLabel(text);
  }

  const splitPatterns = ["(D/B)", "(C/B)"];
  for (const token of splitPatterns) {
    const idx = text.indexOf(token);
    if (idx > 0) {
      return (
        <span className="inline-block leading-snug">
          <span className="block">{text.slice(0, idx).trim()}</span>
          <span className="block text-[0.92em]">{text.slice(idx).trim()}</span>
        </span>
      );
    }
  }

  if (text.length > 10 && text.includes(" ")) {
    const mid = Math.ceil(text.length / 2);
    const spaceIdx = text.indexOf(" ", mid - 3);
    if (spaceIdx > 0 && spaceIdx < text.length - 2) {
      return (
        <span className="inline-block leading-snug">
          <span className="block">{text.slice(0, spaceIdx).trim()}</span>
          <span className="block">{text.slice(spaceIdx).trim()}</span>
        </span>
      );
    }
  }

  return text;
}

function headerClass(
  kind: FreshmanEnrollmentDatasetKind,
  rowIndex: number,
  colIndex: number,
  label: string,
  rowspan: number,
  colspan: number,
  touchesLastHeaderRow: boolean,
): string {
  const cols = FRESHMAN_ENROLLMENT_ALIMI_COL[kind];
  const isRowSpanCell = rowspan > 1;
  const isMetricLeaf = colIndex >= cols.firstMetric && colspan === 1;
  const metricCol = isMetricLeaf ? METRIC_COL : "";
  const wrapHead = isSingleLetterParenLabel(label)
    ? "whitespace-nowrap"
    : isMetricLeaf
    ? "whitespace-normal leading-snug break-words"
    : label.includes("(") || label.includes("신입생") || label.length > 8
      ? "whitespace-normal"
      : "whitespace-nowrap";
  const spanBottom = touchesLastHeaderRow ? "feam-th-rowspan-bottom" : "";
  const identityWidth = alimiIdentityWidthClass(cols, colIndex);
  const identityCenter = isAlimiIdentityCenterCol(cols, colIndex)
    ? "text-center"
    : "";
  const schoolNameClass =
    kind === "grad" &&
    (colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.schoolRep ||
      colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.gradName)
      ? "min-w-[16rem] w-[16rem]"
      : "";

  if (rowIndex === 0 && kind === "undergrad" && label.includes("신입생 충원율")) {
    return `${tableHeadClass} feam-th-rowspan ${spanBottom} ${headerThBase} ${FDB_TABLE.headGroup} ${FDB_TABLE_COLOR.rateGroup} ${metricCol} ${wrapHead}`;
  }
  if (rowIndex === 0 && kind === "undergrad" && label.includes("경쟁률")) {
    return `${tableHeadClass} feam-th-rowspan ${spanBottom} ${headerThBase} ${FDB_TABLE_COLOR.rateSecondary} ${metricCol} ${wrapHead}`;
  }
  if (colIndex === cols.year && isRowSpanCell) {
    return `${FDB_TABLE_HEAD.rowSpan} feam-th-rowspan ${spanBottom} ${headerThBase} ${identityWidth} ${identityCenter} ${wrapHead}`;
  }
  if (isRowSpanCell) {
    return `${FDB_TABLE_HEAD.rowSpan} feam-th-rowspan ${spanBottom} ${headerThBase} ${identityWidth} ${schoolNameClass} ${identityCenter} ${metricCol} ${wrapHead}`;
  }
  if (colspan > 1) {
    return `${tableHeadClass} ${headerThBase} ${FDB_TABLE.headGroup} ${wrapHead}`;
  }
  return `${tableHeadClass} ${headerThBase} ${FDB_TABLE.headSub} ${metricCol} ${wrapHead}`;
}

function fmtCellValue(
  cell: string,
  kind: FreshmanEnrollmentDatasetKind,
  colIndex: number,
  row: RawEnrollmentRow,
): string {
  if (colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL[kind].year) {
    return row.yearText || "—";
  }
  if (colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL[kind].schoolCode) {
    return row.schoolCodeStd || cell || "—";
  }
  if (kind === "grad") {
    const g = FRESHMAN_ENROLLMENT_ALIMI_COL.grad;
    if (colIndex === g.schoolRep || colIndex === g.mainBranch) {
      return cell || "—";
    }
  }
  return fmtDisplay(cell);
}

function cellClass(
  kind: FreshmanEnrollmentDatasetKind,
  colIndex: number,
): string {
  const cols = FRESHMAN_ENROLLMENT_ALIMI_COL[kind];
  const base = `border-r border-border/40 ${FDB_TABLE.cell} ${FDB_TYPO.tableBody}`;
  const metric = `${base} ${METRIC_COL} ${FDB_TYPO.tableMetric} text-right font-mono tabular-nums`;
  const identityWidth = alimiIdentityWidthClass(cols, colIndex);
  const identityCenter = isAlimiIdentityCenterCol(cols, colIndex)
    ? "text-center"
    : "";
  const schoolNameWidth =
    kind === "grad" &&
    (colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.schoolRep ||
      colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.gradName)
      ? "min-w-[16rem] w-[16rem]"
      : "";

  if (colIndex === cols.year) {
    return `${base}  ${identityWidth} text-center font-mono text-muted ${FDB_TYPO.tableCode}`;
  }
  if (kind === "undergrad" && colIndex === cols.estb) {
    return `${base}  ${identityWidth} ${identityCenter} text-muted`;
  }
  if (kind === "undergrad" && colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.undergrad.schoolName) {
    return `${base}  ${identityWidth} ${FDB_TABLE_COLOR.schoolName}`;
  }
  if (kind === "grad" && colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.schoolRep) {
    return `${base}  ${schoolNameWidth} ${FDB_TABLE_COLOR.schoolName}`;
  }
  if (kind === "grad" && colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.gradName) {
    return `${base} ${schoolNameWidth} ${FDB_TABLE_COLOR.schoolName}`;
  }
  if (
    kind === "undergrad" &&
    colIndex === FRESHMAN_ENROLLMENT_ALIMI_COL.undergrad.fillRateWithin
  ) {
    return `${metric} ${FDB_TABLE_COLOR.ratePrimary}`;
  }
  if (kind === "undergrad" && colIndex === 20) {
    return `${metric} ${FDB_TABLE_COLOR.rateSecondary}`;
  }
  if (colIndex >= cols.firstMetric) {
    return metric;
  }
  return `${base} ${identityWidth} ${identityCenter} text-muted`;
}

export function FreshmanEnrollmentAlimiRawTable({
  kind,
  headerRows,
  headerMerges,
  rows,
  displayYear,
  sheetLabel,
}: {
  kind: FreshmanEnrollmentDatasetKind;
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  rows: RawEnrollmentRow[];
  displayYear?: number | null;
  sheetLabel?: string;
}) {
  const cols = FRESHMAN_ENROLLMENT_ALIMI_COL[kind];
  const hiddenCols = hiddenAlimiIdentityCols(cols);
  const columnCount = headerRows[0]?.length ?? 0;
  const visibleColCount = Math.max(
    1,
    columnCount - [...hiddenCols].filter((i) => i >= 0 && i < columnCount).length,
  );
  const headerRenderRows = buildHeaderRenderRows(headerRows, headerMerges);
  const lastHeaderRowIndex = headerRenderRows.length - 1;
  const wrapRef = useRef<HTMLDivElement>(null);
  const virtualize = rows.length >= VIRTUALIZE_MIN_ROWS;
  const { start, end } = useVirtualRowRange(virtualize, rows.length, wrapRef);
  const visibleRows = virtualize ? rows.slice(start, end) : rows;
  const topPad = virtualize ? start * VIRTUAL_ROW_HEIGHT : 0;
  const bottomPad = virtualize ? (rows.length - end) * VIRTUAL_ROW_HEIGHT : 0;

  return (
    <div className="flex flex-col gap-2">
      {displayYear != null ? (
        <p className={`${FDB_TYPO.legend} text-muted`}>
          {displayYear}년 · {sheetLabel ?? kind} ·{" "}
          {rows.length.toLocaleString("ko-KR")}건 · 원본 {columnCount}열
        </p>
      ) : null}
      <div
        ref={wrapRef}
        className="feam-table-wrap rounded-lg border border-border/60"
      >
        <table
          className={`feam-freshman-metric-table min-w-max ${FDB_TYPO.tableBody}`}
        >
          <colgroup>
            {Array.from({ length: columnCount }).flatMap((_, i) => {
              if (hiddenCols.has(i)) return [];
              let width: string | undefined;
              if (i === cols.year) width = UNIV_ALIMI_IDENTITY_WIDTH_CSS.year;
              else if (i === cols.estb) width = UNIV_ALIMI_IDENTITY_WIDTH_CSS.estb;
              else if (
                (kind === "undergrad" &&
                  i === FRESHMAN_ENROLLMENT_ALIMI_COL.undergrad.schoolName) ||
                (kind === "grad" &&
                  (i === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.schoolRep ||
                    i === FRESHMAN_ENROLLMENT_ALIMI_COL.grad.gradName))
              ) {
                width = UNIV_ALIMI_IDENTITY_WIDTH_CSS.schoolName;
              } else if (i >= cols.firstMetric) {
                width = "5.4rem";
              }
              return [<col key={i} style={width ? { width } : undefined} />];
            })}
          </colgroup>
          <thead>
            {headerRenderRows.map((renderRow, rowIndex) => (
              <tr key={`header-${rowIndex}`} className="bg-surface-2">
                {renderRow
                  .filter((cell) => !hiddenCols.has(cell.colIndex))
                  .map((cell) => {
                  const touchesLast =
                    rowIndex + cell.rowspan - 1 >= lastHeaderRowIndex;
                  return (
                    <th
                      key={`${rowIndex}-${cell.colIndex}`}
                      rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
                      colSpan={cell.colspan > 1 ? cell.colspan : undefined}
                      className={headerClass(
                        kind,
                        rowIndex,
                        cell.colIndex,
                        cell.label,
                        cell.rowspan,
                        cell.colspan,
                        touchesLast,
                      )}
                    >
                      {renderHeaderLabel(cell.label)}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {topPad > 0 ? (
              <tr aria-hidden>
                <td
                  colSpan={visibleColCount}
                  style={{ height: topPad, padding: 0, border: 0 }}
                />
              </tr>
            ) : null}
            {visibleRows.map((row, visibleIndex) => {
              const rowIndex = virtualize ? start + visibleIndex : visibleIndex;
              return (
                <tr
                  key={`${row.schoolCodeStd}-${row.yearText}-${rowIndex}`}
                  className={`border-b border-border/40 ${
                    rowIndex % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                  data-stripe={rowIndex % 2 === 0 ? "odd" : "even"}
                >
                  {row.cells.slice(0, columnCount).map((cell, colIndex) =>
                    hiddenCols.has(colIndex) ? null : (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={cellClass(kind, colIndex)}
                    >
                      {fmtCellValue(cell, kind, colIndex, row)}
                    </td>
                    ),
                  )}
                </tr>
              );
            })}
            {bottomPad > 0 ? (
              <tr aria-hidden>
                <td
                  colSpan={visibleColCount}
                  style={{ height: bottomPad, padding: 0, border: 0 }}
                />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
