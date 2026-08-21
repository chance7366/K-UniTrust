"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Database,
  Layers3,
  TrendingUp,
} from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";

import "./competitiveness-run-ui-mock.css";

type RunViewTab = "step1" | "step2" | "step3" | "analytics";
type SchoolKindFilter = "university" | "junior-college";

const MOCK_YEARS = [2025, 2024, 2023];
const UNIV_COUNT = 248;
const COLLEGE_COUNT = 64;

const MOCK_INDICATORS = [
  { id: "freshman", label: "신입생충원율", year: "2024년" },
  { id: "enrolled", label: "재학생충원율", year: "2024년" },
  { id: "dropout", label: "중도탈락율", year: "2024년" },
  { id: "fund", label: "기금확보율", year: "2023년" },
];

const MOCK_ROWS = [
  {
    no: 1,
    code: "0000100",
    name: "경북대학교",
    estb: "국·공립",
    region: "대구",
    values: [98.2, 96.4, 4.1, 185.3],
  },
  {
    no: 2,
    code: "0000046",
    name: "가톨릭대학교",
    estb: "사립",
    region: "경기",
    values: [102.1, 94.8, 3.8, 142.6],
  },
  {
    no: 3,
    code: "0002748",
    name: "가야대학교(김해)",
    estb: "사립",
    region: "경남",
    values: [88.5, 91.2, 6.2, 98.4],
  },
];

function CurrentRunHeader() {
  return (
    <header className="rounded-xl border border-border bg-surface px-5 py-4 shadow-[var(--glow-inset)]">
      <p className={`${FDB_TYPO.legend} font-medium text-accent-cyan`}>대학경쟁력분석</p>
      <h1
        className={`mt-1 ${FDB_TYPO.pageTitle} tracking-tight text-[#1a5c3a] [text-shadow:0_1px_0_rgba(255,255,255,0.65)]`}
      >
        분석실행
      </h1>
      <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
        1~3단계 분석을 실행합니다. 결과는 상단 분석연도 DB에 저장됩니다.
      </p>
    </header>
  );
}

function CurrentYearSelector({ year }: { year: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
      <p className={FDB_TYPO.legend}>
        아래 연도는{" "}
        <strong className="font-medium text-foreground">
          기본설정·분석실행·추세분석·대학별경쟁력
        </strong>
        에 공통 적용됩니다.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">분석연도</span>
          <select
            value={year}
            disabled
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-accent"
          >
            {MOCK_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}년 · 분석결과 있음
              </option>
            ))}
          </select>
          <span className="text-xs font-medium text-accent-cyan">분석결과 있음</span>
        </div>
      </div>
      <p className={`mt-2 ${FDB_TYPO.legend}`}>
        {year}년 · 대상대학 312건 · 분석결과 있음 · 분석 2026. 3. 7.
      </p>
    </div>
  );
}

function CurrentRunStatusBanner({ year }: { year: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>
          <span className="text-muted">분석연도 </span>
          <span className="font-semibold text-accent">{year}년</span>
        </span>
        <span className="font-medium text-accent-cyan">분석결과 있음</span>
      </div>
    </div>
  );
}

