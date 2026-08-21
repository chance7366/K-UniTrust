"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { RunResultsExportButtons } from "@/components/analysis/competitiveness-analysis/RunResultsExportButtons";
import { RunStepHelpPanel } from "@/components/analysis/competitiveness-analysis/RunStepHelpPanel";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { buildStep2ExportAoa } from "@/lib/competitiveness-analysis/export-run-results";
import { STEP2_INDEX_HELP_SECTIONS } from "@/lib/competitiveness-analysis/step-help";
import {
  matchesSchoolKindFilter,
  STEP1_INDICATOR_LABELS,
  type SchoolKindFilter,
} from "@/lib/competitiveness-analysis/step1-indicators";
import type { UniversityRunResult } from "@/lib/competitiveness-analysis/types";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";
import { RUN_NO_RESULTS_MESSAGE } from "@/components/analysis/competitiveness-analysis/RunStatusBanner";

import "@/components/analysis/freshman-enrollment-alimi-table.css";

function fmt(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function parseSchoolKindFilter(value: string | null): SchoolKindFilter {
  return value === "junior-college" ? "junior-college" : "university";
}

export function Step2IndexResultsPanel() {
  const searchParams = useSearchParams();
  const kindParam = searchParams.get("kind");

  const {
    analysisYear,
    step2IndexResults,
    step2LastRunAt,
    step2Error,
    step12IndicatorIds,
  } = useCompetitivenessSettings();

  const [schoolKindFilter, setSchoolKindFilter] = useState<SchoolKindFilter>(
    () => parseSchoolKindFilter(kindParam),
  );
  const [schoolQuery, setSchoolQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setSchoolKindFilter(parseSchoolKindFilter(kindParam));
  }, [kindParam]);

  const filteredRows = useMemo(() => {
    if (!step2IndexResults?.length) return [];
    const query = schoolQuery.trim().toLowerCase();
    return [...step2IndexResults]
      .filter((row) => {
        if (!matchesSchoolKindFilter(row.schoolKind, schoolKindFilter)) return false;
        if (!query) return true;
        return row.schoolName.toLowerCase().includes(query);
      })
      .sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));
  }, [step2IndexResults, schoolKindFilter, schoolQuery]);

  const exportUniversityCount = useMemo(() => {
    if (!step2IndexResults?.length) return 0;
    return step2IndexResults.filter((row) =>
      matchesSchoolKindFilter(row.schoolKind, "university"),
    ).length;
  }, [step2IndexResults]);

  const exportJuniorCollegeCount = useMemo(() => {
    if (!step2IndexResults?.length) return 0;
    return step2IndexResults.filter((row) =>
      matchesSchoolKindFilter(row.schoolKind, "junior-college"),
    ).length;
  }, [step2IndexResults]);

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {step2Error ? (
        <p className={`mb-3 ${FDB_TYPO.legend} text-danger`}>{step2Error}</p>
      ) : null}

      {!step2IndexResults?.length ? (
        <p className={`rounded-lg border border-dashed border-border bg-surface-2 px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
          {RUN_NO_RESULTS_MESSAGE}
        </p>
      ) : (
        <div className="space-y-3">
          {helpOpen ? (
            <RunStepHelpPanel
              kicker="2단계 도움말"
              title="지수·순위 생성 방법"
              intro={`1단계 원지표값을 전국 동종(대학/전문대학) 분포 대비 백분위(0~100)로 표준화합니다. 순위는 대상대학 내 동종별 순위이며, 가중치는 반영하지 않습니다.${step2LastRunAt ? ` 마지막 실행: ${step2LastRunAt}` : ""}`}
              sections={STEP2_INDEX_HELP_SECTIONS}
              onClose={() => setHelpOpen(false)}
            />
          ) : null}
          <div className="flex h-[56px] flex-wrap items-center justify-end gap-1.5 border-b border-border bg-surface-2/50 px-4">
              <SchoolNameSearchInput
                value={schoolQuery}
                onSearch={setSchoolQuery}
                className="shrink-0"
              />
              <RunResultsExportButtons
                step={2}
                analysisYear={analysisYear}
                schoolKind={schoolKindFilter}
                universityCount={exportUniversityCount}
                juniorCollegeCount={exportJuniorCollegeCount}
                buildRows={(kind) =>
                  buildStep2ExportAoa(
                    (step2IndexResults ?? []).filter((row) =>
                      matchesSchoolKindFilter(row.schoolKind, kind),
                    ),
                    step12IndicatorIds,
                  )
                }
              />
              <GlassHelpButton
                active={helpOpen}
                onClick={() => setHelpOpen((open) => !open)}
                size="sm"
              />
          </div>

          {filteredRows.length ? (
            <Step2IndicatorTable
              rows={filteredRows}
              indicatorIds={step12IndicatorIds}
            />
          ) : (
            <p className={`rounded-lg border border-dashed border-border bg-surface-2 px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
              {schoolQuery.trim()
                ? "검색 조건에 맞는 학교가 없습니다."
                : "해당 학교종류 대상대학이 없습니다."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Step2IndicatorTable({
  rows,
  indicatorIds,
}: {
  rows: UniversityRunResult[];
  indicatorIds: string[];
}) {
  return (
    <div className="feam-table-wrap rounded-lg border border-border">
      <table className={`w-full min-w-[1600px] text-left ${FDB_TYPO.tableBody}`}>
        <thead className={`bg-surface-2 ${FDB_TYPO.legend}`}>
          <tr>
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} bg-surface-2 text-center`}
            >
              No
            </th>
            <th
              rowSpan={2}
              className={`${FDB_TABLE_HEAD.rowSpan} min-w-[120px] bg-surface-2`}
            >
              학교명
            </th>
            {indicatorIds.map((id) => (
              <th
                key={id}
                colSpan={3}
                className={`${FDB_TABLE_HEAD.base} border-r border-border/50 text-center ${FDB_TABLE.headGroup}`}
              >
                {STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id}
              </th>
            ))}
          </tr>
          <tr>
            {indicatorIds.map((id) => (
              <Fragment key={id}>
                <th className={`${FDB_TABLE_HEAD.base} border-r border-border/50 text-center ${FDB_TABLE.headSub}`}>
                  지표값
                </th>
                <th className={`${FDB_TABLE_HEAD.base} border-r border-border/50 text-center ${FDB_TABLE.headSub}`}>
                  지수
                </th>
                <th className={`${FDB_TABLE_HEAD.base} border-r border-border/50 text-center ${FDB_TABLE.headSub}`}>
                  순위
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.schoolCodeStd}
              className={`border-b border-border/40 ${
                idx % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
              }`}
              data-stripe={idx % 2 === 0 ? "odd" : "even"}
            >
              <td className={`${FDB_TABLE.cellSticky} text-center text-muted`}>
                {idx + 1}
              </td>
              <td className={`${FDB_TABLE.cellSticky} ${FDB_TABLE_COLOR.schoolName}`}>
                {row.schoolName}
              </td>
              {indicatorIds.map((id) => {
                const cell = row.indicators.find((c) => c.financeTabId === id);
                return (
                  <Fragment key={id}>
                    <td className={`${FDB_TABLE.cellMetric} border-l border-border/40 text-right font-mono tabular-nums ${FDB_TYPO.tableBody}`}>
                      {cell && !cell.dataMissing ? fmt(cell.rawValue) : "—"}
                    </td>
                    <td className={`${FDB_TABLE.cellMetric} text-right font-semibold tabular-nums ${FDB_TYPO.tableBody} text-accent`}>
                      {cell && !cell.dataMissing ? fmt(cell.indexScore) : "—"}
                    </td>
                    <td className={`${FDB_TABLE.cellMetric} text-right tabular-nums ${FDB_TYPO.tableBody}`}>
                      {cell && !cell.dataMissing && cell.rank ? cell.rank : "—"}
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
