"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import {
  MOCK_TARGET_UNIVERSITIES,
  TARGET_UNIVERSITY_UPLOAD_HEADER,
  type TargetUniversityRow,
} from "@/lib/competitiveness-analysis/config";

import "./competitiveness-settings-ui-mock.css";

type SettingsSection = "upload" | "indicators" | "guidelines" | "absolute";

const MOCK_YEARS = [2025, 2024, 2023];
const UPLOAD_COUNT = 312;
const ABSOLUTE_COUNT = 18;

const MOCK_INDICATORS = [
  { label: "신입생충원율", weight: 15, enabled: true },
  { label: "재학생충원율", weight: 15, enabled: true },
  { label: "중도탈락율", weight: 10, enabled: true },
  { label: "기금확보율", weight: 15, enabled: true },
];

function absoluteFlag(v: "" | "해당") {
  return v === "해당" ? (
    <span className="font-medium text-danger">해당</span>
  ) : (
    "—"
  );
}

function CurrentHeader() {
  return (
    <header className="rounded-xl border border-border bg-surface px-5 py-4 shadow-[var(--glow-inset)]">
      <p className={`${FDB_TYPO.legend} font-medium text-accent-cyan`}>대학경쟁력분석</p>
      <h1
        className={`mt-1 ${FDB_TYPO.pageTitle} tracking-tight text-[#1a5c3a] [text-shadow:0_1px_0_rgba(255,255,255,0.65)]`}
      >
        기본설정
      </h1>
      <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
        대상대학·적용지표·가중치·분석방법과 지침·절대지표 대학을 설정합니다. (상단 분석연도
        기준)
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
                {y}년{y === 2025 ? " · 분석결과 있음" : " · 분석결과 없음"}
              </option>
            ))}
          </select>
          <span className="text-xs font-medium text-accent-cyan">분석결과 있음</span>
        </div>
        <button type="button" className="text-xs text-accent">
          + 다른 연도 추가
        </button>
      </div>
      <p className={`mt-2 ${FDB_TYPO.legend}`}>
        {year}년 · 대상대학 {UPLOAD_COUNT.toLocaleString("ko-KR")}건 · 분석결과 있음 · 설정
        저장 2026. 3. 8. 오후 2:30:00 · 분석 2026. 3. 7.
      </p>
    </div>
  );
}

function ProposedYearToolbar({
  year,
  onChange,
}: {
  year: number;
  onChange: (year: number) => void;
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
        <span className={FDB_TYPO.legend}>
          대상대학 {UPLOAD_COUNT.toLocaleString("ko-KR")}건
        </span>
        <button type="button" className={`ml-auto ${FDB_TYPO.legend} text-accent hover:underline`}>
          + 연도 추가
        </button>
      </div>
    </section>
  );
}

