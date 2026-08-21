"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Database } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "./freshman-enrollment-ui-mock.css";

type Section = "charts" | "data";
type ViewMode = "campus" | "consolidated";

const MOCK_YEARS = [2024, 2023, 2022, 2021];

function YearFilterSelectMock({
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
        onChange={(event) => onChange(Number(event.target.value))}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        {[...years].sort((a, b) => b - a).map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionTabRowMock({
  active,
  onChange,
  showUpload = false,
}: {
  active: Section;
  onChange: (section: Section) => void;
  showUpload?: boolean;
}) {
  const tabs: { id: Section; label: string; icon: typeof Database }[] = [
    { id: "data", label: "대학별DB", icon: Database },
    { id: "charts", label: "통계분석", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1"
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
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-colors ${
                isActive
                  ? `${FDB_TYPO.sectionTab} bg-surface text-indigo-700 shadow-sm ring-1 ring-border/60`
                  : `${FDB_TYPO.sectionTabInactive} hover:text-foreground`
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-indigo-700" : "text-muted"
                }`}
                aria-hidden
              />
              {tab.label}
            </button>
          );
        })}
      </div>
      {showUpload ? (
        <div className="ml-auto shrink-0">
          <ExcelUploadButton variant="emerald" />
        </div>
      ) : null}
    </div>
  );
}

function ViewModeToggleMock({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {(
        [
          { id: "campus" as const, label: "캠퍼스별" },
          { id: "consolidated" as const, label: "본교통합" },
        ] as const
      ).map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            value === mode.id
              ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
              : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function FilterSelectMock({
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
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
      >
        <option value="">전체</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionTabRowSlimMock({
  active,
  onChange,
  showUpload = false,
}: {
  active: Section;
  onChange: (section: Section) => void;
  showUpload?: boolean;
}) {
  const tabs: { id: Section; label: string; icon: typeof Database }[] = [
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
      {showUpload ? (
        <div className="ml-auto shrink-0">
          <ExcelUploadButton variant="emerald" />
        </div>
      ) : null}
    </div>
  );
}

function ViewModeToggleSlimMock({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex h-[30px] items-stretch rounded-md border border-border bg-surface-2 p-0.5">
      {(
        [
          { id: "campus" as const, label: "캠퍼스별" },
          { id: "consolidated" as const, label: "본교통합" },
        ] as const
      ).map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={`rounded px-2.5 py-1 transition-colors ${
            value === mode.id
              ? `${FDB_TYPO.toolbarControl} bg-accent/15 text-accent shadow-sm`
              : `${FDB_TYPO.toolbarControl} text-muted hover:text-foreground`
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function SlimToolbarPreview() {
  const [section, setSection] = useState<Section>("data");
  const [displayYear, setDisplayYear] = useState(2024);
  const [viewMode, setViewMode] = useState<ViewMode>("campus");
  const [estb, setEstb] = useState("");
  const [schoolDivision, setSchoolDivision] = useState("");

  return (
    <div className="feu-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="feu-label">제안 — 슬림 툴바 (프로덕션 미적용)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          탭 높이 = 엑셀 업로드 · 필터 패널과 탭 간격 축소 · 캠퍼스별/본교통합 = 학교명
          입력 높이(30px)
        </p>
      </div>
      <div className="space-y-6 p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-dashed border-[#dde5ee] bg-[#f8fafc] p-3">
            <p className="mb-3 text-xs font-bold text-[#5a6a7c]">현재 (프로덕션)</p>
            <div className="space-y-4 rounded-lg border border-border bg-background p-3">
              <SectionTabRowMock active="data" onChange={() => undefined} showUpload />
              <section className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                  <YearFilterSelectMock
                    label="표시 연도"
                    value={2024}
                    years={MOCK_YEARS}
                    onChange={() => undefined}
                  />
                  <ViewModeToggleMock value="campus" onChange={() => undefined} />
                  <label className="ml-auto flex shrink-0 items-center gap-2">
                    <span className={FDB_TYPO.toolbarLabel}>학교명</span>
                    <input
                      type="search"
                      placeholder="학교명 입력 후 Enter"
                      className={`w-36 rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none sm:w-44 ${FDB_TYPO.toolbarControl}`}
                      readOnly
                    />
                  </label>
                </div>
              </section>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              탭 ~50px · 탭↔필터 gap-4(16px) · ViewMode ~38px
            </p>
          </div>

          <div className="rounded-lg border border-[#b4dcc8] bg-[#effaf4]/40 p-3">
            <p className="mb-3 text-xs font-bold text-[#1a5c3a]">제안 (슬림)</p>
            <div className="space-y-1 rounded-lg border border-border bg-background p-3">
              <SectionTabRowSlimMock
                active={section}
                onChange={setSection}
                showUpload
              />
              {section === "data" ? (
                <section className="rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                    <YearFilterSelectMock
                      label="표시 연도"
                      value={displayYear}
                      years={MOCK_YEARS}
                      onChange={setDisplayYear}
                    />
                    <ViewModeToggleSlimMock
                      value={viewMode}
                      onChange={setViewMode}
                    />
                    <FilterSelectMock
                      label="설립구분"
                      value={estb}
                      options={["국립", "사립", "공립"]}
                      onChange={setEstb}
                    />
                    <FilterSelectMock
                      label="학교구분"
                      value={schoolDivision}
                      options={["대학교", "전문대학"]}
                      onChange={setSchoolDivision}
                    />
                    <span
                      className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 ${FDB_TYPO.toolbarControl} text-muted`}
                    >
                      학교종류 ▾
                    </span>
                    <span
                      className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 ${FDB_TYPO.toolbarControl} text-muted`}
                    >
                      지역 ▾
                    </span>
                    <label className="ml-auto flex shrink-0 items-center gap-2">
                      <span className={FDB_TYPO.toolbarLabel}>학교명</span>
                      <input
                        type="search"
                        placeholder="학교명 입력 후 Enter"
                        className={`h-[30px] w-36 rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                        readOnly
                      />
                    </label>
                  </div>
                </section>
              ) : (
                <section className="rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <YearFilterSelectMock
                      label="표시 연도"
                      value={displayYear}
                      years={MOCK_YEARS}
                      onChange={setDisplayYear}
                    />
                    <ViewModeToggleSlimMock
                      value={viewMode}
                      onChange={setViewMode}
                    />
                  </div>
                </section>
              )}
            </div>
            <p className="mt-2 text-[11px] text-[#1a5c3a]">
              탭 ~30px(엑셀 업로드와 동일) · 탭↔필터 gap-1(4px) · ViewMode 30px
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <p className="mb-3 text-xs font-bold text-[#5a6a7c]">전체 맥락 미리보기 (슬림)</p>
          <div className="space-y-4">
            <DashboardEmeraldHeader
              sectionLabel="학생충원"
              subtitle="신입생 충원 현황 분석"
              title="신입생충원율"
            />
            <div className="flex flex-col gap-1">
              <SectionTabRowSlimMock
                active={section}
                onChange={setSection}
                showUpload
              />
              {section === "data" ? (
                <>
                  <section className="rounded-xl border border-border bg-surface px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                      <YearFilterSelectMock
                        label="표시 연도"
                        value={displayYear}
                        years={MOCK_YEARS}
                        onChange={setDisplayYear}
                      />
                      <ViewModeToggleSlimMock
                        value={viewMode}
                        onChange={setViewMode}
                      />
                      <FilterSelectMock
                        label="설립구분"
                        value={estb}
                        options={["국립", "사립", "공립"]}
                        onChange={setEstb}
                      />
                      <FilterSelectMock
                        label="학교구분"
                        value={schoolDivision}
                        options={["대학교", "전문대학"]}
                        onChange={setSchoolDivision}
                      />
                      <span
                        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 ${FDB_TYPO.toolbarControl} text-muted`}
                      >
                        학교종류 ▾
                      </span>
                      <span
                        className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 ${FDB_TYPO.toolbarControl} text-muted`}
                      >
                        지역 ▾
                      </span>
                      <label className="ml-auto flex shrink-0 items-center gap-2">
                        <span className={FDB_TYPO.toolbarLabel}>학교명</span>
                        <input
                          type="search"
                          placeholder="학교명 입력 후 Enter"
                          className={`h-[30px] w-36 rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                          readOnly
                        />
                      </label>
                    </div>
                  </section>
                  <section className="rounded-xl border border-border bg-surface p-5">
                    <div className="feu-placeholder feu-table-placeholder !min-h-[120px] !py-8">
                      대학별DB 테이블 영역
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section className="rounded-xl border border-border bg-surface px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <YearFilterSelectMock
                        label="표시 연도"
                        value={displayYear}
                        years={MOCK_YEARS}
                        onChange={setDisplayYear}
                      />
                      <ViewModeToggleSlimMock
                        value={viewMode}
                        onChange={setViewMode}
                      />
                    </div>
                  </section>
                  <section className="rounded-xl border border-border bg-surface p-5">
                    <div className="feu-placeholder feu-chart-placeholder !min-h-[120px] !py-8">
                      통계분석 차트 영역
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentLayoutPreview() {
  return (
    <div className="feu-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="feu-label before">현재 앱 (프로덕션)</span>
      </div>
      <div className="space-y-4 p-4">
        <header className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[26px] font-extrabold text-[#1a5c3a]">
              신입생 충원 현황
            </h1>
            <span className="rounded-md border border-dashed border-accent-cyan/40 bg-surface-2 px-4 py-2 text-sm text-accent-cyan">
              엑셀업로드
            </span>
          </div>
        </header>
        <SectionTabRowMock active="data" onChange={() => undefined} />
        <section className="rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className={FDB_TYPO.panelTitle}>대학별DB</h3>
              <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>312개 대학 · 캠퍼스별 DB</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={FDB_TYPO.toolbarLabel}>표시 연도</span>
              {[2024, 2023].map((year) => (
                <span
                  key={year}
                  className={`rounded-md border px-2.5 py-1 ${FDB_TYPO.toolbarControl} ${
                    year === 2024
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface-2 text-muted"
                  }`}
                >
                  {year}년
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProposedLayoutPreview() {
  const [section, setSection] = useState<Section>("data");
  const [displayYear, setDisplayYear] = useState(2024);
  const [viewMode, setViewMode] = useState<ViewMode>("campus");
  const [estb, setEstb] = useState("");
  const [schoolDivision, setSchoolDivision] = useState("");

  return (
    <div className="feu-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="feu-label">제안 — 학교개황 패턴 (KPI 없음)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          에메랄드 헤더 · 통계분석/대학별DB 탭 우측 엑셀 업로드 · 표시 연도 콤보박스
        </p>
      </div>
      <div className="space-y-4 p-4">
        <DashboardEmeraldHeader
          sectionLabel="학생충원"
          subtitle="신입생 충원 현황 분석"
          title="신입생충원율"
        />

        <SectionTabRowMock
          active={section}
          onChange={setSection}
          showUpload
        />

        {section === "charts" ? (
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <YearFilterSelectMock
                  label="표시 연도"
                  value={displayYear}
                  years={MOCK_YEARS}
                  onChange={setDisplayYear}
                />
                <ViewModeToggleMock value={viewMode} onChange={setViewMode} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="feu-placeholder feu-chart-placeholder">
                통계분석 차트 영역 (목업) — {displayYear}년 ·{" "}
                {viewMode === "campus" ? "캠퍼스별" : "본교통합"}
                <p className="mt-2 text-xs text-muted">
                  글로벌 필터·차트 KPI·도움말 등 기존 통계분석 콘텐츠는 이 영역에
                  유지됩니다.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                <YearFilterSelectMock
                  label="표시 연도"
                  value={displayYear}
                  years={MOCK_YEARS}
                  onChange={setDisplayYear}
                />
                <ViewModeToggleMock value={viewMode} onChange={setViewMode} />
                <FilterSelectMock
                  label="설립구분"
                  value={estb}
                  options={["국립", "사립", "공립"]}
                  onChange={setEstb}
                />
                <FilterSelectMock
                  label="학교구분"
                  value={schoolDivision}
                  options={["대학교", "전문대학"]}
                  onChange={setSchoolDivision}
                />
                <span
                  className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 ${FDB_TYPO.toolbarControl} text-muted`}
                >
                  학교종류 ▾
                </span>
                <span
                  className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 ${FDB_TYPO.toolbarControl} text-muted`}
                >
                  지역 ▾
                </span>
                <label className="ml-auto flex shrink-0 items-center gap-2">
                  <span className={FDB_TYPO.toolbarLabel}>학교명</span>
                  <input
                    type="search"
                    placeholder="학교명 입력 후 Enter"
                    className={`w-36 rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                    readOnly
                  />
                </label>
              </div>
              {viewMode === "consolidated" ? (
                <p className={`mt-2 border-t border-border/40 pt-2 ${FDB_TYPO.legend}`}>
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  본교통합 DB 생성됨 ·{" "}
                  <span className="text-accent-orange">○</span> 미생성 연도 안내는
                  유지
                </p>
              ) : null}
            </section>
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="feu-placeholder feu-table-placeholder">
                대학별DB 테이블 영역 (목업) — {displayYear}년 ·{" "}
                {viewMode === "campus" ? "캠퍼스별" : "본교통합"}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export function FreshmanEnrollmentUiMock() {
  return (
    <div className="feu-root p-6 antialiased">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-emerald-900">
              슬림 툴바 — 프로덕션 적용 완료
            </p>
            <Link
              href="/analysis/finance-analysis?tab=freshman-enrollment-rate&section=data"
              className="font-bold text-emerald-700 hover:text-emerald-900"
            >
              현재 프로덕션 보기 →
            </Link>
          </div>
        </div>

        <header className="feu-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-[#1a2433]">
            신입생충원율 — UI 패턴 목업
          </h1>
          <p className="mt-1 text-sm text-[#5a6a7c]">
            슬림 탭·간격·ViewMode 높이 시안과, 기존 학교개황 패턴 적용 상태를
            비교합니다.
          </p>
        </header>

        <SlimToolbarPreview />

        <section className="feu-panel space-y-3 px-5 py-4 text-sm text-[#5a6a7c]">
          <h2 className="text-sm font-bold text-[#1a5c3a]">슬림 툴바 변경 요약</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-[#1a2433]">SectionTabRow</strong> —{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">h-[30px]</code>{" "}
              · text-sm · 아이콘 14px · 패딩 축소 → 엑셀 업로드 버튼과 동일 높이
            </li>
            <li>
              <strong className="text-[#1a2433]">탭 ↔ 필터 간격</strong> —{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">gap-4</code> →{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">gap-1</code>{" "}
              (필터 패널 상단에 밀착)
            </li>
            <li>
              <strong className="text-[#1a2433]">ViewModeToggle</strong> —{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">py-1.5</code> →{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">py-1</code>{" "}
              · 컨테이너 <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">h-[30px]</code>{" "}
              → 학교명 검색 입력과 동일
            </li>
          </ul>
        </section>

        <details className="feu-panel group">
          <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-[#5a6a7c] hover:text-[#1a2433]">
            이전 패턴 목업 (접기/펼치기)
          </summary>
          <div className="space-y-6 border-t border-[#e8edf3] p-4">
            <CurrentLayoutPreview />
            <ProposedLayoutPreview />
          </div>
        </details>

        <section className="feu-panel space-y-3 px-5 py-4 text-sm text-[#5a6a7c]">
          <h2 className="text-sm font-bold text-[#1a5c3a]">기존 패턴 변경 요약</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-[#1a2433]">헤더</strong> —{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">
                DashboardEmeraldHeader
              </code>
              , 배지 &lsquo;학생충원&rsquo;, 제목 &lsquo;신입생충원율&rsquo;
            </li>
            <li>
              <strong className="text-[#1a2433]">KPI</strong> — 없음 (학교개황과
              차별)
            </li>
            <li>
              <strong className="text-[#1a2433]">탭</strong> — 대학별DB / 통계분석 (아이콘 + 인디고 활성 스타일)
            </li>
            <li>
              <strong className="text-[#1a2433]">엑셀 업로드</strong> — 통계분석 /
              대학별DB 탭 행 우측 끝
            </li>
            <li>
              <strong className="text-[#1a2433]">표시 연도</strong> — 버튼 →
              콤보박스, 두 탭 모두 툴바에서 선택
            </li>
            <li>
              <strong className="text-[#1a2433]">대학별DB</strong> — &lsquo;대학별DB&rsquo;
              제목·건수 삭제, 필터·검색 한 줄
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
