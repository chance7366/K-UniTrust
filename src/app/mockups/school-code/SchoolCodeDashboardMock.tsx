"use client";

import Link from "next/link";
import { useState } from "react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardKpiCard } from "@/components/analysis/DashboardKpiCard";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

import "./school-code-mock.css";

const MOCK_YEARS = [2024, 2023, 2022];

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

function CurrentLayoutPreview() {
  return (
    <div className="scm-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="scm-label before">현재 앱 (프로덕션)</span>
      </div>
      <div className="space-y-4 p-4">
        <header className="scm-current-header">
          <h1>표준분류 학교코드</h1>
          <span className="rounded-md border border-dashed border-accent-cyan/40 bg-surface-2 px-4 py-2 text-sm text-accent-cyan">
            엑셀업로드
          </span>
        </header>
        <section className="rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className={FDB_TYPO.panelTitle}>대학별자료</h3>
              <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>478개 학교 · DB 연도 3개</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={FDB_TYPO.toolbarLabel}>표시 연도</span>
              {MOCK_YEARS.map((year) => (
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
  const [displayYear, setDisplayYear] = useState(2024);
  const [schoolKind, setSchoolKind] = useState("");
  const [estb, setEstb] = useState("");
  const [region, setRegion] = useState("");

  const hasActiveFilter = Boolean(schoolKind || estb || region);
  const filteredCount = hasActiveFilter ? 312 : 478;

  return (
    <div className="scm-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="scm-label">제안 — 학교개황 패턴 적용</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          에메랄드 헤더 · 슬림 KPI · 필터 툴바 우측 엑셀 업로드
        </p>
      </div>
      <div className="space-y-4 p-4">
        <DashboardEmeraldHeader
          sectionLabel="대학현황"
          subtitle="표준분류 학교코드 관리"
          title="학교코드"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardKpiCard
            accent="blue"
            title={`${displayYear}년 학교`}
            value="478"
            sub="해당 연도 전체"
          />
          <DashboardKpiCard
            accent="emerald"
            title="DB 연도"
            value="3"
            sub="업로드된 조사년도"
          />
          <DashboardKpiCard
            accent="amber"
            title="조회 결과"
            value={filteredCount.toLocaleString("ko-KR")}
            sub="필터 적용 후"
          />
          <DashboardKpiCard
            accent="red"
            title="학교종류"
            value="12"
            sub="분류 종류 수"
          />
        </div>

        <section className="rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <YearFilterSelectMock
              label="표시 연도"
              value={displayYear}
              years={MOCK_YEARS}
              onChange={setDisplayYear}
            />
            <FilterSelectMock
              label="학교종류"
              value={schoolKind}
              options={["대학교", "전문대학", "대학원"]}
              onChange={setSchoolKind}
            />
            <FilterSelectMock
              label="설립구분"
              value={estb}
              options={["국립", "사립", "공립"]}
              onChange={setEstb}
            />
            <FilterSelectMock
              label="지역"
              value={region}
              options={["서울", "경기", "부산"]}
              onChange={setRegion}
            />
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={() => {
                  setSchoolKind("");
                  setEstb("");
                  setRegion("");
                }}
                className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 text-muted hover:text-foreground ${FDB_TYPO.toolbarControl}`}
              >
                필터 초기화
              </button>
            ) : null}
            <div className="ml-auto shrink-0">
              <ExcelUploadButton variant="emerald" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="scm-table-placeholder">
            데이터 테이블 영역 (목업) — {displayYear}년 ·{" "}
            {filteredCount.toLocaleString("ko-KR")}건
          </div>
        </section>
      </div>
    </div>
  );
}

export function SchoolCodeDashboardMock() {
  return (
    <div className="scm-root p-6 antialiased">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-emerald-900">
              프로덕션 학교코드 페이지에 적용 완료
            </p>
            <Link
              href="/analysis/univ-map?tab=school-code"
              className="font-bold text-emerald-700 hover:text-emerald-900"
            >
              현재 앱 보기 →
            </Link>
          </div>
        </div>

        <header className="scm-panel px-6 py-5">
          <h1 className="text-xl font-extrabold text-[#1a2433]">
            학교코드 — 학교개황 UI 패턴 목업
          </h1>
          <p className="mt-1 text-sm text-[#5a6a7c]">
            헤더 · KPI · 필터 툴바(표시 연도 포함) · 엑셀 업로드 우측 배치를 학교개황과
            동일한 패턴으로 미리보기합니다.
          </p>
        </header>

        <CurrentLayoutPreview />
        <ProposedLayoutPreview />

        <section className="scm-panel space-y-3 px-5 py-4 text-sm text-[#5a6a7c]">
          <h2 className="text-sm font-bold text-[#1a5c3a]">제안 변경 요약</h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-[#1a2433]">헤더</strong> —{" "}
              <code className="rounded bg-[#f4f7fa] px-1.5 py-0.5 text-xs">
                DashboardEmeraldHeader
              </code>
              , 1행: 아이콘 · 대학현황 · 표준분류 학교코드 · 부제
            </li>
            <li>
              <strong className="text-[#1a2433]">KPI</strong> — 해당 연도 학교 수, DB
              연도, 조회 결과, 학교종류 수 (슬림 카드)
            </li>
            <li>
              <strong className="text-[#1a2433]">툴바</strong> — &lsquo;대학별자료&rsquo;
              제목·건수 삭제, 표시 연도·필터 한 줄, 엑셀 업로드 우측 끝
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
