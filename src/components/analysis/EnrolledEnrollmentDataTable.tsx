"use client";

import {
  VirtualPadRow,
  useVirtualizedRows,
} from "@/components/analysis/virtualized-table";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  ENROLLED_ENROLLMENT_METRIC_GROUPS,
  type EnrolledEnrollmentRow,
} from "@/lib/ingest/enrolled-enrollment-config";
import type { EnrolledEnrollmentViewMode } from "@/lib/data/enrolled-enrollment";
import type { EnrolledEnrollmentConsolidatedRow } from "@/lib/ingest/enrolled-enrollment-consolidated-config";

import "./freshman-enrollment-alimi-table.css";

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;

const METRIC_COLUMN_COUNT =
  2 +
  ENROLLED_ENROLLMENT_METRIC_GROUPS.reduce(
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

function isRateGroup(key: string): boolean {
  return key === "fillRate" || key === "fillRateWithin";
}

function rateHeaderClass(key: string): string {
  if (key === "fillRate") return FDB_TABLE_COLOR.ratePrimary;
  if (key === "fillRateWithin") return FDB_TABLE_COLOR.rateSecondary;
  return "";
}

export function EnrolledEnrollmentDataTable({
  rows,
  viewMode = "campus",
  showHalfColumn = false,
}: {
  rows: EnrolledEnrollmentRow[] | EnrolledEnrollmentConsolidatedRow[];
  viewMode?: EnrolledEnrollmentViewMode;
  showHalfColumn?: boolean;
}) {
  const isConsolidated = viewMode === "consolidated";
  const virt = useVirtualizedRows(rows.length);
  const visibleRows = virt.slice(rows);
  const colSpan = (showHalfColumn ? 1 : 0) + 2 + METRIC_COLUMN_COUNT;

  return (
    <div
      ref={virt.wrapRef}
      className="feam-table-wrap rounded-lg border border-border/60"
    >
      <table className={`w-full table-fixed border-separate ${FDB_TYPO.tableBody}`}>
        <colgroup>
          {showHalfColumn ? <col style={{ width: "4.5rem" }} /> : null}
          <col style={{ width: "5.5rem" }} />
          <col style={{ width: "18rem" }} />
          {Array.from({ length: METRIC_COLUMN_COUNT }).map((_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-surface-2">
            {showHalfColumn ? (
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} whitespace-nowrap bg-surface-2 text-center`}
              >
                상하반기
              </th>
            ) : null}
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan}  whitespace-nowrap text-center`}
            >
              {isConsolidated ? "대표코드" : "학교코드"}
            </th>
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan}  whitespace-nowrap text-left`}
            >
              학교명
            </th>
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}
            >
              학생정원
            </th>
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.headRowSpan} text-center`}
            >
              학생모집정지인원
            </th>
            {ENROLLED_ENROLLMENT_METRIC_GROUPS.map((g) =>
              isRateGroup(g.key) ? (
                <th
                  key={g.key}
                  rowSpan={2}
                  className={`${FDB_TABLE_HEAD.rowSpan} ${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headRowSpan} text-center ${rateHeaderClass(g.key)}`}
                >
                  {g.label}
                </th>
              ) : (
                <th
                  key={g.key}
                  colSpan={g.columns.length}
                  className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center`}
                >
                  {g.label}
                </th>
              ),
            )}
          </tr>
          <tr className="border-b border-border bg-surface-2">
            {ENROLLED_ENROLLMENT_METRIC_GROUPS.flatMap((g) =>
              isRateGroup(g.key)
                ? []
                : g.columns.map((col) => (
                    <th
                      key={`${g.key}-${col.key}`}
                      className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center`}
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
              "campusCount" in row && typeof row.campusCount === "number"
                ? row.campusCount
                : undefined;

            return (
              <tr
                key={`${row.year}-${row.half}-${row.schoolCodeStd}-${row.schoolName}-${i}`}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
                data-stripe={i % 2 === 0 ? "odd" : "even"}
              >
                {showHalfColumn ? (
                  <td className={`whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cellSticky} text-center text-xs font-medium`}>
                    {row.half || "—"}
                  </td>
                ) : null}
                <td
                  className={` whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cellSticky} text-center font-mono ${FDB_TYPO.tableCode} text-muted`}
                >
                  {row.schoolCodeStd || "—"}
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
                  {fmtCount(row.studentQuota)}
                </td>
                <td className={metricCellClass}>
                  {fmtCount(row.recruitmentSuspension)}
                </td>
                <td className={metricCellClass}>
                  {fmtCount(row.enrolled.total)}
                </td>
                <td className={metricCellClass}>
                  {fmtCount(row.enrolled.within)}
                </td>
                <td className={metricCellClass}>
                  {fmtCount(row.enrolled.outside)}
                </td>
                <td className={`${metricCellClass} ${FDB_TABLE_COLOR.ratePrimary}`}>
                  {fmtPercent(row.fillRate)}
                </td>
                <td className={`${metricCellClass} ${FDB_TABLE_COLOR.rateSecondary}`}>
                  {fmtPercent(row.fillRateWithin)}
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
