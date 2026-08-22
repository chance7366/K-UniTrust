"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { FpUniversityReportActions } from "@/components/analysis/financial-projection/FpUniversityReportActions";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import type { ProjectionTargetRow } from "@/lib/competitiveness-analysis/financial-projection/mock-data";
import type {
  ProjectionResult,
  SimulationScenario,
  UnivBaseData,
} from "@/lib/competitiveness-analysis/financial-projection/types";
import type { RiskStage } from "@/lib/competitiveness-analysis/financial-projection/risk-stage";
import {
  gradeBadgeClass,
} from "@/lib/competitiveness-analysis/run-analytics";
import type { AnalyticsGrade } from "@/lib/competitiveness-analysis/diagnostic-grade";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import "@/components/analysis/competitiveness-analysis/run-analytics.css";
import "@/components/analysis/competitiveness-analysis/university-competitiveness-dashboard.css";

import {
  type LookupTab,
  type RunTab,
} from "./FinancialProjectionLookupMock";
import {
  RiskStageChip,
  SCENARIO_LABEL,
  SlimTabs,
  riskStage,
  yearOrDash,
} from "./fpm-shared";
import "./university/fp-university-lookup-mock.css";

function fmtEnrolledCount(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  return `${Math.trunc(v).toLocaleString("ko-KR")}명`;
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
  if (
    (event.deltaY < 0 && canScrollUp) ||
    (event.deltaY > 0 && canScrollDown)
  ) {
    event.stopPropagation();
  }
}

