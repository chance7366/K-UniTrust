import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  getSpecialCityRatioColor,
  ORIGIN_REGION_SPECIAL_CITY_RATIO_COLORS,
  ORIGIN_REGION_SPECIAL_CITY_RATIO_LEGEND,
  ORIGIN_REGION_SPECIAL_CITY_RATIO_LEGEND_DESCRIPTION,
} from "@/lib/analysis/origin-region-ratio-grade";
import {
  ORIGIN_REGION_REGION_GROUPS,
  type OriginRegionRow,
} from "@/lib/ingest/origin-region-config";

import "./freshman-enrollment-alimi-table.css";

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR");
}

function fmtRatio(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function SpecialCityRatioLegend() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted">특광자치시 비율</span>
        {ORIGIN_REGION_SPECIAL_CITY_RATIO_LEGEND.map((grade) => {
          const style = ORIGIN_REGION_SPECIAL_CITY_RATIO_COLORS[grade];
          return (
            <span
              key={grade}
              className="inline-flex min-w-[1.75rem] items-center justify-center text-xs font-bold"
              style={{ color: style.bg }}
            >
              {grade}
            </span>
          );
        })}
      </div>
      <p className={FDB_TYPO.legend}>
        {ORIGIN_REGION_SPECIAL_CITY_RATIO_LEGEND_DESCRIPTION}
      </p>
    </div>
  );
}

export function OriginRegionDataTable({ rows }: { rows: OriginRegionRow[] }) {
  return (
    <>
      <div className="feam-table-wrap overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full min-w-[1100px] border-separate text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan}  bg-surface-2 ${FDB_TABLE.headRowSpan} text-left font-medium`}
              >
                학교코드
              </th>
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan}  bg-surface-2 ${FDB_TABLE.headRowSpan} text-left font-medium`}
              >
                학교명
              </th>
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} border-r border-border/50 ${FDB_TABLE.headRowSpan} text-right font-medium`}
              >
                총입학자수
              </th>
              {ORIGIN_REGION_REGION_GROUPS.map((g) => (
                <th
                  key={g.key}
                  colSpan={2}
                  className={`${tableHeadClass} border-b border-border/50 border-r border-border/50 ${FDB_TABLE.headGroup} text-center font-medium`}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2">
              {ORIGIN_REGION_REGION_GROUPS.flatMap((g, groupIndex) => [
                <th
                  key={`${g.key}-count`}
                  className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center`}
                >
                  학생수
                </th>,
                <th
                  key={`${g.key}-ratio`}
                  className={`${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSub} text-center ${
                    g.key === "special_city"
                      ? FDB_TABLE_COLOR.rateGroup
                      : groupIndex % 2 === 0
                        ? FDB_TABLE_COLOR.ratePrimary
                        : FDB_TABLE_COLOR.rateSecondary
                  }`}
                >
                  비율
                  {g.key === "special_city" ? (
                    <span
                      className={`mt-0.5 block text-[10px] font-normal ${FDB_TABLE_COLOR.rateGroup}`}
                    >
                      기준
                    </span>
                  ) : null}
                </th>,
              ])}
            </tr>
          </thead><tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.year}-${row.schoolName}-${i}`}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
                data-stripe={i % 2 === 0 ? "odd" : "even"}
              >
                <td className={` border-r border-border/40 ${FDB_TABLE.cellSticky} font-mono ${FDB_TYPO.tableCode}`}>
                  {row.schoolCodeStd || "—"}
                </td>
                <td className={` border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE_COLOR.schoolName} ${FDB_TYPO.tableBody}`}>
                  {row.schoolName}
                </td>
                <td className={`border-r border-border/40 ${FDB_TABLE.cellMetric} font-mono font-semibold ${FDB_TYPO.tableBody}`}>
                  {fmtCount(row.totalEnrolled)}
                </td>
                {ORIGIN_REGION_REGION_GROUPS.flatMap((g, groupIndex) => {
                  const cell = row.byRegion[g.key];
                  const isSpecialCityRatio = g.key === "special_city";
                  const ratioColor = isSpecialCityRatio
                    ? getSpecialCityRatioColor(cell.ratio)
                    : null;

                  return [
                    <td
                      key={`${g.key}-c`}
                      className={`border-r border-border/40 ${FDB_TABLE.cellMetric} font-mono ${FDB_TYPO.tableBody}`}
                    >
                      {fmtCount(cell.count)}
                    </td>,
                    <td
                      key={`${g.key}-r`}
                      className={`border-r border-border/40 ${FDB_TABLE.cellMetric} font-mono ${
                        isSpecialCityRatio
                          ? "font-bold"
                          : groupIndex % 2 === 0
                            ? FDB_TABLE_COLOR.ratePrimary
                            : FDB_TABLE_COLOR.rateSecondary
                      } ${FDB_TYPO.tableBody}`}
                      style={
                        ratioColor ? { color: ratioColor } : undefined
                      }
                    >
                      {fmtRatio(cell.ratio)}
                    </td>,
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <SpecialCityRatioLegend />
      </div>
    </>
  );
}
