"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassActionButton } from "@/components/analysis/GlassHelpButton";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { StudentFillUniversityResultPane } from "@/components/analysis/student-fill-analysis/StudentFillUniversityResultPane";
import { useAccessRole } from "@/components/auth/AccessRoleProvider";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import type { StudentFillUniversityReport } from "@/lib/analysis/student-fill-analysis/diagnosis";
import { StudentFillReportGuidelinesPanel } from "@/components/analysis/student-fill-analysis/StudentFillReportGuidelinesPanel";
import {
  studentFillRowMatchesEstb,
  type StudentFillEstbFilter,
} from "@/lib/analysis/student-fill-analysis/cohort-rules";
import { sfaFillStage } from "@/lib/analysis/student-fill-analysis/fill-stage";
import type { StudentFillPeerPayload } from "@/lib/analysis/student-fill-analysis/peer-aggregates";
import type { StudentFillSchoolRow } from "@/lib/analysis/student-fill-analysis/types";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import {
  FpAnalysisYearBar,
  RiskStageChip,
} from "@/app/mockups/competitiveness-analysis/financial-projection/fpm-shared";

import "@/components/analysis/glass-help-button.css";
import "@/components/analysis/competitiveness-analysis/university-competitiveness-dashboard.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/financial-projection-ui-mock.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/university/fp-university-lookup-mock.css";

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
  estbFilter: StudentFillEstbFilter,
  selectedSidoId: string | null,
  searchQuery: string,
) {
  const kindLabel = schoolKind === "junior-college" ? "전문대학" : "대학";
  let rows = universities.filter(
    (row) =>
      row.schoolDivision === kindLabel &&
      studentFillRowMatchesEstb(row.estb, estbFilter),
  );
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
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [estbFilter, setEstbFilter] = useState<StudentFillEstbFilter>("all");
  const [selectedSidoId, setSelectedSidoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState(codeParam);
  const [peer, setPeer] = useState<StudentFillPeerPayload | null>(null);
  const [report, setReport] = useState<StudentFillUniversityReport | null>(null);
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
      setPeer(null);
      setReport(null);
      return;
    }
    const qs = `?year=${analysisYear}&code=${encodeURIComponent(selectedCode)}`;
    fetch(`/api/student-fill-analysis/university${qs}`)
      .then(async (res) => {
        const body = (await res.json()) as {
          school?: StudentFillSchoolRow | null;
          peer?: StudentFillPeerPayload | null;
          report?: StudentFillUniversityReport | null;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "시계열을 불러오지 못했습니다.");
        setPeer(body.peer ?? null);
        setReport(body.report ?? null);
        if (body.school) {
          setSchools((prev) => {
            const next = prev.filter((row) => row.schoolCodeStd !== body.school!.schoolCodeStd);
            return [...next, body.school!];
          });
        }
      })
      .catch(() => {
        setPeer(null);
        setReport(null);
      });
  }, [analysisYear, selectedCode]);

  const kindCounts = useMemo(() => {
    let university = 0;
    let juniorCollege = 0;
    for (const row of schools) {
      if (!studentFillRowMatchesEstb(row.estb, estbFilter)) continue;
      if (row.schoolDivision === "전문대학") juniorCollege += 1;
      else university += 1;
    }
    return { university, juniorCollege };
  }, [schools, estbFilter]);

  const filteredSchools = useMemo(
    () => filterSchools(schools, schoolKind, estbFilter, selectedSidoId, searchQuery),
    [schools, schoolKind, estbFilter, selectedSidoId, searchQuery],
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
    syncUrl(next, selectedCode);
  }

  function openReport() {
    if (!analysisYear || !selectedUniv) return;
    window.open(
      `/api/student-fill-analysis/university-report?year=${analysisYear}&code=${encodeURIComponent(selectedUniv.schoolCodeStd)}&format=html`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function changeSchoolKind(kind: SchoolKindFilter) {
    setSchoolKind(kind);
    const rows = filterSchools(schools, kind, estbFilter, selectedSidoId, searchQuery);
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
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="학생충원분석"
        title="대학별분석"
        subtitle="좌측 목록에서 대학을 고르고 분석결과를 봅니다. 진단·대응과제는 개별대학 보고서에 있습니다."
        note={
          lastRunAt
            ? `${year}년 실행 · ${lastRunAt} · 충원·재적·외국인 ${year}년 · 탈락 ${year - 1}년`
            : "기본설정에서 분석실행하면 이 화면에 저장됩니다."
        }
      />

      <div className="flex flex-col gap-1">
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
            <GlassMintTabGroup
              ariaLabel="설립구분"
              active={estbFilter}
              onChange={setEstbFilter}
              items={[
                { id: "public", label: "국공립" },
                { id: "private", label: "사립" },
                { id: "all", label: "국공사립" },
              ]}
            />
          }
        />

        <StudentFillReportGuidelinesPanel analysisYear={year} />
      </div>

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
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain pr-1">
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

                  <div className="rounded-lg border border-border/70 bg-surface-2/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-accent-cyan">
                        개별대학 보고서
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {report ? (
                          <>
                            <GlassActionButton
                              tone="blue"
                              onClick={openReport}
                            >
                              보고서 열람
                            </GlassActionButton>
                            <GlassActionButton
                              tone="orange"
                              onClick={openReport}
                            >
                              PDF 저장
                            </GlassActionButton>
                          </>
                        ) : null}
                        {canGenerate ? (
                          <GlassActionButton
                            tone="green"
                            disabled={generating}
                            onClick={() => void generateReport()}
                          >
                            {generating
                              ? "생성 중…"
                              : report
                                ? "보고서 재생성"
                                : "보고서 생성"}
                          </GlassActionButton>
                        ) : null}
                      </div>
                    </div>
                    {reportError ? (
                      <p className={`mt-2 ${FDB_TYPO.legend} text-danger`}>
                        {reportError}
                      </p>
                    ) : null}
                    {!canGenerate ? (
                      <p className={`mt-2 ${FDB_TYPO.legend} text-muted`}>
                        보고서 생성은 관리자만 할 수 있습니다. 저장된 보고서는
                        열람·PDF 저장으로 볼 수 있습니다.
                      </p>
                    ) : null}
                  </div>

                  <StudentFillUniversityResultPane school={selectedUniv} peer={peer} />
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
