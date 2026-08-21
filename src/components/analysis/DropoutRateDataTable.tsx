"use client";

import {
  VirtualPadRow,
  useVirtualizedRows,
} from "@/components/analysis/virtualized-table";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";

import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";



import {

  DROPOUT_RATE_METRIC_GROUPS,

  type DropoutRateRow,

} from "@/lib/ingest/dropout-rate-config";

import type { DropoutRateViewMode } from "@/lib/data/dropout-rate";

import type { DropoutRateConsolidatedRow } from "@/lib/ingest/dropout-rate-consolidated-config";

import "./freshman-enrollment-alimi-table.css";



const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;



const METRIC_COLUMN_COUNT = DROPOUT_RATE_METRIC_GROUPS.reduce(

  (sum, g) => sum + g.columns.length,

  0,

);



function fmtCount(n: number | null | undefined): string {

  if (n == null || Number.isNaN(n)) return "—";

  return n.toLocaleString("ko-KR");

}



function fmtPercent(n: number | null | undefined): string {

  if (n == null || Number.isNaN(n)) return "—";

  return n.toLocaleString("ko-KR", {

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  });

}



const metricCellClass = `border-r border-border/40 ${FDB_TABLE.cellMetric} text-right font-mono tabular-nums ${FDB_TYPO.tableBody}`;



function rateHeaderClass(groupKey: string, colKey: string): string {

  if (groupKey === "enrolled" && colKey === "rate") return FDB_TABLE_COLOR.ratePrimary;

  if (groupKey === "freshman" && colKey === "rate") return FDB_TABLE_COLOR.rateSecondary;

  return "";

}



export function DropoutRateDataTable({

  rows,

  viewMode = "campus",

}: {

  rows: DropoutRateRow[] | DropoutRateConsolidatedRow[];

  viewMode?: DropoutRateViewMode;

}) {

  const isConsolidated = viewMode === "consolidated";
  const virt = useVirtualizedRows(rows.length);
  const visibleRows = virt.slice(rows);
  const colSpan = 2 + METRIC_COLUMN_COUNT;

  return (

    <div
      ref={virt.wrapRef}
      className="feam-table-wrap rounded-lg border border-border/60"
    >

      <table className={`w-full table-fixed border-separate ${FDB_TYPO.tableBody}`}>

        <colgroup>

          <col style={{ width: "5.5rem" }} />

          <col style={{ width: "18rem" }} />

          {Array.from({ length: METRIC_COLUMN_COUNT }).map((_, i) => (

            <col key={i} />

          ))}

        </colgroup>

        <thead>

          <tr className="bg-surface-2">

            <th

              rowSpan={2}

              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan}  whitespace-nowrap bg-surface-2 text-center`}

            >

              {isConsolidated ? "대표코드" : "학교코드"}

            </th>

            <th

              rowSpan={2}

              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan}  whitespace-nowrap text-left`}

            >

              학교명

            </th>

            {DROPOUT_RATE_METRIC_GROUPS.map((g) => (

              <th

                key={g.key}

                colSpan={g.columns.length}

                className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}

              >

                {g.label}

              </th>

            ))}

          </tr>

          <tr className="border-b border-border bg-surface-2">

            {DROPOUT_RATE_METRIC_GROUPS.flatMap((g) =>

              g.columns.map((col) => (

                <th

                  key={`${g.key}-${col.key}`}

                  className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center ${rateHeaderClass(g.key, col.key)}`}

                >

                  {col.label}

                </th>

              )),

            )}

          </tr>

        </thead>

        <tbody>

          <VirtualPadRow colSpan={colSpan} height={virt.topPad} />
          {visibleRows.map((row, visibleIndex) => {
            const i = virt.rowIndex(visibleIndex);
            const campusCount =

              "campusCount" in row ? row.campusCount : undefined;



            return (

              <tr

                key={`${row.year}-${row.schoolCodeStd}-${row.schoolName}-${i}`}

                className={`border-b border-border/40 ${

                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"

                }`}
                data-stripe={i % 2 === 0 ? "odd" : "even"}

              >

                <td className={` whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cellSticky} text-center font-mono ${FDB_TYPO.tableCode} text-muted`}>

                  {row.schoolCodeStd || `—`}

                </td>

                <td className={` overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}>

                  <span className="inline-flex max-w-full items-center gap-1.5">

                    <span className="truncate">{row.schoolName}</span>

                    {isConsolidated &&

                    campusCount != null &&

                    campusCount > 1 ? (

                      <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-normal text-accent">

                        {campusCount}개

                      </span>

                    ) : null}

                  </span>

                </td>

                <td className={metricCellClass}>

                  {fmtCount(row.enrolled.total)}

                </td>

                <td className={metricCellClass}>

                  {fmtCount(row.enrolled.dropouts)}

                </td>

                <td className={`${metricCellClass} ${FDB_TABLE_COLOR.ratePrimary}`}>

                  {fmtPercent(row.enrolled.rate)}

                </td>

                <td className={metricCellClass}>

                  {fmtCount(row.freshman.total)}

                </td>

                <td className={metricCellClass}>

                  {fmtCount(row.freshman.dropouts)}

                </td>

                <td className={`${metricCellClass} ${FDB_TABLE_COLOR.rateSecondary}`}>

                  {fmtPercent(row.freshman.rate)}

                </td>

              </tr>

            );

          })}
          <VirtualPadRow colSpan={colSpan} height={virt.bottomPad} />

        </tbody>

      </table>

    </div>

  );

}

