import {
  FDB_SCHOOL_NAME_COL_PX,
  FDB_TABLE,
  FDB_TABLE_HEAD,
} from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type { CompetitivenessTargetUnivRow } from "@/lib/analysis/competitiveness-target-univ-mock-view";

import "@/components/analysis/freshman-enrollment-alimi-table.css";

function fmtEnrolledCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return Math.trunc(n).toLocaleString("ko-KR");
}

function flagCell(value: string) {
  const v = value.trim();
  if (!v) return "";
  return <span className="font-semibold text-accent-orange">{v}</span>;
}

export function CompetitivenessTargetUnivDataTable({
  rows,
}: {
  rows: CompetitivenessTargetUnivRow[];
}) {
  const tableHeadClass = FDB_TABLE_HEAD.base;
  const cell = `whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} last:border-r-0 ${FDB_TYPO.tableBody}`;

  return (
    <div className="feam-table-wrap rounded-lg border border-border/60">
      <table
        className={`w-full min-w-[880px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}
      >
        <colgroup>
          <col style={{ width: FDB_SCHOOL_NAME_COL_PX }} />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {[
              { label: "학교명", align: "left" as const },
              { label: "지역", align: "center" as const },
              { label: "재학생수", align: "right" as const },
              { label: "학자금제한", align: "center" as const },
              { label: "임시이사", align: "center" as const },
              { label: "결산미제출", align: "center" as const },
              { label: "자금부족", align: "center" as const },
            ].map((col) => (
              <th
                key={col.label}
                className={`${tableHeadClass} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} ${
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                      ? "pr-[5ch] text-right"
                      : "text-left"
                } last:border-r-0`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.year}-${row.schoolRepCode}-${row.schoolRepName}`}
              className={`border-b border-border/40 ${
                i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
              }`}
            >
              <td
                className={`overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE.schoolNameCol} ${FDB_TABLE_COLOR.schoolName}`}
              >
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <span className="truncate">{row.schoolRepName}</span>
                  {row.campusCount > 1 ? (
                    <span
                      className={`shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-normal text-accent ${FDB_TYPO.legend}`}
                    >
                      {row.campusCount}개
                    </span>
                  ) : null}
                </span>
              </td>
              <td className={`${cell} text-center`}>{row.region || "—"}</td>
              <td
                className={`${cell} pr-[5ch] text-right font-mono tabular-nums`}
              >
                {fmtEnrolledCount(row.enrolledTotal)}
              </td>
              <td className={`${cell} text-center`}>
                {flagCell(row.studentAidRestrict)}
              </td>
              <td className={`${cell} text-center`}>
                {flagCell(row.provisionalBoard)}
              </td>
              <td className={`${cell} text-center`}>
                {flagCell(row.noSettlement)}
              </td>
              <td className={`${cell} text-center`}>
                {flagCell(row.fundShortage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
