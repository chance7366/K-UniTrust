"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { RunResultsExportButtons } from "@/components/analysis/competitiveness-analysis/RunResultsExportButtons";
import { RunStepHelpPanel } from "@/components/analysis/competitiveness-analysis/RunStepHelpPanel";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { buildStep1ExportAoa } from "@/lib/competitiveness-analysis/export-run-results";
import { STEP1_RAW_HELP_SECTIONS } from "@/lib/competitiveness-analysis/step-help";
import {
  matchesSchoolKindFilter,
  STEP1_INDICATOR_LABELS,
  type SchoolKindFilter,
} from "@/lib/competitiveness-analysis/step1-indicators";
import type { UniversityRawResult } from "@/lib/competitiveness-analysis/types";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";
import { RUN_NO_RESULTS_MESSAGE } from "@/components/analysis/competitiveness-analysis/RunStatusBanner";

import "@/components/analysis/freshman-enrollment-alimi-table.css";

function fmt(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function fmtEnrolledCount(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "";
  return Math.trunc(v).toLocaleString("ko-KR");
}

function parseSchoolKindFilter(value: string | null): SchoolKindFilter {
  return value === "junior-college" ? "junior-college" : "university";
}

export function Step1RawResultsPanel() {
  const searchParams = useSearchParams();
  const kindParam = searchParams.get("kind");

  const {
    analysisYear,
    settings,
    step1RawResults,
    step1LastRunAt,
    step1Error,
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
    if (!step1RawResults?.length) return [];
    const query = schoolQuery.trim().toLowerCase();
    return [...step1RawResults]
      .filter((row) => {
        if (!matchesSchoolKindFilter(row.schoolKind, schoolKindFilter)) return false;
        if (!query) return true;
        return row.schoolName.toLowerCase().includes(query);
      })
      .sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));
  }, [step1RawResults, schoolKindFilter, schoolQuery]);

  const yearLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const id of step12IndicatorIds) {
      map.set(
        id,
        settings.indicatorYears[id] ??
          step1RawResults?.[0]?.indicators.find((c) => c.financeTabId === id)
            ?.yearLabel ??
          "—",
      );
    }
    return map;
  }, [settings.indicatorYears, step1RawResults, step12IndicatorIds]);

  const yearLabelRecord = useMemo(() => {
    const record: Record<string, string> = {};
    for (const [id, label] of yearLabels.entries()) {
      record[id] = label;
    }
    return record;
  }, [yearLabels]);

  const exportUniversityCount = useMemo(() => {
    if (!step1RawResults?.length) return 0;
    return step1RawResults.filter((row) =>
      matchesSchoolKindFilter(row.schoolKind, "university"),
    ).length;
  }, [step1RawResults]);

  const exportJuniorCollegeCount = useMemo(() => {
    if (!step1RawResults?.length) return 0;
    return step1RawResults.filter((row) =>
      matchesSchoolKindFilter(row.schoolKind, "junior-college"),
    ).length;
  }, [step1RawResults]);

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {step1Error ? (
        <p className={`mb-3 ${FDB_TYPO.legend} text-danger`}>{step1Error}</p>
      ) : null}

      {!step1RawResults?.length ? (
        <p className={`rounded-lg border border-dashed border-border bg-surface-2 px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
          {RUN_NO_RESULTS_MESSAGE}
        </p>
      ) : (
        <div className="space-y-3">
          {helpOpen ? (
            <RunStepHelpPanel
              kicker="1단계 도움말"
              title="원지표값 생성 방법"
              intro={`대상대학별 원값을 재정분석지표 표시연도에서 조회합니다. 학생충원지표는 대학은 대학+대학원, 전문대학은 전문대학 값을 쓰며, 분석지침에 설정된 지표(${step12IndicatorIds.length}개)를 사용합니다.${step1LastRunAt ? ` 마지막 실행: ${step1LastRunAt}` : ""}`}
              sections={STEP1_RAW_HELP_SECTIONS}
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
                step={1}
                analysisYear={analysisYear}
                schoolKind={schoolKindFilter}
                universityCount={exportUniversityCount}
                juniorCollegeCount={exportJuniorCollegeCount}
                buildRows={(kind) =>
                  buildStep1ExportAoa(
                    (step1RawResults ?? []).filter((row) =>
                      matchesSchoolKindFilter(row.schoolKind, kind),
                    ),
                    step12IndicatorIds,
                    yearLabelRecord,
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
            <Step1IndicatorTable
              rows={filteredRows}
              yearLabels={yearLabels}
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

function Step1IndicatorTable({
  rows,
  yearLabels,
  indicatorIds,
}: {
  rows: UniversityRawResult[];
  yearLabels: Map<string, string>;
  indicatorIds: string[];
}) {
  return (
    <div className="feam-table-wrap rounded-lg border border-border">
      <table className={`w-full min-w-[1400px] text-left ${FDB_TYPO.tableBody}`}>
        <thead className={`bg-surface-2 ${FDB_TYPO.legend}`}>
          <tr>
            <th className={`${FDB_TABLE_HEAD.base} border-r border-border/50 text-center ${FDB_TABLE.headSingle}`}>
              No
            </th>
            <th className={`${FDB_TABLE_HEAD.base} min-w-[140px] border-r border-border/50 bg-surface-2 ${FDB_TABLE.headSingle}`}>
              학교명
            </th>
            <th className={`${FDB_TABLE_HEAD.base} border-r border-border/50 pr-[5ch] text-right ${FDB_TABLE.headSingle}`}>
              재학생수
            </th>
            <th className={`${FDB_TABLE_HEAD.base} border-r border-border/50 ${FDB_TABLE.headSingle}`}>지역</th>
            {indicatorIds.map((id) => (
              <th
                key={id}
                className={`${FDB_TABLE_HEAD.base} min-w-[88px] border-r border-border/50 text-right ${FDB_TABLE.headSingle}`}
              >
                <div>
                  {STEP1_INDICATOR_LABELS[id as keyof typeof STEP1_INDICATOR_LABELS] ?? id}
                </div>
                <div className="mt-0.5 font-normal text-[10px] text-muted">
                  {yearLabels.get(id)}
                </div>
              </th>
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
              <td className={`${FDB_TABLE.cell} pr-[5ch] text-right font-mono tabular-nums`}>
                {fmtEnrolledCount(row.enrolledTotal)}
              </td>
              <td className={FDB_TABLE.cell}>{row.region || "—"}</td>
              {indicatorIds.map((id) => {
                const cell = row.indicators.find((c) => c.financeTabId === id);
                return (
                  <td
                    key={id}
                    className={`${FDB_TABLE.cellMetric} text-right font-mono tabular-nums ${FDB_TYPO.tableBody}`}
                    title={cell && !cell.found ? cell.note : undefined}
                  >
                    {cell?.found ? (
                      fmt(cell.rawValue)
                    ) : (
                      <span className="text-warning" title={cell?.note}>
                        —
                      </span>
                    )}
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
