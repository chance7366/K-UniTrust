"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardKpiCard } from "@/components/analysis/DashboardKpiCard";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AnalysisTargetDataTable } from "@/components/analysis/AnalysisTargetDataTable";
import { buildAnalysisTargetHref } from "@/lib/analysis/analysis-target-navigation";
import {
  ANALYSIS_TARGET_COHORT_DIVISION,
  type AnalysisTargetCohort,
  type AnalysisTargetDashboardData,
  type AnalysisTargetViewMode,
} from "@/lib/analysis/analysis-target-view";
import {
  ANALYSIS_TARGET_TEMPLATE_HEADER,
  ANALYSIS_TARGET_TEMPLATE_SAMPLES,
} from "@/lib/ingest/analysis-target-config";

const ALL_FILTER = "";

function TemplatePreviewTable() {
  return (
    <div className="mt-4 w-full basis-full overflow-x-auto rounded-lg border border-border/60">
      <table className={`w-full min-w-[1600px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            {ANALYSIS_TARGET_TEMPLATE_HEADER.map((h) => (
              <th
                key={h}
                className={`text-table-head whitespace-nowrap border-r border-border/50 px-2 py-2 font-medium ${
                  h === "학교코드" ? "text-accent-orange" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ANALYSIS_TARGET_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              {ANALYSIS_TARGET_TEMPLATE_HEADER.map((h) => (
                <td
                  key={h}
                  className={`border-r border-border/40 px-2 py-1.5 ${
                    h === "학교코드" || h === "대표학교코드" || h === "기준연도"
                      ? "font-mono"
                      : ""
                  } ${h === "학교코드" ? "font-semibold text-accent-orange" : ""}`}
                >
                  {String(row[h as keyof typeof row] || "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        양식 헤더·샘플 행 — 업로드 시 위 1행 헤더 구조를 그대로 사용하세요. 기준연도는 A열에서 인식되며, 학교코드·대표학교코드는 텍스트(앞자리 0 유지)입니다.
      </p>
    </div>
  );
}

function HelpPanel() {
  return (
    <div className={`w-full basis-full rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
      <p>
        <span className="font-medium text-foreground">개요</span> : 학교명,
        학교코드, 대표학교코드, 본분교, 설립구분, 학교구분, 학교종류, 지역,
        관련법령, 법인명, 학교상태, 상위학교, 학자금제한, 임시이사, 결산미제출 정보
      </p>
      <p className="mt-2">
        <span className="font-medium text-foreground">출처</span> : 학교코드정보
      </p>
      <p className="mt-2">
        <span className="font-medium text-foreground">관리</span> : 연도별관리
      </p>
      <p className="mt-2">
        <span className="font-medium text-foreground">특이사항</span> :
        학교코드·대표학교코드는 텍스트 형식(앞자리 0 유지)으로 저장·표시한다.
        학교코드 보기에서는 본교·분교·캠퍼스를 모두 나열하고, 대표학교코드
        보기에서는 대학·전문대학(필요 시 대학원)을 대표학교 단위로 묶는다.
        재정분석지표·대학경쟁력분석은 대표학교코드 기준으로 캠퍼스 데이터를
        합산한다. 학자금제한·임시이사·결산미제출은 캠퍼스 중 하나라도 해당이면
        해당으로 표시한다.
      </p>

      <div className="mt-4 border-t border-border/50 pt-3">
        <p>
          <span className="font-medium text-foreground">개요</span> : 재정분석지표,
          대학경쟁력분석 대상교
        </p>
        <p className="mt-2">
          <span className="font-medium text-foreground">출처</span> : 학교코드정보
        </p>
        <p className="mt-2">
          <span className="font-medium text-foreground">관리</span> : 학교코드정보에서
          설립구분(사립), 학교구분(대학, 전문대학, 대학원), 학교상태(기존, 신설,
          학교명 변경), 학교종류(대학교, 산업대학, 전문대학, 일반대학원,
          전문대학원, 특수대학원, 전문대학(2년제), 전문대학(3년제),
          전문대학(4년제))
        </p>
        <p className="mt-2">
          <span className="font-medium text-foreground">특이사항</span> :
          본교뿐만 아니라 분교, 캠퍼스도 모두 분석대상에 포함시킬것. 재정분석지표·
          대학경쟁력분석은 대표학교코드(학교대표) 기준으로 학교코드 데이터를
          합산한다. 예: 가톨릭관동대학교 0000513.
        </p>
        <p className="mt-2">
          학자금지원제한대학, 임시이사, 결산미제출교 관리 : &apos;해당&apos; 여부
          표시할 것, 절대평가지표, 지수점수와 관계없이 위험대학
        </p>
        <p className="mt-2">
          결산미제출교는 평가분석에서 제외하되 평가등급에서 E등급 부여.
        </p>
        <p className="mt-2">
          학자금지원제한대학 표시 : 2026년(2025년 발표), 2025년(2024년 발표)
        </p>
        <p className="mt-2">결산미제출교 : 해당 회계연도에 표기</p>
      </div>
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
        const res = await fetch("/api/ingest/univ-map/analysis-target/upload", {
          method: "POST",
          body: fd,
        });
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
          <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>엑셀업로드</p>
          <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>분석대상</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            분석대상학교 엑셀을 업로드하면{" "}
            <code className="text-accent">data/csv/univ_map_analysis_target.csv</code>
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
          <UploadPanelTemplateLink href="/api/ingest/univ-map/analysis-target/template" download="analysis_target_upload_template.xlsx" />
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
        {helpOpen ? <HelpPanel /> : null}
        <TemplatePreviewTable />
      </div>
    </section>
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
  const sortedYears = [...years].sort((a, b) => b - a);

  return (
    <div className="flex items-center gap-2">
      <label className={FDB_TYPO.toolbarLabel}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        {sortedYears.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </select>
    </div>
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
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: AnalysisTargetViewMode;
  onChange: (mode: AnalysisTargetViewMode) => void;
}) {
  return (
    <div className="inline-flex h-[30px] items-stretch rounded-md border border-border bg-surface-2 p-0.5">
      <button
        type="button"
        onClick={() => onChange("campus")}
        className={`rounded px-2.5 py-1 transition-colors ${
          value === "campus"
            ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
            : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`
        }`}
      >
        학교코드
      </button>
      <button
        type="button"
        onClick={() => onChange("rep")}
        className={`rounded px-2.5 py-1 transition-colors ${
          value === "rep"
            ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
            : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`
        }`}
      >
        대표학교코드
      </button>
    </div>
  );
}

function CohortTabBar({
  active,
  counts,
  onChange,
}: {
  active: AnalysisTargetCohort;
  counts: Record<AnalysisTargetCohort, number>;
  onChange: (cohort: AnalysisTargetCohort) => void;
}) {
  const tabs: { id: AnalysisTargetCohort; label: string; count: number }[] = [
    { id: "university", label: "대학", count: counts.university },
    { id: "junior-college", label: "전문대학", count: counts["junior-college"] },
  ];
  if (counts.graduate > 0) {
    tabs.push({ id: "graduate", label: "대학원", count: counts.graduate });
  }

  return (
    <div
      className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
      aria-label="대표학교 학교구분"
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
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-[10px] font-semibold ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-surface text-muted"
              }`}
            >
              {tab.count.toLocaleString("ko-KR")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function cohortFromSchoolDivision(value: string): AnalysisTargetCohort {
  if (value === ANALYSIS_TARGET_COHORT_DIVISION["junior-college"]) {
    return "junior-college";
  }
  if (value === ANALYSIS_TARGET_COHORT_DIVISION.graduate) {
    return "graduate";
  }
  return "university";
}

export function AnalysisTargetDashboard({
  data,
}: {
  data: AnalysisTargetDashboardData;
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const allYears = data.years;
  const displayYear = data.displayYear;
  const viewMode = data.viewMode;
  const cohort = data.cohort;
  const {
    estb: estbFilter,
    mainBranch: mainBranchFilter,
    schoolDivision: schoolDivisionFilter,
    schoolKind: schoolKindFilter,
    region: regionFilter,
    status: statusFilter,
    q: queryFilter,
  } = data.filters;
  const tableRows = viewMode === "rep" ? data.repRows : data.rows.map((row) => ({
    ...row,
    campusCount: 1,
  }));
  const yearRowCount = data.yearRowCount;
  const filterOptions = data.filterOptions;
  const isRep = viewMode === "rep";
  const cohortLabel = ANALYSIS_TARGET_COHORT_DIVISION[cohort];
  const repSchoolCount =
    data.cohortCounts.university + data.cohortCounts["junior-college"];

  const hasActiveFilter =
    estbFilter !== ALL_FILTER ||
    (!isRep && mainBranchFilter !== ALL_FILTER) ||
    (!isRep && schoolDivisionFilter !== ALL_FILTER) ||
    schoolKindFilter !== ALL_FILTER ||
    regionFilter !== ALL_FILTER ||
    statusFilter !== ALL_FILTER ||
    queryFilter !== "";

  function navigate(next: {
    year?: number | null;
    view?: AnalysisTargetViewMode;
    cohort?: AnalysisTargetCohort;
    estb?: string;
    mainBranch?: string;
    schoolDivision?: string;
    schoolKind?: string;
    region?: string;
    status?: string;
    q?: string;
    resetFilters?: boolean;
  }) {
    const nextView = next.view ?? viewMode;
    router.push(
      buildAnalysisTargetHref({
        year: next.year ?? displayYear,
        view: nextView,
        cohort: next.cohort ?? cohort,
        estb: next.resetFilters ? "" : (next.estb ?? estbFilter),
        mainBranch: next.resetFilters ? "" : (next.mainBranch ?? mainBranchFilter),
        schoolDivision: next.resetFilters
          ? ""
          : (next.schoolDivision ?? schoolDivisionFilter),
        schoolKind: next.resetFilters ? "" : (next.schoolKind ?? schoolKindFilter),
        region: next.resetFilters ? "" : (next.region ?? regionFilter),
        status: next.resetFilters ? "" : (next.status ?? statusFilter),
        q: next.resetFilters ? "" : (next.q ?? queryFilter),
        resetFilters: next.resetFilters,
      }),
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="재정분석지표·대학경쟁력분석 대상교 관리"
        title="분석대상"
      />

      {uploadOpen ? (
        <UploadPanel uploadedAt={data.uploadedAt} rowCount={data.rowCount} onClose={() => setUploadOpen(false)} />
      ) : null}

      {data.hasData && displayYear != null ? (
        isRep ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKpiCard
              accent="blue"
              title="대표학교"
              value={repSchoolCount.toLocaleString("ko-KR")}
              sub="대학·전문대학"
            />
            <DashboardKpiCard
              accent="emerald"
              title="대학"
              value={data.cohortCounts.university.toLocaleString("ko-KR")}
              sub="대표학교코드 기준"
            />
            <DashboardKpiCard
              accent="amber"
              title="전문대학"
              value={data.cohortCounts["junior-college"].toLocaleString("ko-KR")}
              sub="대표학교코드 기준"
            />
            <DashboardKpiCard
              accent="red"
              title="조회 결과"
              value={tableRows.length.toLocaleString("ko-KR")}
              sub={`${cohortLabel} · 필터 적용 후`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKpiCard
              accent="blue"
              title={`${displayYear}년 학교`}
              value={yearRowCount.toLocaleString("ko-KR")}
              sub="학교코드 전체"
            />
            <DashboardKpiCard
              accent="emerald"
              title="DB 연도"
              value={allYears.length.toLocaleString("ko-KR")}
              sub="업로드된 기준연도"
            />
            <DashboardKpiCard
              accent="amber"
              title="조회 결과"
              value={tableRows.length.toLocaleString("ko-KR")}
              sub="필터 적용 후"
            />
            <DashboardKpiCard
              accent="red"
              title="학교종류"
              value={filterOptions.schoolKinds.length.toLocaleString("ko-KR")}
              sub="분류 종류 수"
            />
          </div>
        )
      ) : null}

      <section className="rounded-xl border border-border bg-surface px-4 py-3">
        {data.hasData && displayYear != null ? (
          <div className="flex flex-wrap items-center gap-3">
            <YearFilterSelect
              label="표시 연도"
              value={displayYear}
              years={allYears}
              onChange={(year) => navigate({ year, resetFilters: true })}
            />
            <ViewModeToggle
              value={viewMode}
              onChange={(mode) =>
                navigate({
                  view: mode,
                  cohort:
                    mode === "rep"
                      ? cohortFromSchoolDivision(schoolDivisionFilter)
                      : cohort,
                })
              }
            />
            <FilterSelect
              label="설립구분"
              value={estbFilter}
              options={filterOptions.estbs}
              onChange={(value) => navigate({ estb: value })}
            />
            {!isRep ? (
              <FilterSelect
                label="본분교"
                value={mainBranchFilter}
                options={filterOptions.mainBranches}
                onChange={(value) => navigate({ mainBranch: value })}
              />
            ) : null}
            {!isRep ? (
              <FilterSelect
                label="학교구분"
                value={schoolDivisionFilter}
                options={filterOptions.schoolDivisions}
                onChange={(value) => navigate({ schoolDivision: value })}
              />
            ) : null}
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
              value={statusFilter}
              options={filterOptions.statuses}
              onChange={(value) => navigate({ status: value })}
            />
            <label className="flex items-center gap-2">
              <span className={FDB_TYPO.toolbarLabel}>검색</span>
              <input
                type="search"
                defaultValue={queryFilter}
                placeholder={isRep ? "학교대표·대표코드·법인명" : "학교명·코드·법인명"}
                className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate({ q: e.currentTarget.value });
                  }
                }}
              />
            </label>
            {hasActiveFilter ? (
              <button type="button" onClick={() => navigate({ resetFilters: true })} className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 text-muted hover:text-foreground ${FDB_TYPO.toolbarControl}`}>
                필터 초기화
              </button>
            ) : null}
            {!uploadOpen ? (
              <div className="ml-auto shrink-0">
                <ExcelUploadButton variant="emerald" onClick={() => setUploadOpen(true)} />
              </div>
            ) : null}
          </div>
        ) : !uploadOpen ? (
          <div className="flex justify-end">
            <ExcelUploadButton variant="emerald" onClick={() => setUploadOpen(true)} />
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        {!data.hasData || displayYear == null ? (
          <p className={FDB_TYPO.bodyText}>
            데이터가 없습니다. 상단의{" "}
            <button type="button" onClick={() => setUploadOpen(true)} className="text-accent underline-offset-2 hover:underline">
              엑셀업로드
            </button>
            에서 양식을 다운로드한 뒤 엑셀을 업로드하세요.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {isRep ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CohortTabBar
                  active={cohort}
                  counts={data.cohortCounts}
                  onChange={(next) => navigate({ cohort: next, schoolKind: "" })}
                />
                <p className={FDB_TYPO.legend}>
                  재정분석지표·대학경쟁력분석은 대표학교코드로 캠퍼스(학교코드)
                  데이터를 합산합니다.
                </p>
              </div>
            ) : (
              <p className={FDB_TYPO.legend}>
                학교코드 기준 · 본교·분교·캠퍼스를 모두 표시합니다. 대표학교코드
                보기로 전환하면 대학·전문대학 분석 단위를 볼 수 있습니다.
              </p>
            )}
            {tableRows.length === 0 ? (
              <p className={FDB_TYPO.bodyText}>
                {hasActiveFilter
                  ? `선택한 조건에 맞는 학교가 없습니다. (${displayYear}년 · 필터 적용)`
                  : `선택한 연도(${displayYear}년)에 해당하는 데이터가 없습니다.`}
              </p>
            ) : (
              <AnalysisTargetDataTable rows={tableRows} viewMode={viewMode} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
