"use client";

import {
  VirtualPadRow,
  useVirtualizedRows,
} from "@/components/analysis/virtualized-table";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";

import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";



import {

  FINANCIAL_SUPPORT_MINISTRY_COLUMNS,

  fmtBenefitRate,

  fmtEok,

  wonToEok,

  type FinancialSupportBenefitRateRow,

} from "@/lib/ingest/financial-support-benefit-rate-config";

import "./freshman-enrollment-alimi-table.css";



const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;



const metricCellClass = `border-r border-border/40 ${FDB_TABLE.cellMetric} text-right font-mono tabular-nums ${FDB_TYPO.tableBody}`;



function ministryCellClass(tone?: "yellow"): string {

  const base =

    `border-r border-border/40 px-1.5 py-1.5 text-right font-mono tabular-nums ${FDB_TYPO.tableBody}`;

  if (tone === "yellow") {

    return `${base} font-medium text-yellow-400`;

  }

  return base;

}



function ministryHeadClass(tone?: "yellow"): string {

  const base =

    `text-table-head whitespace-nowrap border-r border-border/50 px-1.5 ${FDB_TABLE.headSub} text-center ${FDB_TYPO.legend} font-medium`;

  if (tone === "yellow") {

    return `${base} text-yellow-400`;

  }

  return base;

}



export function FinancialSupportBenefitRateDataTable({

  rows,

}: {

  rows: FinancialSupportBenefitRateRow[];

}) {

  const virt = useVirtualizedRows(rows.length);
  const visibleRows = virt.slice(rows);
  const colSpan = 2 + FINANCIAL_SUPPORT_MINISTRY_COLUMNS.length + 3;

  return (

    <div>

      <div className="mb-2 flex justify-end">

        <span className={FDB_TYPO.legend}>(단위 : 억원)</span>

      </div>

      <div
        ref={virt.wrapRef}
        className="feam-table-wrap rounded-lg border border-border/60"
      >

        <table className={`w-full table-fixed border-separate ${FDB_TYPO.tableBody}`}>

          <colgroup>

            <col style={{ width: "5.5rem" }} />

            <col style={{ width: "16rem" }} />

            {FINANCIAL_SUPPORT_MINISTRY_COLUMNS.map((col) => (

              <col key={col.key} />

            ))}

            <col />

            <col />

            <col />

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

                colSpan={FINANCIAL_SUPPORT_MINISTRY_COLUMNS.length}

                className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}

              >

                재정지원 (부처·지자체)

              </th>

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}

              >

                지원액

                <br />

                합계

              </th>

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}

              >

                등록금

                <br />

                수입

              </th>

              <th

                rowSpan={2}

                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center ${FDB_TABLE_COLOR.ratePrimary}`}

              >

                재정지원

                <br />

                수혜율

                <span className={`mt-0.5 block font-normal ${FDB_TYPO.legend}`}>

                  기준

                </span>

              </th>

            </tr>

            <tr className="border-b border-border bg-surface-2">

              {FINANCIAL_SUPPORT_MINISTRY_COLUMNS.map((col) => (

                <th

                  key={col.key}

                  className={ministryHeadClass(

                    "tone" in col ? col.tone : undefined,

                  )}

                >

                  {col.label}

                </th>

              ))}

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

                <td className={` whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cellSticky} text-center font-mono ${FDB_TYPO.tableCode} text-muted`}>

                  {row.schoolCodeStd}

                </td>

                <td className={` overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}>

                  {row.schoolName}

                </td>

                {FINANCIAL_SUPPORT_MINISTRY_COLUMNS.map((col) => (

                  <td

                    key={col.key}

                    className={ministryCellClass(

                      "tone" in col ? col.tone : undefined,

                    )}

                  >

                    {fmtEok(

                      wonToEok(

                        row[

                          col.key as keyof FinancialSupportBenefitRateRow

                        ] as number,

                      ),

                    )}

                  </td>

                ))}

                <td className={`${metricCellClass} font-semibold`}>

                  {fmtEok(wonToEok(row.totalSupport))}

                </td>

                <td className={metricCellClass}>

                  {fmtEok(row.tuitionRevenue)}

                </td>

                <td className={`${metricCellClass} ${FDB_TABLE_COLOR.ratePrimary}`}>

                  {fmtBenefitRate(row.benefitRate)}

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

