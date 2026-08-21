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

import { EnrolledEnrollmentChartDashboard } from "@/components/analysis/EnrolledEnrollmentChartDashboard";
import { EnrolledEnrollmentDataTable } from "@/components/analysis/EnrolledEnrollmentDataTable";
import { FinanceAnalysisDbExportButtons } from "@/components/analysis/FinanceAnalysisDbExportButtons";
import { FilterMultiCheckbox } from "@/components/analysis/FilterMultiCheckbox";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { buildEnrolledEnrollmentHref } from "@/lib/analysis/enrolled-enrollment-navigation";
import { serializeMultiFilterParam } from "@/lib/analysis/table-filter-utils";
import type {
  EnrolledEnrollmentDashboardData,
  EnrolledEnrollmentPeriodStatus,
  EnrolledEnrollmentSection,
  EnrolledEnrollmentViewMode,
} from "@/lib/data/enrolled-enrollment";
import { enrolledPeriodKey } from "@/lib/ingest/enrolled-enrollment-period";
import {
  ENROLLED_ENROLLMENT_METRIC_GROUPS,
  ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2,
  ENROLLED_ENROLLMENT_TEMPLATE_SAMPLES,
} from "@/lib/ingest/enrolled-enrollment-config";

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
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">기준연도</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">상하반기</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학교종류</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">설립구분</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">지역</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">상태</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학교코드_표준</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학교</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학생정원</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학생모집정지인원</th>
            {ENROLLED_ENROLLMENT_METRIC_GROUPS.map((g) => (
              <th key={g.key} colSpan={g.columns.length} className={`text-table-head border-r border-border/50 px-2 py-2 text-center font-medium ${g.key === "fillRate" || g.key === "fillRateWithin" ? "text-accent-orange" : ""}`}>
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            {ENROLLED_ENROLLMENT_TEMPLATE_HEADER_ROW2.slice(10).map((h, idx) => (
              <th key={`${h}-${idx}`} className="text-table-head whitespace-nowrap px-2 py-2 text-center font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ENROLLED_ENROLLMENT_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">{row.기준연도}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.상하반기}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교종류}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.설립구분}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.지역}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.상태}</td>
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">{row.학교코드_표준}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">{fmtCount(row.학생정원)}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">{fmtCount(row.학생모집정지인원)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.재학생_계)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.재학생_정원내)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.재학생_정원외)}</td>
              <td className="px-2 py-1.5 text-right font-mono font-semibold text-accent-orange">{fmtPercent(row.재학생충원율)}</td>
              <td className="px-2 py-1.5 text-right font-mono font-semibold text-accent-orange">{fmtPercent(row.정원내재학생충원율)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        양식 헤더·샘플 행 — 업로드 시 위 2행 헤더 구조를 그대로 사용하세요. 기준연도는 A열에서 인식됩니다.
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
          "/api/ingest/finance-analysis/enrolled-enrollment-rate/upload",
          { method: "POST", body: fd },
        );
        const body = (await res.json()) as {
          ok?: boolean;
          rowCount?: number;
          overwrittenPeriods?: string[];
          newPeriods?: string[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "업로드에 실패했습니다.");
        }
        const parts: string[] = [];
        if (body.overwrittenPeriods?.length) {
          parts.push(`덮어쓰기: ${body.overwrittenPeriods.join(", ")}`);
        }
        if (body.newPeriods?.length) {
          parts.push(`신규: ${body.newPeriods.join(", ")}`);
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
          <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>재학생충원율</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            재학생 충원율(학교별자료) 엑셀을 업로드하면{" "}
            <code className="text-accent">data/csv/finance_analysis_enrolled_enrollment.csv</code>
            에 저장됩니다. 동일 기준연도·상하반기는 덮어쓰기, 신규는 추가됩니다.
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
          <UploadPanelTemplateLink href="/api/ingest/finance-analysis/enrolled-enrollment-rate/template" download="enrolled_enrollment_upload_template.xlsx" />
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
          exportBasePath="/api/ingest/finance-analysis/enrolled-enrollment-rate/export"
          hasConsolidated
          campusRowCount={rowCount}
          consolidatedRowCount={consolidatedRowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">업로드 양식</span>은 기준연도·상하반기·학교종류·설립구분·지역·상태·학교코드_표준·학교·학생정원·학생모집정지인원·재학생·재학생충원율 2행 헤더 구조입니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">기준연도</span>는 A열에서 인식하며, 표시 연도 선택으로 조회합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> : 재학생 충원율(학교별자료)
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
  halfFilter,
  periodStatus,
  onDone,
}: {
  displayYear: number;
  halfFilter: string;
  periodStatus: EnrolledEnrollmentPeriodStatus | undefined;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConsolidate() {
    setMessage(null);
    setError(null);
    const period = enrolledPeriodKey(displayYear, halfFilter);
    startTransition(async () => {
      try {
        const res = await fetch(
          "/api/ingest/finance-analysis/enrolled-enrollment-rate/consolidate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ periods: [period] }),
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
          `${displayYear}년 ${halfFilter} 본교통합 ${body.totalRows ?? 0}건 생성됨`,
        );
        onDone();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "본교통합 생성에 실패했습니다.",
        );
      }
    });
  }

  if (periodStatus?.hasConsolidatedData) return null;

  return (
    <div className="mt-3 rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-3 py-2.5 text-xs">
      <p className="text-muted">
        <span className="font-medium text-foreground">
          {displayYear}년 {halfFilter}
        </span>{" "}
        본교통합 DB가 아직 생성되지 않았습니다. 상·하반기는 각각 별도로 생성됩니다.
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

export function EnrolledEnrollmentDashboard({
  data,
}: {
  data: EnrolledEnrollmentDashboardData;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const allYears = data.years;
  const displayYear = data.displayYear;
  const viewMode = data.viewMode;
  const section = data.section;
  const yearStatuses = data.yearStatuses;
  const periodStatuses = data.periodStatuses;
  const {
    half: halfFilter,
    estb: estbFilter,
    schoolDivision: schoolDivisionFilter,
    schoolKinds: schoolKindsFilter,
    regions: regionsFilter,
    search: searchFilter,
  } = data.filters;
  const filteredRows =
    viewMode === "consolidated" ? data.consolidatedRows : data.rows;
  const filterOptions = data.filterOptions;
  const currentPeriodStatus =
    displayYear != null && halfFilter
      ? periodStatuses.find(
          (p) => p.year === displayYear && p.half === halfFilter,
        )
      : undefined;
  const displayYearStatus = yearStatuses.find((s) => s.year === displayYear);

  const hasActiveFilter =
    halfFilter !== ALL_FILTER ||
    estbFilter !== ALL_FILTER ||
    schoolDivisionFilter !== ALL_FILTER ||
    schoolKindsFilter.length > 0 ||
    regionsFilter.length > 0 ||
    searchFilter.length > 0;

  function navigate(next: {
    year?: number | null;
    half?: string;
    estb?: string;
    schoolDivision?: string;
    schoolKinds?: string[];
    regions?: string[];
    search?: string;
    view?: EnrolledEnrollmentViewMode;
    section?: EnrolledEnrollmentSection;
    resetFilters?: boolean;
    resetSchoolKinds?: boolean;
  }) {
    router.push(
      buildEnrolledEnrollmentHref({
        year: next.year ?? displayYear,
        view: next.view ?? viewMode,
        section: next.section ?? section,
        half: next.resetFilters ? ALL_FILTER : (next.half ?? halfFilter),
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
        subtitle="재학생 충원 현황 분석"
        title="재학생충원율"
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
            <EnrolledEnrollmentChartDashboard
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
                    <FilterSelect label="상하반기" value={halfFilter} options={filterOptions.halves} onChange={(value) => navigate({ half: value })} />
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
                    <p className={`mt-2 ${FDB_TYPO.legend}`}>
                      본교통합은 <span className="text-foreground">상반기·하반기 각각</span>{" "}
                      학교대표코드 기준으로 캠퍼스를 묶습니다. 상·하반기를 합산하지 않습니다.
                    </p>
                  ) : null}
                  {viewMode === "consolidated" &&
                  displayYear != null &&
                  halfFilter &&
                  !currentPeriodStatus?.hasConsolidatedData ? (
                    <ConsolidatePanel
                      displayYear={displayYear}
                      halfFilter={halfFilter}
                      periodStatus={currentPeriodStatus}
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
                  halfFilter &&
                  !currentPeriodStatus?.hasConsolidatedData
                    ? `${displayYear}년 ${halfFilter} 본교통합 DB가 없습니다. 상·하반기를 선택한 뒤 본교통합을 생성하세요.`
                    : viewMode === "consolidated" &&
                        !halfFilter &&
                        !displayYearStatus?.allPeriodsConsolidated
                      ? `${displayYear}년 일부 상하반기 본교통합 DB가 없습니다. 상·하반기를 각각 선택해 생성하세요.`
                    : hasActiveFilter
                      ? `선택한 조건에 맞는 대학이 없습니다. (${displayYear}년${halfFilter ? ` · ${halfFilter}` : " · 전체"} · 필터 적용)`
                      : `선택한 연도(${displayYear}년)에 해당하는 데이터가 없습니다.`}
                </p>
              ) : (
                <EnrolledEnrollmentDataTable
                  rows={filteredRows}
                  viewMode={viewMode}
                  showHalfColumn={!halfFilter}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
