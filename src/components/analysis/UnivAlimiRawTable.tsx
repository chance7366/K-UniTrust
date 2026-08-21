"use client";

import { useRef } from "react";

import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { buildHeaderRenderRows } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type { HeaderMergeRange } from "@/lib/analysis/freshman-enrollment-alimi/header-merges";
import type { UnivAlimiColMap, UnivAlimiRawRow } from "@/lib/analysis/univ-alimi-raw/types";
import {
  alimiIdentityWidthClass,
  displayAlimiHeaderLabel,
  hiddenAlimiIdentityCols,
  isAlimiIdentityCenterCol,
  UNIV_ALIMI_IDENTITY_WIDTH_CSS,
} from "@/lib/analysis/univ-alimi-raw/table-chrome";
import {
  VIRTUALIZE_MIN_ROWS,
  VIRTUAL_ROW_HEIGHT,
  useVirtualRowRange,
} from "@/components/analysis/use-virtual-row-range";

import "./freshman-enrollment-alimi-table.css";

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;
const headerThBase =
  "border-r border-border/50 bg-surface-2 text-center align-middle px-2 py-1.5";

/** 출신학교 · 학교명 우측 리프 열 너비 (일반고 학생수/비율 기준) */
const ORIGIN_SCHOOL_METRIC_COL = "w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem]";
const UNIFORM_METRIC_COL = "feam-metric-col";

function uniformColStart(cols: UnivAlimiColMap): number {
  return cols.gradName != null ? cols.gradName + 1 : cols.firstMetric;
}

function leafHeaderOfColumn(headerRows: string[][], colIndex: number): string {
  for (let r = headerRows.length - 1; r >= 0; r--) {
    const v = headerRows[r]?.[colIndex]?.trim();
    if (v) return v;
  }
  return "";
}

function isRatioColumn(headerRows: string[][], colIndex: number): boolean {
  return leafHeaderOfColumn(headerRows, colIndex) === "비율";
}

function wrapOriginSchoolHeader(
  label: string,
  colspan = 1,
): React.ReactNode {
  const t = label.trim();
  if (!t) return " ";

  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 2) {
    return (
      <span className="inline-block leading-none">
        <span className="block">{parts[0]}</span>
        <span className="block">{parts[1]}</span>
      </span>
    );
  }

  if (t.includes("·") && t.length > 6) {
    const idx = t.indexOf("·");
    return (
      <span className="inline-block leading-none">
        <span className="block">{t.slice(0, idx + 1)}</span>
        <span className="block">{t.slice(idx + 1).trim()}</span>
      </span>
    );
  }

  if (colspan === 1 && t.length >= 5) {
    const mid = Math.ceil(t.length / 2);
    return (
      <span className="inline-block leading-none">
        <span className="block">{t.slice(0, mid)}</span>
        <span className="block">{t.slice(mid)}</span>
      </span>
    );
  }

  return t;
}

