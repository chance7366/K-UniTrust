"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardSectionTabRow } from "@/components/analysis/DashboardSectionTabRow";
import { DashboardViewModeToggle } from "@/components/analysis/DashboardViewModeToggle";
import { DashboardYearFilterSelect } from "@/components/analysis/DashboardYearFilterSelect";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DropoutRateChartDashboard } from "@/components/analysis/DropoutRateChartDashboard";
import { DropoutRateDataTable } from "@/components/analysis/DropoutRateDataTable";
import { FinanceAnalysisDbExportButtons } from "@/components/analysis/FinanceAnalysisDbExportButtons";
import { FilterMultiCheckbox } from "@/components/analysis/FilterMultiCheckbox";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { buildDropoutRateHref } from "@/lib/analysis/dropout-rate-navigation";
import { serializeMultiFilterParam } from "@/lib/analysis/table-filter-utils";
import type {
  DropoutRateDashboardData,
  DropoutRateSection,
  DropoutRateViewMode,
  DropoutRateYearStatus,
} from "@/lib/data/dropout-rate";
import {
  DROPOUT_RATE_TEMPLATE_HEADER,
  DROPOUT_RATE_TEMPLATE_SAMPLES,
} from "@/lib/ingest/dropout-rate-config";

const ALL_FILTER = "";

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

