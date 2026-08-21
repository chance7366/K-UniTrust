"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  SlidersHorizontal,
} from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardKpiCard } from "@/components/analysis/DashboardKpiCard";
import { GlassHelpButton } from "@/components/analysis/GlassHelpButton";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { CompetitivenessTargetUnivDataTable } from "@/components/analysis/competitiveness-analysis/CompetitivenessTargetUnivDataTable";
import {
  COMPETITIVENESS_TARGET_UNIV_HELP,
  COMPETITIVENESS_TARGET_UNIV_HELP_SUB,
  COMPETITIVENESS_TARGET_UNIV_HELP_TITLE,
} from "@/lib/analysis/competitiveness-target-univ-mock-help";
import {
  COMPETITIVENESS_TARGET_COHORT_LABEL,
  buildCompetitivenessTargetUnivHref,
  buildCompetitivenessTargetUnivMockHref,
  type CompetitivenessSettingsTab,
  type CompetitivenessTargetCohort,
  type CompetitivenessTargetUnivData,
} from "@/lib/analysis/competitiveness-target-univ-mock-view";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";

const COHORTS: CompetitivenessTargetCohort[] = [
  "university",
  "junior-college",
];

function fmtCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR");
}

function SettingsTabRow({
  active,
  targetCount,
  onChange,
}: {
  active: CompetitivenessSettingsTab;
  targetCount: number;
  onChange: (tab: CompetitivenessSettingsTab) => void;
}) {
  const tabs: {
    id: CompetitivenessSettingsTab;
    label: string;
    icon: typeof Building2;
    count?: number;
  }[] = [
    { id: "target", label: "대상대학", icon: Building2, count: targetCount },
    { id: "indicators", label: "적용지표·가중치", icon: SlidersHorizontal },
    { id: "guidelines", label: "분석방법과 지침", icon: BookOpen },
    { id: "absolute", label: "절대지표 대학", icon: AlertTriangle },
  ];

  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
      aria-label="기본설정"
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
              <span
                className={`rounded-full px-1.5 text-[10px] font-semibold ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-surface text-muted"
                }`}
              >
                {fmtCount(tab.count)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function CohortTabBar({
  active,
  counts,
  onChange,
}: {
  active: CompetitivenessTargetCohort;
  counts: Record<CompetitivenessTargetCohort, number>;
  onChange: (cohort: CompetitivenessTargetCohort) => void;
}) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
      aria-label="학교구분"
    >
      {COHORTS.map((id) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`inline-flex h-[30px] items-center gap-1 rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "font-medium text-muted hover:text-foreground"
            }`}
          >
            {COMPETITIVENESS_TARGET_COHORT_LABEL[id]}
            <span
              className={`rounded-full px-1.5 text-[10px] font-semibold ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-surface text-muted"
              }`}
            >
              {fmtCount(counts[id])}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-surface px-5 py-10">
      <p className={`${FDB_TYPO.bodyText} text-center`}>
        {title} 탭은 목업에서 아직 만들지 않았습니다. 대상대학 탭만 실제
        데이터로 보여 줍니다.
      </p>
    </section>
  );
}

export function CompetitivenessTargetUnivMockPage({
  data,
  variant = "mock",
  chrome = "full",
}: {
  data: CompetitivenessTargetUnivData;
  variant?: "mock" | "production";
  chrome?: "full" | "board";
}) {
  const router = useRouter();
  const [, startNav] = useTransition();
  const [helpOpen, setHelpOpen] = useState(false);
  const hasActiveFilter = Boolean(data.filters.q);
  const targetCount =
    data.cohortCounts.university + data.cohortCounts["junior-college"];
  const showChrome = chrome === "full";
  const showTarget = !showChrome || data.tab === "target";

  function navigate(next: {
    tab?: CompetitivenessSettingsTab;
    year?: number | null;
    cohort?: CompetitivenessTargetCohort;
    region?: string;
    q?: string;
    resetFilters?: boolean;
  }) {
    const href = (variant === "production"
      ? buildCompetitivenessTargetUnivHref
      : buildCompetitivenessTargetUnivMockHref)({
      tab: showChrome ? (next.tab ?? data.tab) : "target",
      year: next.year ?? data.displayYear,
      cohort: next.cohort ?? data.cohort,
      region: next.resetFilters ? "" : (next.region ?? data.filters.region),
      q: next.resetFilters ? "" : (next.q ?? data.filters.q),
      resetFilters: next.resetFilters,
    });
    startNav(() => {
      router.push(href);
    });
  }

  return (
    <div className={showChrome ? "flex w-full flex-col gap-4 pb-10" : "flex w-full flex-col gap-4"}>
      {showChrome && variant === "mock" ? (
        <>
          <DashboardEmeraldHeader
            sectionLabel="목업 · 미적용"
            subtitle="분석대상 대표학교 · 학교코드 · 자금확보율"
            title="기본설정"
          />
          <section className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3">
            <p className={`${FDB_TYPO.panelMeta} text-foreground`}>
              프로덕션 기본설정으로 이동합니다. 대상대학은 분석대상 대표학교를
              불러옵니다.
            </p>
          </section>
        </>
      ) : null}

      {showChrome ? (
        <SettingsTabRow
          active={data.tab}
          targetCount={targetCount}
          onChange={(tab) => navigate({ tab, resetFilters: true })}
        />
      ) : null}

      {showChrome && data.tab === "indicators" ? (
        <PlaceholderPanel title="적용지표·가중치" />
      ) : null}
      {showChrome && data.tab === "guidelines" ? (
        <PlaceholderPanel title="분석방법과 지침" />
      ) : null}
      {showChrome && data.tab === "absolute" ? (
        <PlaceholderPanel title="절대지표 대학" />
      ) : null}

      {showTarget ? (
        <>
          {data.hasData && data.displayYear != null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
              <DashboardKpiCard
                accent="blue"
                title="대표학교"
                value={fmtCount(targetCount)}
                sub="대학·전문대학"
              />
              <DashboardKpiCard
                accent="emerald"
                title="대학"
                value={fmtCount(data.cohortCounts.university)}
                sub="대표학교코드 기준"
              />
              <DashboardKpiCard
                accent="amber"
                title="전문대학"
                value={fmtCount(data.cohortCounts["junior-college"])}
                sub="대표학교코드 기준"
              />
              <DashboardKpiCard
                accent="red"
                title="학자금제한"
                value={fmtCount(data.flagCounts.studentAidRestrict)}
                sub="해당"
              />
              <DashboardKpiCard
                accent="red"
                title="임시이사"
                value={fmtCount(data.flagCounts.provisionalBoard)}
                sub="해당"
              />
              <DashboardKpiCard
                accent="red"
                title="결산미제출"
                value={fmtCount(data.flagCounts.noSettlement)}
                sub="해당"
              />
              <DashboardKpiCard
                accent="red"
                title="자금부족"
                value={fmtCount(data.flagCounts.fundShortage)}
                sub="자금합계<0"
              />
            </div>
          ) : null}

          {helpOpen ? (
            <HelpGuidePanel
              sections={COMPETITIVENESS_TARGET_UNIV_HELP}
              onClose={() => setHelpOpen(false)}
              eyebrow={COMPETITIVENESS_TARGET_UNIV_HELP_TITLE}
              title="대표학교 불러오기 규칙"
              description={COMPETITIVENESS_TARGET_UNIV_HELP_SUB}
            />
          ) : null}

          <section className="ctu-toolbar rounded-xl border border-border bg-surface p-5">
            {!data.hasData || data.displayYear == null ? (
              <p className={FDB_TYPO.bodyText}>표시할 데이터가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {variant === "mock" ? (
                      <div className="flex items-center gap-1.5">
                        <label className={FDB_TYPO.toolbarLabel}>표시 연도</label>
                        <select
                          value={data.displayYear}
                          onChange={(e) =>
                            navigate({
                              year: Number(e.target.value),
                              resetFilters: true,
                            })
                          }
                          className={`h-7 rounded-md border border-border bg-surface-2 px-2 py-0 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
                        >
                          {data.years.map((year) => (
                            <option key={year} value={year}>
                              {year}년
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <CohortTabBar
                      active={data.cohort}
                      counts={data.cohortCounts}
                      onChange={(cohort) =>
                        navigate({ cohort, resetFilters: true })
                      }
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={FDB_TYPO.legend}>
                      조회 {fmtCount(data.rows.length)}곳 · 대학원은 포함하지
                      않습니다.
                    </p>
                    {hasActiveFilter ? (
                      <button
                        type="button"
                        onClick={() => navigate({ resetFilters: true })}
                        className={`h-7 rounded-md border border-border bg-surface-2 px-2 py-0 text-muted hover:text-foreground ${FDB_TYPO.toolbarControl}`}
                      >
                        필터 초기화
                      </button>
                    ) : null}
                    <SchoolNameSearchInput
                      value={data.filters.q}
                      onSearch={(q) => navigate({ q })}
                      className="shrink-0"
                      inputClassName={`h-7 w-36 rounded-md border border-border bg-surface-2 px-2 py-0 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                    />
                    <GlassHelpButton
                      active={helpOpen}
                      onClick={() => setHelpOpen((open) => !open)}
                    />
                  </div>
                </div>
                {data.rows.length === 0 ? (
                  <p className={FDB_TYPO.bodyText}>
                    {hasActiveFilter
                      ? `선택한 조건에 맞는 대학이 없습니다. (${data.displayYear}년 · 필터 적용)`
                      : `${data.displayYear}년 분석대상 데이터가 없습니다.`}
                  </p>
                ) : (
                  <CompetitivenessTargetUnivDataTable rows={data.rows} />
                )}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
