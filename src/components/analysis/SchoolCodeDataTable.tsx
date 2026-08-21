"use client";

import { useRef } from "react";

import {
  VIRTUALIZE_MIN_ROWS,
  VIRTUAL_ROW_HEIGHT,
  useVirtualRowRange,
} from "@/components/analysis/use-virtual-row-range";
import { FDB_TABLE } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type { SchoolCodeRow } from "@/lib/ingest/school-code-config";

import "./freshman-enrollment-alimi-table.css";

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;

const thClass = `${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} text-left font-medium last:border-r-0`;
const tdClass = `whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} last:border-r-0 ${FDB_TYPO.tableBody}`;

function cell(value: string) {
  return value || "—";
}

type ColumnDef = {
  key: keyof SchoolCodeRow;
  label: string;
  align?: "left" | "center";
  emphasis?: "codeAccent" | "code" | "name";
  getValue: (row: SchoolCodeRow) => string;
};

const COLUMNS: ColumnDef[] = [
  {
    key: "schoolCodeStd",
    label: "학교코드",
    align: "center",
    emphasis: "codeAccent",
    getValue: (row) => row.schoolCodeStd,
  },
  {
    key: "schoolName",
    label: "학교명",
    emphasis: "name",
    getValue: (row) => row.schoolName,
  },
  {
    key: "mainBranchName",
    label: "본분교",
    align: "center",
    getValue: (row) => cell(row.mainBranchName),
  },
  {
    key: "schoolDivision",
    label: "학교구분",
    getValue: (row) => cell(row.schoolDivision),
  },
  {
    key: "schoolRepCode",
    label: "대표학교코드",
    align: "center",
    emphasis: "code",
    getValue: (row) => cell(row.schoolRepCode),
  },
  {
    key: "schoolRepName",
    label: "학교대표",
    getValue: (row) => cell(row.schoolRepName),
  },
  {
    key: "schoolKind",
    label: "학교종류",
    getValue: (row) => cell(row.schoolKind),
  },
  {
    key: "region",
    label: "지역",
    align: "center",
    getValue: (row) => cell(row.region),
  },
  {
    key: "estb",
    label: "설립구분",
    align: "center",
    getValue: (row) => cell(row.estb),
  },
  {
    key: "relatedLaw",
    label: "관련법령",
    getValue: (row) => cell(row.relatedLaw),
  },
  {
    key: "corpName",
    label: "법인명",
    getValue: (row) => cell(row.corpName),
  },
  {
    key: "status",
    label: "학교상태",
    align: "center",
    getValue: (row) => cell(row.status),
  },
  {
    key: "parentSchoolName",
    label: "상위학교",
    getValue: (row) => cell(row.parentSchoolName),
  },
];

function cellClass(col: ColumnDef): string {
  const parts = [tdClass];
  if (col.align === "center") parts.push("text-center");
  if (col.emphasis === "codeAccent") {
    parts.push(`font-mono tabular-nums ${FDB_TYPO.tableCode} text-muted`);
  } else if (col.emphasis === "code") {
    parts.push(`font-mono tabular-nums ${FDB_TYPO.tableCode}`);
  } else if (col.emphasis === "name") {
    parts.push(FDB_TABLE_COLOR.schoolName);
  }
  return parts.join(" ");
}

function headClass(col: ColumnDef): string {
  const parts = [thClass, "sticky top-0 z-[2] bg-surface-2"];
  if (col.align === "center") parts.push("text-center");
  return parts.join(" ");
}

export function SchoolCodeDataTable({ rows }: { rows: SchoolCodeRow[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const virtualize = rows.length >= VIRTUALIZE_MIN_ROWS;
  const { start, end } = useVirtualRowRange(virtualize, rows.length, wrapRef);
  const visibleRows = virtualize ? rows.slice(start, end) : rows;
  const topPad = virtualize ? start * VIRTUAL_ROW_HEIGHT : 0;
  const bottomPad = virtualize ? (rows.length - end) * VIRTUAL_ROW_HEIGHT : 0;
  const columnCount = COLUMNS.length;

  return (
    <div
      ref={wrapRef}
      className="feam-table-wrap rounded-lg border border-border/60"
    >
      <table className={`w-full min-w-max border-separate ${FDB_TYPO.tableBody}`}>
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {COLUMNS.map((col) => (
              <th key={col.key} className={headClass(col)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topPad > 0 ? (
            <tr aria-hidden>
              <td
                colSpan={columnCount}
                style={{ height: topPad, padding: 0, border: 0 }}
              />
            </tr>
          ) : null}
          {visibleRows.map((row, visibleIndex) => {
            const i = virtualize ? start + visibleIndex : visibleIndex;
            return (
              <tr
                key={`${row.year}-${row.schoolCodeStd}-${i}`}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
                data-stripe={i % 2 === 0 ? "odd" : "even"}
              >
                {COLUMNS.map((col) => (
                  <td key={col.key} className={cellClass(col)}>
                    {col.getValue(row)}
                  </td>
                ))}
              </tr>
            );
          })}
          {bottomPad > 0 ? (
            <tr aria-hidden>
              <td
                colSpan={columnCount}
                style={{ height: bottomPad, padding: 0, border: 0 }}
              />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
