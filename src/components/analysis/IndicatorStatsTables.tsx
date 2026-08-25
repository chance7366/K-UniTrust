"use client";

import { PanelWithHelp } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import type {
  IndicatorStatsColumn,
  IndicatorStatsFormat,
  IndicatorStatsNumericRow,
} from "@/lib/analysis/indicator-stats";

function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function fmtRate(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtMillion0(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n / 1000).toLocaleString("ko-KR");
}

function formatValue(
  n: number | null | undefined,
  format: IndicatorStatsFormat,
): string {
  if (format === "rate") return fmtRate(n);
  if (format === "million0") return fmtMillion0(n);
  return fmtInt(n);
}

function StatsTable({
  groupLabel,
  rows,
  columns,
}: {
  groupLabel: string;
  rows: IndicatorStatsNumericRow[];
  columns: IndicatorStatsColumn[];
}) {
  const groups: { name: string; cols: IndicatorStatsColumn[] }[] = [];
  for (const col of columns) {
    const name = col.group ?? "";
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.cols.push(col);
    else groups.push({ name, cols: [col] });
  }
  const hasGroups = groups.some((g) => g.name);
  const head = `${CHART_TYPO.tableHead} px-2 py-2 text-center`;
  const cell = "px-2 py-1.5 text-right font-mono";

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full min-w-[880px] table-fixed border-collapse ${CHART_TYPO.tableBody}`}
      >
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th
              rowSpan={hasGroups ? 2 : 1}
              className={`${head} text-left`}
            >
              {groupLabel}
            </th>
            <th rowSpan={hasGroups ? 2 : 1} className={head}>
              학교 수
            </th>
            {groups.map((group) =>
              group.name ? (
                <th
                  key={group.name}
                  colSpan={group.cols.length}
                  className={`${head} border-b border-border/50 border-r border-border/40 ${
                    group.cols.some((c) => c.format === "rate")
                      ? FDB_TABLE_COLOR.rateGroup
                      : ""
                  }`}
                >
                  {group.name}
                </th>
              ) : (
                group.cols.map((col) => (
                  <th
                    key={col.id}
                    rowSpan={hasGroups ? 2 : 1}
                    className={`${head} ${
                      col.rateTone === "primary"
                        ? FDB_TABLE_COLOR.ratePrimary
                        : col.rateTone === "secondary"
                          ? FDB_TABLE_COLOR.rateSecondary
                          : ""
                    }`}
                  >
                    {col.label}
                  </th>
                ))
              ),
            )}
          </tr>
          {hasGroups ? (
            <tr className="border-b border-border bg-surface-2">
              {columns
                .filter((col) => col.group)
                .map((col) => (
                  <th
                    key={col.id}
                    className={`${head} border-r border-border/40 ${
                      col.rateTone === "primary"
                        ? FDB_TABLE_COLOR.ratePrimary
                        : col.rateTone === "secondary"
                          ? FDB_TABLE_COLOR.rateSecondary
                          : ""
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
            </tr>
          ) : null}
        </thead>
        <tbody>
          {rows.map((row) => {
            const isTotal = row.label === "전체";
            return (
              <tr
                key={row.label}
                className={`border-b border-border/40 ${
                  isTotal ? "bg-surface-2 font-semibold" : ""
                }`}
              >
                <td className="px-2 py-1.5 text-left font-bold text-accent">
                  {row.label}
                </td>
                <td className={`${cell} text-center`}>{fmtInt(row.schoolCount)}</td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`${cell} ${
                      col.rateTone === "primary"
                        ? FDB_TABLE_COLOR.ratePrimary
                        : col.rateTone === "secondary"
                          ? FDB_TABLE_COLOR.rateSecondary
                          : ""
                    }`}
                  >
                    {formatValue(row.values[col.id], col.format)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function IndicatorStatsTables({
  division,
  scale,
  zone,
  region,
  columns,
  note,
  showDivision,
}: {
  division: IndicatorStatsNumericRow[] | null;
  scale: IndicatorStatsNumericRow[];
  zone: IndicatorStatsNumericRow[];
  region: IndicatorStatsNumericRow[];
  columns: IndicatorStatsColumn[];
  note?: string;
  showDivision: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {note ? <p className={CHART_TYPO.legend}>{note}</p> : null}
      {showDivision && division ? (
        <PanelWithHelp
          title="학교구분별"
          subtitle="전체대학 탭 · 전체와 각 학교구분"
          help={{
            title: "학교구분별",
            body: "전체는 현재 전체대학 보기입니다. 아래 구분은 각 코호트 원자료입니다.",
          }}
        >
          <StatsTable groupLabel="학교구분" rows={division} columns={columns} />
        </PanelWithHelp>
      ) : null}
      <PanelWithHelp
        title="규모별"
        subtitle="전체 + 대규모·중규모·소규모"
        help={{
          title: "규모별",
          body: "대학경쟁력분석과 같은 재학생수 규모 기준입니다. 대학은 10,000/5,000명, 전문대학은 4,000/2,000명입니다.",
        }}
      >
        <StatsTable groupLabel="규모" rows={scale} columns={columns} />
      </PanelWithHelp>
      <PanelWithHelp
        title="권역별"
        subtitle="전체 + 5극 3특"
        help={{
          title: "권역별",
          body: "수도권·충청권·동남권·대경권·서남권·강원권·전북권·제주권으로 같은 원자료를 합산합니다.",
        }}
      >
        <StatsTable groupLabel="권역" rows={zone} columns={columns} />
      </PanelWithHelp>
      <PanelWithHelp
        title="지역별"
        subtitle="전체 + 17개 시·도"
        help={{
          title: "지역별",
          body: "소재 시·도별로 원자료를 합산합니다. 전체는 시·도 미매칭 행을 포함한 코호트 전체입니다.",
        }}
      >
        <StatsTable groupLabel="지역" rows={region} columns={columns} />
      </PanelWithHelp>
    </div>
  );
}
