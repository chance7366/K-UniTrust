"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardYearFilterSelect } from "@/components/analysis/DashboardYearFilterSelect";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { OriginRegionDataTable } from "@/components/analysis/OriginRegionDataTable";
import { FilterMultiCheckbox } from "@/components/analysis/FilterMultiCheckbox";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { buildOriginRegionHref } from "@/lib/analysis/origin-region-navigation";
import { serializeMultiFilterParam } from "@/lib/analysis/table-filter-utils";
import type { OriginRegionDashboardData } from "@/lib/data/origin-region";
import {
  ORIGIN_REGION_REGION_GROUPS,
  ORIGIN_REGION_TEMPLATE_HEADER_ROW1,
  ORIGIN_REGION_TEMPLATE_HEADER_ROW2,
  ORIGIN_REGION_TEMPLATE_SAMPLES,
} from "@/lib/ingest/origin-region-config";

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR");
}

function fmtRatio(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function TemplatePreviewTable() {
  const mergeSpans: { label: string; span: number }[] = [];
  let i = 8;
  while (i < ORIGIN_REGION_TEMPLATE_HEADER_ROW1.length) {
    const label = ORIGIN_REGION_TEMPLATE_HEADER_ROW1[i];
    if (label) {
      mergeSpans.push({ label: String(label), span: 2 });
      i += 2;
    } else {
      i += 1;
    }
  }

  return (
    <div className="mt-4 w-full basis-full overflow-x-auto rounded-lg border border-border/60">
      <table className={`w-full min-w-[960px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              기준연도
            </th>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              학교종류
            </th>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              설립구분
            </th>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              지역
            </th>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              상태
            </th>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              학교코드_표준
            </th>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              학교
            </th>
            <th
              rowSpan={2}
              className="text-table-head border-r border-border/50 px-2 py-2 font-medium"
            >
              총입학자수
            </th>
            {mergeSpans.map((g) => (
              <th
                key={g.label}
                colSpan={g.span}
                className="text-table-head border-r border-border/50 px-2 py-2 text-center font-medium"
              >
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            {ORIGIN_REGION_TEMPLATE_HEADER_ROW2.slice(8).map((h, idx) => (
              <th
                key={`${h}-${idx}`}
                className="text-table-head whitespace-nowrap px-2 py-2 text-center font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ORIGIN_REGION_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">
                {row.기준연도}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.학교종류}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.설립구분}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.지역}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.상태}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">
                {row.학교코드_표준}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.학교}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">
                {fmtCount(row.총입학자수)}
              </td>
              {ORIGIN_REGION_REGION_GROUPS.flatMap((g) => {
                const countKey = `${g.label}_학생수` as keyof typeof row;
                const ratioKey = `${g.label}_비율` as keyof typeof row;
                return [
                  <td
                    key={`${g.key}-c`}
                    className="px-2 py-1.5 text-right font-mono"
                  >
                    {fmtCount(row[countKey] as number)}
                  </td>,
                  <td
                    key={`${g.key}-r`}
                    className="px-2 py-1.5 text-right font-mono"
                  >
                    {fmtRatio(row[ratioKey] as number)}
                  </td>,
                ];
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        양식 헤더·샘플 행 — 업로드 시 위 2행 헤더 구조를 그대로 사용하세요. 기준연도는
        A열(기준연도)에서 인식됩니다.
      </p>
    </div>
  );
}

function UploadPanel({
  uploadedAt,
  rowCount,
  onClose,
}: {
  uploadedAt: string | null;
  rowCount: number;
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
          "/api/ingest/finance-analysis/origin-region/upload",
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
            엑셀업로드
          </p>
          <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>출신지역</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            신입생의 출신 고등학교 유형별 현황(학교별자료) 엑셀을 업로드하면{" "}
            <code className="text-accent">
              data/csv/finance_analysis_origin_region.csv
            </code>
            에 저장됩니다. 동일 기준연도는 덮어쓰기, 신규 연도는 추가됩니다.
          </p>
          {uploadedAt ? (
            <p className={`mt-2 ${FDB_TYPO.legend}`}>
              최근 업로드: {new Date(uploadedAt).toLocaleString("ko-KR")} ·{" "}
              {rowCount.toLocaleString("ko-KR")}행
            </p>
          ) : (
            <p className={`mt-2 ${FDB_TYPO.legend} text-warning`}>
              아직 업로드된 데이터가 없습니다.
            </p>
          )}
          {message ? (
            <p className={`mt-2 ${FDB_TYPO.legend} text-accent`}>{message}</p>
          ) : null}
          {error ? (
            <p className={`mt-2 ${FDB_TYPO.legend} text-accent-orange`}>{error}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <UploadPanelTemplateLink href="/api/ingest/finance-analysis/origin-region/template" download="origin_region_upload_template.xlsx" />
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
        {helpOpen ? (
          <div className={`w-full basis-full rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">업로드 양식</span>은
              기준연도·학교종류·설립구분·지역·상태·학교·총입학자수와 출신지역
              유형별(학생수·비율) 2행 헤더 구조입니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">기준연도</span>는 A열에서
              인식하며, 표시 연도 선택으로 조회합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> :
              신입생의 출신 고등학교 유형별 현황(학교별자료)
            </p>
          </div>
        ) : null}
        <TemplatePreviewTable />
      </div>
    </section>
  );
}

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
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function OriginRegionDashboard({
  data,
}: {
  data: OriginRegionDashboardData;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const allYears = data.years;
  const displayYear = data.displayYear;
  const {
    estb: estbFilter,
    schoolDivision: schoolDivisionFilter,
    schoolKinds: schoolKindsFilter,
    regions: regionsFilter,
    search: searchFilter,
  } = data.filters;
  const filteredRows = data.rows;
  const filterOptions = data.filterOptions;

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
    resetFilters?: boolean;
    resetSchoolKinds?: boolean;
  }) {
    router.push(
      buildOriginRegionHref({
        year: next.year ?? displayYear,
        estb: next.resetFilters ? "": (next.estb ?? estbFilter),
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
        subtitle="출신학교 지역정보별 입학자수 및 비율"
        title="출신학교"
      />

      {uploadOpen ? (
        <UploadPanel
          uploadedAt={data.uploadedAt}
          rowCount={data.rowCount}
          onClose={() => setUploadOpen(false)}
        />
      ) : null}

      <div className="flex flex-col gap-1">
        {!uploadOpen ? (
          <div className="flex justify-end">
            <ExcelUploadButton
              variant="emerald"
              onClick={() => setUploadOpen(true)}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-surface px-4 py-3">
            {data.hasData && displayYear != null ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                <DashboardYearFilterSelect
                  value={displayYear}
                  years={allYears}
                  onChange={(year) => navigate({ year, resetFilters: true })}
                />
                <FilterSelect
                  label="설립구분"
                  value={estbFilter}
                  options={filterOptions.estbs}
                  onChange={(value) =>
                    navigate({ estb: value, resetSchoolKinds: true })
                  }
                />
                <FilterSelect
                  label="학교구분"
                  value={schoolDivisionFilter}
                  options={filterOptions.schoolDivisions}
                  onChange={(value) =>
                    navigate({ schoolDivision: value, resetSchoolKinds: true })
                  }
                />
                <FilterMultiCheckbox
                  label="학교종류"
                  options={filterOptions.schoolKinds}
                  selected={schoolKindsFilter}
                  onChange={(schoolKinds) => navigate({ schoolKinds })}
                />
                <FilterMultiCheckbox
                  label="지역"
                  options={filterOptions.regions}
                  selected={regionsFilter}
                  onChange={(regions) => navigate({ regions })}
                />
                {hasActiveFilter ? (
                  <button
                    type="button"
                    onClick={() => navigate({ resetFilters: true })}
                    className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 text-muted hover:text-foreground ${FDB_TYPO.toolbarControl}`}
                  >
                    필터 초기화
                  </button>
                ) : null}
                <SchoolNameSearchInput
                  value={searchFilter}
                  onSearch={(search) => navigate({ search })}
                  className="ml-auto shrink-0"
                />
              </div>
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
                {hasActiveFilter
                  ? `선택한 조건에 맞는 대학이 없습니다. (${displayYear}년 · 필터 적용)`
                  : `선택한 연도(${displayYear}년)에 해당하는 데이터가 없습니다.`}
              </p>
            ) : (
              <OriginRegionDataTable rows={filteredRows} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
