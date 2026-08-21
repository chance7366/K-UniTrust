import { FDB_TABLE } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type {
  AnalysisTargetRepRow,
  AnalysisTargetViewMode,
} from "@/lib/analysis/analysis-target-view";

import "./freshman-enrollment-alimi-table.css";

const tableHeadClass = `text-table-head ${FDB_TYPO.tableHead}`;

const thClass = `${tableHeadClass} whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} text-left font-medium last:border-r-0`;
const tdClass = `whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} last:border-r-0 ${FDB_TYPO.tableBody}`;

function cell(value: string) {
  return value || "—";
}

function flagCell(value: string) {
  const v = value.trim();
  return !v || v === "—" ? "" : v;
}

type ColumnDef = {
  key: string;
  label: string;
  align?: "left" | "center";
  emphasis?: "codeAccent" | "code" | "name" | "flag";
  getValue: (row: AnalysisTargetRepRow) => string;
};

const CAMPUS_COLUMNS: ColumnDef[] = [
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
    getValue: (row) => cell(row.region),
  },
  {
    key: "estb",
    label: "설립구분",
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
    getValue: (row) => cell(row.status),
  },
  {
    key: "parentSchoolName",
    label: "상위학교",
    getValue: (row) => cell(row.parentSchoolName),
  },
  {
    key: "studentAidRestrict",
    label: "학자금제한",
    align: "center",
    emphasis: "flag",
    getValue: (row) => flagCell(row.studentAidRestrict),
  },
  {
    key: "provisionalBoard",
    label: "임시이사",
    align: "center",
    emphasis: "flag",
    getValue: (row) => flagCell(row.provisionalBoard),
  },
  {
    key: "noSettlement",
    label: "결산미제출",
    align: "center",
    emphasis: "flag",
    getValue: (row) => flagCell(row.noSettlement),
  },
];

const REP_COLUMNS: ColumnDef[] = [
  {
    key: "schoolRepCode",
    label: "대표학교코드",
    align: "center",
    emphasis: "codeAccent",
    getValue: (row) => row.schoolRepCode || row.schoolCodeStd,
  },
  {
    key: "schoolRepName",
    label: "학교대표",
    emphasis: "name",
    getValue: (row) => row.schoolRepName || row.schoolName,
  },
  {
    key: "campusCount",
    label: "캠퍼스 수",
    align: "center",
    getValue: (row) => String(row.campusCount),
  },
  {
    key: "schoolKind",
    label: "학교종류",
    getValue: (row) => cell(row.schoolKind),
  },
  {
    key: "region",
    label: "지역",
    getValue: (row) => cell(row.region),
  },
  {
    key: "estb",
    label: "설립구분",
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
    getValue: (row) => cell(row.status),
  },
  {
    key: "studentAidRestrict",
    label: "학자금제한",
    align: "center",
    emphasis: "flag",
    getValue: (row) => flagCell(row.studentAidRestrict),
  },
  {
    key: "provisionalBoard",
    label: "임시이사",
    align: "center",
    emphasis: "flag",
    getValue: (row) => flagCell(row.provisionalBoard),
  },
  {
    key: "noSettlement",
    label: "결산미제출",
    align: "center",
    emphasis: "flag",
    getValue: (row) => flagCell(row.noSettlement),
  },
];

function cellClass(col: ColumnDef, value: string): string {
  const parts = [tdClass];
  if (col.align === "center") parts.push("text-center");
  if (col.emphasis === "codeAccent") {
    parts.push(`font-mono tabular-nums ${FDB_TYPO.tableCode} text-muted`);
  } else if (col.emphasis === "code") {
    parts.push(`font-mono tabular-nums ${FDB_TYPO.tableCode}`);
  } else if (col.emphasis === "name") {
    parts.push(FDB_TABLE_COLOR.schoolName);
  } else if (col.emphasis === "flag" && value) {
    parts.push("font-semibold text-accent-orange");
  }
  return parts.join(" ");
}

function headClass(col: ColumnDef): string {
  const parts = [thClass, "sticky top-0 z-[2] bg-surface-2"];
  if (col.align === "center") parts.push("text-center");
  return parts.join(" ");
}

export function AnalysisTargetDataTable({
  rows,
  viewMode = "campus",
}: {
  rows: AnalysisTargetRepRow[];
  viewMode?: AnalysisTargetViewMode;
}) {
  const columns = viewMode === "rep" ? REP_COLUMNS : CAMPUS_COLUMNS;

  return (
    <div className="feam-table-wrap rounded-lg border border-border/60">
      <table className={`w-full min-w-max border-separate ${FDB_TYPO.tableBody}`}>
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {columns.map((col) => (
              <th key={col.key} className={headClass(col)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={
                viewMode === "rep"
                  ? `${row.year}-${row.schoolRepCode || row.schoolCodeStd}-${row.schoolDivision}-${i}`
                  : `${row.year}-${row.schoolCodeStd}-${i}`
              }
              className={`border-b border-border/40 ${
                i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
              }`}
            >
              {columns.map((col) => {
                const value = col.getValue(row);
                return (
                  <td key={col.key} className={cellClass(col, value)}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
