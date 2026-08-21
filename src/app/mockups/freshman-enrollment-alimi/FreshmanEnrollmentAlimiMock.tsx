"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Database, Download } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FilterMultiCheckbox } from "@/components/analysis/FilterMultiCheckbox";
import { FreshmanEnrollmentAlimiRawTable } from "@/components/analysis/FreshmanEnrollmentAlimiRawTable";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { getTableSchoolKindOptions } from "@/lib/analysis/school-division";
import { rowMatchesTableFilters } from "@/lib/analysis/table-filter-utils";
import type { FreshmanEnrollmentAlimiMockData } from "@/lib/analysis/freshman-enrollment-alimi/types";
import type {
  FreshmanEnrollmentAlimiFilterOptions,
  FreshmanEnrollmentDatasetKind,
  RawEnrollmentSheet,
} from "@/lib/analysis/freshman-enrollment-alimi/types";

import "./freshman-enrollment-alimi-mock.css";

const ALL_FILTER = "";

function sortKo(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "ko"));
}

function buildFilterOptions(
  rows: RawEnrollmentSheet["rows"],
  estbFilter: string,
  schoolDivisionFilter: string,
): FreshmanEnrollmentAlimiFilterOptions {
  const estbs = new Set<string>();
  const schoolDivisions = new Set<string>();
  const regions = new Set<string>();

  for (const row of rows) {
    if (row.estb) estbs.add(row.estb);
    if (row.schoolDivision) schoolDivisions.add(row.schoolDivision);
    if (row.region) regions.add(row.region);
  }

  return {
    estbs: sortKo([...estbs]),
    schoolDivisions: sortKo([...schoolDivisions]),
    schoolKinds: getTableSchoolKindOptions(
      rows,
      estbFilter,
      schoolDivisionFilter,
    ),
    regions: sortKo([...regions]),
  };
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
  const safeValue =
    !value || options.includes(value) ? value : ALL_FILTER;

  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        <option value={ALL_FILTER}>전체</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function YearFilterSelect({
  label,
  value,
  years,
  onChange,
}: {
  label: string;
  value: number;
  years: number[];
  onChange: (year: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </select>
    </div>
  );
}

function DatasetTabRow({
  active,
  onChange,
  action,
}: {
  active: FreshmanEnrollmentDatasetKind;
  onChange: (kind: FreshmanEnrollmentDatasetKind) => void;
  action?: React.ReactNode;
}) {
  const tabs: { id: FreshmanEnrollmentDatasetKind; label: string }[] = [
    { id: "undergrad", label: "대학전문" },
    { id: "grad", label: "대학원" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div
        className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
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
              <Database
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
      {action}
    </div>
  );
}

function UploadCard({
  title,
  fileName,
  rowCount,
  templateName,
}: {
  title: string;
  fileName: string;
  rowCount: number;
  templateName: string;
}) {
  return (
    <div className="feam-upload-card">
      <p className={`${FDB_TYPO.legend} font-medium text-accent-cyan`}>{title}</p>
      <p className={`mt-1 ${FDB_TYPO.panelTitle}`}>{fileName}</p>
      <p className={`mt-2 ${FDB_TYPO.bodyText}`}>
        연도별 덮어쓰기 · 현재 {rowCount.toLocaleString("ko-KR")}행 (목업 미저장)
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <UploadPanelTemplateLink href="#" download={templateName} />
        <UploadPanelSelectButton disabled pending={false} onClick={() => {}} />
      </div>
    </div>
  );
}

function ExportButtons({ sheet }: { sheet: RawEnrollmentSheet }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled
        className={`inline-flex items-center gap-1.5 rounded-lg border border-accent-cyan/40 bg-surface-2 px-4 py-2 text-accent-cyan opacity-80 ${FDB_TYPO.toolbarControl}`}
        title="목업 · 프로덕션 연동 후 활성화"
      >
        <Download className="h-4 w-4" aria-hidden />
        {sheet.label} 원본 down
      </button>
      <span className={FDB_TYPO.legend}>
        {sheet.fileName} · {sheet.rows.length.toLocaleString("ko-KR")}행
      </span>
    </div>
  );
}

export function FreshmanEnrollmentAlimiMock({
  data,
}: {
  data: FreshmanEnrollmentAlimiMockData;
}) {
  const [dataset, setDataset] = useState<FreshmanEnrollmentDatasetKind>("undergrad");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const activeSheet = dataset === "undergrad" ? data.undergrad : data.grad;
  const defaultYear = activeSheet.years[0] ?? null;

  const [displayYear, setDisplayYear] = useState<number>(
    data.undergrad.years[0] ?? new Date().getFullYear(),
  );
  const [estbFilter, setEstbFilter] = useState(ALL_FILTER);
  const [schoolDivisionFilter, setSchoolDivisionFilter] = useState(ALL_FILTER);
  const [schoolKindsFilter, setSchoolKindsFilter] = useState<string[]>([]);
  const [regionsFilter, setRegionsFilter] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  const yearRows = useMemo(
    () => activeSheet.rows.filter((row) => row.year === displayYear),
    [activeSheet.rows, displayYear],
  );

  const filterOptions = useMemo(
    () => buildFilterOptions(yearRows, estbFilter, schoolDivisionFilter),
    [yearRows, estbFilter, schoolDivisionFilter],
  );

  const filteredRows = useMemo(
    () =>
      yearRows.filter((row) =>
        rowMatchesTableFilters(row, {
          estb: estbFilter,
          schoolDivision: schoolDivisionFilter,
          schoolKinds: schoolKindsFilter,
          regions: regionsFilter,
          search: searchFilter,
        }),
      ),
    [
      yearRows,
      estbFilter,
      schoolDivisionFilter,
      schoolKindsFilter,
      regionsFilter,
      searchFilter,
    ],
  );

  const hasActiveFilter =
    estbFilter !== ALL_FILTER ||
    schoolDivisionFilter !== ALL_FILTER ||
    schoolKindsFilter.length > 0 ||
    regionsFilter.length > 0 ||
    searchFilter.length > 0;

  function resetFilters() {
    setEstbFilter(ALL_FILTER);
    setSchoolDivisionFilter(ALL_FILTER);
    setSchoolKindsFilter([]);
    setRegionsFilter([]);
    setSearchFilter("");
  }

  function handleDatasetChange(kind: FreshmanEnrollmentDatasetKind) {
    const sheet = kind === "undergrad" ? data.undergrad : data.grad;
    setDataset(kind);
    setDisplayYear(sheet.years[0] ?? displayYear);
    resetFilters();
  }

  function handleYearChange(year: number) {
    setDisplayYear(year);
    resetFilters();
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <div className="feam-banner" role="note">
        <strong>신입생충원 UI 목업 v0.2</strong>
        <p>
          대학현황 / 대학알리미 / 신입생충원 · 기준연도 텍스트 · 프로덕션과
          동일 필터·표 색상 ·{" "}
          <Link href="/analysis/univ-map?tab=freshman-enrollment" className="underline">
            프로덕션
          </Link>
        </p>
      </div>

      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="대학알리미 · 신입생 충원 현황"
        title="신입생충원"
      />

      {uploadOpen ? (
        <section className="rounded-xl border border-dashed border-accent-cyan/40 bg-surface/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
                엑셀업로드
              </p>
              <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>신입생충원</h4>
              <p className={`mt-2 max-w-3xl ${FDB_TYPO.bodyText}`}>
                대학전문·대학원 파일을 각각 업로드합니다. 양식이 다르며 원본
                구조 그대로 DB에 저장됩니다. (목업 · 업로드 미연동)
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <UploadPanelHideButton onClick={() => setUploadOpen(false)} />
              <UploadPanelHelpButton
                active={helpOpen}
                onClick={() => setHelpOpen((v) => !v)}
              />
            </div>
          </div>

          {helpOpen ? (
            <div
              className={`mt-3 rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}
            >
              <p>
                <span className="font-medium text-foreground">기준연도</span>는
                엑셀 텍스트 형식 그대로 저장·표시합니다.
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">대학전문</span> :
                3행 헤더 · 모집인원/지원자/입학자/충원율/경쟁률
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">대학원</span> :
                3행 헤더 · 대학원명 컬럼 · 지원자/입학자(남·여)
              </p>
            </div>
          ) : null}

          <div className="feam-upload-grid mt-4">
            <UploadCard
              title="대학전문"
              fileName={data.undergrad.fileName}
              rowCount={data.undergrad.rows.length}
              templateName="freshman_enrollment_undergrad_template.xlsx"
            />
            <UploadCard
              title="대학원"
              fileName={data.grad.fileName}
              rowCount={data.grad.rows.length}
              templateName="freshman_enrollment_grad_template.xlsx"
            />
          </div>

          <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
            <p className={`${FDB_TYPO.toolbarLabel} text-foreground`}>
              DB 원본 다운로드
            </p>
            <ExportButtons sheet={data.undergrad} />
            <ExportButtons sheet={data.grad} />
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-1">
        <DatasetTabRow
          active={dataset}
          onChange={handleDatasetChange}
          action={
            !uploadOpen ? (
              <ExcelUploadButton variant="emerald" onClick={() => setUploadOpen(true)} />
            ) : null
          }
        />

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-surface px-4 py-3">
            {defaultYear != null ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                <YearFilterSelect
                  label="표시 연도"
                  value={displayYear}
                  years={activeSheet.years}
                  onChange={handleYearChange}
                />
                <FilterSelect
                  label="설립구분"
                  value={estbFilter}
                  options={filterOptions.estbs}
                  onChange={(value) => {
                    setEstbFilter(value);
                    setSchoolKindsFilter([]);
                  }}
                />
                <FilterSelect
                  label="학교구분"
                  value={schoolDivisionFilter}
                  options={filterOptions.schoolDivisions}
                  onChange={(value) => {
                    setSchoolDivisionFilter(value);
                    setSchoolKindsFilter([]);
                  }}
                />
                <FilterMultiCheckbox
                  label="학교종류"
                  options={filterOptions.schoolKinds}
                  selected={schoolKindsFilter}
                  onChange={setSchoolKindsFilter}
                  labelClassName={`shrink-0 ${FDB_TYPO.toolbarLabel}`}
                  controlClassName={`${FDB_TYPO.toolbarControl} flex min-w-[5.5rem] items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-foreground outline-none hover:border-accent/60 focus:border-accent`}
                />
                <FilterMultiCheckbox
                  label="지역"
                  options={filterOptions.regions}
                  selected={regionsFilter}
                  onChange={setRegionsFilter}
                  labelClassName={`shrink-0 ${FDB_TYPO.toolbarLabel}`}
                  controlClassName={`${FDB_TYPO.toolbarControl} flex min-w-[5.5rem] items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-foreground outline-none hover:border-accent/60 focus:border-accent`}
                />
                {hasActiveFilter ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 hover:text-foreground ${FDB_TYPO.toolbarControl} text-muted`}
                  >
                    필터 초기화
                  </button>
                ) : null}
                <SchoolNameSearchInput
                  value={searchFilter}
                  onSearch={setSearchFilter}
                  className="ml-auto shrink-0"
                  labelClassName={`shrink-0 ${FDB_TYPO.toolbarLabel}`}
                  inputClassName={`w-36 rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                />
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            {defaultYear == null ? (
              <p className={FDB_TYPO.bodyText}>데이터가 없습니다.</p>
            ) : filteredRows.length === 0 ? (
              <p className={FDB_TYPO.bodyText}>
                {hasActiveFilter
                  ? `선택한 조건에 맞는 대학이 없습니다. (${displayYear}년 · 필터 적용)`
                  : `선택한 연도(${displayYear}년)에 해당하는 데이터가 없습니다.`}
              </p>
            ) : (
              <FreshmanEnrollmentAlimiRawTable
                kind={activeSheet.kind}
                headerRows={activeSheet.headerRows}
                headerMerges={activeSheet.headerMerges}
                rows={filteredRows}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
