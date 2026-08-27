"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassActionButton } from "@/components/analysis/GlassHelpButton";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { useAccessRole } from "@/components/auth/AccessRoleProvider";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import {
  buildStudentFillActions,
  buildStudentFillDiagnosis,
  type StudentFillUniversityReport,
} from "@/lib/analysis/student-fill-analysis/diagnosis";
import { sfaFillStage } from "@/lib/analysis/student-fill-analysis/fill-stage";
import type { StudentFillSchoolRow } from "@/lib/analysis/student-fill-analysis/types";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import {
  FpAnalysisYearBar,
  RiskStageChip,
  SlimTabs,
} from "@/app/mockups/competitiveness-analysis/financial-projection/fpm-shared";

import "@/components/analysis/glass-help-button.css";
import "@/components/analysis/competitiveness-analysis/run-export-buttons.css";
import "@/components/analysis/competitiveness-analysis/university-competitiveness-dashboard.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/financial-projection-ui-mock.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/university/fp-university-lookup-mock.css";

type LookupTab = "result" | "diagnosis" | "action";
type TrendPoint = StudentFillSchoolRow & { year: number };
type MergedTrendPoint = TrendPoint & {
  nationalRateAll?: number | null;
  nationalEnrolledFillRate?: number | null;
  nationalDropoutRate?: number | null;
  nationalForeignShare?: number | null;
};

function fmtCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.trunc(n).toLocaleString("ko-KR")}명`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function establishmentBadgeClass(establishment: string) {
  if (establishment.includes("국립") || establishment === "공립") {
    return "border-sky-600/50 bg-sky-100 font-semibold text-sky-800";
  }
  if (establishment === "사립") {
    return "border-orange-600/55 bg-orange-100 font-semibold text-orange-800";
  }
  return "border-border bg-surface-2 font-medium text-foreground";
}

function handleSchoolListWheel(event: React.WheelEvent<HTMLDivElement>) {
  const element = event.currentTarget;
  const canScrollUp = element.scrollTop > 0;
  const canScrollDown =
    element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  if ((event.deltaY < 0 && canScrollUp) || (event.deltaY > 0 && canScrollDown)) {
    event.stopPropagation();
  }
}

function filterSchools(
  universities: StudentFillSchoolRow[],
  schoolKind: SchoolKindFilter,
  selectedSidoId: string | null,
  searchQuery: string,
) {
  const kindLabel = schoolKind === "junior-college" ? "전문대학" : "대학";
  let rows = universities.filter((row) => row.schoolDivision === kindLabel);
  if (selectedSidoId) {
    const sido = KOREA_SIDO_REGIONS.find((region) => region.id === selectedSidoId);
    if (sido) rows = rows.filter((row) => row.region === sido.shortLabel);
  }
  const query = searchQuery.trim().toLowerCase();
  if (query) {
    rows = rows.filter(
      (row) =>
        row.schoolName.toLowerCase().includes(query) ||
        row.schoolCodeStd.toLowerCase().includes(query),
    );
  }
  return [...rows].sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));
}

function MetricGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2">
          <dt className={FDB_TYPO.legend}>{k}</dt>
          <dd className="mt-0.5 text-lg font-bold text-emerald-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function printHtml(html: string) {
  const popup = window.open("", "_blank");
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}

export function StudentFillUniversityPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessRole = useAccessRole();
  const canGenerate = accessRole === "admin";
  const yearParam = Number(searchParams.get("year"));
  const yearFromUrl = Number.isInteger(yearParam) && yearParam >= 2000 ? yearParam : null;
  const codeParam = searchParams.get("code") ?? "";

  const [years, setYears] = useState<number[]>([]);
  const [analysisYear, setAnalysisYear] = useState<number | null>(yearFromUrl);
  const [schools, setSchools] = useState<StudentFillSchoolRow[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [kindCounts, setKindCounts] = useState({ university: 0, juniorCollege: 0 });
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [selectedSidoId, setSelectedSidoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState(codeParam);
  const [lookupTab, setLookupTab] = useState<LookupTab>("result");
  const [trend, setTrend] = useState<MergedTrendPoint[]>([]);
  const [report, setReport] = useState<StudentFillUniversityReport | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const qs = analysisYear != null ? `?year=${analysisYear}` : "";
    setLoading(true);
    fetch(`/api/student-fill-analysis/university${qs}`)
      .then(async (res) => {
        const body = (await res.json()) as {
          years?: number[];
          analysisYear?: number | null;
          lastRunAt?: string | null;
          universityCount?: number;
          juniorCollegeCount?: number;
          schools?: StudentFillSchoolRow[];
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "대학별분석을 불러오지 못했습니다.");
        setYears(body.years ?? []);
        if (body.analysisYear) setAnalysisYear(body.analysisYear);
        setLastRunAt(body.lastRunAt ?? null);
        setKindCounts({
          university: body.universityCount ?? 0,
          juniorCollege: body.juniorCollegeCount ?? 0,
        });
        setSchools(body.schools ?? []);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "대학별분석을 불러오지 못했습니다.");
        setSchools([]);
      })
      .finally(() => setLoading(false));
  }, [analysisYear]);

  useEffect(() => {
    if (!analysisYear || !selectedCode) {
      setTrend([]);
      setReport(null);
      return;
    }
    const qs = `?year=${analysisYear}&code=${encodeURIComponent(selectedCode)}`;
    fetch(`/api/student-fill-analysis/university${qs}`)
      .then(async (res) => {
        const body = (await res.json()) as {
          trend?: TrendPoint[];
          nationalTrend?: any[];
          report?: StudentFillUniversityReport | null;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "시계열을 불러오지 못했습니다.");
        
        const merged: MergedTrendPoint[] = (body.trend ?? []).map((t) => {
          const nat = body.nationalTrend?.find((n) => n.year === t.year);
          return {
            ...t,
            nationalRateAll: nat?.rateAll ?? null,
            nationalEnrolledFillRate: nat?.enrolledFillRate ?? null,
            nationalDropoutRate: nat?.dropoutRate ?? null,
            nationalForeignShare: nat?.foreignShare ?? null,
          };
        });
        
        setTrend(merged);
        setReport(body.report ?? null);
      })
      .catch(() => {
        setTrend([]);
        setReport(null);
      });
  }, [analysisYear, selectedCode]);

  const filteredSchools = useMemo(
    () => filterSchools(schools, schoolKind, selectedSidoId, searchQuery),
    [schools, schoolKind, selectedSidoId, searchQuery],
  );

  const selectedUniv =
    schools.find((row) => row.schoolCodeStd === selectedCode) ??
    filteredSchools[0] ??
    null;

  useEffect(() => {
    if (!selectedUniv) return;
    const next = selectedUniv.schoolDivision === "전문대학" ? "junior-college" : "university";
    setSchoolKind((prev) => (prev === next ? prev : next));
  }, [selectedUniv]);

  useEffect(() => {
    if (filteredSchools.some((row) => row.schoolCodeStd === selectedCode)) return;
    if (filteredSchools[0]) setSelectedCode(filteredSchools[0].schoolCodeStd);
  }, [filteredSchools, selectedCode]);

  function syncUrl(year: number, code: string) {
    const params = new URLSearchParams();
    params.set("year", String(year));
    if (code) params.set("code", code);
    router.replace(`/analysis/student-fill-analysis/university?${params.toString()}`);
  }

  function changeYear(next: number) {
    setAnalysisYear(next);
    setReportOpen(false);
    syncUrl(next, selectedCode);
  }

  function changeSchoolKind(kind: SchoolKindFilter) {
    setSchoolKind(kind);
    const rows = filterSchools(schools, kind, selectedSidoId, searchQuery);
    if (rows[0]) {
      setSelectedCode(rows[0].schoolCodeStd);
      if (analysisYear) syncUrl(analysisYear, rows[0].schoolCodeStd);
    }
  }

  async function generateReport() {
    if (!analysisYear || !selectedUniv || !canGenerate) return;
    setGenerating(true);
    setReportError(null);
    try {
      const res = await fetch("/api/student-fill-analysis/university-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisYear,
          schoolCodeStd: selectedUniv.schoolCodeStd,
        }),
      });
      const body = (await res.json()) as {
        report?: StudentFillUniversityReport;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "보고서를 생성하지 못했습니다.");
      if (body.report) {
        setReport(body.report);
        setReportOpen(true);
        setLookupTab("diagnosis");
      }
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : "보고서를 생성하지 못했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  const year = analysisYear ?? years[0] ?? 2025;
  const selectedSido = KOREA_SIDO_REGIONS.find((region) => region.id === selectedSidoId);
  const selectedZone = selectedUniv ? zoneForSido(selectedUniv.region) : null;
  const selectedScale = selectedUniv
    ? schoolScaleFromEnrolled(
        selectedUniv.enrolledTotal,
        selectedUniv.schoolDivision === "전문대학" ? "전문대" : "4년제",
      )
    : null;
  const selectedStage =
    selectedUniv?.rateAll != null ? sfaFillStage(selectedUniv.rateAll) : null;
  const diagnosis = selectedUniv ? buildStudentFillDiagnosis(selectedUniv) : [];
  const actions = selectedUniv ? buildStudentFillActions(selectedUniv) : [];
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="학생충원분석"
        title="대학별분석"
        subtitle="좌측 목록에서 대학을 고르고 분석결과 · 진단 · 대응과제를 봅니다"
        note={
          lastRunAt
            ? `${year}년 실행 · ${lastRunAt} · 충원·재적·외국인 ${year}년 · 탈락 ${year - 1}년`
            : "기본설정에서 분석실행하면 이 화면에 저장됩니다."
        }
      />

      <FpAnalysisYearBar
        analysisYear={year}
        availableYears={years.length ? years : [year]}
        settlementYear={year - 1}
        endYear={year}
        hasRun={Boolean(lastRunAt)}
        showYearMeta={false}
        showAddYear={false}
        onAddYear={() => undefined}
        onChange={changeYear}
        afterStatus={
          <span className={FDB_TYPO.legend}>
            충원·재적·외국인 {year}년 · 탈락 {year - 1}년
          </span>
        }
      />

      {loadError ? <p className={`${FDB_TYPO.legend} text-danger`}>{loadError}</p> : null}

      {!loading && schools.length === 0 ? (
        <p className={`rounded-lg border border-border bg-surface-2 px-4 py-6 ${FDB_TYPO.bodyText}`}>
          {year}년 저장된 분석결과가 없습니다.{" "}
          <Link
            href="/analysis/student-fill-analysis/settings"
            className="font-medium text-accent hover:underline"
          >
            기본설정에서 분석실행
          </Link>
          을 누르면 대학별분석이 채워집니다.
        </p>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedSidoId(null)}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              !selectedSidoId
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            전국
          </button>
          {KOREA_SIDO_REGIONS.map((sido) => (
            <button
              key={sido.id}
              type="button"
              onClick={() => setSelectedSidoId(sido.id)}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                selectedSidoId === sido.id
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {sido.shortLabel}
            </button>
          ))}
          <div className="ml-auto w-full min-w-[180px] max-w-xs shrink-0 sm:w-56">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="대학 검색"
              className="h-[30px] w-full rounded-md border border-border bg-surface-2 px-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[324px_minmax(0,1fr)] lg:items-start">
          <aside className="flex max-h-[50vh] min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-[calc(100dvh-13rem)] lg:max-h-[780px]">
            <div className="border-b border-border px-4 py-3">
              <div className="ucm-school-list-header">
                <div className="min-w-0">
                  <h2 className="font-semibold text-accent-cyan">
                    <span className="block text-base">대학 목록</span>
                    <span className="text-sm">
                      ({selectedSido ? selectedSido.label : "전국"}·
                      {filteredSchools.length.toLocaleString("ko-KR")}건)
                    </span>
                  </h2>
                </div>
                <SchoolKindTabBar
                  active={schoolKind}
                  universityCount={kindCounts.university}
                  juniorCollegeCount={kindCounts.juniorCollege}
                  onChange={changeSchoolKind}
                  ariaLabel="대학별분석 학교종류"
                />
              </div>
            </div>
            <div
              ref={listRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2"
              onWheel={handleSchoolListWheel}
            >
              <ul className="m-0 list-none space-y-1 p-0">
                {filteredSchools.map((univ) => {
                  const active = selectedUniv?.schoolCodeStd === univ.schoolCodeStd;
                  const stage = univ.rateAll != null ? sfaFillStage(univ.rateAll) : null;
                  return (
                    <li key={univ.schoolCodeStd}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCode(univ.schoolCodeStd);
                          setReportOpen(false);
                          if (analysisYear) syncUrl(analysisYear, univ.schoolCodeStd);
                        }}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? "border-accent-cyan/50 bg-accent/10"
                            : "border-transparent bg-surface-2/40 hover:border-border hover:bg-surface-2"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-accent-cyan">{univ.schoolName}</p>
                            <p className="mt-0.5 truncate text-[13px] text-[#92400e]">
                              {univ.region} · {fmtCount(univ.enrolledTotal)}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${establishmentBadgeClass(univ.estb)}`}>
                            {univ.estb}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-[#db2777]">
                            <span>내외 {fmtPct(univ.rateAll)}</span>
                            <span>· 모집 {fmtPct(univ.recruitChange)}</span>
                          </p>
                          {stage ? <RiskStageChip stage={stage} /> : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <div className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface p-4 lg:h-[calc(100dvh-13rem)] lg:max-h-[780px]">
            {selectedUniv ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="fpm-univ-tab-stack">
                  <div className="fpm-univ-tab-row">
                    <span className="fpm-univ-tab-label">조회</span>
                    <SlimTabs
                      ariaLabel="대학별분석 탭"
                      active={lookupTab}
                      onChange={setLookupTab}
                      tabs={[
                        { id: "result", label: "분석결과" },
                        { id: "diagnosis", label: "진단" },
                        { id: "action", label: "대응과제" },
                      ]}
                    />
                    <div className="ml-auto flex flex-wrap items-center gap-1.5">
                      <GlassActionButton
                        tone="green"
                        disabled={!canGenerate || generating}
                        onClick={() => void generateReport()}
                      >
                        {generating ? "생성 중…" : "보고서 생성"}
                      </GlassActionButton>
                      <button
                        type="button"
                        className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
                        onClick={() => setReportOpen(true)}
                        disabled={!report}
                      >
                        화면보기
                      </button>
                      <button
                        type="button"
                        className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
                        disabled={!report}
                        onClick={() => {
                          if (report) printHtml(report.html);
                        }}
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                </div>

                {reportError ? (
                  <p className={`mt-2 ${FDB_TYPO.legend} text-danger`}>{reportError}</p>
                ) : null}
                {!canGenerate ? (
                  <p className={`mt-2 ${FDB_TYPO.legend}`}>보고서 생성은 관리자만 할 수 있습니다. 저장된 보고서는 화면보기·PDF로 볼 수 있습니다.</p>
                ) : null}

                <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain pr-1">
                  <section className="rounded-xl border border-accent/40 bg-[var(--glow-panel-kpi)] p-5 shadow-[var(--glow-inset)]">
                    <p className="text-xs font-medium text-accent-cyan">
                      {year}년 분석 · {selectedZone ?? "권역 미분류"} · 학위(A) 기본
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">{selectedUniv.schoolName}</h2>
                        <p className="mt-1 text-sm text-muted">
                          {selectedUniv.region} · {fmtCount(selectedUniv.enrolledTotal)}
                          {selectedScale ? ` · ${selectedScale}` : ""}
                          {` · ${selectedUniv.estb}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-6 text-center">
                        <div>
                          <p className="flex justify-center">
                            {selectedStage ? <RiskStageChip stage={selectedStage} /> : null}
                          </p>
                          <p className={`mt-1 ${FDB_TYPO.legend}`}>충원단계</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-accent-orange">{fmtPct(selectedUniv.rateAll)}</p>
                          <p className={FDB_TYPO.legend}>정원내외 충원율</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-accent">{fmtPct(selectedUniv.enrolledFillRate)}</p>
                          <p className={FDB_TYPO.legend}>재학생충원율</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{fmtPct(selectedUniv.foreignShare)}</p>
                          <p className={FDB_TYPO.legend}>학위외국인 비중</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {lookupTab === "result" ? (
                    <>
                      <div className="sticky top-0 z-10 -mx-1 mb-2 flex flex-wrap gap-2 bg-surface/95 px-1 py-2 backdrop-blur">
                        <button onClick={() => document.getElementById('sec-roster')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-surface-3 transition-colors">재적현황</button>
                        <button onClick={() => document.getElementById('sec-freshman')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-surface-3 transition-colors">신입생충원</button>
                        <button onClick={() => document.getElementById('sec-enrolled')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-surface-3 transition-colors">재학·탈락</button>
                        <button onClick={() => document.getElementById('sec-foreign')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-surface-3 transition-colors">외국인</button>
                        <button onClick={() => document.getElementById('sec-summary')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-surface-3 transition-colors">종합</button>
                      </div>
                      <section id="sec-roster" className="scroll-mt-14 rounded-xl border border-border p-4">
                        <h3 className="text-sm font-semibold">재적현황</h3>
                      <p className={`mt-1 ${FDB_TYPO.legend}`}>
                        재학생(A) + 휴학(B) + 학사학위취득유예(C) = 재적(D). 재학생(충원)은 상반기 재학생충원입니다.
                      </p>
                      <div className="mt-4">
                        <MetricGrid
                          items={[
                            ["재학생(충원)", fmtCount(selectedUniv.enrolledFill)],
                            ["정원외 재학생", fmtCount(selectedUniv.enrolledOutside)],
                            ["정원외 재학생 비중", fmtPct(selectedUniv.enrolledOutShare)],
                            ["휴학생", fmtCount(selectedUniv.leaveCount)],
                            ["학사학위취득유예", fmtCount(selectedUniv.deferCount)],
                            ["재적학생", fmtCount(selectedUniv.rosterTotal)],
                            ["휴학 비중", fmtPct(selectedUniv.leaveShare)],
                            ["유예 비중", fmtPct(selectedUniv.deferShare)],
                          ]}
                        />
                      </div>
                    </section>

                    <section id="sec-freshman" className="scroll-mt-14 rounded-xl border border-border p-4">
                      <h3 className="text-sm font-semibold">신입생충원</h3>
                      <div className="mt-3 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="rateAll" name="정원내외충원율" stroke="#2a7a55" connectNulls dot={false} />
                            <Line type="monotone" dataKey="nationalRateAll" name="동일집단 충원율" stroke="#2a7a55" strokeDasharray="3 3" connectNulls dot={false} />
                            <Line type="monotone" dataKey="rateIn" name="정원내충원율" stroke="#3B82F6" connectNulls dot={false} />
                            <Line type="monotone" dataKey="outShare" name="정원외비중" stroke="#d97706" connectNulls dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4">
                        <MetricGrid
                          items={[
                            ["정원내 모집", fmtCount(selectedUniv.recruitWithin)],
                            ["정원내 입학", fmtCount(selectedUniv.admitWithin)],
                            ["정원내 충원율", fmtPct(selectedUniv.rateIn)],
                            ["정원외 모집", fmtCount(selectedUniv.recruitOutside)],
                            ["정원외 입학", fmtCount(selectedUniv.admitOutside)],
                            ["정원외 비중", fmtPct(selectedUniv.outShare)],
                            ["정원내외 충원율", fmtPct(selectedUniv.rateAll)],
                            ["모집증감", fmtPct(selectedUniv.recruitChange)],
                            ["신입생 탈락", fmtCount(selectedUniv.freshmanDropoutCount)],
                            ["신입생 탈락율", fmtPct(selectedUniv.freshmanDropoutRate)],
                          ]}
                        />
                      </div>
                    </section>

                    <section id="sec-enrolled" className="scroll-mt-14 rounded-xl border border-border p-4">
                      <h3 className="text-sm font-semibold">재학·탈락</h3>
                      <div className="mt-3 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="enrolledFillRate" name="재학생충원율" stroke="#2a7a55" connectNulls dot={false} />
                            <Line type="monotone" dataKey="nationalEnrolledFillRate" name="동일집단 재학생충원율" stroke="#2a7a55" strokeDasharray="3 3" connectNulls dot={false} />
                            <Line type="monotone" dataKey="dropoutRate" name="중도탈락율" stroke="#dc2626" connectNulls dot={false} />
                            <Line type="monotone" dataKey="nationalDropoutRate" name="동일집단 중도탈락율" stroke="#dc2626" strokeDasharray="3 3" connectNulls dot={false} />
                            <Line type="monotone" dataKey="freshmanDropoutRate" name="신입생탈락율" stroke="#7c3aed" connectNulls dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4">
                        <MetricGrid
                          items={[
                            ["학생정원", fmtCount(selectedUniv.studentQuota)],
                            ["재학생(충원)", fmtCount(selectedUniv.enrolledFill)],
                            ["재학생충원율", fmtPct(selectedUniv.enrolledFillRate)],
                            ["정원내 충원율", fmtPct(selectedUniv.enrolledFillRateIn)],
                            ["중도탈락", fmtCount(selectedUniv.dropoutCount)],
                            ["중도탈락율", fmtPct(selectedUniv.dropoutRate)],
                            ["신입생 탈락", fmtCount(selectedUniv.freshmanDropoutCount)],
                            ["신입생 탈락율", fmtPct(selectedUniv.freshmanDropoutRate)],
                          ]}
                        />
                      </div>
                    </section>

                    <section id="sec-foreign" className="scroll-mt-14 rounded-xl border border-border p-4">
                      <h3 className="text-sm font-semibold">외국인</h3>
                      <p className={`mt-1 ${FDB_TYPO.legend}`}>
                        기본은 학위(A). 공시 행이 없으면 칸을 비웁니다. 정원외 ≠ 외국인.
                      </p>
                      <div className="mt-3 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="foreignShare" name="학위 비중" stroke="#2a7a55" connectNulls dot={false} />
                            <Line type="monotone" dataKey="nationalForeignShare" name="동일집단 학위비중" stroke="#2a7a55" strokeDasharray="3 3" connectNulls dot={false} />
                            <Line type="monotone" dataKey="foreignDropRate" name="학위 탈락율" stroke="#dc2626" connectNulls dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4">
                        <MetricGrid
                          items={[
                            ["학위(A)", fmtCount(selectedUniv.foreignDegree)],
                            ["공동운영(B)", fmtCount(selectedUniv.foreignJoint)],
                            ["연수(C)", fmtCount(selectedUniv.foreignTraining)],
                            ["외국인 계", fmtCount(selectedUniv.foreignTotal)],
                            ["재적대비 학위비중", fmtPct(selectedUniv.foreignShare)],
                            ["언어능력충족율", fmtPct(selectedUniv.langAbilityRate)],
                            ["학위 탈락율", fmtPct(selectedUniv.foreignDropRate)],
                            ["전체 탈락율", fmtPct(selectedUniv.foreignDropAllRate)],
                          ]}
                        />
                      </div>
                    </section>

                    <section id="sec-summary" className="scroll-mt-14 overflow-hidden rounded-xl border border-border">
                      <div className="border-b border-border/60 px-4 py-3">
                        <h3 className="text-sm font-semibold">종합</h3>
                      </div>
                      <div className="overflow-auto">
                        <table className={`w-full min-w-[720px] border-collapse ${FDB_TYPO.tableBody}`}>
                          <thead>
                            <tr className="border-b border-border bg-surface-2/80">
                              {["연도", "내외충원율", "재학생충원율", "중도탈락율", "신입탈락율", "외국인비중", "휴학비중"].map(
                                (h) => (
                                  <th key={h} className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>
                                    {h}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {trend.map((row) => (
                              <tr key={row.year} className="border-b border-border/40">
                                <td className={`${FDB_TABLE.cell} font-semibold`}>{row.year}</td>
                                <td className={`${FDB_TABLE.cellMetric} font-mono ${FDB_TABLE_COLOR.ratePrimary}`}>
                                  {fmtPct(row.rateAll)}
                                </td>
                                <td className={`${FDB_TABLE.cellMetric} font-mono`}>{fmtPct(row.enrolledFillRate)}</td>
                                <td className={`${FDB_TABLE.cellMetric} font-mono`}>{fmtPct(row.dropoutRate)}</td>
                                <td className={`${FDB_TABLE.cellMetric} font-mono`}>{fmtPct(row.freshmanDropoutRate)}</td>
                                <td className={`${FDB_TABLE.cellMetric} font-mono`}>{fmtPct(row.foreignShare)}</td>
                                <td className={`${FDB_TABLE.cellMetric} font-mono`}>{fmtPct(row.leaveShare)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    </>
                  ) : null}

                  {lookupTab === "diagnosis" ? (
                    <div className="flex flex-col gap-3">
                      {diagnosis.map((item) => (
                        <section
                          key={item.title}
                          className={`rounded-xl border px-4 py-3 ${
                            item.tone === "warn"
                              ? "border-amber-400/70 bg-amber-50"
                              : item.tone === "ok"
                                ? "border-emerald-300/80 bg-emerald-50/80"
                                : "border-border bg-surface-2/60"
                          }`}
                        >
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <p className={`mt-1 ${FDB_TYPO.bodyText}`}>{item.body}</p>
                        </section>
                      ))}
                    </div>
                  ) : null}

                  {lookupTab === "action" ? (
                    <div className="flex flex-col gap-3">
                      {actions.map((item, i) => (
                        <section key={item.title} className="rounded-xl border border-border bg-surface-2/50 px-4 py-3">
                          <p className={FDB_TYPO.legend}>과제 {i + 1}</p>
                          <h3 className="mt-0.5 text-sm font-semibold">{item.title}</h3>
                          <p className={`mt-1 ${FDB_TYPO.bodyText}`}>{item.body}</p>
                        </section>
                      ))}
                    </div>
                  ) : null}

                  {reportOpen && report ? (
                    <section className="rounded-xl border border-accent/40 bg-white px-4 py-4">
                      <p className={FDB_TYPO.legend}>저장된 보고서</p>
                      <h3 className="mt-1 text-base font-bold">
                        {report.schoolName} 학생충원 진단 보고서 ({report.analysisYear})
                      </h3>
                      <p className={`mt-1 ${FDB_TYPO.legend}`}>생성 시각 {report.generatedAt}</p>
                      <ol className={`mt-3 list-decimal space-y-2 pl-5 ${FDB_TYPO.bodyText}`}>
                        {report.diagnosis.map((item) => (
                          <li key={item.title}>
                            <strong>{item.title}.</strong> {item.body}
                          </li>
                        ))}
                      </ol>
                      <h4 className="mt-4 text-sm font-semibold">대응과제</h4>
                      <ul className={`mt-2 list-disc space-y-1 pl-5 ${FDB_TYPO.bodyText}`}>
                        {report.actions.map((item) => (
                          <li key={item.title}>
                            <strong>{item.title}.</strong> {item.body}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <p className={CHART_TYPO.bodyText}>
                  {loading ? "불러오는 중…" : "좌측 목록에서 대학을 선택하세요."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
