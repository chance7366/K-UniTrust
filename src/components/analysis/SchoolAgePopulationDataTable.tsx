"use client";

import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  EXTINCTION_RISK_GRADE_LEGEND,
  getSchoolAgeCellGrade,
  getSchoolAgeRiskTextColor,
  isSchoolAgeColoredColumn,
  SCHOOL_AGE_BASELINE_KEY,
  SCHOOL_AGE_RISK_INDEX_LEGEND_DESCRIPTION,
} from "@/lib/analysis/school-age-population-decline-grade";
import { schoolAgeRowCellBg } from "@/lib/analysis/school-age-population-table-style";
import type {
  SchoolAgePopulationRow,
  SchoolAgePopulationYearCell,
} from "@/lib/data/school-age-population";
import {
  SCHOOL_AGE_AGE_COLUMNS,
  SCHOOL_AGE_AGE_GROUPS,
  type SchoolAgeAgeKey,
} from "@/lib/ingest/school-age-population-config";

import "./freshman-enrollment-alimi-table.css";
import "./regional-decline-dashboard.css";

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR");
}

function fmtWeight(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function RiskIndexLegend() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted">위험지수</span>
        {EXTINCTION_RISK_GRADE_LEGEND.map((grade) => {
          return (
            <span
              key={grade}
              className="inline-flex min-w-[1.75rem] items-center justify-center text-xs font-bold"
              style={{ color: getSchoolAgeRiskTextColor(grade) }}
            >
              {grade}
            </span>
          );
        })}
      </div>
      <p className={FDB_TYPO.legend}>
        {SCHOOL_AGE_RISK_INDEX_LEGEND_DESCRIPTION}
      </p>
    </div>
  );
}

function AgeCell({
  colKey,
  cell,
  rowBg,
  borderRight,
}: {
  colKey: SchoolAgeAgeKey;
  cell: SchoolAgePopulationYearCell | null;
  rowBg: string;
  borderRight: boolean;
}) {
  if (!cell) {
    return (
      <td
        className={`${FDB_TABLE.cellMetric} text-right font-mono ${rowBg} ${
          borderRight ? "border-r border-border/40" : ""
        }`}
      >
        —
      </td>
    );
  }

  const value = cell.ages[colKey];
  const baseline = cell.ages[SCHOOL_AGE_BASELINE_KEY];

  if (!isSchoolAgeColoredColumn(colKey)) {
    const isBaseline = colKey === SCHOOL_AGE_BASELINE_KEY;
    return (
      <td
        className={`${FDB_TABLE.cellMetric} text-right font-mono ${
          isBaseline ? "font-semibold text-accent-orange" : "text-muted"
        } ${rowBg} ${borderRight ? "border-r border-border/40" : ""}`}
      >
        {fmtCount(value)}
      </td>
    );
  }

  const grade = getSchoolAgeCellGrade(value, baseline);
  if (grade == null || value == null) {
    return (
      <td
        className={`${FDB_TABLE.cellMetric} text-right font-mono ${rowBg} ${
          borderRight ? "border-r border-border/40" : ""
        }`}
      >
        —
      </td>
    );
  }

  return (
    <td
      className={`${FDB_TABLE.cellMetric} text-right font-mono font-semibold ${rowBg} ${
        borderRight ? "border-r border-border/40" : ""
      }`}
      style={{ color: getSchoolAgeRiskTextColor(grade) }}
    >
      {fmtCount(value)}
    </td>
  );
}

export function SchoolAgePopulationDataTable({
  rows,
  displayYear,
  showWeight = true,
}: {
  rows: SchoolAgePopulationRow[];
  displayYear: number;
  showWeight?: boolean;
}) {
  const groupEndKeys = new Set(
    SCHOOL_AGE_AGE_GROUPS.map((g) => `age_${g.ages[g.ages.length - 1]}`),
  );

  return (
    <>
      <div className="feam-table-wrap rd-table-wrap rounded-lg border border-border/60">
        <table className="w-full min-w-[1280px]">
          <thead>
            <tr className="bg-surface-2 text-xs">
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan}  min-w-[72px] bg-surface-2 text-left`}
              >
                구분
              </th>
              {showWeight ? (
                <th
                  rowSpan={2}
                  className={`${FDB_TABLE_HEAD.rowSpan} min-w-[72px] bg-surface-2 text-center`}
                >
                  가중치
                </th>
              ) : null}
              {SCHOOL_AGE_AGE_GROUPS.map((g, i) => (
                <th
                  key={g.label}
                  colSpan={g.ages.length}
                  className={`${FDB_TABLE_HEAD.base} text-center ${FDB_TABLE.headGroup} ${
                    i < SCHOOL_AGE_AGE_GROUPS.length - 1
                      ? "border-r border-border/50"
                      : ""
                  }`}
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 text-xs">
              {SCHOOL_AGE_AGE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${FDB_TABLE_HEAD.base} min-w-[64px] text-center ${FDB_TABLE.headSub} ${
                    groupEndKeys.has(col.key) ? "border-r border-border/50" : ""
                  } ${col.key === SCHOOL_AGE_BASELINE_KEY ? "text-accent-orange" : ""}`}
                >
                  {col.header}
                  {col.key === SCHOOL_AGE_BASELINE_KEY ? (
                    <span className="mt-0.5 block text-[10px] font-normal text-accent-orange">
                      기준
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="!text-[13px] text-right">
            {rows.map((row, rowIndex) => {
              const cell = row.byYear[displayYear] ?? null;
              const rowBg = schoolAgeRowCellBg(rowIndex);
              return (
                <tr key={row.region} className="border-b border-border/40">
                  <td
                    className={` border-r border-border/50 ${FDB_TABLE.cellSticky} text-right ${FDB_TABLE_COLOR.schoolName} ${rowBg}`}
                  >
                    {row.region}
                  </td>
                  {showWeight ? (
                    <td
                      className={`${FDB_TABLE.cellMetric} border-r border-border/40 text-right font-mono font-bold text-[#1e40af] ${rowBg}`}
                    >
                      {fmtWeight(cell?.admissionWeight)}
                    </td>
                  ) : null}
                  {SCHOOL_AGE_AGE_COLUMNS.map((col) => (
                    <AgeCell
                      key={col.key}
                      colKey={col.key}
                      cell={cell}
                      rowBg={rowBg}
                      borderRight={groupEndKeys.has(col.key)}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <RiskIndexLegend />
      </div>
    </>
  );
}