function ProposedYearToolbar({
  year,
  onChange,
  settingsStale = false,
}: {
  year: number;
  onChange: (year: number) => void;
  settingsStale?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <label className={FDB_TYPO.toolbarLabel}>분석연도</label>
          <select
            value={year}
            onChange={(event) => onChange(Number(event.target.value))}
            className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
          >
            {MOCK_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
        <span className={`rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 ${FDB_TYPO.legend} text-accent`}>
          분석결과 있음
        </span>
        <span className={FDB_TYPO.legend}>대상대학 312건</span>
        <button type="button" className={`ml-auto ${FDB_TYPO.legend} text-accent hover:underline`}>
          + 연도 추가
        </button>
      </div>
      {settingsStale ? (
        <p className="mt-2 text-xs font-medium text-accent-orange">
          기본설정 값이 변경되었습니다. 다시 분석실행하시기 바랍니다.
        </p>
      ) : null}
    </section>
  );
}

function CurrentRunViewTabs({
  active,
  onChange,
}: {
  active: RunViewTab;
  onChange: (tab: RunViewTab) => void;
}) {
  const tabs: { id: RunViewTab; label: string }[] = [
    { id: "step1", label: "1단계 · 원지표값" },
    { id: "step2", label: "2단계 · 지수·순위" },
    { id: "step3", label: "3단계 · 종합지수" },
    { id: "analytics", label: "통계분석" },
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

function ProposedRunViewTabRow({
  active,
  onChange,
}: {
  active: RunViewTab;
  onChange: (tab: RunViewTab) => void;
}) {
  const tabs: {
    id: RunViewTab;
    label: string;
    icon: typeof Database;
  }[] = [
    { id: "step1", label: "1단계 · 원지표값", icon: Database },
    { id: "step2", label: "2단계 · 지수·순위", icon: TrendingUp },
    { id: "step3", label: "3단계 · 종합지수", icon: Layers3 },
    { id: "analytics", label: "통계분석", icon: BarChart3 },
  ];

  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
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
  );
}

function CurrentSchoolKindTabs({
  active,
  onChange,
}: {
  active: SchoolKindFilter;
  onChange: (filter: SchoolKindFilter) => void;
}) {
  const tabs = [
    { id: "university" as const, label: `대학 (${UNIV_COUNT}건)` },
    { id: "junior-college" as const, label: `전문대학 (${COLLEGE_COUNT}건)` },
  ];

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
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

function ProposedSchoolKindTabRow({
  active,
  onChange,
}: {
  active: SchoolKindFilter;
  onChange: (filter: SchoolKindFilter) => void;
}) {
  const tabs = [
    { id: "university" as const, label: "대학", count: UNIV_COUNT },
    { id: "junior-college" as const, label: "전문대학", count: COLLEGE_COUNT },
  ];

  return (
    <div className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "font-medium text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`car-tab-badge ${isActive ? "active" : ""}`}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Step1ResultsTable({ compact = false }: { compact?: boolean }) {
  const cell = compact ? FDB_TABLE.cell : "px-2 py-2";
  const head = compact ? FDB_TABLE.headSingle : "px-2 py-2";

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className={`w-full min-w-[900px] border-collapse text-sm ${FDB_TYPO.tableBody}`}>
        <thead className={`bg-surface-2 ${FDB_TYPO.legend}`}>
          <tr>
            <th className={`${FDB_TABLE_HEAD.base} sticky left-0 z-10 bg-surface-2 ${head}`}>No</th>
            <th className={`${FDB_TABLE_HEAD.base} sticky left-8 z-10 bg-surface-2 ${head}`}>학교코드</th>
            <th className={`${FDB_TABLE_HEAD.base} sticky left-24 z-10 min-w-[120px] bg-surface-2 ${head}`}>
              학교명
            </th>
            <th className={`${FDB_TABLE_HEAD.base} ${head}`}>설립</th>
            <th className={`${FDB_TABLE_HEAD.base} ${head}`}>지역</th>
            {MOCK_INDICATORS.map((ind) => (
              <th key={ind.id} className={`${FDB_TABLE_HEAD.base} min-w-[80px] text-right ${head}`}>
                <div>{ind.label}</div>
                <div className="mt-0.5 font-normal text-[10px] text-muted">{ind.year}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_ROWS.map((row) => (
            <tr key={row.code} className="border-t border-border/60">
              <td className={`${cell} sticky left-0 z-10 bg-surface`}>{row.no}</td>
              <td className={`${cell} sticky left-8 z-10 bg-surface font-mono text-accent-orange`}>
                {row.code}
              </td>
              <td
                className={`${cell} sticky left-24 z-10 bg-surface ${
                  compact ? FDB_TABLE_COLOR.schoolName : "font-medium"
                }`}
              >
                {row.name}
              </td>
              <td className={cell}>{row.estb}</td>
              <td className={cell}>{row.region}</td>
              {row.values.map((value, index) => (
                <td key={index} className={`${cell} text-right font-mono`}>
                  {value.toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepPanelContent({
  view,
  schoolKind,
  onSchoolKindChange,
  compact = false,
}: {
  view: RunViewTab;
  schoolKind: SchoolKindFilter;
  onSchoolKindChange: (filter: SchoolKindFilter) => void;
  compact?: boolean;
}) {
  if (view === "analytics") {
    return (
      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
        {!compact ? (
          <>
            <h2 className={FDB_TYPO.panelTitle}>통계분석 · 1·2·3단계 통합 대시보드</h2>
            <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
              3단계 실행 결과를 권역·등급·부문별로 입체 분석합니다.
            </p>
          </>
        ) : null}
        <div className={`car-chart-placeholder ${compact ? "mt-0" : "mt-6"}`}>
          등급 분포 · 권역별 평균 · 레이더 · 산점도 차트 (기존 RunAnalyticsDashboard 유지)
        </div>
      </section>
    );
  }

  const stepMeta: Record<
    Exclude<RunViewTab, "analytics">,
    { title: string; desc: string; runLabel: string }
  > = {
    step1: {
      title: "1단계 · 원지표값",
      desc: "대상대학별 지표 원값을 재정분석 DB(본교통합)에서 조회합니다.",
      runLabel: "1단계 실행",
    },
    step2: {
      title: "2단계 · 지수·순위",
      desc: "1단계 원지표값을 전국 동종 분포 대비 백분위(0~100)로 표준화합니다.",
      runLabel: "2단계 실행",
    },
    step3: {
      title: "3단계 · 종합지수",
      desc: "2단계 지수에 카테고리·지표 가중치를 반영해 종합지수·순위를 산출합니다.",
      runLabel: "3단계 실행",
    },
  };

  const meta = stepMeta[view];

  if (compact) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`${FDB_TYPO.legend} text-muted`}>{meta.desc}</p>
          <button
            type="button"
            className={`h-[30px] shrink-0 rounded-md bg-accent px-3 font-semibold text-white ${FDB_TYPO.toolbarControl}`}
          >
            {meta.runLabel}
          </button>
        </div>
        <div className="mt-3 space-y-3">
          <ProposedSchoolKindTabRow active={schoolKind} onChange={onSchoolKindChange} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={FDB_TYPO.legend}>
              {schoolKind === "university" ? "대학" : "전문대학"}{" "}
              {(schoolKind === "university" ? UNIV_COUNT : COLLEGE_COUNT).toLocaleString("ko-KR")}건
            </p>
            <div className="flex gap-2">
              <span className={`inline-flex h-[30px] items-center rounded-md border border-border bg-surface-2 px-2.5 ${FDB_TYPO.toolbarControl} text-muted`}>
                엑셀 down
              </span>
              <span className={`inline-flex h-[30px] items-center rounded-md border border-border bg-surface-2 px-2.5 ${FDB_TYPO.toolbarControl} text-muted`}>
                CSV down
              </span>
            </div>
          </div>
          <Step1ResultsTable compact />
          <p className={`${FDB_TYPO.legend} text-muted`}>
            1단계 마지막 실행: 2026. 3. 7. 오후 3:12:00
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={FDB_TYPO.panelTitle}>{meta.title}</h2>
          <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>{meta.desc}</p>
          <p className={`mt-1 ${FDB_TYPO.legend} text-accent-cyan`}>
            {view === "step1" ? "1" : view === "step2" ? "2" : "3"}단계 마지막 실행: 2026. 3. 7.
          </p>
        </div>
        <button
          type="button"
          className={`rounded-lg bg-accent px-5 py-2.5 font-semibold text-white ${FDB_TYPO.toolbarControl}`}
        >
          {meta.runLabel}
        </button>
      </div>
      <div className="mt-6 space-y-4">
        <CurrentSchoolKindTabs active={schoolKind} onChange={onSchoolKindChange} />
        <p className={FDB_TYPO.legend}>
          {schoolKind === "university" ? "대학" : "전문대학"}{" "}
          {(schoolKind === "university" ? UNIV_COUNT : COLLEGE_COUNT).toLocaleString("ko-KR")}건 ·
          적용연도는 기본설정 값 기준
        </p>
        <Step1ResultsTable />
      </div>
    </section>
  );
}

function CurrentLayoutPreview() {
  const [view, setView] = useState<RunViewTab>("step1");
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const year = 2025;

  return (
    <div className="car-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="car-label before">현재 앱 (프로덕션)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          <Link
            href="/analysis/competitiveness-analysis/run"
            className="text-accent underline-offset-2 hover:underline"
          >
            /analysis/competitiveness-analysis/run
          </Link>
        </p>
      </div>
      <div className="space-y-4 p-4">
        <CurrentRunHeader />
        <CurrentYearSelector year={year} />
        <CurrentRunStatusBanner year={year} />
        <CurrentRunViewTabs active={view} onChange={setView} />
        <StepPanelContent
          view={view}
          schoolKind={schoolKind}
          onSchoolKindChange={setSchoolKind}
        />
      </div>
    </div>
  );
}

function ProposedLayoutPreview() {
  const [view, setView] = useState<RunViewTab>("step1");
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [year, setYear] = useState(2025);

  return (
    <div className="car-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="car-label">제안 (프로덕션 미적용)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          에메랄드 헤더 · 슬림 분석연도 · RunStatusBanner 통합 · 슬림 단계 탭 · 표 밀도
        </p>
      </div>
      <div className="space-y-4 p-4">
        <DashboardEmeraldHeader
          sectionLabel="대학경쟁력분석"
          subtitle="1~3단계 분석 · 결과는 분석연도 DB에 저장"
          title="분석실행"
        />

        <div className="flex flex-col gap-1">
          <ProposedYearToolbar year={year} onChange={setYear} />
          <ProposedRunViewTabRow active={view} onChange={setView} />
          <StepPanelContent
            view={view}
            schoolKind={schoolKind}
            onSchoolKindChange={setSchoolKind}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonNotes() {
  return (
    <div className="car-panel p-4">
      <h2 className="text-sm font-bold text-[#1a5c3a]">변경 요약</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-[#5a6a7c]">헤더 · 상태</p>
          <ul className="mt-2 space-y-1 text-xs text-[#3d4f5f]">
            <li>CompetitivenessShell 헤더 → DashboardEmeraldHeader</li>
            <li>분석연도 슬림 툴바 (기본설정과 동일 패턴)</li>
            <li>RunStatusBanner 별도 박스 제거 → 연도 툴바에 상태·경고 통합</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#5a6a7c]">단계 탭 · 결과</p>
          <ul className="mt-2 space-y-1 text-xs text-[#3d4f5f]">
            <li>슬림 탭 30px · Database / TrendingUp / Layers3 / BarChart3</li>
            <li>단계 패널 h2 제거 · N단계 실행 버튼 30px</li>
            <li>대학/전문대학 탭 슬림 + badge · FDB_TABLE 표 밀도</li>
            <li>통계분석 탭: 기존 RunAnalyticsDashboard 차트 유지</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function CompetitivenessRunUiMock() {
  return (
    <div className="car-root px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <span className="car-label">목업 · 프로덕션 미적용</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1a5c3a]">
            대학경쟁력분석 분석실행 UI 패턴 시안
          </h1>
          <p className="max-w-3xl text-sm text-[#5a6a7c]">
            기본설정 목업과 동일한 학교개황 패턴을 분석실행(1~3단계·통계분석)에 맞게 조정한
            미리보기입니다. 단계별 실행·학교종류 필터·내보내기 UX는 유지합니다.
          </p>
          <p className="text-xs text-muted">
            목업 URL:{" "}
            <Link href="/mockups/competitiveness-analysis/run" className="text-accent hover:underline">
              /mockups/competitiveness-analysis/run
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
