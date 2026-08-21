"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { BarChart3, MapPin } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardPageTitle } from "@/components/analysis/DashboardPageTitle";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import {
  EXTINCTION_RISK_GRADE_COLORS,
  EXTINCTION_RISK_GRADE_LEGEND,
  getExtinctionRiskGradeStyle,
} from "@/lib/analysis/regional-decline-grade";

import "./regional-decline-ui-mock.css";

type Section = "sido-data" | "dashboard";

const ALL_YEARS = [2024, 2023, 2022, 2021, 2020];

type MockCell = { index: number; grade: number } | null;

const MOCK_ROWS: { region: string; byYear: Record<number, MockCell> }[] = [
  {
    region: "전국",
    byYear: {
      2024: { index: 68.42, grade: 2 },
      2023: { index: 69.15, grade: 2 },
      2022: { index: 70.01, grade: 2 },
      2021: { index: 71.33, grade: 2 },
      2020: { index: 72.88, grade: 2 },
    },
  },
  {
    region: "서울",
    byYear: {
      2024: { index: 142.56, grade: 0 },
      2023: { index: 141.02, grade: 0 },
      2022: { index: 139.88, grade: 0 },
      2021: { index: 138.44, grade: 0 },
      2020: { index: 137.21, grade: 0 },
    },
  },
  {
    region: "부산",
    byYear: {
      2024: { index: 54.12, grade: 3 },
      2023: { index: 53.88, grade: 3 },
      2022: { index: 52.76, grade: 3 },
      2021: { index: 51.44, grade: 3 },
      2020: { index: 50.02, grade: 3 },
    },
  },
  {
    region: "대구",
    byYear: {
      2024: { index: 38.24, grade: 4 },
      2023: { index: 37.91, grade: 4 },
      2022: { index: 36.55, grade: 4 },
      2021: { index: 35.12, grade: 4 },
      2020: { index: 33.88, grade: 4 },
    },
  },
  {
    region: "경북",
    byYear: {
      2024: { index: 22.15, grade: 5 },
      2023: { index: 21.88, grade: 5 },
      2022: { index: 21.02, grade: 5 },
      2021: { index: 20.44, grade: 5 },
      2020: { index: 19.76, grade: 5 },
    },
  },
  {
    region: "전남",
    byYear: {
      2024: { index: 18.42, grade: 5 },
      2023: { index: 18.01, grade: 5 },
      2022: { index: 17.55, grade: 5 },
      2021: { index: 16.88, grade: 5 },
      2020: { index: 16.12, grade: 5 },
    },
  },
];

function GradeBadge({ grade }: { grade: number }) {
  const style = getExtinctionRiskGradeStyle(grade);
  return (
    <span
      className="inline-flex min-w-[1.75rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

function IndexCell({ cell }: { cell: MockCell }) {
  if (!cell) return <span className="text-muted">—</span>;
  const style = getExtinctionRiskGradeStyle(cell.grade);
  return (
    <span className="font-mono text-sm font-semibold" style={{ color: style.bg }}>
      {cell.index.toFixed(2)}
    </span>
  );
}

function GradeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`${FDB_TYPO.legend} font-medium text-muted`}>소멸위험등급</span>
      {EXTINCTION_RISK_GRADE_LEGEND.map((grade) => {
        const style = EXTINCTION_RISK_GRADE_COLORS[grade];
        return (
          <span
            key={grade}
            className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded px-1.5 text-xs font-bold"
            style={{ backgroundColor: style.bg, color: style.text }}
          >
            {grade}
          </span>
        );
      })}
    </div>
  );
}

