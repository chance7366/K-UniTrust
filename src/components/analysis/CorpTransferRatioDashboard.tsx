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
import { DashboardYearFilterSelect } from "@/components/analysis/DashboardYearFilterSelect";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FinanceAnalysisDbExportButtons } from "@/components/analysis/FinanceAnalysisDbExportButtons";
import { FilterMultiCheckbox } from "@/components/analysis/FilterMultiCheckbox";
import { CorpTransferRatioChartDashboard } from "@/components/analysis/CorpTransferRatioChartDashboard";
import { CorpTransferRatioDataTable } from "@/components/analysis/CorpTransferRatioDataTable";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { buildCorpTransferRatioHref } from "@/lib/analysis/corp-transfer-ratio-navigation";
import { serializeMultiFilterParam } from "@/lib/analysis/table-filter-utils";
import type {
  CorpTransferRatioDashboardData,
  CorpTransferRatioSection,
} from "@/lib/data/corp-transfer-ratio";
import {
  CORP_TRANSFER_RATIO_HELP_LINES,
  CORP_TRANSFER_RATIO_TEMPLATE_HEADER,
  CORP_TRANSFER_RATIO_TEMPLATE_SAMPLES,
} from "@/lib/ingest/corp-transfer-ratio-config";

const ALL_FILTER = "";

function fmtAmount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function fmtPercent(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function TemplatePreviewTable() {
  return (
    <div className="mt-4 w-full basis-full overflow-x-auto rounded-lg border border-border/60">
      <table className={`w-full min-w-[1200px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            {CORP_TRANSFER_RATIO_TEMPLATE_HEADER.map((h) => (
              <th
                key={h}
                className={`text-table-head ${FDB_TYPO.tableHead} whitespace-nowrap border-r border-border/50 px-2 py-2 font-medium ${
                  h === "학교코드_표준" || h === "전입금비율"
                    ? "text-accent-orange"
                    : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CORP_TRANSFER_RATIO_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              <td className="border-r border-border/40 px-2 py-1.5 font-mono">
                {row.기준연도}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 font-mono font-semibold text-accent-orange">
                {row.학교코드_표준}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.학교명}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.학교구분명}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.학교종류명}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.지역명}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">
                {row.설립구분명}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">
                {fmtAmount(row.경상비전입금)}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">
                {fmtAmount(row.법정부담전입금)}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">
                {fmtAmount(row.자산전입금)}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">
                {fmtAmount(row.전입금합계)}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5 text-right font-mono">
                {fmtAmount(row.등록금수입)}
              </td>
              <td className="px-2 py-1.5 text-right font-mono font-semibold text-accent-orange">
                {fmtPercent(row.전입금비율)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        양식 헤더·샘플 행 — 업로드 시 위 1행 헤더 구조를 그대로 사용하세요. 금액
        단위는 천원입니다. 기준연도는 A열에서 인식됩니다.
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
          "/api/ingest/finance-analysis/corp-transfer-ratio/upload",
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
            <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
              엑셀업로드
            </p>
            <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>법인전입금비율</h4>
            <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
              법인전입금비율 엑셀을 업로드하면{" "}
              <code className="text-accent">
                data/csv/finance_analysis_corp_transfer_ratio.csv
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
            {message ? <p className={`mt-2 ${FDB_TYPO.legend} text-accent`}>{message}</p> : null}
            {error ? (
              <p className={`mt-2 ${FDB_TYPO.legend} text-accent-orange`}>{error}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <UploadPanelTemplateLink href="/api/ingest/finance-analysis/corp-transfer-ratio/template" download="corp_transfer_ratio_upload_template.xlsx" />
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
          exportBasePath="/api/ingest/finance-analysis/corp-transfer-ratio/export"
          campusRowCount={rowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            {CORP_TRANSFER_RATIO_HELP_LINES.map((line, i) => (
              <p key={line} className={i > 0 ? "mt-2" : undefined}>
                {line}
              </p>
            ))}
            <p className="mt-2">
              <span className="font-medium text-foreground">업로드 양식</span>은
              기준연도·학교코드_표준·학교명·학교구분명·학교종류명·지역명·설립구분명·경상비전입금·법정부담전입금·자산전입금·전입금합계·등록금수입·전입금비율
              1행 헤더 구조입니다. 금액 단위는 천원입니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">기준연도</span>는
              A열에서 인식하며, 표시 연도 선택으로 조회합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> :
              법인재정 법인전입금비율(학교별자료)
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">DB 원본 down</span>
              은 현재 DB에 저장된 전체 원본 데이터를 업로드 양식과 동일한 구조의
              엑셀 파일로 받을 수 있습니다.
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

export function CorpTransferRatioDashboard({
  data,
}: {
  data: CorpTransferRatioDashboardData;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const allYears = data.years;
  const displayYear = data.displayYear;
  const section = data.section;
  const {
    estb: estbFilter,
    schoolKinds: schoolKindsFilter,
    schoolDivision: schoolDivisionFilter,
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
    schoolKinds?: string[];
    schoolDivision?: string;
    regions?: string[];
    search?: string;
    section?: CorpTransferRatioSection;
    resetFilters?: boolean;
    resetSchoolKinds?: boolean;
  }) {
    router.push(
      buildCorpTransferRatioHref({
        year: next.year ?? displayYear,
        section: next.section ?? section,
        estb: next.resetFilters ? "": (next.estb ?? estbFilter),
        schoolKind:
          next.resetFilters || next.resetSchoolKinds
            ? ""
            : serializeMultiFilterParam(next.schoolKinds ?? schoolKindsFilter),
        schoolDivision: next.resetFilters
          ? ""
          : (next.schoolDivision ?? schoolDivisionFilter),
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
        sectionLabel="재정분석"
        subtitle="법인 전입금 비율 현황"
        title="법인전입금비율"
      />

      {uploadOpen ? (
        <UploadPanel
          uploadedAt={data.uploadedAt}
          rowCount={data.rowCount}
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
        <CorpTransferRatioChartDashboard
          rows={data.advancedChartRows}
          years={allYears}
          hasData={data.hasData}
        />
      ) : (
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
              options={filterOptions.estbs ?? []}
              onChange={(value) => navigate({ estb: value, resetSchoolKinds: true })}
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
            />
            <FilterMultiCheckbox
              label="지역"
              options={filterOptions.regions}
              selected={regionsFilter}
              onChange={(regions) => navigate({ regions })}
            />
            {hasActiveFilter ? (
              <button
                type="button" onClick={() => navigate({ resetFilters: true })}
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
              엑셀업로드
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
          <CorpTransferRatioDataTable rows={filteredRows} />
        )}
      </section>
        </div>
      )}
      </div>
    </div>
  );
}
