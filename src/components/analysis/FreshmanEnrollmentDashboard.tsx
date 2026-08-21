"use client";

import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Database } from "lucide-react";

import { FinanceAnalysisDbExportButtons } from "@/components/analysis/FinanceAnalysisDbExportButtons";
import { FilterMultiCheckbox } from "@/components/analysis/FilterMultiCheckbox";
import { FreshmanEnrollmentChartDashboard } from "@/components/analysis/FreshmanEnrollmentChartDashboard";
import { FreshmanEnrollmentDataTable } from "@/components/analysis/FreshmanEnrollmentDataTable";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { buildFreshmanEnrollmentHref } from "@/lib/analysis/freshman-enrollment-navigation";
import { serializeMultiFilterParam } from "@/lib/analysis/table-filter-utils";
import type {
  FreshmanEnrollmentDashboardData,
  FreshmanEnrollmentSection,
  FreshmanEnrollmentViewMode,
  FreshmanEnrollmentYearStatus,
} from "@/lib/data/freshman-enrollment";
import {
  FRESHMAN_ENROLLMENT_METRIC_GROUPS,
  FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW2,
  FRESHMAN_ENROLLMENT_TEMPLATE_SAMPLES,
} from "@/lib/ingest/freshman-enrollment-config";

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
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학교종류</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">설립구분</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">지역</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">상태</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학교코드_표준</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">학교</th>
            <th rowSpan={2} className="text-table-head border-r border-border/50 px-2 py-2 font-medium">입학정원</th>
            {FRESHMAN_ENROLLMENT_METRIC_GROUPS.map((g) => (
              <th key={g.key} colSpan={g.columns.length} className="text-table-head border-r border-border/50 px-2 py-2 text-center font-medium">
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            {FRESHMAN_ENROLLMENT_TEMPLATE_HEADER_ROW2.slice(8).map((h, idx) => (
              <th key={`${h}-${idx}`} className="text-table-head whitespace-nowrap px-2 py-2 text-center font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FRESHMAN_ENROLLMENT_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">{row.기준연도}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교종류}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.설립구분}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.지역}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.상태}</td>
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">{row.학교코드_표준}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교}</td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">{fmtCount(row.입학정원)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.모집인원_계)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.모집인원_정원내)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.모집인원_정원외)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.입학자_계)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.입학자_정원내)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtCount(row.입학자_정원외)}</td>
              <td className="px-2 py-1.5 text-right font-mono font-semibold text-accent-orange">{fmtPercent(row.신입생충원율_정원내)}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtPercent(row.신입생충원율_정원내외)}</td>
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

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(
            "/api/ingest/finance-analysis/freshman-enrollment-rate/upload",
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
      })();
    });
  }

  return (
    <section className="rounded-xl border border-dashed border-accent-cyan/40 bg-surface/60 p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>엑셀업로드</p>
          <h4 className="mt-1 text-base font-semibold">신입생충원율</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            신입생 충원 현황(학교별자료) 엑셀을 업로드하면{" "}
            <code className="text-accent">data/csv/finance_analysis_freshman_enrollment.csv</code>
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
          <UploadPanelTemplateLink href="/api/ingest/finance-analysis/freshman-enrollment-rate/template" download="freshman_enrollment_upload_template.xlsx" />
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
          exportBasePath="/api/ingest/finance-analysis/freshman-enrollment-rate/export"
          hasConsolidated
          campusRowCount={rowCount}
          consolidatedRowCount={consolidatedRowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">업로드 양식</span>은 기준연도·학교종류·설립구분·지역·상태·학교코드_표준·학교·입학정원·모집인원·입학자·신입생충원율 2행 헤더 구조입니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">기준연도</span>는 A열에서 인식하며, 표시 연도 선택으로 조회합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> : 신입생 충원 현황(학교별자료)
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const safeOptions = options ?? [];
  const safeValue =
    !value || safeOptions.includes(value) ? value : ALL_FILTER;

  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        <option value={ALL_FILTER}>전체</option>
        {safeOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function YearFilterSelect({
  label,
  value,
  years,
  yearStatuses,
  viewMode,
  onChange,
}: {
  label: string;
  value: number;
  years: number[];
  yearStatuses: FreshmanEnrollmentYearStatus[];
  viewMode: FreshmanEnrollmentViewMode;
  onChange: (year: number) => void;
}) {
  const sortedYears = [...years].sort((a, b) => b - a);

  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        {sortedYears.map((year) => {
          const status = yearStatuses.find((item) => item.year === year);
          const title =
            viewMode === "consolidated"
              ? status?.hasConsolidatedData
                ? `${year}년 본교통합 DB 생성됨 (${status.consolidatedRowCount}건)`
                : `${year}년 본교통합 DB 미생성`
              : `${year}년 캠퍼스별 ${status?.campusRowCount ?? 0}건`;

          return (
            <option key={year} value={year} title={title}>
              {year}년
            </option>
          );
        })}
      </select>
    </div>
  );
}

function SectionTabRow({
  active,
  onChange,
  action,
}: {
  active: FreshmanEnrollmentSection;
  onChange: (section: FreshmanEnrollmentSection) => void;
  action?: React.ReactNode;
}) {
  const tabs: {
    id: FreshmanEnrollmentSection;
    label: string;
    icon: typeof Database;
  }[] = [
    { id: "data", label: "대학별DB", icon: Database },
    { id: "charts", label: "통계분석", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div
        className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                  : "font-medium text-muted hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${
                  isActive ? "text-indigo-700" : "text-muted"
                }`}
                aria-hidden
              />
              {tab.label}
            </button>
          );
        })}
      </div>
      {action ?? null}
    </div>
  );
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: FreshmanEnrollmentViewMode;
  onChange: (mode: FreshmanEnrollmentViewMode) => void;
}) {
  return (
    <div className="inline-flex h-[30px] items-stretch rounded-md border border-border bg-surface-2 p-0.5">
      <button
        type="button"
        onClick={() => onChange("campus")}
        className={`rounded px-2.5 py-1 transition-colors ${
          value === "campus"
            ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
            : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`}
        }`}
      >
        캠퍼스별
      </button>
      <button
        type="button"
        onClick={() => onChange("consolidated")}
        className={`rounded px-2.5 py-1 transition-colors ${
          value === "consolidated"
            ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
            : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`}
        }`}
      >
        본교통합
      </button>
    </div>
  );
}

function ConsolidatePanel({
  displayYear,
  yearStatus,
  onDone,
}: {
  displayYear: number;
  yearStatus: FreshmanEnrollmentYearStatus | undefined;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConsolidate() {
    setMessage(null);
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(
            "/api/ingest/finance-analysis/freshman-enrollment-rate/consolidate",
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
      })();
    });
  }

  if (yearStatus?.hasConsolidatedData) return null;

  return (
    <div className="mt-3 rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-3 py-2.5">
      <p className={FDB_TYPO.bodyText}>
        <span className="font-medium text-foreground">{displayYear}년</span>{" "}
        본교통합 DB가 아직 생성되지 않았습니다. 학교코드와 캠퍼스별 원자료를
        이용해 집계합니다.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleConsolidate}
          className={`rounded-md border border-accent-orange/40 bg-surface px-3 py-1 text-accent-orange hover:bg-accent-orange/10 disabled:opacity-60 ${FDB_TYPO.toolbarControl}`}
        >
          {pending ? "생성 중…" : "본교통합 생성"}
        </button>
        {message ? <span className="text-accent">{message}</span> : null}
        {error ? <span className="text-accent-orange">{error}</span> : null}
      </div>
    </div>
  );
}

export function FreshmanEnrollmentDashboard({
  data,
}: {
  data: FreshmanEnrollmentDashboardData;
}) {
  const router = useRouter();
  const [, startNav] = useTransition();
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
    view?: FreshmanEnrollmentViewMode;
    section?: FreshmanEnrollmentSection;
    resetFilters?: boolean;
    resetSchoolKinds?: boolean;
  }) {
    const href = buildFreshmanEnrollmentHref({
      year: next.year ?? displayYear,
      view: next.view ?? viewMode,
      section: next.section ?? section,
      estb: next.resetFilters ? "" : (next.estb ?? estbFilter),
      schoolDivision: next.resetFilters
        ? ""
        : (next.schoolDivision ?? schoolDivisionFilter),
      schoolKind: next.resetFilters || next.resetSchoolKinds
        ? ""
        : serializeMultiFilterParam(next.schoolKinds ?? schoolKindsFilter),
      region: next.resetFilters
        ? ""
        : serializeMultiFilterParam(next.regions ?? regionsFilter),
      search: next.resetFilters ? "" : (next.search ?? searchFilter),
      resetFilters: next.resetFilters,
    });
    startNav(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="신입생 충원 현황 분석"
        title="신입생충원율"
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
        <SectionTabRow
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
          <FreshmanEnrollmentChartDashboard
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
                  <YearFilterSelect
                    label="표시 연도"
                    value={displayYear}
                    years={allYears}
                    yearStatuses={yearStatuses}
                    viewMode={viewMode}
                    onChange={(year) => navigate({ year, resetFilters: true })}
                  />
                  <ViewModeToggle
                    value={viewMode}
                    onChange={(mode) => navigate({ view: mode })}
                  />
                  <FilterSelect
                    label="설립구분"
                    value={estbFilter}
                    options={filterOptions.estbs ?? []}
                    onChange={(value) =>
                      navigate({ estb: value, resetSchoolKinds: true })
                    }
                  />
                  <FilterSelect
                    label="학교구분"
                    value={schoolDivisionFilter}
                    options={filterOptions.schoolDivisions ?? []}
                    onChange={(value) =>
                      navigate({ schoolDivision: value, resetSchoolKinds: true })
                    }
                  />
                  <FilterMultiCheckbox
                    label="학교종류"
                    options={filterOptions.schoolKinds}
                    selected={schoolKindsFilter}
                    onChange={(schoolKinds) => navigate({ schoolKinds })}
                    labelClassName={`shrink-0 ${FDB_TYPO.toolbarLabel}`}
                    controlClassName={`${FDB_TYPO.toolbarControl} flex min-w-[5.5rem] items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-foreground outline-none hover:border-accent/60 focus:border-accent`}
                  />
                  <FilterMultiCheckbox
                    label="지역"
                    options={filterOptions.regions}
                    selected={regionsFilter}
                    onChange={(regions) => navigate({ regions })}
                    labelClassName={`shrink-0 ${FDB_TYPO.toolbarLabel}`}
                    controlClassName={`${FDB_TYPO.toolbarControl} flex min-w-[5.5rem] items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-foreground outline-none hover:border-accent/60 focus:border-accent`}
                  />
                  {hasActiveFilter ? (
                    <button
                      type="button"
                      onClick={() => navigate({ resetFilters: true })}
                      className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 hover:text-foreground ${FDB_TYPO.toolbarControl} text-muted`}
                    >
                      필터 초기화
                    </button>
                  ) : null}
                  <SchoolNameSearchInput
                    value={searchFilter}
                    onSearch={(search) => navigate({ search })}
                    className="ml-auto shrink-0"
                    labelClassName={`shrink-0 ${FDB_TYPO.toolbarLabel}`}
                    inputClassName={`w-36 rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                  />
                </div>
                {viewMode === "consolidated" ? (
                  <div
                    className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/40 pt-2 ${FDB_TYPO.legend}`}
                  >
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
                        ·{" "}
                        {displayYearStatus.consolidatedRowCount.toLocaleString(
                          "ko-KR",
                        )}
                        건
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {viewMode === "consolidated" &&
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
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="text-accent underline-offset-2 hover:underline"
                >
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
              <FreshmanEnrollmentDataTable
                rows={filteredRows}
                viewMode={viewMode}
              />
            )}
          </section>
        </div>
      )}
      </div>
    </div>
  );
}