function CurrentSectionTabBar({
  active,
  onChange,
}: {
  active: Section;
  onChange: (section: Section) => void;
}) {
  const tabs: { id: Section; label: string }[] = [
    { id: "dashboard", label: "지역소멸대시보드" },
    { id: "sido-data", label: "시도별자료" },
  ];

  return (
    <div
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-4 py-2 transition-colors ${
            active === tab.id
              ? `${FDB_TYPO.sectionTab} bg-surface text-foreground shadow-sm ring-1 ring-border`
              : `${FDB_TYPO.sectionTabInactive} hover:text-foreground`
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ProposedSectionTabRow({
  active,
  onChange,
  showUpload = false,
}: {
  active: Section;
  onChange: (section: Section) => void;
  showUpload?: boolean;
}) {
  const tabs: { id: Section; label: string; icon: typeof MapPin }[] = [
    { id: "sido-data", label: "시도별자료", icon: MapPin },
    { id: "dashboard", label: "지역소멸대시보드", icon: BarChart3 },
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

function YearToggleButtons({
  years,
  selected,
  onToggle,
  slim = false,
}: {
  years: number[];
  selected: number[];
  onToggle: (year: number) => void;
  slim?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={FDB_TYPO.toolbarLabel}>표시 연도</span>
      {years.map((year) => {
        const isActive = selected.includes(year);
        return (
          <button
            key={year}
            type="button"
            onClick={() => onToggle(year)}
            className={`rounded-md border transition-colors ${FDB_TYPO.toolbarControl} ${
              slim ? "h-[30px] px-2.5 py-1" : "px-2.5 py-1"
            } ${
              isActive
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {year}년
          </button>
        );
      })}
    </div>
  );
}

function SidoTable({
  displayYears,
  compact = false,
}: {
  displayYears: number[];
  compact?: boolean;
}) {
  const cell = compact ? FDB_TABLE.cell : "px-3 py-2.5";
  const cellSticky = compact ? FDB_TABLE.cellSticky : "px-4 py-2.5";
  const headGroup = compact ? FDB_TABLE.headGroup : "px-3 py-2";
  const headSub = compact ? FDB_TABLE.headSub : "px-3 py-2";
  const headRowSpan = compact
    ? `${FDB_TABLE_HEAD.rowSpan} sticky left-0 z-10 min-w-[88px] bg-surface-2 text-left`
    : "text-table-head sticky left-0 z-10 min-w-[88px] border-r border-border/50 bg-surface-2 px-4 py-3 text-left align-middle";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className={compact ? "bg-surface-2 text-xs" : "border-b border-border bg-surface-2 text-xs"}>
            <th rowSpan={2} className={headRowSpan}>
              구분
            </th>
            {displayYears.map((year) => (
              <th
                key={year}
                colSpan={2}
                className={`${FDB_TABLE_HEAD.base} text-center ${headGroup} ${
                  year !== displayYears[displayYears.length - 1]
                    ? "border-r border-border/50"
                    : ""
                }`}
              >
                {year}년
              </th>
            ))}
          </tr>
          <tr className="border-b border-border bg-surface-2 text-xs">
            {displayYears.map((year) => (
              <Fragment key={year}>
                <th className={`${FDB_TABLE_HEAD.base} min-w-[72px] text-center ${headSub}`}>
                  지수
                </th>
                <th
                  className={`${FDB_TABLE_HEAD.base} min-w-[56px] text-center ${headSub} ${
                    year !== displayYears[displayYears.length - 1]
                      ? "border-r border-border/50"
                      : ""
                  }`}
                >
                  등급
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_ROWS.map((row) => (
            <tr key={row.region} className="border-b border-border/50 hover:bg-accent/5">
              <td
                className={`sticky left-0 z-10 border-r border-border/50 bg-surface ${cellSticky} ${
                  compact ? FDB_TABLE_COLOR.schoolName : "font-medium"
                }`}
              >
                {row.region}
              </td>
              {displayYears.map((year) => {
                const cellData = row.byYear[year] ?? null;
                const isLastYear = year === displayYears[displayYears.length - 1];
                return (
                  <Fragment key={`${row.region}-${year}`}>
                    <td className={`${cell} text-center align-middle`}>
                      <IndexCell cell={cellData} />
                    </td>
                    <td
                      className={`${cell} text-center align-middle ${
                        !isLastYear ? "border-r border-border/40" : ""
                      }`}
                    >
                      {cellData ? <GradeBadge grade={cellData.grade} /> : <span className="text-muted">—</span>}
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useDisplayYears(defaultYears: number[]) {
  const [displayYears, setDisplayYears] = useState(defaultYears);

  function toggleYear(year: number) {
    setDisplayYears((prev) => {
      if (prev.includes(year)) {
        const next = prev.filter((y) => y !== year);
        return next.length > 0 ? next.sort((a, b) => a - b) : prev;
      }
      return [...prev, year].sort((a, b) => a - b);
    });
  }

  return { displayYears, toggleYear };
}

function CurrentLayoutPreview() {
  const { displayYears, toggleYear } = useDisplayYears([2024, 2023, 2022]);
  const [section, setSection] = useState<Section>("dashboard");

  return (
    <div className="rdu-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="rdu-label before">현재 앱 (프로덕션)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          <Link
            href="/analysis/finance-analysis?tab=regional-decline"
            className="text-accent underline-offset-2 hover:underline"
          >
            /analysis/finance-analysis?tab=regional-decline
          </Link>
        </p>
      </div>
      <div className="space-y-4 p-4">
        <header className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DashboardPageTitle className={FDB_TYPO.pageTitle}>지역소멸</DashboardPageTitle>
            <ExcelUploadButton />
          </div>
        </header>

        <CurrentSectionTabBar active={section} onChange={setSection} />

        {section === "sido-data" ? (
          <>
            <section className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className={FDB_TYPO.panelTitle}>시도별 자료</h3>
                  <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>17개 시·도 · DB 연도 25개</p>
                </div>
                <YearToggleButtons
                  years={ALL_YEARS}
                  selected={displayYears}
                  onToggle={toggleYear}
                />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-surface p-5">
              <SidoTable displayYears={displayYears} />
              <div className="mt-4 border-t border-border pt-4">
                <GradeLegend />
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="rdu-chart-placeholder">지역소멸대시보드 차트 영역</div>
          </section>
        )}
      </div>
    </div>
  );
}

function ProposedLayoutPreview() {
  const { displayYears, toggleYear } = useDisplayYears([2024, 2023, 2022]);
  const [section, setSection] = useState<Section>("sido-data");

  return (
    <div className="rdu-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="rdu-label">제안 (프로덕션 미적용)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          에메랄드 헤더 · 슬림 탭(시도별자료 → 대시보드) · 탭 우측 엑셀 · 패널 제목 제거 · 표 밀도 통일
        </p>
      </div>
      <div className="space-y-4 p-4">
        <DashboardEmeraldHeader
          sectionLabel="재정분석"
          subtitle="지방소멸위험지수 · 시·도별 현황"
          title="지역소멸"
        />

        <div className="flex flex-col gap-1">
          <ProposedSectionTabRow active={section} onChange={setSection} showUpload />

          {section === "sido-data" ? (
            <>
              <section className="rounded-xl border border-border bg-surface px-4 py-3">
                <YearToggleButtons
                  years={ALL_YEARS}
                  selected={displayYears}
                  onToggle={toggleYear}
                  slim
                />
              </section>
              <section className="rounded-xl border border-border bg-surface p-5">
                <SidoTable displayYears={displayYears} compact />
                <div className="mt-4 border-t border-border pt-4">
                  <GradeLegend />
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="rdu-chart-placeholder">
                Bar Race · 추이선 · 등급 매트릭스 · 상세표 (기존 차트 유지)
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonNotes() {
  return (
    <div className="rdu-panel p-4">
      <h2 className="text-sm font-bold text-[#1a5c3a]">변경 요약</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-[#5a6a7c]">헤더 · 탭</p>
          <ul className="mt-2 space-y-1 text-xs text-[#3d4f5f]">
            <li>DashboardPageTitle + 헤더 엑셀 → DashboardEmeraldHeader (엑셀은 탭 행 우측)</li>
            <li>탭 순서: 시도별자료 → 지역소멸대시보드 (데이터 우선, 다른 재정분석과 동일)</li>
            <li>슬림 탭 30px · MapPin / BarChart3 아이콘</li>
            <li>탭 ↔ 필터 간격 gap-1</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#5a6a7c]">시도별자료 · 표</p>
          <ul className="mt-2 space-y-1 text-xs text-[#3d4f5f]">
            <li>「시도별 자료」패널 제목·건수 제거 — 표시 연도 토글만 한 줄</li>
            <li>다중 연도 토글 유지 (단일 combobox 아님 — 컬럼이 연도별로 펼쳐짐)</li>
            <li>FDB_TABLE 밀도 · 2행 헤더 rowspan border-b-0</li>
            <li>구분(시·도)명 #1a5c3a · 등급 색상(A–E) 기존 유지</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function RegionalDeclineUiMock() {
  return (
    <div className="rdu-root px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <span className="rdu-label">목업 · 프로덕션 미적용</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1a5c3a]">
            지역소멸 UI 패턴 시안
          </h1>
          <p className="max-w-3xl text-sm text-[#5a6a7c]">
            신입생충원율 등에 적용한 학교개황 패턴을 지역소멸에 맞게 조정한 미리보기입니다.
            탭 이름·다중 연도 토글·등급 색상은 지역소멸 고유 UX를 유지합니다.
          </p>
          <p className="text-xs text-muted">
            목업 URL:{" "}
            <Link href="/mockups/regional-decline-ui" className="text-accent hover:underline">
              /mockups/regional-decline-ui
            </Link>
          </p>
        </header>

        <ComparisonNotes />

        <div className="grid gap-6 xl:grid-cols-2">
          <CurrentLayoutPreview />
          <ProposedLayoutPreview />
        </div>
      </div>
    </div>
  );
}