function CurrentSectionTabs({
  active,
  onChange,
}: {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  const tabs: { id: SettingsSection; label: string }[] = [
    { id: "upload", label: `대상대학 업로드 (${UPLOAD_COUNT.toLocaleString("ko-KR")}건)` },
    { id: "indicators", label: "적용지표 · 적용연도 · 가중치" },
    { id: "guidelines", label: "분석방법과 지침" },
    { id: "absolute", label: `절대지표 대학 (${ABSOLUTE_COUNT.toLocaleString("ko-KR")}건)` },
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
}: {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  const tabs: {
    id: SettingsSection;
    label: string;
    icon: typeof Upload;
    count?: number;
  }[] = [
    { id: "upload", label: "대상대학 업로드", icon: Upload, count: UPLOAD_COUNT },
    { id: "indicators", label: "적용지표 · 가중치", icon: SlidersHorizontal },
    { id: "guidelines", label: "분석방법과 지침", icon: BookOpen },
    { id: "absolute", label: "절대지표 대학", icon: AlertTriangle, count: ABSOLUTE_COUNT },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
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
              {tab.count != null ? (
                <span className={`cas-tab-badge ${isActive ? "active" : ""}`}>
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TargetUniversityTable({
  rows,
  compact = false,
}: {
  rows: TargetUniversityRow[];
  compact?: boolean;
}) {
  const cell = compact ? FDB_TABLE.cell : "px-3 py-2";
  const head = compact ? FDB_TABLE.headSingle : "px-3 py-2";

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead className="bg-surface-2 text-xs">
          <tr>
            {TARGET_UNIVERSITY_UPLOAD_HEADER.map((h) => (
              <th key={h} className={`${FDB_TABLE_HEAD.base} ${head} font-medium`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.schoolCodeStd} className="border-t border-border/60">
              <td className={`${cell} font-mono text-accent-orange`}>{row.schoolCodeStd}</td>
              <td className={`${cell} ${compact ? FDB_TABLE_COLOR.schoolName : "font-medium"}`}>
                {row.schoolName}
              </td>
              <td className={cell}>{row.estb}</td>
              <td className={cell}>{row.schoolDivision}</td>
              <td className={cell}>{row.schoolKind}</td>
              <td className={cell}>{row.region}</td>
              <td className={`${cell} text-center`}>{absoluteFlag(row.crisis)}</td>
              <td className={`${cell} text-center`}>{absoluteFlag(row.noAccreditation)}</td>
              <td className={`${cell} text-center`}>{absoluteFlag(row.provisionalBoard)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UploadSectionContent({
  year,
  compact = false,
  showExcelInToolbar = false,
}: {
  year: number;
  compact?: boolean;
  showExcelInToolbar?: boolean;
}) {
  if (compact) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5">
        <p className={`${FDB_TYPO.legend} text-muted`}>
          {year}년 · 경영위기·미인증·임시이사는 &apos;해당&apos; 입력 · 자금부족은 절대지표
          대학에서 생성
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!showExcelInToolbar ? (
            <ExcelUploadButton variant="emerald" />
          ) : null}
          <span className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted">
            양식 down
          </span>
          <span className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted">
            DB down
          </span>
          <span className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted">
            DB에서 불러오기
          </span>
        </div>
        <div className="mt-4">
          <TargetUniversityTable rows={MOCK_TARGET_UNIVERSITIES} compact />
        </div>
        <p className={`mt-2 ${FDB_TYPO.legend}`}>
          화면 {UPLOAD_COUNT.toLocaleString("ko-KR")}건 · DB {UPLOAD_COUNT.toLocaleString("ko-KR")}건
          · 최근 업로드: 2026. 3. 8. 오후 2:30:00
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      <h2 className="text-base font-semibold">대상대학 업로드</h2>
      <p className="mt-1 text-sm text-muted">
        {year}년 · 학교코드 · 학교명 · … — 경영위기·미인증·임시이사는 &apos;해당&apos; 입력
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          엑셀 업로드
        </button>
        <span className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-muted">
          양식 down
        </span>
        <span className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-muted">
          DB down
        </span>
      </div>
      <div className="mt-4">
        <TargetUniversityTable rows={MOCK_TARGET_UNIVERSITIES} />
      </div>
    </section>
  );
}

function IndicatorsSectionContent({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {!compact ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">적용지표 · 적용연도 · 가중치</h2>
              <p className="mt-1 text-sm text-muted">
                재정분석지표 메뉴의 지표를 자동 반영
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-accent-2 px-4 py-2 text-sm text-white"
            >
              설정 저장
            </button>
          </div>
        </>
      ) : (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 ${FDB_TYPO.toolbarControl}`}
          >
            도움말
          </button>
          <button
            type="button"
            className={`h-[30px] rounded-md bg-accent-2 px-3 text-white ${FDB_TYPO.toolbarControl}`}
          >
            설정 저장
          </button>
        </div>
      )}
      <p className={`${compact ? "" : "mt-4 "}mb-3 text-xs text-accent`}>
        카테고리 가중치 합계: 100% · 가중치 검증 완료
      </p>
      <ul className="space-y-2">
        {MOCK_INDICATORS.map((ind) => (
          <li
            key={ind.label}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-surface-2 px-3 py-2"
          >
            <label className="flex min-w-[140px] items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={ind.enabled} readOnly />
              {ind.label}
            </label>
            <select
              className="min-w-[120px] rounded-md border border-border bg-surface px-2 py-1 text-sm"
              defaultValue="2024년"
            >
              <option>2024년</option>
              <option>2023년</option>
            </select>
            <span className={FDB_TYPO.legend}>지표 가중치</span>
            <input
              type="number"
              readOnly
              value={ind.weight}
              className="w-14 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm font-mono"
            />
            <span className={FDB_TYPO.legend}>%</span>
          </li>
        ))}
      </ul>
      {compact ? (
        <p className={`mt-3 ${FDB_TYPO.legend} text-muted`}>
          패널 제목 제거 · 저장·도움말을 슬림 툴바(30px)로 이동
        </p>
      ) : null}
    </section>
  );
}

function GuidelinesSectionContent({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {!compact ? (
        <>
          <h2 className="text-base font-semibold">분석방법과 지침</h2>
          <p className="mt-1 text-sm text-muted">
            분석방법 설정과 지침은 이 화면에서만 관리합니다.
          </p>
        </>
      ) : (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            className={`h-[30px] rounded-md bg-accent-2 px-3 text-white ${FDB_TYPO.toolbarControl}`}
          >
            설정 저장
          </button>
        </div>
      )}
      <div className={`grid gap-4 md:grid-cols-2 ${compact ? "" : "mt-4"}`}>
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <p className={`${FDB_TYPO.sectionTab} text-sm`}>1·2단계 조회 지표</p>
          <p className={`mt-2 ${FDB_TYPO.legend}`}>적용 지표만 (체크된 지표)</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <p className={`${FDB_TYPO.sectionTab} text-sm`}>2단계 전국 백분위 비교</p>
          <p className={`mt-2 ${FDB_TYPO.legend}`}>동일 학교종류끼리</p>
        </div>
      </div>
      <div className="cas-placeholder mt-4 !min-h-[100px] !py-6">
        분석 지침 미리보기 (자동 생성 텍스트)
      </div>
    </section>
  );
}

function AbsoluteSectionContent({ compact = false }: { compact?: boolean }) {
  const lists = [
    { title: "경영위기대학", count: 3 },
    { title: "기관인증평가 미인증대학", count: 5 },
    { title: "임시이사선임대학", count: 2 },
    { title: "자금부족대학", count: 8 },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {!compact ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">절대지표 대학</h2>
              <p className="mt-1 text-sm text-muted">
                경영위기·미인증·임시이사 → 업로드 &apos;해당&apos;
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-accent-orange/50 bg-accent-orange/10 px-4 py-2 text-sm text-accent-orange"
            >
              자금부족대학 생성
            </button>
          </div>
        </>
      ) : (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className={`h-[30px] rounded-md border border-accent-orange/50 bg-accent-orange/10 px-2.5 text-accent-orange ${FDB_TYPO.toolbarControl}`}
          >
            자금부족대학 생성
          </button>
          <button
            type="button"
            className={`h-[30px] rounded-md bg-accent-2 px-3 text-white ${FDB_TYPO.toolbarControl}`}
          >
            설정 저장
          </button>
        </div>
      )}
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${compact ? "" : "mt-4"}`}>
        {lists.map((list) => (
          <div key={list.title} className="rounded-lg border border-border bg-surface-2 p-4">
            <h3 className={FDB_TYPO.sectionTab}>{list.title}</h3>
            <p className={`mt-1 ${FDB_TYPO.legend}`}>{list.count}건</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionContent({
  section,
  year,
  compact = false,
}: {
  section: SettingsSection;
  year: number;
  compact?: boolean;
}) {
  switch (section) {
    case "upload":
      return <UploadSectionContent year={year} compact={compact} />;
    case "indicators":
      return <IndicatorsSectionContent compact={compact} />;
    case "guidelines":
      return <GuidelinesSectionContent compact={compact} />;
    case "absolute":
      return <AbsoluteSectionContent compact={compact} />;
  }
}

function CurrentLayoutPreview() {
  const [section, setSection] = useState<SettingsSection>("upload");
  const year = 2025;

  return (
    <div className="cas-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="cas-label before">현재 앱 (프로덕션)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          <Link
            href="/analysis/competitiveness-analysis/settings"
            className="text-accent underline-offset-2 hover:underline"
          >
            /analysis/competitiveness-analysis/settings
          </Link>
        </p>
      </div>
      <div className="space-y-4 p-4">
        <CurrentHeader />
        <CurrentYearSelector year={year} />
        <CurrentSectionTabs active={section} onChange={setSection} />
        <SectionContent section={section} year={year} />
      </div>
    </div>
  );
}

function ProposedLayoutPreview() {
  const [section, setSection] = useState<SettingsSection>("upload");
  const [year, setYear] = useState(2025);

  return (
    <div className="cas-panel overflow-hidden">
      <div className="border-b border-[#e8edf3] px-4 py-2.5">
        <span className="cas-label">제안 (프로덕션 미적용)</span>
        <p className="mt-1 text-xs text-[#5a7a6c]">
          에메랄드 헤더 · 슬림 분석연도 · 슬림 탭 · 업로드 섹션 내 emerald 엑셀 · 표 밀도
        </p>
      </div>
      <div className="space-y-4 p-4">
        <DashboardEmeraldHeader
          sectionLabel="대학경쟁력분석"
          subtitle="대상대학 · 적용지표 · 가중치 · 분석방법"
          title="기본설정"
        />

        <div className="flex flex-col gap-1">
          <ProposedYearToolbar year={year} onChange={setYear} />
          <ProposedSectionTabRow active={section} onChange={setSection} />
          <SectionContent section={section} year={year} compact />
        </div>
      </div>
    </div>
  );
}

function ComparisonNotes() {
  return (
    <div className="cas-panel p-4">
      <h2 className="text-sm font-bold text-[#1a5c3a]">변경 요약</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-[#5a6a7c]">헤더 · 분석연도</p>
          <ul className="mt-2 space-y-1 text-xs text-[#3d4f5f]">
            <li>CompetitivenessShell 헤더 → DashboardEmeraldHeader</li>
            <li>분석연도: 설명·메타 축소, 한 줄 슬림 툴바 (30px combobox)</li>
            <li>「+ 다른 연도 추가」는 우측 링크 유지</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#5a6a7c]">섹션 탭 · 콘텐츠</p>
          <ul className="mt-2 space-y-1 text-xs text-[#3d4f5f]">
            <li>슬림 탭 30px · Upload / Sliders / Book / AlertTriangle 아이콘</li>
            <li>건수는 탭 라벨 괄호 → 작은 badge (312, 18)</li>
            <li>대상대학 탭: 엑셀 업로드는 기존 위치(버튼 행) · emerald 디자인만 적용</li>
            <li>섹션 카드 h2 제거 또는 축소 · 저장 버튼 30px · FDB_TABLE 표</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function CompetitivenessSettingsUiMock() {
  return (
    <div className="cas-root px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <span className="cas-label">목업 · 프로덕션 미적용</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1a5c3a]">
            대학경쟁력분석 기본설정 UI 패턴 시안
          </h1>
          <p className="max-w-3xl text-sm text-[#5a6a7c]">
            재정분석·지역소멸 등에 적용한 학교개황 패턴을 경쟁력 기본설정에 맞게 조정한
            미리보기입니다. 4개 섹션 탭·분석연도·설정 저장 UX는 유지합니다.
          </p>
          <p className="text-xs text-muted">
            목업 URL:{" "}
            <Link
              href="/mockups/competitiveness-analysis/settings"
              className="text-accent hover:underline"
            >
              /mockups/competitiveness-analysis/settings
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
