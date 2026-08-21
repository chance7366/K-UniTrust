"use client";

import { FDB_TABLE } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type { SchoolOverviewRow } from "@/lib/ingest/school-overview-config";
import { SCHOOL_OVERVIEW_COLUMNS } from "@/lib/ingest/school-overview-config";

import "./freshman-enrollment-alimi-table.css";

const CENTER_KEYS = new Set<keyof SchoolOverviewRow>([
  "region",
  "establishment",
  "schoolStatus",
]);

export function SchoolOverviewDataTable({ rows }: { rows: SchoolOverviewRow[] }) {
  return (
    <div className="feam-table-wrap rounded-lg border border-border/60">
      <table className={`w-full min-w-[1400px] ${FDB_TYPO.tableBody}`}>
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {SCHOOL_OVERVIEW_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`text-table-head whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} font-medium ${
                  col.key === "schoolCodeStd"
                    ? " w-[5.5rem] min-w-[5.5rem] text-center"
                    : col.key === "schoolName"
                      ? " min-w-[14rem] text-left"
                      : CENTER_KEYS.has(col.key)
                        ? "text-center"
                        : "text-left"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.schoolCodeStd}-${row.mainBranch}-${i}`}
              className={`border-b border-border/40 ${
                i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
              }`}
              data-stripe={i % 2 === 0 ? "odd" : "even"}
            >
              {SCHOOL_OVERVIEW_COLUMNS.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} ${
                    col.key === "schoolCodeStd"
                      ? ` w-[5.5rem] min-w-[5.5rem] text-center font-mono ${FDB_TYPO.tableCode} text-muted`
                      : col.key === "schoolName"
                        ? ` min-w-[14rem] ${FDB_TABLE_COLOR.schoolName}`
                        : CENTER_KEYS.has(col.key)
                          ? `text-center text-muted ${FDB_TYPO.tableBody}`
                          : `text-muted ${FDB_TYPO.tableBody}`
                  }`}
                >
                  {col.key === "homepage" && row.homepage ? (
                    <a
                      href={
                        row.homepage.startsWith("http")
                          ? row.homepage
                          : `https://${row.homepage}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-cyan hover:underline"
                    >
                      {row.homepage}
                    </a>
                  ) : (
                    row[col.key] || "—"
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
