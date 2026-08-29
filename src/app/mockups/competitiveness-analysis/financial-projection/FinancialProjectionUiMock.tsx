"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Building2,
  Database,
  SlidersHorizontal,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardKpiCard } from "@/components/analysis/DashboardKpiCard";
import { CompetitivenessTargetUnivDataTable } from "@/components/analysis/competitiveness-analysis/CompetitivenessTargetUnivDataTable";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import {
  GlassActionButton,
  GlassHelpButton,
} from "@/components/analysis/GlassHelpButton";
import {
  downloadExportCsv,
  downloadExportXlsx,
  type ExportCell,
} from "@/lib/competitiveness-analysis/export-run-results";
import "@/components/analysis/competitiveness-analysis/run-export-buttons.css";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import {
  getFinancialProjectionTabHref,
  parseFpSettingsTab,
  type FinancialProjectionMenuId,
  type FinancialProjectionSettingsTab,
} from "@/lib/analysis/financial-projection-tabs";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { sidoShortLabel, zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import {
  VirtualPadRow,
  useVirtualizedRows,
} from "@/components/analysis/virtualized-table";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import "@/components/analysis/freshman-enrollment-alimi-table.css";
import {
  resolveUnivSegments,
  scenarioParams,
  wonToEok,
} from "@/lib/competitiveness-analysis/financial-projection/calculate-projection";
import {
  BASELINE_INDICATOR_CATALOG,
  DEFAULT_ACCOUNT_MAP,
  MOCK_DATA_CHECKS,
  MOCK_CPI_FORWARD_ASSUMPTION_PCT,
  MOCK_MACRO_NATIONAL,
  MOCK_PROJECTION_TARGETS,
  MOCK_UNIVERSITIES,
  type BaselineIndicatorPick,
  type ProjectionTargetRow,
} from "@/lib/competitiveness-analysis/financial-projection/mock-data";
import { fetchFinancialProjectionBootstrap } from "@/lib/competitiveness-analysis/financial-projection/bootstrap-client-cache";
import {
  readFpLiveSnapshot,
  writeFpLiveSnapshot,
} from "@/lib/competitiveness-analysis/financial-projection/fp-live-cache";
import {
  hydrateFpRunView,
  invalidateFpRunPersist,
  startFpRunCompute,
  subscribeFpRunProgress,
} from "@/lib/competitiveness-analysis/financial-projection/fp-run-engine";
import {
  copyFpEditionTemplate,
  listStoredFpAnalysisYears,
  readFinancialProjectionEdition,
  readFinancialProjectionStore,
  upsertFinancialProjectionEdition,
  writeFinancialProjectionSession,
} from "@/lib/competitiveness-analysis/financial-projection/session";
import {
  FP_DEFAULT_ANALYSIS_YEAR,
  mergeFpAnalysisYears,
  schoolAgeIndexBaseYearOf,
} from "@/lib/competitiveness-analysis/financial-projection/years";
import type {
  MacroData,
  ProjectionResult,
  SimulationParams,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";
import type { CompetitivenessTargetUnivRow } from "@/lib/analysis/competitiveness-target-univ-mock-view";

import {
  DiagnosisSection,
  RunSection,
  StrategySection,
  type LookupTab,
  type RunTab,
} from "./FinancialProjectionLookupMock";
import { schoolAgeIndexAtYear } from "@/lib/competitiveness-analysis/financial-projection/school-age-tuition-index";
import {
  FP_TARGET_UNIV_HELP,
  FP_TARGET_UNIV_HELP_SUB,
  FP_TARGET_UNIV_HELP_TITLE,
} from "@/lib/competitiveness-analysis/financial-projection/target-univ-help";
import {
  FP_BASELINE_HELP_SUB,
  FP_BASELINE_HELP_TITLE,
  fpBaselineHelp,
} from "@/lib/competitiveness-analysis/financial-projection/baseline-help";
import {
  FP_SCENARIO_HELP_SUB,
  FP_SCENARIO_HELP_TITLE,
  fpScenarioFieldHelp,
  fpScenarioHelp,
} from "@/lib/competitiveness-analysis/financial-projection/scenario-help";
import {
  FP_RUN_RESULTS_HELP_SUB,
  FP_RUN_RESULTS_HELP_TITLE,
  fpRunResultsHelp,
} from "@/lib/competitiveness-analysis/financial-projection/run-results-help";
import {
  FP_RUN_SCENARIOS,
  fpRunSignature,
  fpUnisSignature,
  hydrateFpPublishedRunFromServer,
  loadFpRunEditionIntoMemory,
  markFpRunPending,
  readFpSchoolRun,
  storedToProjection,
  clearFpRunEdition,
  fpRunYearHasResults,
  fpStoredRunSignature,
} from "@/lib/competitiveness-analysis/financial-projection/run-results-cache";
import { workspaceScope } from "@/lib/auth/local-workspace";
import type { FpServerSession } from "@/lib/competitiveness-analysis/financial-projection/server-store";
import {
  CLASS_LABEL,
  FpAnalysisYearBar,
  SCENARIO_LABEL,
  SliderControl,
  START_YEAR,
  RiskStageChip,
  YOY_BLUE,
  isFpAnalysisYear,
  projectionEndYearOf,
  RISK_MID_HORIZON_YEARS,
  RISK_NEAR_HORIZON_YEARS,
  riskStage,
  settlementYearOf,
  tickProps,
  yearOrDash,
  ROW_KIND_LABEL,
} from "./fpm-shared";
import { FpUniversityLookupPanel } from "./FpUniversityLookupPanel";
import { FpReportGuidelinesPanel } from "@/components/analysis/financial-projection/FpReportGuidelinesPanel";
import "./financial-projection-ui-mock.css";

type MenuId = FinancialProjectionMenuId;
type SettingsTab = FinancialProjectionSettingsTab;
type TargetCohort = "대학" | "전문대학";

const MENUS: { id: MenuId; label: string; title: string; subtitle: string }[] = [
  {
    id: "settings",
    label: "기본설정",
    title: "기본설정",
    subtitle: "분석연도별 대상대학 · 기초자료 · 시나리오",
  },
  {
    id: "execute",
    label: "분석결과",
    title: "분석결과",
    subtitle: "시나리오 탭에서 실행한 대상대학 재정추계 결과를 조회합니다",
  },
  {
    id: "university",
    label: "대학별추계",
    title: "대학별추계",
    subtitle: "해당 분석연도 실행 후 개별대학 추계결과·한계진단·대응전략 조회",
  },
];

function projectionTargetToUnivRow(row: ProjectionTargetRow): CompetitivenessTargetUnivRow {
  const flag = (value: unknown) =>
    value === "해당" || value === true ? "해당" : "";
  return {
    year: 0,
    schoolRepCode: row.schoolCodeStd,
    schoolRepName: row.schoolName,
    schoolDivision: row.schoolKind,
    schoolKind: row.schoolKind,
    region: row.region,
    estb: row.estb,
    campusCount: row.campusCount ?? 1,
    enrolledTotal: row.enrolledTotal ?? null,
    studentAidRestrict: flag(row.studentAidRestrict),
    provisionalBoard: flag(row.provisionalBoard),
    noSettlement: flag(row.noSettlement),
    fundShortage: flag(row.fundShortage),
  };
}

function fmtKpiCount(n: number): string {
  return n.toLocaleString("ko-KR");
}

function SettingsTabRow({
  active,
  targetCount,
  onChange,
}: {
  active: SettingsTab;
  targetCount: number;
  onChange: (tab: SettingsTab) => void;
}) {
  const tabs: {
    id: SettingsTab;
    label: string;
    icon: typeof Building2;
    count?: number;
  }[] = [
    { id: "target", label: "대상대학", icon: Building2, count: targetCount },
    { id: "baseline", label: "기초자료 생성", icon: Database },
    { id: "scenario", label: "시나리오", icon: SlidersHorizontal },
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
                className={`ml-0.5 rounded-full px-1.5 text-[10px] font-semibold ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-surface text-muted"
                }`}
              >
                {fmtKpiCount(tab.count)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function FpSectionCard({
  title,
  description,
  headerMeta,
  headerActions,
  contentClassName,
  children,
}: {
  title?: string;
  description?: string;
  headerMeta?: ReactNode;
  headerActions?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || description || headerMeta || headerActions);
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--glow-inset)]">
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="text-base font-semibold">{title}</h2>
            ) : null}
            {description ? (
              <p
                className={`${title ? "mt-1 text-sm text-muted" : FDB_TYPO.legend} ${!title ? "text-muted" : ""}`}
              >
                {description}
              </p>
            ) : null}
            {headerMeta}
          </div>
          {headerActions ? (
            <div className="shrink-0">{headerActions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={hasHeader ? (contentClassName ?? "mt-4") : ""}>
        {children}
      </div>
    </section>
  );
}

function FpInnerCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-surface-2 p-4">
      {title ? (
        <h3 className="text-sm font-semibold text-accent-cyan">{title}</h3>
      ) : null}
      {description ? (
        <p className={`${title ? "mt-1" : ""} ${FDB_TYPO.legend}`}>
          {description}
        </p>
      ) : null}
      {children ? (
        <div className={title || description ? "mt-3" : ""}>{children}</div>
      ) : null}
    </div>
  );
}

function fpTableHeadClass(align: "left" | "center" | "right" = "left") {
  return `${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} ${
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left"
  } last:border-r-0`;
}

function fpTableCellClass(opts?: {
  mono?: boolean;
  school?: boolean;
  right?: boolean;
}) {
  return `whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} last:border-r-0 ${FDB_TYPO.tableBody} ${
    opts?.school ? FDB_TABLE_COLOR.schoolName : ""
  } ${opts?.mono ? "font-mono" : ""} ${opts?.right ? "text-right" : ""}`.trim();
}

function CohortTabBar({
  active,
  univCount,
  collegeCount,
  onChange,
}: {
  active: TargetCohort;
  univCount: number;
  collegeCount: number;
  onChange: (cohort: TargetCohort) => void;
}) {
  const tabs: { id: TargetCohort; label: string; count: number }[] = [
    { id: "대학", label: "대학", count: univCount },
    { id: "전문대학", label: "전문대학", count: collegeCount },
  ];

  return (
    <div
      className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
      role="tablist"
      aria-label="학교구분"
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
              {fmtKpiCount(tab.count)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FinancialProjectionUiMock({
  activeMenu,
  production = false,
}: {
  activeMenu?: MenuId;
  production?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlYearParam = searchParams.get("year");
  const skipPersist = useRef(true);
  const [internalMenu, setInternalMenu] = useState<MenuId>("settings");
  const menu =
    activeMenu === "scenario" ? "settings" : (activeMenu ?? internalMenu);
  const [analysisYear, setAnalysisYear] = useState(FP_DEFAULT_ANALYSIS_YEAR);
  const [availableYears, setAvailableYears] = useState<number[]>([
    FP_DEFAULT_ANALYSIS_YEAR,
  ]);
  const [yearReady, setYearReady] = useState(false);
  const [coverage, setCoverage] = useState<{
    hasTargetRoster: boolean;
    hasSchoolAge: boolean;
  }>({ hasTargetRoster: true, hasSchoolAge: true });
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(() =>
    parseFpSettingsTab(searchParams.get("tab")),
  );
  const [targetCohort, setTargetCohort] = useState<TargetCohort>("대학");
  const [targets, setTargets] = useState<ProjectionTargetRow[]>(
    production ? [] : MOCK_PROJECTION_TARGETS,
  );
  const [universities, setUniversities] = useState<UnivBaseData[]>([]);
  const [indicators, setIndicators] = useState(BASELINE_INDICATOR_CATALOG);
  const [baselineReady, setBaselineReady] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [cpiPct, setCpiPct] = useState(MOCK_CPI_FORWARD_ASSUMPTION_PCT);
  const [params, setParams] = useState<SimulationParams>(() =>
    scenarioParams("base", 2.5),
  );
  const [resultViewScenario, setResultViewScenario] =
    useState<SimulationScenario>("base");
  const [resultCohort, setResultCohort] = useState<TargetCohort>("대학");
  const [lookupCode, setLookupCode] = useState(
    production ? "" : MOCK_UNIVERSITIES[0]!.schoolCodeStd,
  );
  const [lookupTab, setLookupTab] = useState<LookupTab>("result");
  const [runTab, setRunTab] = useState<RunTab>("students");
  const [hydrated, setHydrated] = useState(false);
  const [runStoreEpoch, setRunStoreEpoch] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nationalMacro, setNationalMacro] = useState<MacroData>(MOCK_MACRO_NATIONAL);
  const [schoolAgeLive, setSchoolAgeLive] = useState<{
    regionLabel: string;
    dataYear: number;
    admissionBaselineYear: number;
    declineSeries: { year: number; index: number; weightedResource: number }[];
  } | null>(null);

  const settlementYear = settlementYearOf(analysisYear);
  const endYear = projectionEndYearOf(analysisYear);
  const indexBaseYear = schoolAgeIndexBaseYearOf(analysisYear);

  useEffect(() => {
    const store = readFinancialProjectionStore();
    const fromUrl = Number(searchParams.get("year"));
    const next = isFpAnalysisYear(fromUrl)
      ? fromUrl
      : store.currentAnalysisYear;
    setAnalysisYear(next);
    setAvailableYears(
      mergeFpAnalysisYears(listStoredFpAnalysisYears(), [next, FP_DEFAULT_ANALYSIS_YEAR]),
    );
    setYearReady(true);
    // 최초 1회: URL 또는 저장된 현재 연도
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!yearReady) return;
    const urlYear = Number(urlYearParam);
    if (!isFpAnalysisYear(urlYear)) return;
    setAnalysisYear((prev) => (prev === urlYear ? prev : urlYear));
  }, [urlYearParam, yearReady]);

  useEffect(() => {
    if (!yearReady || !pathname) return;
    const urlYear = Number(urlYearParam);
    if (urlYear === analysisYear) return;
    const next = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "",
    );
    next.set("year", String(analysisYear));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [analysisYear, pathname, router, urlYearParam, yearReady]);

  useEffect(() => {
    if (!production) return;
    const urlTab = searchParams.get("tab");
    if (urlTab === "macro" && pathname) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", "scenario");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      setSettingsTab("scenario");
      return;
    }
    const next = parseFpSettingsTab(urlTab);
    setSettingsTab((prev) => (prev === next ? prev : next));
  }, [pathname, production, router, searchParams]);

  useEffect(() => {
    if (!yearReady) return;
    let cancelled = false;

    const cached = readFpLiveSnapshot(analysisYear);
    if (cached) {
      setTargets(cached.targets);
      setUniversities(cached.universities);
      setIndicators(cached.indicators);
      setBaselineReady(cached.baselineReady);
      setHasRun(cached.hasRun);
      setLastRunAt(cached.lastRunAt);
      setCpiPct(cached.cpiPct);
      setParams(cached.params);
      setResultViewScenario(cached.resultViewScenario);
      setLookupCode(cached.lookupCode);
      setNationalMacro(cached.nationalMacro);
      setSchoolAgeLive(cached.schoolAgeLive);
      setCoverage(cached.coverage);
      setAvailableYears(cached.availableYears);
      setLoadError(cached.loadError);
      skipPersist.current = true;
      setHydrated(true);
      void loadFpRunEditionIntoMemory(analysisYear).then(() => {
        if (cancelled) return;
        if (fpRunYearHasResults(analysisYear)) setHasRun(true);
        setRunStoreEpoch((n) => n + 1);
      });
      return;
    }

    async function hydrate() {
      const saved = readFinancialProjectionEdition(analysisYear);
      if (!production) {
        setTargets(saved.targets);
        setUniversities(saved.universities);
        setIndicators(saved.indicators);
        setBaselineReady(saved.baselineReady);
        setHasRun(saved.hasRun);
        setLastRunAt(saved.lastRunAt);
        setCpiPct(saved.cpiPct);
        setParams(saved.params);
        setResultViewScenario(saved.params.scenario);
        setLookupCode(saved.lookupCode);
        skipPersist.current = true;
        setHydrated(true);
        return;
      }

      try {
        const json = await fetchFinancialProjectionBootstrap(analysisYear);
        if (cancelled) return;

        const liveTargets = json.targets ?? [];
        const liveCodes = new Set(liveTargets.map((t) => t.schoolCodeStd));
        const userHasLocalDraft =
          workspaceScope() === "user" &&
          Boolean(saved.hasRun && fpRunYearHasResults(analysisYear));

        let serverSession: FpServerSession | null = null;
        if (!userHasLocalDraft) {
          try {
            const sessionRes = await fetch(
              `/api/financial-projection/session?year=${analysisYear}`,
            );
            if (sessionRes.ok) {
              const sessionJson = (await sessionRes.json()) as {
                session?: FpServerSession | null;
              };
              serverSession = sessionJson.session ?? null;
            }
          } catch {
            /* fallback to local */
          }
        }

        const publishedUnivs =
          !userHasLocalDraft && serverSession?.universities?.length
            ? serverSession.universities.filter(
                (u) =>
                  liveCodes.has(u.schoolCodeStd) &&
                  (u.analysisYear ?? analysisYear) === analysisYear,
              )
            : [];
        const localUnivs = saved.universities.filter(
          (u) =>
            liveCodes.has(u.schoolCodeStd) &&
            (u.analysisYear ?? analysisYear) === analysisYear,
        );
        const univs = userHasLocalDraft
          ? localUnivs
          : publishedUnivs.length
            ? publishedUnivs
            : localUnivs;
        const baselineReady = Boolean(
          univs.length &&
            (userHasLocalDraft
              ? saved.baselineReady
              : (serverSession?.baselineReady ?? saved.baselineReady)),
        );
        const hasRun = Boolean(
          univs.length &&
            (userHasLocalDraft
              ? saved.hasRun
              : (serverSession?.hasRun ?? saved.hasRun)),
        );
        setTargets(liveTargets);
        setNationalMacro(json.nationalMacro);
        setSchoolAgeLive(json.schoolAge ?? null);
        setCoverage(
          json.coverage ?? { hasTargetRoster: liveTargets.length > 0, hasSchoolAge: Boolean(json.schoolAge) },
        );
        setAvailableYears((prev) =>
          mergeFpAnalysisYears(prev, json.availableYears, listStoredFpAnalysisYears(), [
            analysisYear,
          ]),
        );
        setIndicators(saved.indicators);
        setUniversities(univs);
        setBaselineReady(baselineReady);
        setHasRun(hasRun);
        setLastRunAt(
          userHasLocalDraft
            ? saved.lastRunAt
            : (serverSession?.lastRunAt ?? (univs.length ? saved.lastRunAt : null)),
        );
        setCpiPct(
          userHasLocalDraft
            ? saved.cpiPct
            : (serverSession?.cpiPct ?? saved.cpiPct),
        );
        setParams(
          userHasLocalDraft
            ? saved.params
            : (serverSession?.params ?? saved.params),
        );
        setResultViewScenario(
          (userHasLocalDraft
            ? saved.params
            : (serverSession?.params ?? saved.params)
          ).scenario,
        );
        setLookupCode(
          liveCodes.has(
            userHasLocalDraft
              ? saved.lookupCode
              : (serverSession?.lookupCode ?? saved.lookupCode),
          )
            ? userHasLocalDraft
              ? saved.lookupCode
              : (serverSession?.lookupCode ?? saved.lookupCode)
            : (liveTargets.find((t) => t.included)?.schoolCodeStd ?? ""),
        );
        setLoadError(null);
        if (userHasLocalDraft) {
          await loadFpRunEditionIntoMemory(analysisYear);
        } else {
          await hydrateFpPublishedRunFromServer(analysisYear);
        }
        if (cancelled) return;
        if (fpRunYearHasResults(analysisYear) && univs.length) {
          setHasRun(true);
        }
        setRunStoreEpoch((n) => n + 1);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "대상대학을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          skipPersist.current = true;
          setHydrated(true);
        }
      }
    }

    setHydrated(false);
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [production, analysisYear, yearReady]);

  useEffect(() => {
    if (!hydrated || !yearReady) return;
    writeFpLiveSnapshot({
      analysisYear,
      targets,
      universities,
      indicators,
      baselineReady,
      hasRun,
      lastRunAt,
      cpiPct,
      params,
      lookupCode,
      resultViewScenario,
      nationalMacro,
      schoolAgeLive,
      coverage,
      availableYears,
      loadError,
    });
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      writeFinancialProjectionSession({
        analysisYear,
        targets,
        universities,
        indicators,
        baselineReady,
        hasRun,
        lastRunAt,
        cpiPct,
        params,
        lookupCode,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    hydrated,
    yearReady,
    analysisYear,
    targets,
    universities,
    indicators,
    baselineReady,
    hasRun,
    lastRunAt,
    cpiPct,
    params,
    lookupCode,
    resultViewScenario,
    nationalMacro,
    schoolAgeLive,
    coverage,
    availableYears,
    loadError,
  ]);

  function changeAnalysisYear(next: number) {
    if (next === analysisYear || !isFpAnalysisYear(next)) return;
    if (hydrated) {
      writeFinancialProjectionSession({
        analysisYear,
        targets,
        universities,
        indicators,
        baselineReady,
        hasRun,
        lastRunAt,
        cpiPct,
        params,
        lookupCode,
      });
    }
    setAvailableYears((prev) => mergeFpAnalysisYears(prev, [next]));
    skipPersist.current = true;
    setAnalysisYear(next);
  }

  function addAnalysisYear(year: number) {
    if (!isFpAnalysisYear(year)) return;
    const store = readFinancialProjectionStore();
    if (!store.editions[String(year)]) {
      upsertFinancialProjectionEdition(copyFpEditionTemplate(analysisYear, year));
    }
    changeAnalysisYear(year);
  }

  function go(next: MenuId) {
    if (production) {
      router.push(getFinancialProjectionTabHref(next, analysisYear));
      return;
    }
    if (next === "scenario") {
      setInternalMenu("settings");
      setSettingsTab("scenario");
      return;
    }
    setInternalMenu(next);
  }

  function changeSettingsTab(tab: SettingsTab) {
    setSettingsTab(tab);
    if (!production || !pathname) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("year", String(analysisYear));
    if (tab === "target") next.delete("tab");
    else next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const included = useMemo(
    () => targets.filter((t) => t.included),
    [targets],
  );
  const univCount = included.filter((t) => t.schoolKind === "대학").length;
  const collegeCount = included.filter((t) => t.schoolKind === "전문대학").length;
  const baselineUnivs = useMemo(() => {
    const codes = new Set(included.map((t) => t.schoolCodeStd));
    if (production) {
      return universities.filter((u) => codes.has(u.schoolCodeStd));
    }
    if (universities.length) {
      return universities.filter((u) => codes.has(u.schoolCodeStd));
    }
    return MOCK_UNIVERSITIES.filter((u) => codes.has(u.schoolCodeStd));
  }, [included, production, universities]);

  const ageShift = useMemo(() => {
    if (schoolAgeLive?.declineSeries) return schoolAgeLive.declineSeries;
    return MOCK_MACRO_NATIONAL.years.map((pt) => ({
      year: pt.year,
      index:
        pt.year <= indexBaseYear
          ? 100
          : Math.round((pt.populationRatio / 0.96) * 1000) / 10,
      weightedResource: 0,
    }));
  }, [schoolAgeLive, indexBaseYear]);
  const sidoLabel = schoolAgeLive?.regionLabel ?? MOCK_MACRO_NATIONAL.regionLabel;

  const runParams = useMemo(
    (): SimulationParams => ({
      ...params,
      inflationRatePct: cpiPct,
    }),
    [params, cpiPct],
  );

  const lookupUniv = useMemo(
    () =>
      baselineUnivs.find((u) => u.schoolCodeStd === lookupCode) ??
      baselineUnivs[0],
    [baselineUnivs, lookupCode],
  );

  const onExecuteMenu = menu === "execute";
  const onUniversityMenu = menu === "university";

  type BatchRunRow = {
    univ: UnivBaseData;
    result: ProjectionResult;
    stage: ReturnType<typeof riskStage>;
  };
  const [batchRows, setBatchRows] = useState<BatchRunRow[]>([]);
  const [batchProgress, setBatchProgress] = useState<{
    done: number;
    total: number;
    running: boolean;
  }>({ done: 0, total: 0, running: false });

  const resultViewScenarioRef = useRef(resultViewScenario);
  resultViewScenarioRef.current = resultViewScenario;
  const baselineUnivsRef = useRef(baselineUnivs);
  baselineUnivsRef.current = baselineUnivs;
  const nationalMacroRef = useRef(nationalMacro);
  nationalMacroRef.current = nationalMacro;
  const uniSig = useMemo(
    () => fpUnisSignature(baselineUnivs),
    [baselineUnivs],
  );
  const runSignature = useMemo(
    () =>
      fpRunSignature({
        uniSignature: uniSig,
        cpiPct,
        params: runParams,
      }),
    [uniSig, cpiPct, runParams],
  );
  const runStale = useMemo(() => {
    const stored = fpStoredRunSignature(analysisYear);
    return Boolean(hasRun && stored && stored !== runSignature);
  }, [hasRun, analysisYear, runSignature, runStoreEpoch]);

  const storedSchool = useMemo(() => {
    if (!onUniversityMenu || !lookupUniv) return null;
    return readFpSchoolRun(
      analysisYear,
      resultViewScenario,
      lookupUniv.schoolCodeStd,
      runSignature,
    );
  }, [
    onUniversityMenu,
    lookupUniv,
    analysisYear,
    resultViewScenario,
    runSignature,
    batchProgress.running,
    runStoreEpoch,
  ]);

  const projection = useMemo(() => {
    if (!storedSchool) return null;
    return storedToProjection(storedSchool);
  }, [storedSchool]);

  useEffect(() => subscribeFpRunProgress(setBatchProgress), []);

  useEffect(() => {
    if ((!onExecuteMenu && !onUniversityMenu) || !hasRun || !baselineUnivs.length) return;
    if (batchProgress.running) return;
    const hydratedRows = hydrateFpRunView({
      year: analysisYear,
      unis: baselineUnivs,
      cpiPct,
      runParams,
      scenario: resultViewScenario,
    });
    if (!hydratedRows) return;
    setBatchRows((prev) => {
      if (
        prev.length === hydratedRows.length &&
        prev.every(
          (row, i) =>
            row.univ.schoolCodeStd === hydratedRows[i]?.univ.schoolCodeStd &&
            row.result.operatingLossYear ===
              hydratedRows[i]?.result.operatingLossYear &&
            row.result.liquidityDepletionYear ===
              hydratedRows[i]?.result.liquidityDepletionYear,
        )
      ) {
        return prev;
      }
      return hydratedRows;
    });
  }, [
    onExecuteMenu,
    onUniversityMenu,
    hasRun,
    baselineUnivs,
    analysisYear,
    resultViewScenario,
    cpiPct,
    runParams,
    batchProgress.running,
    runStoreEpoch,
  ]);

  const compareSeries = useMemo(() => {
    if (!onUniversityMenu || !lookupUniv) return [];
    return FP_RUN_SCENARIOS.map((s) => {
      const row = readFpSchoolRun(
        analysisYear,
        s,
        lookupUniv.schoolCodeStd,
        runSignature,
      );
      return {
        scenario: s,
        result: row
          ? storedToProjection(row)
          : storedToProjection({
              code: lookupUniv.schoolCodeStd,
              operatingLossYear: null,
              cashDeficitYear: null,
              liquidityDepletionYear: null,
              tuitionByYear: {},
              rows: [],
              tornado: [],
              goalSeekByDelay: {},
            }),
      };
    });
  }, [
    onUniversityMenu,
    lookupUniv,
    analysisYear,
    runSignature,
    batchProgress.running,
    runStoreEpoch,
  ]);

  const perCapitaRows = useMemo(
    () =>
      (projection?.rows ?? [])
        .filter((r) => r.rowKind !== "actual")
        .map((r) => {
        const expPer = r.students > 0 ? (r.expenseEok * 100) / r.students : 0;
        const tuiPer =
          r.students > 0 ? (r.tuitionRevenueEok * 100) / r.students : 0;
        return {
          year: r.year,
          expenseMan: Math.round(expPer * 10) / 10,
          tuitionMan: Math.round(tuiPer * 10) / 10,
          gapMan: Math.round((expPer - tuiPer) * 10) / 10,
        };
      }),
    [projection?.rows],
  );

  const menuMeta = MENUS.find((m) => m.id === menu)!;
  const listStages = useMemo(() => {
    const map = new Map<string, ReturnType<typeof riskStage>>();
    for (const row of batchRows) {
      map.set(row.univ.schoolCodeStd, row.stage);
    }
    return map;
  }, [batchRows]);
  const stage = riskStage(
    projection?.operatingLossYear ?? null,
    projection?.cashDeficitYear ?? null,
    projection?.liquidityDepletionYear ?? null,
    analysisYear,
  );

  function toggleIndicator(id: string) {
    setIndicators((prev) =>
      prev.map((i) =>
        i.id === id && !i.required ? { ...i, selected: !i.selected } : i,
      ),
    );
    setBaselineReady(false);
  }

  async function generateBaseline() {
    if (!production) {
      setBaselineReady(true);
      setHasRun(false);
      return;
    }
    setGenerating(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/financial-projection/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCodes: included.map((t) => t.schoolCodeStd),
          analysisYear,
        }),
      });
      const json = (await res.json()) as {
        universities?: UnivBaseData[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "기초자료 생성에 실패했습니다.");
      }
      const next = json.universities ?? [];
      setUniversities(next);
      setBaselineReady(true);
      setHasRun(false);
      setBatchRows([]);
      clearFpRunEdition(analysisYear);
      invalidateFpRunPersist();
      if (next[0]) setLookupCode(next[0].schoolCodeStd);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "기초자료 생성에 실패했습니다.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function runAll() {
    if (!baselineUnivs.length) return;
    const lastRun = new Date().toLocaleString("ko-KR");
    const nextLookup = baselineUnivs[0]?.schoolCodeStd ?? lookupCode;
    const signature = fpRunSignature({
      uniSignature: fpUnisSignature(baselineUnivs),
      cpiPct,
      params: runParams,
    });
    markFpRunPending(analysisYear, signature);
    skipPersist.current = true;
    writeFinancialProjectionSession({
      analysisYear,
      targets,
      universities,
      indicators,
      baselineReady,
      hasRun: true,
      lastRunAt: lastRun,
      cpiPct,
      params,
      lookupCode: nextLookup,
    });
    setHasRun(true);
    setResultViewScenario(params.scenario);
    setLastRunAt(lastRun);
    if (nextLookup) setLookupCode(nextLookup);
    setBatchRows([]);
    setBatchProgress({
      done: 0,
      total: baselineUnivs.length * FP_RUN_SCENARIOS.length,
      running: true,
    });
    void startFpRunCompute({
      year: analysisYear,
      unis: baselineUnivs,
      nationalMacro: nationalMacroRef.current,
      cpiPct,
      runParams,
      paramsScenario: params.scenario,
      startYear: START_YEAR,
      endYear,
    }).then((finished) => {
      if (!finished) return;
      const rows = hydrateFpRunView({
        year: analysisYear,
        unis: baselineUnivsRef.current,
        cpiPct,
        runParams,
        scenario: resultViewScenarioRef.current,
      });
      if (rows) setBatchRows(rows);
      setRunStoreEpoch((n) => n + 1);
      go("execute");
    });
  }

  function patchParams(partial: Partial<SimulationParams>) {
    setParams((prev) => ({ ...prev, ...partial }));
  }

  function applyScenario(s: SimulationScenario) {
    setParams((prev) => {
      if (prev.scenario === s) return prev;
      const next = scenarioParams(s, cpiPct);
      return { ...next, inflationRatePct: cpiPct };
    });
  }

  return (
    <>
      {production ? null : (
        <div className="fpm-banner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              ✦ 재정추계분석 UI 목업 · v0.3 · 전체 설정 → 분석결과 → 대학별 조회
            </span>
            <Link
              href="/analysis/financial-projection/settings"
              className="font-medium text-accent hover:underline"
            >
              프로덕션 메뉴
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 pb-10">
        <DashboardEmeraldHeader
          sectionLabel="재정추계분석"
          title={menuMeta.title}
          subtitle={menuMeta.subtitle}
        />

        <div className="flex flex-col gap-1">
          <FpAnalysisYearBar
            analysisYear={analysisYear}
            availableYears={availableYears}
            settlementYear={settlementYear}
            endYear={endYear}
            hasRun={hasRun}
            runStale={runStale}
            coverage={coverage}
            onChange={changeAnalysisYear}
            onAddYear={addAnalysisYear}
            showAddYear={menu !== "execute"}
            showYearMeta={menu !== "execute"}
            afterStatus={
              menu === "execute" ? (
                <>
                  <GlassMintTabGroup
                    ariaLabel="시나리오"
                    active={resultViewScenario}
                    onChange={setResultViewScenario}
                    items={[
                      { id: "best", label: "낙관" },
                      { id: "base", label: "기본" },
                      { id: "worst", label: "비관" },
                      { id: "stress", label: "한계" },
                    ]}
                  />
                  <GlassMintTabGroup
                    ariaLabel="학교구분"
                    active={resultCohort}
                    onChange={setResultCohort}
                    items={[
                      {
                        id: "대학",
                        label: "대학",
                        count: fmtKpiCount(univCount),
                      },
                      {
                        id: "전문대학",
                        label: "전문대학",
                        count: fmtKpiCount(collegeCount),
                      },
                    ]}
                  />
                </>
              ) : undefined
            }
          />

          {menu === "university" ? (
            <FpReportGuidelinesPanel analysisYear={analysisYear} />
          ) : null}

        {production ? null : (
          <nav className="fpm-step-nav" aria-label="재정추계분석 하위 메뉴">
            {MENUS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => go(m.id)}
                className={`fpm-step-btn ${menu === m.id ? "fpm-step-btn-active" : "text-muted hover:text-foreground"}`}
              >
                {m.label}
              </button>
            ))}
          </nav>
        )}

        {loadError ? (
          <p className={`${CHART_TYPO.bodyText} text-rose-600`}>{loadError}</p>
        ) : null}

        {menu === "settings" ? (
          <SettingsSection
            tab={settingsTab}
            onTab={changeSettingsTab}
            targetCohort={targetCohort}
            onCohort={setTargetCohort}
            targets={targets}
            univCount={univCount}
            collegeCount={collegeCount}
            indicators={indicators}
            onToggleIndicator={toggleIndicator}
            baselineReady={baselineReady}
            generating={generating}
            onGenerate={generateBaseline}
            baselineUnivs={baselineUnivs}
            includedCount={included.length}
            ageShift={ageShift}
            sidoLabel={sidoLabel}
            nationalMacro={nationalMacro}
            cpiPct={cpiPct}
            analysisYear={analysisYear}
            settlementYear={settlementYear}
            endYear={endYear}
            indexBaseYear={indexBaseYear}
            coverage={coverage}
            params={runParams}
            onApplyScenario={applyScenario}
            onPatchParams={patchParams}
            onRun={runAll}
            running={batchProgress.running}
            runProgress={batchProgress}
            onCpiPct={(v) => {
              setCpiPct(v);
              setParams((p) => ({ ...p, inflationRatePct: v }));
            }}
          />
        ) : null}

        {menu === "execute" ? (
          <ExecuteSection
            hasRun={hasRun}
            analysisYear={analysisYear}
            settlementYear={settlementYear}
            cohort={resultCohort}
            targets={targets}
            batchRows={batchRows}
            batchProgress={batchProgress}
            onOpenLookup={(code) => {
              setLookupCode(code);
              setLookupTab("result");
              go("university");
            }}
          />
        ) : null}

        {menu === "university" ? (
          batchProgress.running ? (
            <div className="fpm-chart-card">
              <p className={CHART_TYPO.bodyText}>
                기본설정에서 분석실행 저장 중입니다.{" "}
                {batchProgress.done.toLocaleString("ko-KR")} /{" "}
                {batchProgress.total.toLocaleString("ko-KR")} (낙관·기본·비관·한계)
              </p>
            </div>
          ) : !lookupUniv || !baselineUnivs.length ? (
            <div className="fpm-chart-card">
              <p className={CHART_TYPO.bodyText}>
                개별대학 추계는 {analysisYear}년 기본설정·시나리오를 확정한 뒤 시나리오
                탭에서 <strong>분석실행</strong>을 완료해야 조회할 수 있습니다.
              </p>
              <button
                type="button"
                className="mt-3 rounded-md border border-accent bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent"
                onClick={() => go("scenario")}
              >
                시나리오로 이동
              </button>
            </div>
          ) : !hasRun || !storedSchool || storedSchool.rows.length === 0 || !projection ? (
            <>
              {!hasRun ? (
                <p className="fpm-chart-card mb-4 text-sm text-muted">
                  {analysisYear}년 추계 차트는 분석실행 후 표시됩니다. 생성된
                  개별대학 보고서는 아래에서 열람할 수 있습니다.
                </p>
              ) : null}
              <FpUniversityLookupPanel
                universities={baselineUnivs}
                targets={targets}
                analysisYear={analysisYear}
                scenario={resultViewScenario}
                onScenario={setResultViewScenario}
                lookupTab={lookupTab}
                onLookupTab={setLookupTab}
                runTab={runTab}
                onRunTab={setRunTab}
                selectedCode={lookupUniv.schoolCodeStd}
                onSelectCode={setLookupCode}
                listStages={listStages}
                projection={null}
              >
                {null}
              </FpUniversityLookupPanel>
            </>
          ) : (
            <FpUniversityLookupPanel
              universities={baselineUnivs}
              targets={targets}
              analysisYear={analysisYear}
              scenario={resultViewScenario}
              onScenario={setResultViewScenario}
              lookupTab={lookupTab}
              onLookupTab={setLookupTab}
              runTab={runTab}
              onRunTab={setRunTab}
              selectedCode={lookupUniv.schoolCodeStd}
              onSelectCode={setLookupCode}
              listStages={listStages}
              projection={projection}
            >
              {lookupTab === "result" ? (
                <RunSection
                  tab={runTab}
                  onTab={setRunTab}
                  projection={projection}
                  perCapitaRows={perCapitaRows}
                  analysisYear={analysisYear}
                  settlementYear={settlementYear}
                  showInnerTabs={false}
                />
              ) : null}
              {lookupTab === "diagnosis" ? (
                <DiagnosisSection
                  projection={projection}
                  compareSeries={compareSeries}
                  stage={stage}
                  analysisYear={analysisYear}
                />
              ) : null}
              {lookupTab === "strategy" ? (
                <StrategySection
                  scenario={resultViewScenario}
                  cpiPct={cpiPct}
                  univ={lookupUniv}
                  nationalMacro={nationalMacro}
                  startYear={START_YEAR}
                  endYear={endYear}
                  settingsParams={runParams}
                />
              ) : null}
            </FpUniversityLookupPanel>
          )
        ) : null}
        </div>
      </div>
    </>
  );
}

function SettingsSection({
  tab,
  onTab,
  targetCohort,
  onCohort,
  targets,
  univCount,
  collegeCount,
  indicators,
  onToggleIndicator,
  baselineReady,
  generating,
  onGenerate,
  baselineUnivs,
  includedCount,
  ageShift,
  sidoLabel,
  nationalMacro,
  cpiPct,
  analysisYear,
  settlementYear,
  endYear,
  indexBaseYear,
  coverage,
  params,
  onApplyScenario,
  onPatchParams,
  onCpiPct,
  onRun,
  running = false,
  runProgress,
}: {
  tab: SettingsTab;
  onTab: (t: SettingsTab) => void;
  targetCohort: TargetCohort;
  onCohort: (c: TargetCohort) => void;
  targets: ProjectionTargetRow[];
  univCount: number;
  collegeCount: number;
  indicators: BaselineIndicatorPick[];
  onToggleIndicator: (id: string) => void;
  baselineReady: boolean;
  generating: boolean;
  onGenerate: () => void;
  baselineUnivs: UnivBaseData[];
  includedCount: number;
  ageShift: { year: number; index: number; weightedResource: number }[];
  sidoLabel: string;
  nationalMacro: MacroData;
  cpiPct: number;
  analysisYear: number;
  settlementYear: number;
  endYear: number;
  indexBaseYear: number;
  coverage: { hasTargetRoster: boolean; hasSchoolAge: boolean };
  params: SimulationParams;
  onApplyScenario: (s: SimulationScenario) => void;
  onPatchParams: (p: Partial<SimulationParams>) => void;
  onCpiPct: (v: number) => void;
  onRun: () => void;
  running?: boolean;
  runProgress?: { done: number; total: number; running: boolean };
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [baselineHelpOpen, setBaselineHelpOpen] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState("");
  const cohortRows = targets.filter((t) => t.schoolKind === targetCohort);
  const univStatus = indicators.filter((i) => i.source === "대학현황");
  const finance = indicators.filter((i) => i.source === "재정분석지표");
  const q = schoolQuery.trim().toLowerCase();
  const visibleRows = (
    q
      ? cohortRows.filter((row) => row.schoolName.toLowerCase().includes(q))
      : cohortRows
  )
    .slice()
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));
  const baselineByCohort = baselineUnivs.filter(
    (u) => u.schoolKind === targetCohort,
  );
  const visibleBaseline = (
    q
      ? baselineByCohort.filter((u) => u.schoolName.toLowerCase().includes(q))
      : baselineByCohort
  )
    .slice()
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));
  const baselineUnivTabCount = baselineUnivs.filter(
    (u) => u.schoolKind === "대학",
  ).length;
  const baselineCollegeTabCount = baselineUnivs.filter(
    (u) => u.schoolKind === "전문대학",
  ).length;
  const flagCounts = {
    studentAidRestrict: targets.filter((t) => t.studentAidRestrict === "해당").length,
    provisionalBoard: targets.filter((t) => t.provisionalBoard === "해당").length,
    noSettlement: targets.filter((t) => t.noSettlement === "해당").length,
    fundShortage: targets.filter((t) => t.fundShortage === "해당").length,
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <SettingsTabRow
          active={tab}
          targetCount={univCount + collegeCount}
          onChange={onTab}
        />
        {tab === "baseline" ? (
          <GlassActionButton
            tone="green"
            onClick={onGenerate}
            disabled={generating || includedCount === 0}
          >
            {generating ? "생성 중…" : "기초자료 생성"}
          </GlassActionButton>
        ) : null}
        {tab === "scenario" ? (
          <GlassActionButton
            tone="green"
            onClick={onRun}
            disabled={running || !baselineReady || includedCount === 0}
            title={
              running
                ? "낙관·기본·비관·한계 결과를 저장하는 중입니다."
                : !baselineReady
                  ? "기초자료를 먼저 생성하세요."
                  : includedCount === 0
                    ? "대상대학이 없습니다."
                    : undefined
            }
          >
            {running ? "저장 중…" : "분석실행"}
          </GlassActionButton>
        ) : null}
      </div>
      {tab === "scenario" && running && runProgress ? (
        <p className={`${CHART_TYPO.bodyText} mt-2`}>
          분석실행 저장 중 {runProgress.done.toLocaleString("ko-KR")} /{" "}
          {runProgress.total.toLocaleString("ko-KR")} (낙관·기본·비관·한계). 완료되면
          분석결과로 이동합니다.
        </p>
      ) : null}

      {tab === "target" ? (
        <div className="space-y-3">
          {!coverage.hasTargetRoster ? (
            <p className={`${CHART_TYPO.legend} text-accent-orange`}>
              {analysisYear}년 대상대학 명부가 없습니다. 분석대상 대표학교를 업로드한 뒤
              다시 열어 주세요.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            <DashboardKpiCard
              accent="blue"
              title="대표학교"
              value={fmtKpiCount(univCount + collegeCount)}
              sub="대학·전문대학"
            />
            <DashboardKpiCard
              accent="emerald"
              title="대학"
              value={fmtKpiCount(univCount)}
              sub="대표학교코드 기준"
            />
            <DashboardKpiCard
              accent="amber"
              title="전문대학"
              value={fmtKpiCount(collegeCount)}
              sub="대표학교코드 기준"
            />
            <DashboardKpiCard
              accent="red"
              title="학자금제한"
              value={fmtKpiCount(flagCounts.studentAidRestrict)}
              sub="해당"
            />
            <DashboardKpiCard
              accent="red"
              title="임시이사"
              value={fmtKpiCount(flagCounts.provisionalBoard)}
              sub="해당"
            />
            <DashboardKpiCard
              accent="red"
              title="결산미제출"
              value={fmtKpiCount(flagCounts.noSettlement)}
              sub="해당"
            />
            <DashboardKpiCard
              accent="red"
              title="자금부족"
              value={fmtKpiCount(flagCounts.fundShortage)}
              sub="자금합계<0"
            />
          </div>
          {helpOpen ? (
            <HelpGuidePanel
              sections={FP_TARGET_UNIV_HELP}
              onClose={() => setHelpOpen(false)}
              eyebrow={FP_TARGET_UNIV_HELP_TITLE}
              title="대상대학 설정 규칙"
              description={FP_TARGET_UNIV_HELP_SUB}
            />
          ) : null}
          <section className="ctu-toolbar rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CohortTabBar
                  active={targetCohort}
                  univCount={univCount}
                  collegeCount={collegeCount}
                  onChange={(cohort) => {
                    setSchoolQuery("");
                    onCohort(cohort);
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <SchoolNameSearchInput
                    value={schoolQuery}
                    onSearch={setSchoolQuery}
                    className="shrink-0"
                    inputClassName={`h-7 w-36 rounded-md border border-border bg-surface-2 px-2 py-0 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                  />
                  <GlassHelpButton
                    active={helpOpen}
                    onClick={() => setHelpOpen((open) => !open)}
                  />
                </div>
              </div>
              {visibleRows.length === 0 ? (
                <p className={CHART_TYPO.bodyText}>
                  {q
                    ? "검색어에 맞는 학교가 없습니다. 학교명을 지운 뒤 Enter를 누르면 전체 목록이 다시 나옵니다."
                    : "표시할 대상대학이 없습니다."}
                </p>
              ) : (
                <CompetitivenessTargetUnivDataTable
                  rows={visibleRows.map(projectionTargetToUnivRow)}
                />
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "baseline" ? (
        <FpSectionCard contentClassName="space-y-6">
          {baselineHelpOpen ? (
            <HelpGuidePanel
              sections={fpBaselineHelp({
                analysisYear,
                settlementYear,
                endYear,
                indexBaseYear,
              })}
              onClose={() => setBaselineHelpOpen(false)}
              eyebrow={FP_BASELINE_HELP_TITLE}
              title="기초자료 산출 규칙"
              description={FP_BASELINE_HELP_SUB}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <IndicatorPickCard
                  title="대학현황에서 선정"
                  rows={univStatus}
                  onToggle={onToggleIndicator}
                />
                <IndicatorPickCard
                  title="재정분석지표에서 선정"
                  rows={finance}
                  onToggle={onToggleIndicator}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-accent-cyan">
                  계정분류 (교비자금 지출)
                </h3>
                <p className={`mt-1 ${FDB_TYPO.legend}`}>
                  수입은 등록금·맞춤형국가장학금·기타 3줄입니다. 지출 4계정은 3년·2년
                  평균 중 큰 값. 연구학생경비=변동비, 보수·관리운영비·교육외비용=고정비.
                </p>
                <div className="feam-table-wrap mt-3 rounded-lg border border-border/60">
                  <table
                    className={`w-full min-w-[480px] border-collapse ${FDB_TYPO.tableBody}`}
                  >
                    <thead>
                      <tr className="border-b border-border bg-surface-2">
                        {[
                          { label: "코드", align: "left" as const },
                          { label: "과목", align: "left" as const },
                          { label: "분류", align: "center" as const },
                        ].map((col) => (
                          <th
                            key={col.label}
                            className={fpTableHeadClass(col.align)}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEFAULT_ACCOUNT_MAP.map((row, i) => (
                        <tr
                          key={row.code}
                          className={`border-b border-border/40 ${
                            i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                          }`}
                        >
                          <td className={fpTableCellClass({ mono: true })}>
                            {row.code}
                          </td>
                          <td className={fpTableCellClass()}>{row.label}</td>
                          <td className={fpTableCellClass()}>
                            {CLASS_LABEL[row.costClass]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </HelpGuidePanel>
          ) : null}

          {baselineReady &&
          baselineUnivs.some((u) => u.nationalScholarship == null) ? (
            <p className={`${FDB_TYPO.legend} text-accent-orange`}>
              이전에 생성한 기초자료에는 맞춤형국가장학금이 없습니다. 기초자료를 다시
              생성한 뒤 분석을 실행하세요.
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
              <div className="ctu-toolbar flex flex-wrap items-center justify-between gap-2">
                <CohortTabBar
                  active={targetCohort}
                  univCount={baselineUnivTabCount}
                  collegeCount={baselineCollegeTabCount}
                  onChange={(cohort) => {
                    setSchoolQuery("");
                    onCohort(cohort);
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <SchoolNameSearchInput
                    value={schoolQuery}
                    onSearch={setSchoolQuery}
                    className="shrink-0"
                    inputClassName={`h-7 w-36 rounded-md border border-border bg-surface-2 px-2 py-0 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                  />
                  <GlassHelpButton
                    active={baselineHelpOpen}
                    onClick={() => setBaselineHelpOpen((open) => !open)}
                  />
                </div>
              </div>
              {baselineReady ? (
                <BaselineEditionSummary
                  analysisYear={analysisYear}
                  settlementYear={settlementYear}
                  endYear={endYear}
                  indexBaseYear={indexBaseYear}
                  cpiPct={cpiPct}
                  coverage={coverage}
                  rowCount={baselineUnivs.length}
                />
              ) : null}
              {includedMissingCount(includedCount, baselineUnivs) > 0 ? (
                <p className={FDB_TYPO.legend}>
                  결산·충원 매핑이 없는{" "}
                  {includedMissingCount(includedCount, baselineUnivs)}교는 생성
                  목록에서 빠집니다.
                </p>
              ) : null}
              {visibleBaseline.length === 0 ? (
                <p className={CHART_TYPO.bodyText}>
                  {q
                    ? "검색어에 맞는 학교가 없습니다. 학교명을 지운 뒤 Enter를 누르면 전체 목록이 다시 나옵니다."
                    : `${targetCohort} 기초자료가 없습니다.`}
                </p>
              ) : (
                <>
              <BaselineUnivTable
                rows={visibleBaseline}
                analysisYear={analysisYear}
                settlementYear={settlementYear}
                endYear={endYear}
                indexBaseYear={indexBaseYear}
              />
              <BaselineDataSourceChecks />
                </>
              )}
            </div>
        </FpSectionCard>
      ) : null}

      {tab === "scenario" ? (
        <ScenarioSection
          params={params}
          cpiPct={cpiPct}
          analysisYear={analysisYear}
          indexBaseYear={indexBaseYear}
          coverage={coverage}
          ageShift={ageShift}
          sidoLabel={sidoLabel}
          nationalMacro={nationalMacro}
          onApply={onApplyScenario}
          onPatch={onPatchParams}
          onCpiPct={onCpiPct}
        />
      ) : null}
    </div>
  );
}

function fmtSchoolAgeIdx(
  series: UnivBaseData["schoolAgeDecline"],
  year: number,
): string {
  const v = schoolAgeIndexAtYear(series, year);
  return v != null ? v.toFixed(1) : "—";
}

function fmtFixedPartEok(
  u: UnivBaseData,
  part: number | undefined,
): number | "—" {
  if (part != null && part > 0) return wonToEok(part);
  if (u.fixedCosts > 0) return "—";
  return wonToEok(0);
}

function BaselineEditionSummary({
  analysisYear,
  settlementYear,
  endYear,
  indexBaseYear,
  cpiPct,
  coverage,
  rowCount,
}: {
  analysisYear: number;
  settlementYear: number;
  endYear: number;
  indexBaseYear: number;
  cpiPct: number;
  coverage: { hasTargetRoster: boolean; hasSchoolAge: boolean };
  rowCount: number;
}) {
  const items = [
    { label: "분석연도", value: String(analysisYear) },
    { label: "결산연도", value: String(settlementYear) },
    { label: "전망 끝", value: String(endYear) },
    { label: "학령 기준연", value: `${indexBaseYear}(=100)` },
    { label: "물가(CPI)", value: `${cpiPct.toFixed(1)}%`, note: "시나리오 탭 공통" },
    { label: "생성 학교", value: `${rowCount.toLocaleString("ko-KR")}교` },
    {
      label: "학령 자료",
      value: coverage.hasSchoolAge ? "있음" : "없음",
      warn: !coverage.hasSchoolAge,
    },
    {
      label: "대상 명부",
      value: coverage.hasTargetRoster ? "있음" : "없음",
      warn: !coverage.hasTargetRoster,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border/60 bg-surface-2 px-3 py-2"
        >
          <p className={`${FDB_TYPO.legend} text-muted`}>{item.label}</p>
          <p
            className={`mt-0.5 font-mono text-sm tabular-nums ${
              item.warn ? "text-accent-orange" : "text-foreground"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function baselineSchoolAgeColumns(
  analysisYear: number,
  indexBaseYear: number,
  endYear: number,
): { id: string; label: string; year: number }[] {
  const forecastYear = analysisYear + 1;
  const cols: { id: string; label: string; year: number }[] = [
    {
      id: "school-age-base",
      label: `학령${indexBaseYear}(100)`,
      year: indexBaseYear,
    },
  ];
  if (forecastYear !== indexBaseYear) {
    cols.push({
      id: "school-age-forecast",
      label: `학령${forecastYear}`,
      year: forecastYear,
    });
  }
  const lastYear = cols[cols.length - 1]!.year;
  if (endYear !== lastYear) {
    cols.push({
      id: "school-age-end",
      label: `학령${endYear}`,
      year: endYear,
    });
  }
  return cols;
}

function BaselineUnivTable({
  rows,
  analysisYear,
  settlementYear,
  endYear,
  indexBaseYear,
}: {
  rows: UnivBaseData[];
  analysisYear: number;
  settlementYear: number;
  endYear: number;
  indexBaseYear: number;
}) {
  const schoolAgeCols = baselineSchoolAgeColumns(
    analysisYear,
    indexBaseYear,
    endYear,
  );
  const columns: {
    id: string;
    label: string;
    align: "left" | "center" | "right";
  }[] = [
    { id: "code", label: "코드", align: "left" },
    { id: "school", label: "학교", align: "left" },
    { id: "kind", label: "종류", align: "center" },
    { id: "region", label: "지역", align: "center" },
    { id: "program-years", label: "학제", align: "center" },
    { id: "grade", label: "경쟁력", align: "center" },
    { id: "reputation", label: "평판%", align: "right" },
    { id: "quota-total", label: "정원합", align: "right" },
    { id: "quota-ug", label: "학부정원", align: "right" },
    { id: "quota-gr", label: "대학원정원", align: "right" },
    { id: "students-total", label: "재학합", align: "right" },
    { id: "students-ug", label: "학부재학", align: "right" },
    { id: "students-gr", label: "대학원재학", align: "right" },
    { id: "fill-fresh-ug", label: "학부신입충원", align: "right" },
    { id: "fill-enrolled-ug", label: "학부재학충원", align: "right" },
    { id: "dropout-ug", label: "학부중탈", align: "right" },
    { id: "fill-fresh-gr", label: "대학원신입충원", align: "right" },
    { id: "fill-enrolled-gr", label: "대학원재학충원", align: "right" },
    { id: "dropout-gr", label: "대학원중탈", align: "right" },
    { id: "tuition-ug", label: "학부수업료", align: "right" },
    { id: "tuition-gr", label: "대학원수업료", align: "right" },
    {
      id: "tuition-settlement",
      label: `${settlementYear}교비`,
      align: "right",
    },
    {
      id: "tuition-analysis",
      label: `${analysisYear}추정`,
      align: "right",
    },
    { id: "scholarship", label: "국가장학", align: "right" },
    { id: "other-revenue", label: "기타수입", align: "right" },
    { id: "fixed-total", label: "고정비합", align: "right" },
    { id: "fixed-labor", label: "보수", align: "right" },
    { id: "fixed-admin", label: "관리운영", align: "right" },
    { id: "fixed-nonedu", label: "교육외", align: "right" },
    { id: "wage-cagr", label: "임금CAGR", align: "right" },
    { id: "variable-per", label: "변동비1인", align: "right" },
    { id: "variable-total", label: "변동비합", align: "right" },
    ...schoolAgeCols.map((col) => ({
      id: col.id,
      label: col.label,
      align: "right" as const,
    })),
    { id: "local-origin", label: "지역내%", align: "right" },
    { id: "liquidity", label: "가용", align: "right" },
  ];

  return (
    <div className="feam-table-wrap rounded-lg border border-border/60">
      <table
        className={`w-full min-w-[3200px] border-collapse ${FDB_TYPO.tableBody}`}
      >
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {columns.map((col) => (
              <th key={col.id} className={fpTableHeadClass(col.align)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => {
            const { undergrad, graduate } = resolveUnivSegments(u);
            const actualSettlement = (u.tuitionActuals ?? []).find(
              (row) => row.year === (u.settlementYear ?? settlementYear),
            );
            const estimateAnalysis =
              undergrad.currentStudents * undergrad.tuitionPerStudent +
              (graduate?.currentStudents ?? 0) *
                (graduate?.tuitionPerStudent ?? 0);
            const variableTotal =
              u.currentStudents * u.variableCostPerStudent;
            const metric = fpTableCellClass({ mono: true, right: true });
            const codeCell = fpTableCellClass({ mono: true });
            return (
              <tr
                key={u.schoolCodeStd}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
              >
                <td className={codeCell}>{u.schoolCodeStd}</td>
                <td className={fpTableCellClass({ school: true })}>
                  {u.schoolName}
                </td>
                <td className={fpTableCellClass()}>{u.schoolKind}</td>
                <td className={fpTableCellClass()}>{u.region}</td>
                <td className={fpTableCellClass({ mono: true, right: true })}>
                  {u.programYears}년
                </td>
                <td className={fpTableCellClass({ mono: true, right: true })}>
                  {u.compositeGrade}
                </td>
                <td className={metric}>
                  {(u.reputationRatio * 100).toFixed(1)}
                </td>
                <td className={metric}>
                  {u.quota.toLocaleString("ko-KR")}
                </td>
                <td className={metric}>
                  {undergrad.quota.toLocaleString("ko-KR")}
                </td>
                <td className={metric}>
                  {graduate ? graduate.quota.toLocaleString("ko-KR") : "—"}
                </td>
                <td className={metric}>
                  {u.currentStudents.toLocaleString("ko-KR")}
                </td>
                <td className={metric}>
                  {undergrad.currentStudents.toLocaleString("ko-KR")}
                </td>
                <td className={metric}>
                  {graduate
                    ? graduate.currentStudents.toLocaleString("ko-KR")
                    : "—"}
                </td>
                <td className={metric}>{undergrad.freshmanFillRatePct}%</td>
                <td className={metric}>{undergrad.enrolledFillRatePct}%</td>
                <td className={metric}>{undergrad.dropoutRatePct}%</td>
                <td className={metric}>
                  {graduate ? `${graduate.freshmanFillRatePct}%` : "—"}
                </td>
                <td className={metric}>
                  {graduate ? `${graduate.enrolledFillRatePct}%` : "—"}
                </td>
                <td className={metric}>
                  {graduate ? `${graduate.dropoutRatePct}%` : "—"}
                </td>
                <td className={metric}>
                  {(undergrad.tuitionPerStudent / 10000).toFixed(0)}만
                </td>
                <td className={metric}>
                  {graduate
                    ? `${(graduate.tuitionPerStudent / 10000).toFixed(0)}만`
                    : "—"}
                </td>
                <td className={metric}>
                  {actualSettlement
                    ? wonToEok(
                        actualSettlement.undergradWon +
                          actualSettlement.graduateWon,
                      )
                    : "—"}
                </td>
                <td className={metric}>{wonToEok(estimateAnalysis)}</td>
                <td className={metric}>
                  {wonToEok(u.nationalScholarship ?? 0)}
                </td>
                <td className={metric}>{wonToEok(u.otherRevenues)}</td>
                <td className={metric}>{wonToEok(u.fixedCosts)}</td>
                <td className={metric}>
                  {fmtFixedPartEok(u, u.fixedCostLabor)}
                </td>
                <td className={metric}>
                  {fmtFixedPartEok(u, u.fixedCostAdmin)}
                </td>
                <td className={metric}>
                  {fmtFixedPartEok(u, u.fixedCostNonEdu)}
                </td>
                <td className={metric}>{u.laborCostCagrPct.toFixed(1)}%</td>
                <td className={metric}>
                  {(u.variableCostPerStudent / 10000).toFixed(0)}만
                </td>
                <td className={metric}>{wonToEok(variableTotal)}</td>
                {schoolAgeCols.map((col) => (
                  <td key={col.id} className={metric}>
                    {fmtSchoolAgeIdx(u.schoolAgeDecline, col.year)}
                  </td>
                ))}
                <td className={metric}>
                  {(u.localOriginRatio * 100).toFixed(1)}
                </td>
                <td className={metric}>{wonToEok(u.usableLiquidity)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const DATA_CHECK_STATUS_LABEL: Record<
  "ok" | "warn" | "missing",
  string
> = {
  ok: "있음",
  warn: "참고",
  missing: "없음",
};

function BaselineDataSourceChecks() {
  return (
    <div className="space-y-2 border-t border-border/60 pt-4">
      <h3 className="text-sm font-semibold text-accent-cyan">
        원천자료 점검 (에디션 공통)
      </h3>
      <p className={FDB_TYPO.legend}>
        기초자료·시나리오·분석실행에 쓰이는 자료의 준비 상태입니다. 학교별
        표와 함께 확인하세요.
      </p>
      <div className="feam-table-wrap rounded-lg border border-border/60">
        <table
          className={`w-full min-w-[640px] border-collapse ${FDB_TYPO.tableBody}`}
        >
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {["원천", "연도", "상태", "비고"].map((label) => (
                <th key={label} className={fpTableHeadClass("left")}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_DATA_CHECKS.map((row, i) => (
              <tr
                key={row.source}
                className={`border-b border-border/40 ${
                  i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                }`}
              >
                <td className={fpTableCellClass()}>{row.source}</td>
                <td className={fpTableCellClass({ mono: true })}>
                  {row.years}
                </td>
                <td
                  className={`${fpTableCellClass()} ${
                    row.status === "ok"
                      ? "text-emerald-600"
                      : row.status === "warn"
                        ? "text-accent-orange"
                        : "text-rose-600"
                  }`}
                >
                  {DATA_CHECK_STATUS_LABEL[row.status]}
                </td>
                <td className={fpTableCellClass()}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function includedMissingCount(includedCount: number, baselineUnivs: UnivBaseData[]) {
  return Math.max(0, includedCount - baselineUnivs.length);
}

function IndicatorPickCard({
  title,
  rows,
  onToggle,
}: {
  title: string;
  rows: BaselineIndicatorPick[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-accent-cyan">{title}</h3>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-surface-2 px-3 py-2"
          >
            <label className="flex min-w-[160px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={row.selected}
                disabled={row.required}
                onChange={() => onToggle(row.id)}
              />
              {row.label}
            </label>
            <span className={FDB_TYPO.legend}>
              {row.group}
              {row.required ? " · 필수" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioSection({
  params,
  cpiPct,
  analysisYear,
  indexBaseYear,
  coverage,
  ageShift,
  sidoLabel,
  nationalMacro,
  onApply,
  onPatch,
  onCpiPct,
}: {
  params: SimulationParams;
  cpiPct: number;
  analysisYear: number;
  indexBaseYear: number;
  coverage: { hasTargetRoster: boolean; hasSchoolAge: boolean };
  ageShift: { year: number; index: number; weightedResource: number }[];
  sidoLabel: string;
  nationalMacro: MacroData;
  onApply: (s: SimulationScenario) => void;
  onPatch: (p: Partial<SimulationParams>) => void;
  onCpiPct: (v: number) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const fieldHelp = fpScenarioFieldHelp({ analysisYear, indexBaseYear });
  return (
    <div className="space-y-4">
      {helpOpen ? (
        <HelpGuidePanel
          sections={fpScenarioHelp({ analysisYear, indexBaseYear })}
          onClose={() => setHelpOpen(false)}
          eyebrow={FP_SCENARIO_HELP_TITLE}
          title="시나리오 가정과 추계 효과"
          description={FP_SCENARIO_HELP_SUB}
        />
      ) : null}
    <FpSectionCard
      description={`${analysisYear}년 시나리오는 대상대학 전체에 한 세트로 적용합니다. 물가인상률은 변동비(연구학생경비)만, 고정비는 기초자료 「임금 CAGR(%)」와 「고정비 절감」으로 전망합니다. 임금 CAGR은 기초자료 생성 시 보수 5개년에서 자동 계산되며 이 화면에서 학교별로 바꾸지 않습니다. 고정비 절감 0이면 절감 없이 고정비 전체가 임금 CAGR만큼 복리 증가합니다(물가 아님).`}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5"
            role="tablist"
            aria-label="시나리오"
          >
            {(["best", "base", "worst", "stress"] as const).map((s) => {
              const isActive = params.scenario === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onApply(s)}
                  className={`inline-flex h-[30px] items-center rounded px-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                      : "font-medium text-muted hover:text-foreground"
                  }`}
                >
                  {SCENARIO_LABEL[s]}
                </button>
              );
            })}
          </div>
          <GlassHelpButton
            active={helpOpen}
            onClick={() => setHelpOpen((open) => !open)}
          />
        </div>
      }
      contentClassName="mt-4 space-y-4"
    >
      {params.dropoutRateAddonPct ? (
        <p className={FDB_TYPO.legend}>
          {SCENARIO_LABEL[params.scenario]} 칩은 중도탈락 가산 {params.dropoutRateAddonPct}%p를
          엔진에 함께 넣습니다. 화면에 슬라이더는 없습니다.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
          <SliderControl
            label="물가인상률"
            value={cpiPct}
            min={0}
            max={6}
            step={0.1}
            suffix="%"
            hint="연간 %, 전체 대학 변동비에 동일 적용"
            help={fieldHelp.cpi}
            onChange={onCpiPct}
          />
        </div>
        <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
          <SliderControl
            label="등록금 인상률"
            value={params.tuitionIncreaseRatePct}
            min={0}
            max={5}
            step={0.5}
            suffix="%"
            help={fieldHelp.tuition}
            onChange={(v) => onPatch({ tuitionIncreaseRatePct: v })}
          />
        </div>
        <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
          <SliderControl
            label="정원 감축 (what-if)"
            value={params.quotaReductionRatePct}
            min={0}
            max={5}
            step={0.5}
            suffix="%/년"
            hint="중장기 계획 없음 · 전체 공통 가정"
            help={fieldHelp.quota}
            onChange={(v) => onPatch({ quotaReductionRatePct: v })}
          />
        </div>
        <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
          <SliderControl
            label="고정비 절감"
            value={params.fixedCostCutRatePct}
            min={0}
            max={8}
            step={0.5}
            suffix="%/년"
            help={fieldHelp.fixedCut}
            onChange={(v) => onPatch({ fixedCostCutRatePct: v })}
          />
        </div>
        <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
          <SliderControl
            label="충원율 가감"
            value={params.fillRateAdjPct}
            min={-10}
            max={10}
            step={0.5}
            suffix="%p"
            help={fieldHelp.fill}
            onChange={(v) => onPatch({ fillRateAdjPct: v })}
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-accent-cyan">
          기타수입 (국가장학금 제외)
        </h3>
        <p className={`mt-1 ${FDB_TYPO.legend}`}>
          기타<sub>t</sub> = 기준액 × (1+가산비율) × (1+증감률)<sup>τ</sup>.
          τ는 분석연도부터의 경과 연수입니다. 기본값: 기본 0%·0%, 낙관 0%·가산
          0%(직접 입력), 비관 −2%/년·0%, 한계 −5%/년·0%.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="기타수입 증감률"
              value={params.subsidyChangeRatePct}
              min={-20}
              max={20}
              step={0.1}
              suffix="%/년"
              hint="기본 0, 비관 −2, 한계 −5. 이듬해부터 복리."
              help={fieldHelp.otherRate}
              onChange={(v) => onPatch({ subsidyChangeRatePct: v })}
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
            <SliderControl
              label="기타수입 가산비율"
              value={params.otherRevenueBoostPct ?? 0}
              min={0}
              max={100}
              step={0.5}
              suffix="%"
              hint="기준액에 곱하는 가산. 전 대학 동일 비율(금액은 학교 기준액에 비례)."
              help={fieldHelp.otherBoost}
              onChange={(v) => onPatch({ otherRevenueBoostPct: v })}
            />
          </div>
        </div>
      </div>
      <div className="space-y-4 border-t border-border/60 pt-4">
        <p className="text-[13px] text-muted">
          등록금수입 전망: 소재 시도 학령인구 감소 지수({indexBaseYear}=100, {analysisYear}년
          18세=대입 자원). 지역소멸지수는 등록금 경로 미사용. 지출: 변동비=물가(CPI)×재학생,
          고정비=기초 고정비×(1+임금 CAGR)^τ×(1−고정비절감)^τ. 임금 CAGR은 기초자료 표에서
          확인(보수 5개년 자동 산출). 물가는 에디션 공통, 임금·고정비 기준액은 대학별.
        </p>
        {!coverage.hasSchoolAge ? (
          <p className={`${FDB_TYPO.legend} text-accent-orange`}>
            {analysisYear}년 학령인구(시도) 탭이 없습니다. 업로드 후 기초자료를 다시
            생성하세요.
          </p>
        ) : null}
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <FpInnerCard
            title={`학령인구 감소 지수 · ${sidoLabel} (${indexBaseYear}=100)`}
            description="대학별 추계는 소재 시도 지수를 씁니다. 아래는 전국(시도 입학자원가중) 참고 시계열입니다."
          >
            <div className="h-[220px] min-h-[220px] w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={220} debounce={200} minWidth={0}>
                <LineChart data={ageShift}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_THEME.grid}
                  />
                  <XAxis dataKey="year" tick={tickProps()} />
                  <YAxis tick={tickProps()} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="index"
                    name="학령지수"
                    stroke={YOY_BLUE}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FpInnerCard>
          <FpInnerCard
            title="지역소멸지수 (참고 · 미사용)"
            description="0~18세 코호트가 이미 관측되므로 등록금 전망에는 학령지수만 반영합니다."
          >
            <div className="h-[220px] min-h-[220px] w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={220} debounce={200} minWidth={0}>
                <LineChart data={nationalMacro.years}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_THEME.grid}
                  />
                  <XAxis dataKey="year" tick={tickProps()} />
                  <YAxis domain={[0, 1]} tick={tickProps()} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="extinctionIndex"
                    name="소멸지수"
                    stroke={CHART_THEME.rose}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FpInnerCard>
        </div>
      </div>
    </FpSectionCard>
    </div>
  );
}

const TUITION_TABLE_FORECAST_END = 2035;

function tuitionTableYears(settlementYear: number, analysisYear: number): number[] {
  const start = settlementYear - 2;
  const end = Math.max(TUITION_TABLE_FORECAST_END, analysisYear + 10);
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
}

function fmtTuitionEok(value: number | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtEnrolledCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.trunc(n).toLocaleString("ko-KR");
}

function enrolledByCodeFromTargets(targets: ProjectionTargetRow[]) {
  const map = new Map<string, number>();
  for (const target of targets) {
    if (target.enrolledTotal != null && !Number.isNaN(target.enrolledTotal)) {
      map.set(target.schoolCodeStd, target.enrolledTotal);
    }
  }
  return map;
}

function fpUnivProfile(
  univ: UnivBaseData,
  enrolledByCode: Map<string, number>,
) {
  const enrolled = enrolledByCode.get(univ.schoolCodeStd) ?? univ.currentStudents;
  return {
    enrolledLabel: fmtEnrolledCount(enrolled),
    scale:
      schoolScaleFromEnrolled(
        enrolled,
        univ.schoolKind === "전문대학" ? "전문대" : "4년제",
      ) ?? "—",
    region: sidoShortLabel(univ.region) || univ.region?.trim() || "—",
    zone: zoneForSido(univ.region) ?? "—",
  };
}

function countRiskStages(
  rows: {
    stage: { label: string };
  }[],
) {
  const counts = { 경영위기: 0, 경고: 0, 주의: 0, 정상: 0 };
  for (const row of rows) {
    const label = row.stage.label;
    if (label === "경영위기" || label === "경고" || label === "주의" || label === "정상") {
      counts[label] += 1;
    }
  }
  return counts;
}

function ExecuteSection({
  hasRun,
  analysisYear,
  settlementYear,
  cohort,
  targets,
  batchRows,
  batchProgress,
  onOpenLookup,
}: {
  hasRun: boolean;
  analysisYear: number;
  settlementYear: number;
  cohort: TargetCohort;
  targets: ProjectionTargetRow[];
  batchRows: {
    univ: UnivBaseData;
    result: ProjectionResult;
    stage: ReturnType<typeof riskStage>;
  }[];
  batchProgress: { done: number; total: number; running: boolean };
  onOpenLookup: (code: string) => void;
}) {
  const [schoolQuery, setSchoolQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [tuitionTableOpen, setTuitionTableOpen] = useState(false);
  const enrolledByCode = useMemo(
    () => enrolledByCodeFromTargets(targets),
    [targets],
  );

  useEffect(() => {
    setSchoolQuery("");
  }, [cohort]);
  const years = tuitionTableYears(settlementYear, analysisYear);
  const actualYears = years.filter((year) => year < analysisYear);
  const forecastYears = years.filter((year) => year > analysisYear);
  const cohortRows = batchRows.filter((row) => row.univ.schoolKind === cohort);
  const q = schoolQuery.trim().toLowerCase();
  const summaryRows = (
    q
      ? cohortRows.filter((row) => row.univ.schoolName.toLowerCase().includes(q))
      : cohortRows
  )
    .slice()
    .sort((a, b) => a.univ.schoolName.localeCompare(b.univ.schoolName, "ko"));
  const summaryVirtual = useVirtualizedRows(summaryRows.length);
  const visibleSummary = summaryVirtual.slice(summaryRows);
  const riskCounts = countRiskStages(cohortRows);
  const countsReady = hasRun && !batchProgress.running && batchRows.length > 0;
  const kpiCount = (n: number) =>
    countsReady ? `${fmtKpiCount(n)}교` : "—";
  const crisisUntil = analysisYear + RISK_NEAR_HORIZON_YEARS;
  const warnFrom = analysisYear + RISK_NEAR_HORIZON_YEARS + 1;
  const warnUntil = analysisYear + RISK_MID_HORIZON_YEARS;

  function exportSummary(format: "csv" | "xlsx") {
    const aoa: ExportCell[][] = [
      ["학교", "재학생수", "규모", "지역", "권역", "위험단계", "손익적자", "가용고갈"],
      ...summaryRows.map(({ univ, result, stage }) => {
        const meta = fpUnivProfile(univ, enrolledByCode);
        return [
          univ.schoolName,
          meta.enrolledLabel,
          meta.scale,
          meta.region,
          meta.zone,
          stage.label,
          yearOrDash(result.operatingLossYear),
          yearOrDash(result.liquidityDepletionYear),
        ];
      }),
    ];
    const kind = cohort === "대학" ? "university" : "junior_college";
    const filename = `financial_projection_${analysisYear}_${kind}.${format === "csv" ? "csv" : "xlsx"}`;
    if (format === "csv") {
      downloadExportCsv(filename, aoa);
    } else {
      downloadExportXlsx(filename, aoa, "실행결과요약");
    }
  }

  return (
    <div className="space-y-4">
      <div className="fpm-kpi-grid">
        <div className="fpm-kpi">
          <p className={FDB_TYPO.legend}>경영위기</p>
          <p className="fpm-kpi-value text-[#e11d48]">{kpiCount(riskCounts.경영위기)}</p>
          <p className="fpm-kpi-caption">{crisisUntil}년 내 적자·고갈</p>
        </div>
        <div className="fpm-kpi">
          <p className={FDB_TYPO.legend}>경고</p>
          <p className="fpm-kpi-value text-[#b45309]">{kpiCount(riskCounts.경고)}</p>
          <p className="fpm-kpi-caption">
            {warnFrom}~{warnUntil}년 고갈
          </p>
        </div>
        <div className="fpm-kpi">
          <p className={FDB_TYPO.legend}>주의</p>
          <p className="fpm-kpi-value text-[#9a5b00]">{kpiCount(riskCounts.주의)}</p>
          <p className="fpm-kpi-caption">이후 고갈 또는 운영적자</p>
        </div>
        <div className="fpm-kpi">
          <p className={FDB_TYPO.legend}>정상</p>
          <p className="fpm-kpi-value text-[#157a4a]">{kpiCount(riskCounts.정상)}</p>
          <p className="fpm-kpi-caption">고갈·적자 없음</p>
        </div>
      </div>
      {!hasRun ? (
        <p className={CHART_TYPO.bodyText}>
          시나리오 탭에서 분석실행을 누르면 결과가 여기에 표시됩니다. 이 화면에서는
          저장된 값만 조회합니다.
        </p>
      ) : null}
      {hasRun && batchProgress.running ? (
        <p className={CHART_TYPO.bodyText}>
          분석실행 저장 중 {batchProgress.done.toLocaleString("ko-KR")} /{" "}
          {batchProgress.total.toLocaleString("ko-KR")} (낙관·기본·비관·한계)
        </p>
      ) : null}
      {hasRun && !batchProgress.running && !batchRows.length ? (
        <p className={CHART_TYPO.bodyText}>
          저장된 분석결과가 없습니다. 기본설정 시나리오 탭에서 분석실행을 다시 눌러
          주세요.
        </p>
      ) : null}
      {hasRun && !batchProgress.running && batchRows.length ? (
        <>
        {helpOpen ? (
          <HelpGuidePanel
            sections={fpRunResultsHelp(analysisYear)}
            onClose={() => setHelpOpen(false)}
            eyebrow={FP_RUN_RESULTS_HELP_TITLE}
            title="분석결과 조회"
            description={FP_RUN_RESULTS_HELP_SUB}
          />
        ) : null}
        <div
          ref={summaryVirtual.wrapRef}
          className="fpm-chart-card max-h-[70vh] overflow-auto"
        >
          <div className="flex flex-wrap items-center justify-end gap-1.5">
              <SchoolNameSearchInput
                value={schoolQuery}
                onSearch={setSchoolQuery}
                className="shrink-0"
              />
              <button
                type="button"
                onClick={() => exportSummary("csv")}
                disabled={summaryRows.length === 0}
                className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => exportSummary("xlsx")}
                disabled={summaryRows.length === 0}
                className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
              >
                Excel
              </button>
              <GlassHelpButton
                active={helpOpen}
                onClick={() => setHelpOpen((open) => !open)}
                size="sm"
              />
          </div>
          <table className="fpm-summary-table mt-3 w-full min-w-[920px] text-left text-sm">
            <colgroup>
              <col className="fpm-summary-col-school" />
              <col className="fpm-summary-col-enrolled" />
              <col className="fpm-summary-col-meta" />
              <col className="fpm-summary-col-meta" />
              <col className="fpm-summary-col-meta" />
              <col className="fpm-summary-col-result" />
              <col className="fpm-summary-col-result" />
              <col className="fpm-summary-col-result" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base} text-left`}>
                  학교
                </th>
                <th className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base} fpm-summary-enrolled`}>
                  재학생수
                </th>
                {["규모", "지역", "권역", "위험단계", "손익적자", "가용고갈"].map((h) => (
                  <th
                    key={h}
                    className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base} text-center`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryRows.length ? (
                <>
                  <VirtualPadRow colSpan={8} height={summaryVirtual.topPad} />
                  {visibleSummary.map(({ univ, result, stage }) => {
                const meta = fpUnivProfile(univ, enrolledByCode);
                return (
                <tr key={univ.schoolCodeStd} className="border-b border-border/60">
                  <td className={`${FDB_TABLE.cell} ${FDB_TABLE_COLOR.schoolName} truncate`}>
                    <button
                      type="button"
                      className="block w-full truncate text-left font-bold text-[#1a5c3a] hover:underline"
                      onClick={() => onOpenLookup(univ.schoolCodeStd)}
                      title={univ.schoolName}
                    >
                      {univ.schoolName}
                    </button>
                  </td>
                  <td className={`${FDB_TABLE.cell} fpm-summary-enrolled font-mono`}>
                    {meta.enrolledLabel}
                  </td>
                  <td className={`${FDB_TABLE.cell} text-center`}>{meta.scale}</td>
                  <td className={`${FDB_TABLE.cell} text-center`}>{meta.region}</td>
                  <td className={`${FDB_TABLE.cell} text-center`}>{meta.zone}</td>
                  <td className={`${FDB_TABLE.cell} text-center`}>
                    <span className="inline-flex justify-center">
                      <RiskStageChip stage={stage} />
                    </span>
                  </td>
                  <td className={`${FDB_TABLE.cell} text-center`}>
                    {yearOrDash(result.operatingLossYear)}
                  </td>
                  <td className={`${FDB_TABLE.cell} text-center`}>
                    {yearOrDash(result.liquidityDepletionYear)}
                  </td>
                </tr>
                );
                  })}
                  <VirtualPadRow colSpan={8} height={summaryVirtual.bottomPad} />
                </>
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className={`${FDB_TABLE.cell} py-8 text-center text-muted`}
                  >
                    {q
                      ? "검색어에 맞는 학교가 없습니다. 학교명을 지운 뒤 Enter를 누르면 전체 목록이 다시 나옵니다."
                      : `${cohort} 실행 결과가 없습니다.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="fpm-chart-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={CHART_TYPO.panelTitle}>대학별 등록금수입 추계</h3>
              <p className={`mt-1 ${CHART_TYPO.panelMeta}`}>
                단위 억 원. {actualYears[0]}~{settlementYear}년은 교비 학부생수업료[1008]+대학원생수업료[1009]
                ({ROW_KIND_LABEL.actual}), {analysisYear}년은 재학생충원율 재학생(계)×가중평균수업료
                ({ROW_KIND_LABEL.estimate}), {analysisYear + 1}~{years.at(-1)}년은
                학령지수 전망({ROW_KIND_LABEL.forecast}). 표는 {years.at(-1)}년까지입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTuitionTableOpen((open) => !open)}
              className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
            >
              {tuitionTableOpen ? "표 닫기" : "표 열기"}
            </button>
          </div>
          {tuitionTableOpen ? (
          <div className="mt-3 max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[1480px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className={`sticky left-0 top-0 z-30 border-b border-r border-border bg-surface-2 ${FDB_TABLE.headRowSpan} ${FDB_TABLE_HEAD.rowSpan} ${FDB_TABLE.schoolNameCol}`}
                  >
                    학교
                  </th>
                  <th
                    rowSpan={2}
                    className={`sticky top-0 z-20 border-b border-r border-border bg-surface-2 text-right ${FDB_TABLE.headRowSpan} ${FDB_TABLE_HEAD.rowSpan}`}
                  >
                    재학생수
                  </th>
                  {["규모", "지역", "권역"].map((h) => (
                    <th
                      key={h}
                      rowSpan={2}
                      className={`sticky top-0 z-20 border-b border-r border-border bg-surface-2 text-center ${FDB_TABLE.headRowSpan} ${FDB_TABLE_HEAD.rowSpan}`}
                    >
                      {h}
                    </th>
                  ))}
                  {actualYears.length ? (
                    <th
                      colSpan={actualYears.length}
                      className={`sticky top-0 z-10 border-b border-r border-border bg-surface-2 text-center ${FDB_TABLE.headGroup} ${FDB_TABLE_HEAD.base}`}
                    >
                      결산 등록금수입
                    </th>
                  ) : null}
                  <th
                    className={`sticky top-0 z-10 border-b border-r border-border bg-surface-2 text-center ${FDB_TABLE.headGroup} ${FDB_TABLE_HEAD.base}`}
                  >
                    추정
                  </th>
                  {forecastYears.length ? (
                    <th
                      colSpan={forecastYears.length}
                      className={`sticky top-0 z-10 border-b border-border bg-surface-2 text-center ${FDB_TABLE.headGroup} ${FDB_TABLE_HEAD.base}`}
                    >
                      전망 등록금수입
                    </th>
                  ) : null}
                </tr>
                <tr>
                  {years.map((year) => (
                    <th
                      key={year}
                      className={`sticky top-8 z-10 min-w-[72px] border-b border-border bg-surface-2 text-right font-mono ${FDB_TABLE.headSub} ${FDB_TABLE_HEAD.base} ${
                        year === analysisYear ? "text-accent" : ""
                      }`}
                    >
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryRows.map(({ univ, result }, i) => {
                  const byYear = result.tuitionByYear
                    ?? Object.fromEntries(
                      result.rows.map((row) => [row.year, row.tuitionRevenueEok]),
                    );
                  const stripe = i % 2 === 0 ? "bg-surface" : "bg-surface-2/30";
                  const meta = fpUnivProfile(univ, enrolledByCode);
                  return (
                    <tr key={univ.schoolCodeStd} className={`border-b border-border/60 ${stripe}`}>
                      <td
                        className={`sticky left-0 z-10 border-r border-border/60 ${stripe} ${FDB_TABLE.cellSticky} ${FDB_TABLE.schoolNameCol} ${FDB_TABLE_COLOR.schoolName}`}
                      >
                        {univ.schoolName}
                      </td>
                      <td className={`${FDB_TABLE.cell} border-r border-border/40 text-right font-mono tabular-nums`}>
                        {meta.enrolledLabel}
                      </td>
                      <td className={`${FDB_TABLE.cell} border-r border-border/40 text-center`}>
                        {meta.scale}
                      </td>
                      <td className={`${FDB_TABLE.cell} border-r border-border/40 text-center`}>
                        {meta.region}
                      </td>
                      <td className={`${FDB_TABLE.cell} border-r border-border/40 text-center`}>
                        {meta.zone}
                      </td>
                      {years.map((year) => (
                        <td
                          key={year}
                          className={`${FDB_TABLE.cell} text-right font-mono ${
                            year === analysisYear ? "font-semibold text-accent" : ""
                          }`}
                        >
                          {fmtTuitionEok(byYear[year])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          ) : null}
          <p className={`mt-2 ${CHART_TYPO.legend}`}>
            {cohort} {cohortRows.length.toLocaleString("ko-KR")}교 · 결산 자료가 없는 연도는
            — 로 표시합니다.
          </p>
        </div>
        </>
      ) : null}
    </div>
  );
}