function TemplatePreviewTable() {
  return (
    <div className="mt-4 w-full basis-full overflow-x-auto rounded-lg border border-border/60">
      <table className={`w-full min-w-[960px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            {DROPOUT_RATE_TEMPLATE_HEADER.map((h) => (
              <th key={h} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DROPOUT_RATE_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">{row.기준연도}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교종류}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.설립구분}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.지역}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.상태}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-center font-mono">{row.학교코드_표준}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">{fmtCount(row.재적학생)}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">{fmtCount(row.재적학생중도탈락)}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono font-semibold text-accent-orange">{fmtPercent(row.재적학생중도탈락비율)}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">{fmtCount(row.재적학생_신입생)}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">{fmtCount(row.신입생중도탈락)}</td>
              <td className="px-2 py-1.5 text-right font-mono font-semibold text-accent-orange">{fmtPercent(row.신입생중도탈락비율)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        양식 헤더·샘플 행 — 업로드 시 위 1행 헤더 구조를 그대로 사용하세요. 기준연도는 A열에서 인식됩니다.
      </p>
    </div>
  );
}

function UploadPanel({
  uploadedAt,
  rowCount,
  consolidatedRowCount,
  onClose,
}: {
  uploadedAt: string | null;
  rowCount: number;
  consolidatedRowCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  function handleFile(file: File) {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch(
          "/api/ingest/finance-analysis/dropout-rate/upload",
          { method: "POST", body: fd },
        );
        const body = (await res.json()) as {
          ok?: boolean;
          rowCount?: number;
          overwrittenYears?: number[];
          newYears?: number[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "업로드에 실패했습니다.");
        }
        const parts: string[] = [];
        if (body.overwrittenYears?.length) {
          parts.push(`덮어쓰기 연도: ${body.overwrittenYears.join(", ")}`);
        }
        if (body.newYears?.length) {
          parts.push(`신규 연도: ${body.newYears.join(", ")}`);
        }
        setMessage(
          `${body.rowCount ?? 0}건 저장됨${parts.length ? ` · ${parts.join(" · ")}` : ""}`,
        );
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "업로드에 실패했습니다.",
        );
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <section className="rounded-xl border border-dashed border-accent-cyan/40 bg-surface/60 p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>엑셀업로드</p>
          <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>중도탈락율</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            중도탈락 학생 현황(학교별자료) 엑셀을 업로드하면{" "}
            <code className="text-accent">data/csv/finance_analysis_dropout_rate.csv</code>
            에 저장됩니다. 동일 기준연도는 덮어쓰기, 신규 연도는 추가됩니다.
          </p>
          {uploadedAt ? (
            <p className={`mt-2 ${FDB_TYPO.legend}`}>
              최근 업로드: {new Date(uploadedAt).toLocaleString("ko-KR")} · {rowCount.toLocaleString("ko-KR")}행
            </p>
          ) : (
            <p className={`mt-2 ${FDB_TYPO.legend} text-warning`}>아직 업로드된 데이터가 없습니다.</p>
          )}
          {message ? <p className={`mt-2 ${FDB_TYPO.legend} text-accent`}>{message}</p> : null}
          {error ? <p className={`mt-2 ${FDB_TYPO.legend} text-accent-orange`}>{error}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <UploadPanelTemplateLink href="/api/ingest/finance-analysis/dropout-rate/template" download="dropout_rate_upload_template.xlsx" />
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <UploadPanelSelectButton disabled={pending} pending={pending} onClick={() => inputRef.current?.click()} />
          <UploadPanelHideButton onClick={onClose} />
          <UploadPanelHelpButton active={helpOpen} onClick={() => setHelpOpen((prev) => !prev)} />
        </div>
        </div>
        <FinanceAnalysisDbExportButtons
          exportBasePath="/api/ingest/finance-analysis/dropout-rate/export"
          hasConsolidated
          campusRowCount={rowCount}
          consolidatedRowCount={consolidatedRowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">업로드 양식</span>은 기준연도·학교종류·설립구분·지역·상태·학교코드_표준·학교·재적학생·신입생 중도탈락 현황 1행 헤더 구조입니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">기준연도</span>는 A열에서 인식하며, 표시 연도 선택으로 조회합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> : 중도탈락 학생 현황(학교별자료)
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">DB 원본 down</span>
              은 현재 DB에 저장된 전체 원본 데이터를 업로드 양식과 동일한
              구조의 엑셀 파일로 받을 수 있습니다. 본교통합 DB는 집계 결과
              CSV를 엑셀로 변환합니다.
            </p>
          </div>
        ) : null}
        <TemplatePreviewTable />
      </div>
    </section>
  );
}

function FilterSelect({  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        <option value={ALL_FILTER}>전체</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ConsolidatePanel({
  displayYear,
  yearStatus,
  onDone,
}: {
  displayYear: number;
  yearStatus: DropoutRateYearStatus | undefined;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConsolidate() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          "/api/ingest/finance-analysis/dropout-rate/consolidate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ years: [displayYear] }),
          },
        );
        const body = (await res.json()) as {
          ok?: boolean;
          totalRows?: number;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "본교통합 생성에 실패했습니다.");
        }
        setMessage(
          `${displayYear}년 본교통합 ${body.totalRows ?? 0}건 생성됨`,
        );
        onDone();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "본교통합 생성에 실패했습니다.",
        );
      }
    });
  }

  if (yearStatus?.hasConsolidatedData) return null;

  return (
    <div className="mt-3 rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-3 py-2.5 text-xs">
      <p className="text-muted">
        <span className="font-medium text-foreground">{displayYear}년</span>{" "}
        본교통합 DB가 아직 생성되지 않았습니다. 학교코드와 캠퍼스별 원자료를
        이용해 집계합니다.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleConsolidate}
          className="rounded-md border border-accent-orange/40 bg-surface px-3 py-1 text-xs text-accent-orange hover:bg-accent-orange/10 disabled:opacity-60"
        >
          {pending ? "생성 중…" : "본교통합 생성"}
        </button>
        {message ? <span className="text-accent">{message}</span> : null}
        {error ? <span className="text-accent-orange">{error}</span> : null}
      </div>
    </div>
  );
}

export function DropoutRateDashboard({
  data,
}: {
  data: DropoutRateDashboardData;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const allYears = data.years;
  const displayYear = data.displayYear;
  const viewMode = data.viewMode;
  const section = data.section;
  const yearStatuses = data.yearStatuses;
  const {
    estb: estbFilter,
    schoolDivision: schoolDivisionFilter,
    schoolKinds: schoolKindsFilter,
    regions: regionsFilter,
    search: searchFilter,
  } = data.filters;
  const filteredRows =
    viewMode === "consolidated" ? data.consolidatedRows : data.rows;
  const filterOptions = data.filterOptions;
  const displayYearStatus = yearStatuses.find((s) => s.year === displayYear);

  const hasActiveFilter =
    estbFilter !== ALL_FILTER ||
    schoolDivisionFilter !== ALL_FILTER ||
    schoolKindsFilter.length > 0 ||
    regionsFilter.length > 0 ||
    searchFilter.length > 0;

  function navigate(next: {
    year?: number | null;
    estb?: string;
    schoolDivision?: string;
    schoolKinds?: string[];
    regions?: string[];
    search?: string;
    view?: DropoutRateViewMode;
    section?: DropoutRateSection;
    resetFilters?: boolean;
    resetSchoolKinds?: boolean;
  }) {
    router.push(
      buildDropoutRateHref({
        year: next.year ?? displayYear,
        view: next.view ?? viewMode,
        section: next.section ?? section,
        estb: next.resetFilters ? "" : (next.estb ?? estbFilter),
        schoolDivision: next.resetFilters
          ? ""
          : (next.schoolDivision ?? schoolDivisionFilter),
        schoolKind:
          next.resetFilters || next.resetSchoolKinds
            ? ""
            : serializeMultiFilterParam(next.schoolKinds ?? schoolKindsFilter),
        region: next.resetFilters
          ? ""
          : serializeMultiFilterParam(next.regions ?? regionsFilter),
        search: next.resetFilters ? "" : (next.search ?? searchFilter),
        resetFilters: next.resetFilters,
      }),
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="중도탈락 학생 현황 분석"
        title="중도탈락율"
      />

      {uploadOpen ? (
        <UploadPanel
          uploadedAt={data.uploadedAt}
          rowCount={data.rowCount}
          consolidatedRowCount={data.consolidatedRowCount}
          onClose={() => setUploadOpen(false)}
        />
      ) : null}

      <div className="flex flex-col gap-1">
        <DashboardSectionTabRow
          active={section}
          onChange={(nextSection) => navigate({ section: nextSection })}
          action={
            !uploadOpen ? (
              <div className="ml-auto shrink-0">
                <ExcelUploadButton
                  variant="emerald"
                  onClick={() => setUploadOpen(true)}
                />
              </div>
            ) : null
          }
        />

        {section === "charts" ? (
            <DropoutRateChartDashboard
              campusRows={data.allCampusRows}
              consolidatedRows={data.allConsolidatedRows}
              viewMode={viewMode}
              years={allYears}
              hasData={data.hasData}
              hasConsolidatedData={data.hasAnyConsolidatedData}
              onViewModeChange={(mode) => navigate({ view: mode })}
            />
        ) : (
          <div className="flex flex-col gap-4">
            <section className="rounded-xl border border-border bg-surface px-4 py-3">
              {data.hasData && displayYear != null ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                    <DashboardYearFilterSelect
                      value={displayYear}
                      years={allYears}
                      onChange={(year) => navigate({ year, resetFilters: true })}
                    />
                    <DashboardViewModeToggle
                      value={viewMode}
                      onChange={(mode) => navigate({ view: mode })}
                    />
                    <FilterSelect label="설립구분" value={estbFilter} options={filterOptions.estbs ?? []} onChange={(value) => navigate({ estb: value, resetSchoolKinds: true })} />
                    <FilterSelect label="학교구분" value={schoolDivisionFilter} options={filterOptions.schoolDivisions ?? []} onChange={(value) => navigate({ schoolDivision: value, resetSchoolKinds: true })} />
                    <FilterMultiCheckbox label="학교종류" options={filterOptions.schoolKinds} selected={schoolKindsFilter} onChange={(schoolKinds) => navigate({ schoolKinds })} />
                    <FilterMultiCheckbox label="지역" options={filterOptions.regions} selected={regionsFilter} onChange={(regions) => navigate({ regions })} />
                    {hasActiveFilter ? (
                      <button type="button" onClick={() => navigate({ resetFilters: true })} className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 text-muted hover:text-foreground ${FDB_TYPO.toolbarControl}`}>
                        필터 초기화
                      </button>
                    ) : null}
                    <SchoolNameSearchInput
                      value={searchFilter}
                      onSearch={(search) => navigate({ search })}
                      className="ml-auto shrink-0"
                    />
                  </div>
                  {viewMode === "consolidated" ? (
                    <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/40 pt-2 ${FDB_TYPO.legend}`}>
                      <span>
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                        본교통합 DB 생성됨
                      </span>
                      <span>
                        <span className="mr-1 text-accent-orange">○</span>
                        미생성 (학교코드·원자료 필요)
                      </span>
                      {displayYearStatus?.hasConsolidatedData &&
                      displayYearStatus.consolidatedAt ? (
                        <span>
                          선택 연도 생성:{" "}
                          {new Date(displayYearStatus.consolidatedAt).toLocaleString(
                            "ko-KR",
                          )}{" "}
                          · {displayYearStatus.consolidatedRowCount.toLocaleString("ko-KR")}
                          건
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {viewMode === "consolidated" &&
                  displayYear != null &&
                  !displayYearStatus?.hasConsolidatedData ? (
                    <ConsolidatePanel
                      displayYear={displayYear}
                      yearStatus={displayYearStatus}
                      onDone={() => router.refresh()}
                    />
                  ) : null}
                </>
              ) : null}
            </section>

            <section className="rounded-xl border border-border bg-surface p-5">
              {!data.hasData || displayYear == null ? (
                <p className={FDB_TYPO.bodyText}>
                  데이터가 없습니다. 상단의{" "}
                  <button type="button" onClick={() => setUploadOpen(true)} className="text-accent underline-offset-2 hover:underline">
                    엑셀 업로드
                  </button>
                  에서 양식을 다운로드한 뒤 엑셀을 업로드하세요.
                </p>
              ) : filteredRows.length === 0 ? (
                <p className={FDB_TYPO.bodyText}>
                  {viewMode === "consolidated" &&
                  !displayYearStatus?.hasConsolidatedData
                    ? `${displayYear}년 본교통합 DB가 없습니다. 상단에서 본교통합을 생성하세요.`
                    : hasActiveFilter
                      ? `선택한 조건에 맞는 대학이 없습니다. (${displayYear}년 · 필터 적용)`
                      : `선택한 연도(${displayYear}년)에 해당하는 데이터가 없습니다.`}
                </p>
              ) : (
                <DropoutRateDataTable rows={filteredRows} viewMode={viewMode} />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