function fmtDisplay(value: string, roundDigits?: number): string {
  if (!value) return "—";
  const n = Number(value.replace(/,/g, ""));
  if (
    value !== "" &&
    Number.isFinite(n) &&
    /^-?\d[\d,]*(\.\d+)?$/.test(value.replace(/,/g, ""))
  ) {
    if (roundDigits != null) {
      return n.toLocaleString("ko-KR", {
        minimumFractionDigits: roundDigits,
        maximumFractionDigits: roundDigits,
      });
    }
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

function renderHeaderLabel(label: string): React.ReactNode {
  const text = displayAlimiHeaderLabel(label);
  if (!text) return " ";
  if (/\([A-D]\)/.test(text) && !text.includes("/")) {
    return text.replace(/\s+(\([A-D]\))/g, "$1");
  }
  const splitPatterns = ["(D/B)", "(C/B)", "(B/A)", "{C/", "{D/", "{(C/", "{D/"];
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
  return text;
}

function headerClass(
  cols: UnivAlimiColMap,
  colIndex: number,
  label: string,
  rowspan: number,
  colspan: number,
  touchesLastHeaderRow: boolean,
  originSchool?: boolean,
  isRatio?: boolean,
  identityChrome?: boolean,
  uniformMetricCols?: boolean,
): string {
  const headerPad =
    originSchool && colIndex >= cols.firstMetric
      ? "border-r border-border/50 bg-surface-2 text-center align-middle px-1 py-0.5 leading-none"
      : headerThBase;
  const isRowSpanCell = rowspan > 1;
  const uniformStart = uniformColStart(cols);
  const isMetricLeaf =
    colIndex >= (uniformMetricCols ? uniformStart : cols.firstMetric) &&
    colspan === 1;
  const wrapLong =
    originSchool && (label.includes(" ") || label.includes("·") || label.length >= 5);
  const multiline =
    (uniformMetricCols && isMetricLeaf) ||
    wrapLong ||
    label.includes("(") ||
    label.length > 8;
  const nowrap =
    uniformMetricCols && isMetricLeaf
      ? "whitespace-normal leading-snug break-words"
      : multiline
        ? "whitespace-normal"
        : "whitespace-nowrap";
  const spanBottom = touchesLastHeaderRow ? "feam-th-rowspan-bottom" : "";
  const metricWidth = originSchool && isMetricLeaf
    ? ORIGIN_SCHOOL_METRIC_COL
    : uniformMetricCols && isMetricLeaf
      ? UNIFORM_METRIC_COL
      : "";
  const ratioColor = originSchool && isRatio ? FDB_TABLE_COLOR.ratePrimary : "";
  const identityWidth = identityChrome ? alimiIdentityWidthClass(cols, colIndex) : "";
  const identityCenter =
    identityChrome && isAlimiIdentityCenterCol(cols, colIndex) ? "text-center" : "";

  if (colIndex === cols.year && isRowSpanCell) {
    return `${FDB_TABLE_HEAD.rowSpan} feam-th-rowspan ${spanBottom} ${headerThBase} ${identityWidth || "min-w-[4rem]"} ${identityCenter} ${nowrap}`;
  }
  if (colIndex === cols.schoolName && isRowSpanCell) {
    return `${FDB_TABLE_HEAD.rowSpan} feam-th-rowspan ${spanBottom} ${headerThBase} ${identityWidth || "min-w-[14rem]"} text-left ${nowrap}`;
  }
  if (!identityChrome && colIndex === cols.schoolCode && isRowSpanCell) {
    return `${FDB_TABLE_HEAD.rowSpan} feam-th-rowspan ${spanBottom} ${headerThBase} min-w-[5.5rem] ${nowrap}`;
  }
  if (isRowSpanCell) {
    return `${FDB_TABLE_HEAD.rowSpan} feam-th-rowspan ${spanBottom} ${headerPad} ${metricWidth} ${identityWidth} ${identityCenter} ${ratioColor} ${nowrap}`;
  }
  if (colspan > 1) {
    return `${tableHeadClass} ${headerPad} ${FDB_TABLE.headGroup} ${nowrap}`;
  }
  return `${tableHeadClass} ${headerPad} ${FDB_TABLE.headSub} ${metricWidth} ${identityWidth} ${identityCenter} ${ratioColor} ${nowrap}`;
}

function fmtCellValue(
  cell: string,
  cols: UnivAlimiColMap,
  colIndex: number,
  row: UnivAlimiRawRow,
  metricRoundDigits?: number,
): string {
  if (colIndex === cols.year) return row.yearText || "—";
  if (colIndex === cols.schoolCode) return row.schoolCodeStd || cell || "—";
  if (colIndex < cols.firstMetric) return cell || "—";
  return fmtDisplay(cell, metricRoundDigits);
}

function cellClass(
  cols: UnivAlimiColMap,
  colIndex: number,
  originSchool?: boolean,
  isRatio?: boolean,
  identityChrome?: boolean,
  uniformMetricCols?: boolean,
): string {
  const base = `border-r border-border/40 ${FDB_TABLE.cell} ${FDB_TYPO.tableBody}`;
  const metricWidth = originSchool && colIndex >= cols.firstMetric
    ? ORIGIN_SCHOOL_METRIC_COL
    : uniformMetricCols && colIndex >= uniformColStart(cols)
      ? UNIFORM_METRIC_COL
      : "";
  const identityWidth = identityChrome ? alimiIdentityWidthClass(cols, colIndex) : "";
  const identityCenter =
    identityChrome && isAlimiIdentityCenterCol(cols, colIndex) ? "text-center" : "";

  if (colIndex === cols.year) {
    return `${base} ${identityWidth} text-center font-mono text-muted ${FDB_TYPO.tableCode}`;
  }
  if (colIndex === cols.schoolCode) {
    return `${base} ${identityWidth} text-center font-mono text-muted ${FDB_TYPO.tableCode}`;
  }
  if (colIndex === cols.schoolName) {
    return `${base} ${identityWidth} ${FDB_TABLE_COLOR.schoolName}`;
  }
  if (colIndex === cols.gradName) {
    return `${base} ${identityWidth} ${FDB_TABLE_COLOR.schoolName}`;
  }
  if (colIndex >= cols.firstMetric) {
    const ratioColor = originSchool && isRatio ? FDB_TABLE_COLOR.ratePrimary : "";
    return `${base} ${FDB_TYPO.tableMetric} ${metricWidth} text-right font-mono tabular-nums ${ratioColor}`;
  }
  return `${base} ${identityWidth} ${identityCenter} ${metricWidth} text-muted`;
}

export function UnivAlimiRawTable({
  cols,
  headerRows,
  headerMerges,
  rows,
  displayYear,
  sheetLabel,
  metricRoundDigits,
  metricUnitLabel,
  layout,
  uniformMetricCols,
}: {
  cols: UnivAlimiColMap;
  headerRows: string[][];
  headerMerges?: HeaderMergeRange[];
  rows: UnivAlimiRawRow[];
  displayYear?: number | null;
  sheetLabel?: string;
  metricRoundDigits?: number;
  metricUnitLabel?: string;
  layout?: "origin-school" | "univ-alimi";
  uniformMetricCols?: boolean;
}) {
  const originSchool = layout === "origin-school";
  const identityChrome = layout === "origin-school" || layout === "univ-alimi";
  const hiddenCols = identityChrome ? hiddenAlimiIdentityCols(cols) : new Set<number>();
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
      {displayYear != null || metricUnitLabel ? (
        <div className="flex items-end justify-between gap-3">
          {displayYear != null ? (
            <p className={`${FDB_TYPO.legend} text-muted`}>
              {displayYear}년 · {sheetLabel ?? ""} ·{" "}
              {rows.length.toLocaleString("ko-KR")}건 · 원본 {columnCount}열
            </p>
          ) : (
            <span />
          )}
          {metricUnitLabel ? (
            <p className="shrink-0 text-[11px] text-muted">{metricUnitLabel}</p>
          ) : null}
        </div>
      ) : null}
      <div
        ref={wrapRef}
        className={`feam-table-wrap rounded-lg border border-border/60 ${
          originSchool ? "feam-origin-school-table" : ""
        }`}
      >
        <table
          className={`${uniformMetricCols ? "feam-metric-table " : ""}w-full min-w-max ${FDB_TYPO.tableBody}`}
        >
          {identityChrome || originSchool ? (
            <colgroup>
              {Array.from({ length: columnCount }).flatMap((_, i) => {
                if (hiddenCols.has(i)) return [];
                let width: string | undefined;
                if (i === cols.year) width = UNIV_ALIMI_IDENTITY_WIDTH_CSS.year;
                else if (i === cols.estb) width = UNIV_ALIMI_IDENTITY_WIDTH_CSS.estb;
                else if (i === cols.schoolName || i === cols.gradName) {
                  width = UNIV_ALIMI_IDENTITY_WIDTH_CSS.schoolName;
                } else if (originSchool && i >= cols.firstMetric) {
                  width = "3.75rem";
                } else if (uniformMetricCols && i >= uniformColStart(cols)) {
                  width = "5.4rem";
                }
                return [
                  <col key={i} style={width ? { width } : undefined} />,
                ];
              })}
            </colgroup>
          ) : null}
          <thead>
            {headerRenderRows.map((renderRow, rowIndex) => (
              <tr key={`header-${rowIndex}`} className="bg-surface-2">
                {renderRow
                  .filter((cell) => !hiddenCols.has(cell.colIndex))
                  .map((cell) => {
                  const touchesLast =
                    rowIndex + cell.rowspan - 1 >= lastHeaderRowIndex;
                  const isRatio = originSchool && isRatioColumn(headerRows, cell.colIndex);
                  return (
                    <th
                      key={`${rowIndex}-${cell.colIndex}`}
                      rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
                      colSpan={cell.colspan > 1 ? cell.colspan : undefined}
                      className={headerClass(
                        cols,
                        cell.colIndex,
                        cell.label,
                        cell.rowspan,
                        cell.colspan,
                        touchesLast,
                        originSchool,
                        isRatio,
                        identityChrome,
                        uniformMetricCols,
                      )}
                    >
                      {originSchool
                        ? wrapOriginSchoolHeader(cell.label, cell.colspan)
                        : renderHeaderLabel(cell.label)}
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
                    className={cellClass(
                      cols,
                      colIndex,
                      originSchool,
                      originSchool && isRatioColumn(headerRows, colIndex),
                      identityChrome,
                      uniformMetricCols,
                    )}
                  >
                    {fmtCellValue(
                      cell,
                      cols,
                      colIndex,
                      row,
                      metricRoundDigits,
                    )}
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
