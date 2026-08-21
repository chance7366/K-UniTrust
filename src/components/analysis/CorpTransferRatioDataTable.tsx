"use client";

import {
  VirtualPadRow,
  useVirtualizedRows,
} from "@/components/analysis/virtualized-table";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";

import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";



import type { CorpTransferRatioRow } from "@/lib/ingest/corp-transfer-ratio-config";

import "./freshman-enrollment-alimi-table.css";



const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;



const TABLE_METRIC_COLUMN_COUNT = 6;



const metricCellClass = `border-r border-border/40 ${FDB_TABLE.cellMetric} text-right font-mono tabular-nums ${FDB_TYPO.tableBody}`;



function toMillionWon(n: number | null | undefined): number | null {

  if (n == null || Number.isNaN(n)) return null;

  return Math.round(n / 1000);

}



function fmtMillionWon(n: number | null | undefined): string {

  const v = toMillionWon(n);

  if (v == null) return "—";

  return v.toLocaleString("ko-KR");

}



function fmtPercent(n: number | null | undefined): string {

  if (n == null || Number.isNaN(n)) return "—";

  return n.toLocaleString("ko-KR", {

    minimumFractionDigits: 1,

    maximumFractionDigits: 1,

  });

}



export function CorpTransferRatioDataTable({

  rows,

}: {

  rows: CorpTransferRatioRow[];

}) {

  const virt = useVirtualizedRows(rows.length);
  const visibleRows = virt.slice(rows);
  const colSpan = 2 + TABLE_METRIC_COLUMN_COUNT;

  return (

    <div>

      <div className="mb-2 flex justify-end">

        <span className={FDB_TYPO.legend}>(단위 : 백만원)</span>

      </div>

      <div
        ref={virt.wrapRef}
        className="feam-table-wrap rounded-lg border border-border/60"
      >

        <table className={`w-full table-fixed border-separate ${FDB_TYPO.tableBody}`}>

          <colgroup>

            <col style={{ width: "5.5rem" }} />

            <col style={{ width: "18rem" }} />

            {Array.from({ length: TABLE_METRIC_COLUMN_COUNT }).map((_, i) => (

              <col key={i} />

            ))}

          </colgroup>

          <thead>

            <tr className="bg-surface-2">

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan}  whitespace-nowrap bg-surface-2 text-center`}

              >

                학교코드

              </th>

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan}  whitespace-nowrap text-left`}

              >

                학교명

              </th>

              <th

                colSpan={3}

                className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}

              >

                전입금

              </th>

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}

              >

                전입금합계

              </th>

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}

              >

                등록금수입

              </th>

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center ${FDB_TABLE_COLOR.ratePrimary}`}

              >

                전입금비율

                <span className={`mt-0.5 block font-normal ${FDB_TYPO.legend}`}>

                  기준 · 높을수록 좋음

                </span>

              </th>

            </tr>

            <tr className="border-b border-border bg-surface-2">

              <th className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center`}>

                경상비

              </th>

              <th className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center`}>

                법정부담

              </th>

              <th className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center`}>

                자산

              </th>

            </tr>

          </thead>

          <tbody>

            <VirtualPadRow colSpan={colSpan} height={virt.topPad} />
            {visibleRows.map((row, visibleIndex) => {
              const i = virt.rowIndex(visibleIndex);
              return (

              <tr

                key={`${row.year}-${row.schoolCodeStd}-${i}`}

                className={`border-b border-border/40 ${

                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"

                }`}
                data-stripe={i % 2 === 0 ? "odd" : "even"}

              >

                <td className={` whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cellSticky} text-center font-mono text-muted ${FDB_TYPO.tableCode}`}>

                  {row.schoolCodeStd}

                </td>

                <td className={` overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}>

                  {row.schoolName}

                </td>

                <td className={metricCellClass}>

                  {fmtMillionWon(row.ordinaryExpenseTransfer)}

                </td>

                <td className={metricCellClass}>

                  {fmtMillionWon(row.legalObligationTransfer)}

                </td>

                <td className={metricCellClass}>

                  {fmtMillionWon(row.assetTransfer)}

                </td>

                <td className={metricCellClass}>

                  {fmtMillionWon(row.totalTransfer)}

                </td>

                <td className={metricCellClass}>

                  {fmtMillionWon(row.tuitionRevenue)}

                </td>

                <td className={`${metricCellClass} ${FDB_TABLE_COLOR.ratePrimary}`}>

                  {fmtPercent(row.transferRatio)}

                </td>

              </tr>
              );
            })}
            <VirtualPadRow colSpan={colSpan} height={virt.bottomPad} />

          </tbody>

        </table>

      </div>

    </div>

  );

}

