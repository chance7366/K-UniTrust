"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Database, Download } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
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
import { buildFreshmanEnrollmentAlimiHref } from "@/lib/analysis/freshman-enrollment-alimi-navigation";
import { serializeMultiFilterParam } from "@/lib/analysis/table-filter-utils";
import type {
  FreshmanEnrollmentAlimiDashboardData,
  FreshmanEnrollmentDatasetKind,
  RawEnrollmentSheet,
} from "@/lib/analysis/freshman-enrollment-alimi/types";

import "./freshman-enrollment-alimi-dashboard.css";

const ALL_FILTER = "";

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
      <GlassMintTabGroup
        active={active}
        onChange={onChange}
        items={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: Database,
        }))}
      />
      {action}
    </div>
  );
}

function UploadRow({
  kind,
  title,
  sheet,
}: {
  kind: FreshmanEnrollmentDatasetKind;
  title: string;
  sheet: RawEnrollmentSheet;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/ingest/finance-analysis/freshman-enrollment-rate/${kind}/upload`,
            { method: "POST", body: fd },
          );
          const body = (await res.json()) as {
            ok?: boolean;
            rowCount?: number;
            years?: number[];
            overwrittenYears?: number[];
            newYears?: number[];
            error?: string;
          };
          if (!res.ok) {
            throw new Error(body.error ?? "업로드에 실패했습니다.");
          }
          const parts: string[] = [];
          if (body.overwrittenYears?.length) {
            parts.push(`덮어쓰기 ${body.overwrittenYears.join(", ")}년`);
          }
          if (body.newYears?.length) {
            parts.push(`신규 ${body.newYears.join(", ")}년`);
          }
          setMessage(
            `${body.rowCount ?? 0}건${parts.length ? ` · ${parts.join(" · ")}` : ""}`,
          );
          const yearCandidates = [
            ...(body.newYears ?? []),
            ...(body.overwrittenYears ?? []),
            ...(body.years ?? []),
          ];
          const nextYear = yearCandidates.length
            ? Math.max(...yearCandidates)
            : null;
          if (nextYear != null) {
            router.push(
              buildFreshmanEnrollmentAlimiHref({
                dataset: kind,
                year: nextYear,
                resetFilters: true,
              }),
            );
          } else {
            router.refresh();
          }
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

  const uploadedLabel = sheet.uploadedAt
    ? new Date(sheet.uploadedAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="feam-upload-row">
      <div className="feam-upload-row-head">
        <span className="feam-upload-row-label">{title}</span>
        <div className="feam-upload-row-meta" title={sheet.fileName}>
          <strong>{sheet.fileName}</strong>
          {" · "}
          {sheet.rowCount.toLocaleString("ko-KR")}행
          {uploadedLabel ? ` · ${uploadedLabel}` : " · 미업로드"}
        </div>
      </div>
      <div className="feam-upload-row-toolbar">
        <div className="feam-upload-row-actions">
          <UploadPanelTemplateLink
            href={`/api/ingest/finance-analysis/freshman-enrollment-rate/${kind}/template`}
            download={`freshman_enrollment_${kind}_template.xlsx`}
          />
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
          <UploadPanelSelectButton
            disabled={pending}
            pending={pending}
            onClick={() => inputRef.current?.click()}
          />
          <ExportLink sheet={sheet} />
        </div>
      </div>
      {message ? (
        <p className={`feam-upload-row-feedback ${FDB_TYPO.legend} text-accent`}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className={`feam-upload-row-feedback ${FDB_TYPO.legend} text-accent-orange`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ExportLink({ sheet }: { sheet: RawEnrollmentSheet }) {
  const disabled = sheet.rowCount === 0;
  const href = `/api/ingest/finance-analysis/freshman-enrollment-rate/${sheet.kind}/export`;

  const inner = (
    <span className="glass-db-down-btn-core">
      <Download size={12} strokeWidth={2.6} aria-hidden />
      DBdown
    </span>
  );

  if (disabled) {
    return (
      <button type="button" disabled className="glass-db-down-btn">
        {inner}
      </button>
    );
  }

  return (
    <a href={href} className="glass-db-down-btn">
      {inner}
    </a>
  );
}

export function FreshmanEnrollmentAlimiDashboard({
  data,
}: {
  data: FreshmanEnrollmentAlimiDashboardData;
}) {
  const router = useRouter();
  const [, startNav] = useTransition();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const activeSheet =
    data.dataset === "undergrad" ? data.undergrad : data.grad;
  const {
    estb: estbFilter,
    schoolDivision: schoolDivisionFilter,
    schoolKinds: schoolKindsFilter,
    regions: regionsFilter,
    search: searchFilter,
  } = data.filters;
  const displayYear = data.displayYear;

  const hasActiveFilter =
    estbFilter !== ALL_FILTER ||
    schoolDivisionFilter !== ALL_FILTER ||
    schoolKindsFilter.length > 0 ||
    regionsFilter.length > 0 ||
    searchFilter.length > 0;

  function navigate(next: {
    dataset?: FreshmanEnrollmentDatasetKind;
    year?: number | null;
    estb?: string;
    schoolDivision?: string;
    schoolKinds?: string[];
    regions?: string[];
    search?: string;
    resetFilters?: boolean;
    resetSchoolKinds?: boolean;
  }) {
    const href = buildFreshmanEnrollmentAlimiHref({
      dataset: next.dataset ?? data.dataset,
      year: next.year ?? displayYear ?? undefined,
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
    });
    startNav(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="대학알리미 · 신입생 충원 현황"
        title="신입생충원"
      />

      {uploadOpen ? (
        <section className="feam-upload-panel rounded-xl border border-dashed border-accent-cyan/40 bg-surface/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
                엑셀업로드
              </p>
              <h4 className={`mt-0.5 text-sm font-semibold`}>신입생충원</h4>
              <p className={`mt-1 ${FDB_TYPO.legend} text-muted`}>
                대학전문·대학원 각각 업로드 · 동일 기준연도 덮어쓰기
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <UploadPanelHideButton onClick={() => setUploadOpen(false)} />
              <UploadPanelHelpButton
                active={helpOpen}
                onClick={() => setHelpOpen((v) => !v)}
              />
            </div>
          </div>

          {helpOpen ? (
            <div
              className={`mt-2 rounded-lg border border-border/60 bg-surface-2/50 p-3 ${FDB_TYPO.bodyText}`}
            >
              <p>
                <span className="font-medium text-foreground">개요</span> : 학부와
                대학원 신입생의 입학자를 모집인원으로 나누어 정원내와 정원내외
                충원율을 산출한다.
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">출처</span> :
                대학알리미
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">관리</span> : 8월
                공시이며, 매년 연도별 자료로 관리한다.
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">특이사항</span> :
                학부(대학, 전문대학)와 대학원 별도 관리가 필요. 학교코드를
                추가하여 관리하며, 학교코드는 학교코드에서 참조한다. 학부의
                경우 정원내 신입생충원율이 공시되고 대학원의 경우 충원율은
                공시되고 있지 않음. 따라서 시스템에서 정원내
                신입생충원율과 정원내외 신입생충원율을 산출하여 보여지도록
                프로그램을 구현한다.
              </p>
              <p className="mt-3 border-t border-border/40 pt-3">
                <span className="font-medium text-foreground">업로드 양식</span>
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">기준연도</span>는
                엑셀 텍스트 형식 그대로 저장·표시합니다.
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">B열</span>은
                학교코드_표준 또는 학교코드 모두 가능하며, 텍스트 형식(앞자리 0
                유지)으로 저장·표시합니다.
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">대학전문</span> :
                3행 헤더 · G열은 학교 또는 학교명 ·
                모집인원/지원자/입학자/충원율/경쟁률
              </p>
              <p className="mt-2">
                <span className="font-medium text-foreground">대학원</span> :
                3행 헤더 · 학교코드 · 학교대표 · 본분교 · 대학원명 ·
                지원자/입학자(남·여)
              </p>
            </div>
          ) : null}

          <div className="feam-upload-rows">
            <UploadRow
              kind="undergrad"
              title="대학전문"
              sheet={data.undergrad}
            />
            <UploadRow kind="grad" title="대학원" sheet={data.grad} />
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-1">
        <DatasetTabRow
          active={data.dataset}
          onChange={(kind) => {
            const sheet = kind === "undergrad" ? data.undergrad : data.grad;
            navigate({
              dataset: kind,
              year: sheet.years[0] ?? displayYear,
              resetFilters: true,
            });
          }}
          action={
            !uploadOpen ? (
              <ExcelUploadButton
                variant="emerald"
                onClick={() => setUploadOpen(true)}
              />
            ) : null
          }
        />

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-surface px-4 py-3">
            {data.hasData && displayYear != null ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                <YearFilterSelect
                  label="표시 연도"
                  value={displayYear}
                  years={
                    !activeSheet.years.includes(displayYear)
                      ? [displayYear, ...activeSheet.years]
                      : activeSheet.years
                  }
                  onChange={(year) => navigate({ year, resetFilters: true })}
                />
                <FilterSelect
                  label="설립구분"
                  value={estbFilter}
                  options={data.filterOptions.estbs}
                  onChange={(value) =>
                    navigate({ estb: value, resetSchoolKinds: true })
                  }
                />
                <FilterSelect
                  label="학교구분"
                  value={schoolDivisionFilter}
                  options={data.filterOptions.schoolDivisions}
                  onChange={(value) =>
                    navigate({ schoolDivision: value, resetSchoolKinds: true })
                  }
                />
                <FilterMultiCheckbox
                  label="학교종류"
                  options={data.filterOptions.schoolKinds}
                  selected={schoolKindsFilter}
                  onChange={(schoolKinds) => navigate({ schoolKinds })}
                  labelClassName={`shrink-0 ${FDB_TYPO.toolbarLabel}`}
                  controlClassName={`${FDB_TYPO.toolbarControl} flex min-w-[5.5rem] items-center gap-1 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-foreground outline-none hover:border-accent/60 focus:border-accent`}
                />
                <FilterMultiCheckbox
                  label="지역"
                  options={data.filterOptions.regions}
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
            ) : activeSheet.rowCount === 0 ? (
              <p className={FDB_TYPO.bodyText}>
                {activeSheet.label} 데이터가 없습니다.{" "}
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  엑셀 업로드
                </button>
                에서 파일을 업로드하세요.
              </p>
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
                에서 대학전문·대학원 파일을 각각 업로드하세요.
              </p>
            ) : data.filteredRows.length === 0 ? (
              <p className={FDB_TYPO.bodyText}>
                {hasActiveFilter
                  ? `선택한 조건에 맞는 대학이 없습니다. (${displayYear}년 · 필터 적용)`
                  : `선택한 연도(${displayYear}년)에 해당하는 데이터가 없습니다.`}
              </p>
            ) : activeSheet.headerRows.length === 0 ? (
              <p className={FDB_TYPO.bodyText}>
                헤더 정보가 없습니다. 해당 구분의 엑셀을 다시 업로드하세요.
              </p>
            ) : (
              <FreshmanEnrollmentAlimiRawTable
                kind={activeSheet.kind}
                headerRows={activeSheet.headerRows}
                headerMerges={activeSheet.headerMerges}
                rows={data.filteredRows}
                displayYear={displayYear}
                sheetLabel={activeSheet.label}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