function filterFpLookupSchools(
  universities: UnivBaseData[],
  schoolKind: SchoolKindFilter,
  selectedSidoId: string | null,
  searchQuery: string,
) {
  const kindLabel = schoolKind === "junior-college" ? "전문대학" : "대학";
  let rows = universities.filter((row) => row.schoolKind === kindLabel);
  if (selectedSidoId) {
    const sido = KOREA_SIDO_REGIONS.find((region) => region.id === selectedSidoId);
    if (sido) {
      rows = rows.filter((row) => row.region === sido.shortLabel);
    }
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

export function FpUniversityLookupPanel({
  universities,
  targets,
  analysisYear,
  scenario,
  onScenario,
  lookupTab,
  onLookupTab,
  runTab,
  onRunTab,
  selectedCode,
  onSelectCode,
  listStages,
  projection,
  children,
}: {
  universities: UnivBaseData[];
  targets: ProjectionTargetRow[];
  analysisYear: number;
  scenario: SimulationScenario;
  onScenario: (scenario: SimulationScenario) => void;
  lookupTab: LookupTab;
  onLookupTab: (tab: LookupTab) => void;
  runTab: RunTab;
  onRunTab: (tab: RunTab) => void;
  selectedCode: string;
  onSelectCode: (code: string) => void;
  listStages: Map<string, RiskStage>;
  projection: ProjectionResult | null;
  children: ReactNode;
}) {
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [selectedSidoId, setSelectedSidoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeByCode, setGradeByCode] = useState<
    Map<string, { grade: AnalyticsGrade | null; label: string }>
  >(() => new Map());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/competitiveness-analysis/editions/${analysisYear}/grades`)
      .then((res) => res.json())
      .then((data: {
        grades?: Record<string, { grade: AnalyticsGrade | null; label: string }>;
      }) => {
        if (cancelled) return;
        const next = new Map<string, { grade: AnalyticsGrade | null; label: string }>();
        for (const [code, value] of Object.entries(data.grades ?? {})) {
          next.set(code, value);
        }
        setGradeByCode(next);
      })
      .catch(() => {
        if (!cancelled) setGradeByCode(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [analysisYear]);

  const targetByCode = useMemo(
    () => new Map(targets.map((row) => [row.schoolCodeStd, row])),
    [targets],
  );

  const kindCounts = useMemo(
    () => ({
      university: universities.filter((u) => u.schoolKind === "대학").length,
      juniorCollege: universities.filter((u) => u.schoolKind === "전문대학").length,
    }),
    [universities],
  );

  useEffect(() => {
    const univ = universities.find((row) => row.schoolCodeStd === selectedCode);
    if (!univ) return;
    const next = univ.schoolKind === "전문대학" ? "junior-college" : "university";
    setSchoolKind((prev) => (prev === next ? prev : next));
  }, [selectedCode, universities]);

  const filteredSchools = useMemo(
    () =>
      filterFpLookupSchools(universities, schoolKind, selectedSidoId, searchQuery),
    [universities, schoolKind, selectedSidoId, searchQuery],
  );

  const selectedUniv = useMemo(() => {
    const fromAll = universities.find((row) => row.schoolCodeStd === selectedCode);
    if (fromAll) return fromAll;
    return filteredSchools[0] ?? null;
  }, [universities, selectedCode, filteredSchools]);

  useEffect(() => {
    if (selectedCode || !filteredSchools[0]) return;
    onSelectCode(filteredSchools[0].schoolCodeStd);
  }, [filteredSchools, onSelectCode, selectedCode]);

  function changeSchoolKind(kind: SchoolKindFilter) {
    setSchoolKind(kind);
    const rows = filterFpLookupSchools(
      universities,
      kind,
      selectedSidoId,
      searchQuery,
    );
    if (rows[0] && rows[0].schoolCodeStd !== selectedCode) {
      onSelectCode(rows[0].schoolCodeStd);
    }
  }

  const listRef = useRef<HTMLDivElement>(null);
  const listRowHeight = 92;
  const virtualizeList = filteredSchools.length >= 40;
  const [listRange, setListRange] = useState({ start: 0, end: 24 });
  useEffect(() => {
    if (!virtualizeList) {
      setListRange({ start: 0, end: filteredSchools.length });
      return;
    }
    const root = listRef.current;
    if (!root) {
      setListRange({ start: 0, end: filteredSchools.length });
      return;
    }
    function update() {
      const scroller = listRef.current;
      if (!scroller) return;
      const start = Math.max(0, Math.floor(scroller.scrollTop / listRowHeight) - 6);
      const end = Math.min(
        filteredSchools.length,
        Math.ceil((scroller.scrollTop + scroller.clientHeight) / listRowHeight) + 6,
      );
      setListRange((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end },
      );
    }
    update();
    root.addEventListener("scroll", update, { passive: true });
    return () => root.removeEventListener("scroll", update);
  }, [filteredSchools.length, virtualizeList]);
  const visibleSchools = virtualizeList
    ? filteredSchools.slice(listRange.start, listRange.end)
    : filteredSchools;
  const listTopPad = virtualizeList ? listRange.start * listRowHeight : 0;
  const listBottomPad = virtualizeList
    ? (filteredSchools.length - listRange.end) * listRowHeight
    : 0;

  const selectedSido = KOREA_SIDO_REGIONS.find(
    (region) => region.id === selectedSidoId,
  );
  const selectedStage =
    (selectedUniv
      ? listStages.get(selectedUniv.schoolCodeStd)
      : undefined) ??
    (projection
      ? riskStage(
          projection.operatingLossYear,
          projection.cashDeficitYear,
          projection.liquidityDepletionYear,
          analysisYear,
        )
      : undefined);
  const selectedTarget = selectedUniv
    ? targetByCode.get(selectedUniv.schoolCodeStd)
    : undefined;
  const enrolled =
    selectedTarget?.enrolledTotal ?? selectedUniv?.currentStudents ?? null;
  const selectedScale = selectedUniv
    ? schoolScaleFromEnrolled(
        enrolled,
        selectedUniv.schoolKind === "전문대학" ? "전문대" : "4년제",
      )
    : null;
  const selectedZone = selectedUniv ? zoneForSido(selectedUniv.region) : null;

  return (
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
                ariaLabel="대학별추계 학교종류"
              />
            </div>
          </div>
          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2"
            onWheel={handleSchoolListWheel}
          >
            {filteredSchools.length === 0 ? (
              <p className={`px-2 py-6 text-center ${FDB_TYPO.bodyText}`}>
                선택한 조건에 해당하는 대상대학이 없습니다.
              </p>
            ) : (
              <ul className="m-0 list-none space-y-1 p-0">
                {listTopPad > 0 ? (
                  <li aria-hidden style={{ height: listTopPad }} />
                ) : null}
                {visibleSchools.map((univ) => {
                  const active = selectedUniv?.schoolCodeStd === univ.schoolCodeStd;
                  const stage = listStages.get(univ.schoolCodeStd);
                  const target = targetByCode.get(univ.schoolCodeStd);
                  const estb = target?.estb ?? "";
                  const count = target?.enrolledTotal ?? univ.currentStudents;
                  return (
                    <li key={univ.schoolCodeStd}>
                      <button
                        type="button"
                        onClick={() => onSelectCode(univ.schoolCodeStd)}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? "border-accent-cyan/50 bg-accent/10"
                            : "border-transparent bg-surface-2/40 hover:border-border hover:bg-surface-2"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-accent-cyan">
                              {univ.schoolName}
                            </p>
                            <p className="mt-0.5 truncate text-[13px] text-[#92400e]">
                              {univ.region} · {fmtEnrolledCount(count)}
                            </p>
                          </div>
                          {estb ? (
                            <span
                              className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${establishmentBadgeClass(estb)}`}
                            >
                              {estb}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-[#db2777]">
                            <span
                              className={`cra-grade-sm shrink-0 ${gradeBadgeClass(gradeByCode.get(univ.schoolCodeStd)?.grade ?? null)}`}
                            >
                              {gradeByCode.get(univ.schoolCodeStd)?.label ??
                                (univ.compositeGrade ? `${univ.compositeGrade}등급` : "—")}
                            </span>
                            <span>· {stage?.label ?? "—"}</span>
                          </p>
                          {stage ? <RiskStageChip stage={stage} /> : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
                {listBottomPad > 0 ? (
                  <li aria-hidden style={{ height: listBottomPad }} />
                ) : null}
              </ul>
            )}
          </div>
        </aside>

        <div className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface p-4 lg:h-[calc(100dvh-13rem)] lg:max-h-[780px]">
          {selectedUniv && projection ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="fpm-univ-tab-stack">
                <div className="fpm-univ-tab-row">
                  <span className="fpm-univ-tab-label">시나리오</span>
                  <GlassMintTabGroup
                    ariaLabel="시나리오"
                    active={scenario}
                    onChange={onScenario}
                    items={[
                      { id: "best", label: "낙관" },
                      { id: "base", label: "기본" },
                      { id: "worst", label: "비관" },
                      { id: "stress", label: "한계" },
                    ]}
                  />
                </div>
                <div className="fpm-univ-tab-row">
                  <span className="fpm-univ-tab-label">조회</span>
                  <SlimTabs
                    ariaLabel="대학별추계 탭"
                    active={lookupTab}
                    onChange={onLookupTab}
                    tabs={[
                      { id: "result", label: "추계결과" },
                      { id: "diagnosis", label: "한계진단" },
                      { id: "strategy", label: "대응전략" },
                    ]}
                  />
                </div>
                {lookupTab === "result" ? (
                  <div className="fpm-univ-tab-row">
                    <span className="fpm-univ-tab-label">추계결과</span>
                    <SlimTabs
                      ariaLabel="추계결과 탭"
                      active={runTab}
                      onChange={onRunTab}
                      tabs={[
                        { id: "students", label: "학생수" },
                        { id: "pnl", label: "수입·지출" },
                        { id: "cash", label: "자금수지" },
                        { id: "percapita", label: "1인당" },
                      ]}
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain pr-1">
                <section className="rounded-xl border border-accent/40 bg-[var(--glow-panel-kpi)] p-5 shadow-[var(--glow-inset)]">
                  <p className="text-xs font-medium text-accent-cyan">
                    {analysisYear}년 분석 · {selectedZone ?? "권역 미분류"} ·{" "}
                    {SCENARIO_LABEL[scenario]}
                  </p>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedUniv.schoolName}</h2>
                      <p className="mt-1 text-sm text-muted">
                        {selectedUniv.region} · {fmtEnrolledCount(enrolled)}
                        {selectedScale ? ` · ${selectedScale}` : ""}
                        {selectedTarget?.estb ? ` · ${selectedTarget.estb}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-6 text-center">
                      <div>
                        <p className="flex justify-center">
                          {selectedStage ? (
                            <RiskStageChip stage={selectedStage} />
                          ) : (
                            <span className="text-lg font-bold text-muted">—</span>
                          )}
                        </p>
                        <p className={`mt-1 ${FDB_TYPO.legend}`}>위험단계</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-accent-orange">
                          {yearOrDash(projection.operatingLossYear)}
                        </p>
                        <p className={FDB_TYPO.legend}>손익적자</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-accent">
                          {yearOrDash(projection.liquidityDepletionYear)}
                        </p>
                        <p className={FDB_TYPO.legend}>가용고갈</p>
                      </div>
                    </div>
                  </div>
                </section>
                <FpUniversityReportActions
                  analysisYear={analysisYear}
                  schoolCodeStd={selectedUniv.schoolCodeStd}
                  schoolName={selectedUniv.schoolName}
                  hasRunResults={Boolean(projection)}
                />
                {children}
              </div>
            </div>
          ) : selectedUniv ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <section className="rounded-xl border border-accent/40 bg-[var(--glow-panel-kpi)] p-5 shadow-[var(--glow-inset)]">
                <h2 className="text-xl font-bold">{selectedUniv.schoolName}</h2>
                <p className="mt-1 text-sm text-muted">
                  {selectedUniv.region}
                  {selectedTarget?.estb ? ` · ${selectedTarget.estb}` : ""}
                </p>
              </section>
              <FpUniversityReportActions
                analysisYear={analysisYear}
                schoolCodeStd={selectedUniv.schoolCodeStd}
                schoolName={selectedUniv.schoolName}
                hasRunResults={Boolean(projection)}
              />
              <p className={`${CHART_TYPO.bodyText} text-muted`}>
                추계 차트는 {analysisYear}년 분석실행을 완료한 뒤 표시됩니다.
                생성된 보고서는 위에서 열람할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <p className={CHART_TYPO.bodyText}>
                좌측 목록에서 대학을 선택하세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
