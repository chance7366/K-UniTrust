"use client";

import {
  VirtualPadRow,
  useVirtualizedRows,
} from "@/components/analysis/virtualized-table";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TABLE } from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import {
  fmtMillionWon,
  fmtRatio1,
  fmtRatio2,
  priorTuitionYear,
} from "@/lib/analysis/income-property-secure-rate-analytics";
import {
  INCOME_PROPERTY_COLLATERAL_DISPLAY_HEADER,
  INCOME_PROPERTY_TABLE_AMOUNT_HEADERS,
  INCOME_PROPERTY_TABLE_AMOUNT_KEYS,
  INCOME_PROPERTY_TABLE_TOTAL_HEADERS,
  INCOME_PROPERTY_TABLE_TOTAL_KEYS,
  type IncomePropertySecureRateDisplayRow,
} from "@/lib/ingest/income-property-secure-rate-config";

import "./freshman-enrollment-alimi-table.css";

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;

function amountCellClass(key: string): string {
  const base =
    `border-r border-border/40 ${FDB_TABLE.cellMetric} text-right font-mono tabular-nums ${FDB_TYPO.tableBody}`;
  if (key === "totalAppraised" || key === "totalNetIncome") {
    return `${base} text-accent`;
  }
  return base;
}

function amountHeadClass(header: string): string {
  const base = `${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} text-center`;
  if (header === "평가액 합계" || header === "순수입액 합계") {
    return `${base} text-accent`;
  }
  if (header === INCOME_PROPERTY_COLLATERAL_DISPLAY_HEADER) {
    return `${base} text-yellow-400`;
  }
  return base;
}

export function IncomePropertySecureRateDataTable({
  rows,
  displayYear,
}: {
  rows: IncomePropertySecureRateDisplayRow[];
  displayYear: number;
}) {
  const tuitionYear = priorTuitionYear(displayYear);
  const virt = useVirtualizedRows(rows.length);
  const visibleRows = virt.slice(rows);
  const colSpan =
    3 +
    INCOME_PROPERTY_TABLE_AMOUNT_KEYS.length +
    1 +
    INCOME_PROPERTY_TABLE_TOTAL_KEYS.length +
    3;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className={FDB_TYPO.legend}>
          등록금수입 · 재산확보율 기준: {tuitionYear}년 자금확보율 DB · 재산확보율 =
          평가액합계÷등록금수입×100
        </span>
        <span className={FDB_TYPO.legend}>
          (단위 : 백만원, %)
        </span>
      </div>
      <div
        ref={virt.wrapRef}
        className="feam-table-wrap rounded-lg border border-border/60"
      >
        <table className={`w-full min-w-[1600px] border-separate ${FDB_TYPO.tableBody}`}>
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className={`${tableHeadClass}  min-w-[5.5rem] border-r border-border/50 bg-surface-2 ${FDB_TABLE.headSingle} text-center`}>
                학교코드
              </th>
              <th className={`${tableHeadClass}  min-w-[14rem] border-r border-border/50 bg-surface-2 ${FDB_TABLE.headSingle} text-left`}>
                학교명
              </th>
              <th className={`${tableHeadClass} min-w-[12rem] border-r border-border/50 ${FDB_TABLE.headSingle} text-left `}>
                법인명
              </th>
              {INCOME_PROPERTY_TABLE_AMOUNT_HEADERS.map((header) => (
                <th key={header} className={amountHeadClass(header)}>
                  {header}
                </th>
              ))}
              <th className={amountHeadClass(INCOME_PROPERTY_COLLATERAL_DISPLAY_HEADER)}>
                {INCOME_PROPERTY_COLLATERAL_DISPLAY_HEADER}
              </th>
              {INCOME_PROPERTY_TABLE_TOTAL_HEADERS.map((header) => (
                <th key={header} className={amountHeadClass(header)}>
                  {header}
                </th>
              ))}
              <th className={`${tableHeadClass} min-w-[6rem] border-r border-border/50 ${FDB_TABLE.headSingle} text-center `}>
                등록금수입
              </th>
              <th className={`${tableHeadClass} min-w-[5.5rem] border-r border-border/50 ${FDB_TABLE.headSingle} text-center ${FDB_TABLE_COLOR.ratePrimary}`}>
                재산확보율
              </th>
              <th className={`${tableHeadClass} min-w-[5rem] ${FDB_TABLE.headSingle} text-center ${FDB_TABLE_COLOR.rateSecondary}`}>
                수익율
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
                <td className={` whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cellSticky} text-center font-mono ${FDB_TYPO.tableCode} text-muted`}>
                  {row.schoolCodeStd}
                </td>
                <td className={` border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}>
                  {row.schoolName}
                </td>
                <td className={`border-r border-border/40 ${FDB_TABLE.cell} text-muted ${FDB_TYPO.tableBody}`}>
                  {row.corpName}
                </td>
                {INCOME_PROPERTY_TABLE_AMOUNT_KEYS.map((key) => (
                  <td key={key} className={amountCellClass(key)}>
                    {fmtMillionWon(row[key])}
                  </td>
                ))}
                <td className={`${amountCellClass("collateral")} font-medium text-yellow-400`}>
                  {fmtMillionWon(row.collateralDeduction)}
                </td>
                {INCOME_PROPERTY_TABLE_TOTAL_KEYS.map((key) => (
                  <td key={key} className={amountCellClass(key)}>
                    {fmtMillionWon(row[key])}
                  </td>
                ))}
                <td className={amountCellClass("tuition")}>
                  {row.tuitionRevenueMillion != null
                    ? row.tuitionRevenueMillion.toLocaleString("ko-KR")
                    : "—"}
                </td>
                <td className={`${amountCellClass("propertySecureRate")} ${FDB_TABLE_COLOR.ratePrimary}`}>
                  {fmtRatio1(row.propertySecureRate)}
                </td>
                <td className={`${amountCellClass("revenueRate")} ${FDB_TABLE_COLOR.rateSecondary}`}>
                  {fmtRatio2(row.revenueRate)}
                </td>
              </tr>
              );
            })}
            <VirtualPadRow colSpan={colSpan} height={virt.bottomPad} />
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <p className={`py-8 text-center ${FDB_TYPO.bodyText}`}>
          표시할 데이터가 없습니다.
        </p>
      ) : null}
    </div>
  );
}
