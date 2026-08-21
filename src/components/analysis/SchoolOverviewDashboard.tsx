"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";

import { DashboardKpiCard } from "@/components/analysis/DashboardKpiCard";
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FinanceAnalysisDbExportButtons } from "@/components/analysis/FinanceAnalysisDbExportButtons";
import { SchoolOverviewDataTable } from "@/components/analysis/SchoolOverviewDataTable";
import { buildSchoolOverviewHref } from "@/lib/analysis/school-overview-navigation";
import type { SchoolOverviewDashboardData } from "@/lib/data/school-overview";
import {
  SCHOOL_OVERVIEW_TEMPLATE_HEADER,
  SCHOOL_OVERVIEW_TEMPLATE_SAMPLES,
} from "@/lib/ingest/school-overview-config";

const ALL_FILTER = "";

function TemplatePreviewTable() {
  return (
    <div className="mt-4 w-full basis-full overflow-x-auto rounded-lg border border-border/60">
      <table className={`w-full min-w-[1200px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            {SCHOOL_OVERVIEW_TEMPLATE_HEADER.map((h) => (
              <th
                key={h}
                className={`text-table-head whitespace-nowrap border-r border-border/50 px-2 py-2 font-medium ${
                  h === "학교코드_표준" ? "text-accent-orange" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCHOOL_OVERVIEW_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              <td className="border-r border-border/40 px-2 py-1.5 font-mono font-semibold text-accent-orange">
                {row.학교코드_표준}
              </td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교명}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.본분교}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학제}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.지역}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.설립구분}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.관련법령}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.법인명}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교상태}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row["학교명(영문)"]}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.도로명주소}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.지번주소 || "—"}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.우편번호}</td>
              <td className="border-r border-border/40 px-2 py-1.5">{row.학교개교일}</td>
              <td className="px-2 py-1.5">{row.학교홈페이지}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        양식 헤더·샘플 행 — 업로드 시 위 1행 헤더 구조를 그대로 사용하세요.
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
        const res = await fetch("/api/ingest/univ-map/school-overview/upload", {
          method: "POST",
          body: fd,
        });
        const body = (await res.json()) as {
          ok?: boolean;
          rowCount?: number;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "업로드에 실패했습니다.");
        }
        setMessage(`${body.rowCount ?? 0}건 저장됨 (전체 덮어쓰기)`);
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
            <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>학교개황</h4>
            <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
              학교 개황 정보 엑셀을 업로드하면{" "}
              <code className="text-accent">data/csv/univ_map_school_overview.csv</code>
              에 저장됩니다. 업로드 시 기존 데이터는 전체 덮어쓰기됩니다.
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
            <UploadPanelTemplateLink href="/api/ingest/univ-map/school-overview/template" download="school_overview_upload_template.xlsx" />
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
          exportBasePath="/api/ingest/univ-map/school-overview/export"
          campusRowCount={rowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">개요</span> : 본교, 분교,
              캠퍼스, 대학원 등 학교에 대한 학제, 지역, 설립구분, 법인명, 학교상태, 주소
              등 학교 개황에 대한 정보
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">출처</span> : 대학알리미/자료실
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">관리</span> : 매년 수시 공시되는
              자료로 기존자료에 업데이트. 원자료에 &apos;학교코드&apos; 를 추가하여 관리.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">특이사항</span> : 해당사항 없음
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

export function SchoolOverviewDashboard({
  data,
}: {
  data: SchoolOverviewDashboardData;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const {
    region: regionFilter,
    schoolType: schoolTypeFilter,
    schoolKind: schoolKindFilter,
    establishment: establishmentFilter,
    schoolStatus: schoolStatusFilter,
    q: queryFilter,
  } = data.filters;
  const filterOptions = data.filterOptions;
  const filteredRows = data.rows;

  const hasActiveFilter =
    establishmentFilter !== ALL_FILTER ||
    schoolTypeFilter !== ALL_FILTER ||
    schoolKindFilter !== ALL_FILTER ||
    regionFilter !== ALL_FILTER ||
    schoolStatusFilter !== ALL_FILTER ||
    queryFilter !== "";

  function navigate(
    next: Partial<typeof data.filters> & { resetFilters?: boolean },
  ) {
    router.push(
      buildSchoolOverviewHref({
        establishment: next.resetFilters
          ? ""
          : (next.establishment ?? establishmentFilter),
        schoolType: next.resetFilters ? "" : (next.schoolType ?? schoolTypeFilter),
        schoolKind: next.resetFilters ? "" : (next.schoolKind ?? schoolKindFilter),
        region: next.resetFilters ? "" : (next.region ?? regionFilter),
        schoolStatus: next.resetFilters
          ? ""
          : (next.schoolStatus ?? schoolStatusFilter),
        q: next.resetFilters ? "" : (next.q ?? queryFilter),
        resetFilters: next.resetFilters,
      }),
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="학교별 개황 정보 관리"
        title="학교개황"
      />

      {uploadOpen ? (
        <UploadPanel
          uploadedAt={data.uploadedAt}
          rowCount={data.rowCount}
          onClose={() => setUploadOpen(false)}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardKpiCard
          accent="blue"
          title="전체 학교"
          value={data.stats.total.toLocaleString("ko-KR")}
          sub="본·분교 포함"
        />
        <DashboardKpiCard
          accent="emerald"
          title="기존"
          value={data.stats.active.toLocaleString("ko-KR")}
          sub="운영 중"
        />
        <DashboardKpiCard
          accent="red"
          title="폐교"
          value={data.stats.closed.toLocaleString("ko-KR")}
          sub="폐교 처리"
        />
        <DashboardKpiCard
          accent="amber"
          title="조회 결과"
          value={data.stats.filtered.toLocaleString("ko-KR")}
          sub="필터 적용 후"
        />
      </div>

      <section className="rounded-xl border border-border bg-surface px-4 py-3">
        {data.hasData ? (
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="설립구분"
              value={establishmentFilter}
              options={filterOptions.establishments}
              onChange={(value) => navigate({ establishment: value })}
            />
            <FilterSelect
              label="학교구분"
              value={schoolTypeFilter}
              options={filterOptions.schoolTypes}
              onChange={(value) => navigate({ schoolType: value })}
            />
            <FilterSelect
              label="학교종류"
              value={schoolKindFilter}
              options={filterOptions.schoolKinds}
              onChange={(value) => navigate({ schoolKind: value })}
            />
            <FilterSelect
              label="지역"
              value={regionFilter}
              options={filterOptions.regions}
              onChange={(value) => navigate({ region: value })}
            />
            <FilterSelect
              label="학교상태"
              value={schoolStatusFilter}
              options={filterOptions.schoolStatuses}
              onChange={(value) => navigate({ schoolStatus: value })}
            />
            <label className="flex items-center gap-2">
              <span className={FDB_TYPO.toolbarLabel}>검색</span>
              <input
                type="search"
                defaultValue={queryFilter}
                placeholder="학교명·코드"
                className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate({ q: e.currentTarget.value });
                  }
                }}
              />
            </label>
            {hasActiveFilter ? (
              <button
                type="button" onClick={() => navigate({ resetFilters: true })}
                className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 text-muted hover:text-foreground ${FDB_TYPO.toolbarControl}`}
              >
                필터 초기화
              </button>
            ) : null}
            {!uploadOpen ? (
              <div className="ml-auto shrink-0">
                <ExcelUploadButton
                  variant="emerald"
                  onClick={() => setUploadOpen(true)}
                />
              </div>
            ) : null}
          </div>
        ) : !uploadOpen ? (
          <div className="flex justify-end">
            <ExcelUploadButton
              variant="emerald"
              onClick={() => setUploadOpen(true)}
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        {!data.hasData ? (
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
            선택한 조건에 맞는 학교가 없습니다. 필터를 조정해 보세요.
          </p>
        ) : (
          <SchoolOverviewDataTable rows={filteredRows} />
        )}
      </section>
    </div>
  );
}
