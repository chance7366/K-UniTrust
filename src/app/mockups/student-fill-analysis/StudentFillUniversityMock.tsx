"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { CHART_TYPO } from "@/lib/analysis/finance-charts-typography";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import { schoolScaleFromEnrolled } from "@/lib/competitiveness-analysis/school-scale";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import { sourceYearForAnalysisYear } from "@/lib/analysis/student-fill-analysis-tabs";
import type { StudentFillEdition, StudentFillSchoolRow } from "@/lib/analysis/student-fill-analysis/types";

import { FpAnalysisYearBar, RiskStageChip, SlimTabs } from "@/app/mockups/competitiveness-analysis/financial-projection/fpm-shared";

import {
  SFA_MOCK_UNIVERSITIES,
  SFA_MOCK_YEARS,
  sfaFillStage,
  sfaFreshmanTrendFor,
  type SfaMockUniversity,
} from "./mock-data";
import { StudentFillFrame } from "./StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";
import "@/components/analysis/competitiveness-analysis/run-analytics.css";
import "@/components/analysis/competitiveness-analysis/university-competitiveness-dashboard.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/financial-projection-ui-mock.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/university/fp-university-lookup-mock.css";
import "./student-fill-mock.css";

type LookupTab = "result" | "diagnosis" | "action";
type ResultTab = "trend" | "structure";

function fmtCount(v: number) {
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

function filterSchools(
  universities: SfaMockUniversity[],
  schoolKind: SchoolKindFilter,
  selectedSidoId: string | null,
  searchQuery: string,
) {
  const kindLabel = schoolKind === "junior-college" ? "전문대학" : "대학";
  let rows = universities.filter((row) => row.schoolDivision === kindLabel);
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

function estbKind(estb: string): SfaMockUniversity["estb"] {
  if (estb.includes("사립")) return "사립";
  if (estb.includes("공립")) return "공립";
  return "국립";
}

function toSfaMock(row: StudentFillSchoolRow): SfaMockUniversity {
  return {
    schoolCodeStd: row.schoolCodeStd,
    schoolName: row.schoolName,
    schoolDivision: row.schoolDivision,
    estb: estbKind(row.estb),
    region: row.region,
    metro: row.metro,
    enrolledTotal: row.admitTotal,
    rateAll: row.rateAll ?? 0,
    recruitChange: row.recruitChange ?? 0,
    outShare: row.outShare ?? 0,
    foreignDegree: 0,
    foreignDrop: 0,
  };
}

function diagnosis(u: SfaMockUniversity) {
  const parts: string[] = [];
  if (u.recruitChange <= -8) {
    parts.push("모집인원 축소가 충원율 유지에 기여했을 가능성이 큽니다.");
  } else {
    parts.push("모집인원 변동은 상대적으로 완만합니다.");
  }
  if (u.outShare >= 20) {
    parts.push("정원외 비중이 높습니다. 정원외를 외국인으로 해석하지 마세요.");
  }
  if (u.foreignDrop >= 12) {
    parts.push(
      `학위과정 외국인 ${u.foreignDegree.toLocaleString("ko-KR")}명, 외국 중도탈락 ${u.foreignDrop}%로 대체 유입과 이탈을 함께 봐야 합니다.`,
    );
  } else {
    parts.push(
      `학위과정 외국인 ${u.foreignDegree.toLocaleString("ko-KR")}명 · 외국 중도탈락 ${u.foreignDrop}%.`,
    );
  }
  return parts.join(" ");
}

export function StudentFillUniversityMock({
  production = false,
}: {
  production?: boolean;
}) {
  const [analysisYear, setAnalysisYear] = useState(2025);
  const [availableYears, setAvailableYears] = useState([...SFA_MOCK_YEARS]);
  const [roster, setRoster] = useState<SfaMockUniversity[]>(
    production ? [] : SFA_MOCK_UNIVERSITIES,
  );
  const [hasEdition, setHasEdition] = useState(!production);
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [selectedSidoId, setSelectedSidoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState(
    production ? "" : SFA_MOCK_UNIVERSITIES[0]!.schoolCodeStd,
  );
  const [lookupTab, setLookupTab] = useState<LookupTab>("result");
  const [resultTab, setResultTab] = useState<ResultTab>("trend");

  const kindCounts = useMemo(
    () => ({
      university: roster.filter((u) => u.schoolDivision === "대학").length,
      juniorCollege: roster.filter((u) => u.schoolDivision === "전문대학").length,
    }),
    [roster],
  );

  useEffect(() => {
    if (!production) return;
    fetch(`/api/student-fill-analysis/settings?year=${analysisYear}`)
      .then((res) => res.json())
      .then((body: { years?: number[] }) => {
        if (body.years?.length) setAvailableYears(body.years);
      })
      .catch(() => undefined);
    fetch(`/api/student-fill-analysis/run?year=${analysisYear}`)
      .then((res) => res.json())
      .then((body: { edition?: StudentFillEdition | null }) => {
        if (!body.edition) {
          setHasEdition(false);
          setRoster([]);
          return;
        }
        setHasEdition(true);
        setRoster(body.edition.schools.map(toSfaMock));
      })
      .catch(() => {
        setHasEdition(false);
        setRoster([]);
      });
  }, [production, analysisYear]);

  useEffect(() => {
    const univ = roster.find((row) => row.schoolCodeStd === selectedCode);
    if (!univ) return;
    const next = univ.schoolDivision === "전문대학" ? "junior-college" : "university";
    setSchoolKind((prev) => (prev === next ? prev : next));
  }, [selectedCode]);

  const filteredSchools = useMemo(
    () =>
      filterSchools(roster, schoolKind, selectedSidoId, searchQuery),
    [roster, schoolKind, selectedSidoId, searchQuery],
  );

  const selectedUniv = useMemo(() => {
    const fromAll = roster.find(
      (row) => row.schoolCodeStd === selectedCode,
    );
    if (fromAll) return fromAll;
    return filteredSchools[0] ?? null;
  }, [selectedCode, filteredSchools, roster]);

  useEffect(() => {
    if (filteredSchools.some((row) => row.schoolCodeStd === selectedCode)) return;
    if (filteredSchools[0]) setSelectedCode(filteredSchools[0].schoolCodeStd);
  }, [filteredSchools, selectedCode]);

  function changeSchoolKind(kind: SchoolKindFilter) {
    setSchoolKind(kind);
    const rows = filterSchools(
      roster,
      kind,
      selectedSidoId,
      searchQuery,
    );
    if (rows[0] && rows[0].schoolCodeStd !== selectedCode) {
      setSelectedCode(rows[0].schoolCodeStd);
    }
  }

  const listRef = useRef<HTMLDivElement>(null);
  const selectedSido = KOREA_SIDO_REGIONS.find((region) => region.id === selectedSidoId);
  const dropoutYear = sourceYearForAnalysisYear(analysisYear, "dropout");
  const trend = selectedUniv ? sfaFreshmanTrendFor(selectedUniv) : [];
  const yearRow =
    trend.find((row) => row.year === analysisYear) ?? trend[trend.length - 1];
  const selectedZone = selectedUniv ? zoneForSido(selectedUniv.region) : null;
  const selectedScale = selectedUniv
    ? schoolScaleFromEnrolled(
        selectedUniv.enrolledTotal,
        selectedUniv.schoolDivision === "전문대학" ? "전문대" : "4년제",
      )
    : null;
  const selectedStage = selectedUniv ? sfaFillStage(selectedUniv.rateAll) : null;

  return (
    <StudentFillFrame production={production} activeLabel="대학별분석">
      <div className="flex flex-col gap-4 pb-10">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석"
          title="대학별분석"
          subtitle="좌측에서 대학을 고르면 신입생충원·진단·대응과제를 조회합니다"
        />

        {production && !hasEdition ? (
          <p className={`rounded-lg border border-border bg-surface-2 px-4 py-3 ${FDB_TYPO.bodyText}`}>
            {analysisYear}년 분석결과가 없습니다.{" "}
            <Link
              href="/analysis/student-fill-analysis/settings"
              className="font-medium text-accent hover:underline"
            >
              기본설정에서 분석실행
            </Link>
            을 먼저 하세요.
          </p>
        ) : null}

        <FpAnalysisYearBar
          analysisYear={analysisYear}
          availableYears={availableYears}
          settlementYear={dropoutYear}
          endYear={analysisYear}
          hasRun={hasEdition}
          showYearMeta={false}
          showAddYear={!production}
          onChange={setAnalysisYear}
          onAddYear={(year) => {
            setAvailableYears((prev) =>
              prev.includes(year) ? prev : [...prev, year].sort((a, b) => a - b),
            );
            setAnalysisYear(year);
          }}
          afterStatus={
            <span className={FDB_TYPO.legend}>
              신입생·재학생·재적·외국인 {analysisYear}년 · 탈락 {dropoutYear}년
            </span>
          }
        />

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
                {filteredSchools.length === 0 ? (
                  <p className={`px-2 py-6 text-center ${FDB_TYPO.bodyText}`}>
                    선택한 조건에 해당하는 대상대학이 없습니다.
                  </p>
                ) : (
                  <ul className="m-0 list-none space-y-1 p-0">
                    {filteredSchools.map((univ) => {
                      const active = selectedUniv?.schoolCodeStd === univ.schoolCodeStd;
                      const stage = sfaFillStage(univ.rateAll);
                      return (
                        <li key={univ.schoolCodeStd}>
                          <button
                            type="button"
                            onClick={() => setSelectedCode(univ.schoolCodeStd)}
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
                                  {univ.region} · {fmtCount(univ.enrolledTotal)}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${establishmentBadgeClass(univ.estb)}`}
                              >
                                {univ.estb}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-[#db2777]">
                                <span>내외 {univ.rateAll.toFixed(1)}%</span>
                                <span>· 모집 {univ.recruitChange}%</span>
                              </p>
                              <RiskStageChip stage={stage} />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <div className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface p-4 lg:h-[calc(100dvh-13rem)] lg:max-h-[780px]">
              {selectedUniv ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="fpm-univ-tab-stack">
                    <div className="fpm-univ-tab-row">
                      <span className="fpm-univ-tab-label">외국인</span>
                      <GlassMintTabGroup
                        ariaLabel="외국인 범위"
                        active="degree"
                        items={[
                          { id: "degree", label: "학위(A)" },
                          { id: "lang", label: "연수(C)" },
                        ]}
                      />
                    </div>
                    <div className="fpm-univ-tab-row">
                      <span className="fpm-univ-tab-label">조회</span>
                      <SlimTabs
                        ariaLabel="대학별분석 탭"
                        active={lookupTab}
                        onChange={setLookupTab}
                        tabs={[
                          { id: "result", label: "신입생충원" },
                          { id: "diagnosis", label: "진단" },
                          { id: "action", label: "대응과제" },
                        ]}
                      />
                    </div>
                    {lookupTab === "result" ? (
                      <div className="fpm-univ-tab-row">
                        <span className="fpm-univ-tab-label">신입생충원</span>
                        <SlimTabs
                          ariaLabel="신입생충원 탭"
                          active={resultTab}
                          onChange={setResultTab}
                          tabs={[
                            { id: "trend", label: "시계열" },
                            { id: "structure", label: "정원내외" },
                          ]}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain pr-1">
                    <section className="rounded-xl border border-accent/40 bg-[var(--glow-panel-kpi)] p-5 shadow-[var(--glow-inset)]">
                      <p className="text-xs font-medium text-accent-cyan">
                        {analysisYear}년 분석 · {selectedZone ?? "권역 미분류"} · 학위과정(A)
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
                              {selectedStage ? (
                                <RiskStageChip stage={selectedStage} />
                              ) : (
                                <span className="text-lg font-bold text-muted">—</span>
                              )}
                            </p>
                            <p className={`mt-1 ${FDB_TYPO.legend}`}>충원단계</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-accent-orange">
                              {selectedUniv.rateAll.toFixed(1)}%
                            </p>
                            <p className={FDB_TYPO.legend}>정원내외 충원율</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-accent">
                              {selectedUniv.recruitChange}%
                            </p>
                            <p className={FDB_TYPO.legend}>모집인원 변화</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {lookupTab === "result" && resultTab === "trend" ? (
                      <section className="overflow-hidden rounded-xl border border-border">
                        <div className="border-b border-border/60 px-4 py-3">
                          <h3 className="text-sm font-semibold">신입생충원 시계열</h3>
                          <p className={`mt-1 ${FDB_TYPO.legend}`}>
                            목업 예시 · 주지표는 정원내외 합산
                          </p>
                        </div>
                        <div className="overflow-auto">
                          <table
                            className={`w-full min-w-[640px] border-collapse text-left ${FDB_TYPO.tableBody}`}
                          >
                            <thead>
                              <tr className="border-b border-border bg-surface-2/80">
                                {["연도", "정원내 모집", "정원내 충원율", "정원외 비중", "정원내외 충원율"].map(
                                  (h) => (
                                    <th
                                      key={h}
                                      className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}
                                    >
                                      {h}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {trend.map((row) => (
                                <tr key={row.year} className="border-b border-border/40">
                                  <td className={`${FDB_TABLE.cell} font-semibold`}>
                                    {row.year}
                                  </td>
                                  <td className={`${FDB_TABLE.cellMetric} font-mono`}>
                                    {row.recruitIn.toLocaleString("ko-KR")}
                                  </td>
                                  <td
                                    className={`${FDB_TABLE.cellMetric} font-mono ${FDB_TABLE_COLOR.rateSecondary}`}
                                  >
                                    {row.rateIn.toFixed(1)}%
                                  </td>
                                  <td className={`${FDB_TABLE.cellMetric} font-mono`}>
                                    {row.outShare.toFixed(1)}%
                                  </td>
                                  <td
                                    className={`${FDB_TABLE.cellMetric} font-mono ${FDB_TABLE_COLOR.ratePrimary}`}
                                  >
                                    {row.rateAll.toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ) : null}

                    {lookupTab === "result" && resultTab === "structure" ? (
                      <section className="rounded-xl border border-border p-4">
                        <h3 className="text-sm font-semibold">정원내외 구조 ({analysisYear}년)</h3>
                        <p className={`mt-1 ${FDB_TYPO.legend}`}>
                          정원외 입학 ≠ 외국인. 외국인은 학위과정(A) 인원으로만 표시합니다.
                        </p>
                        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {[
                            ["정원내외 충원율", `${(yearRow?.rateAll ?? selectedUniv.rateAll).toFixed(1)}%`],
                            ["정원내 충원율", `${(yearRow?.rateIn ?? selectedUniv.rateAll).toFixed(1)}%`],
                            ["정원외 비중", `${selectedUniv.outShare}%`],
                            ["학위과정 외국인", fmtCount(selectedUniv.foreignDegree)],
                          ].map(([k, v]) => (
                            <div
                              key={k}
                              className="rounded-lg border border-border/70 bg-surface-2 px-3 py-2"
                            >
                              <dt className={FDB_TYPO.legend}>{k}</dt>
                              <dd className="mt-0.5 text-lg font-bold text-emerald-800">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ) : null}

                    {lookupTab === "diagnosis" ? (
                      <section className="rounded-xl border border-border bg-surface-2/60 px-4 py-4">
                        <h3 className="text-sm font-semibold">한계진단 (목업)</h3>
                        <p className={`mt-2 ${FDB_TYPO.bodyText} text-foreground`}>
                          {diagnosis(selectedUniv)}
                        </p>
                        <ul className={`mt-3 list-disc space-y-1 pl-5 ${FDB_TYPO.legend}`}>
                          <li>재학생충원·중도탈락은 분석결과 Phase 3에서 같은 레이아웃으로 붙입니다.</li>
                          <li>
                            조인 키는 분석연도 {analysisYear} + 대표학교코드 {selectedUniv.schoolCodeStd}
                            입니다.
                          </li>
                        </ul>
                      </section>
                    ) : null}

                    {lookupTab === "action" ? (
                      <p className={`${CHART_TYPO.bodyText} text-muted`}>
                        대응과제는 대학별추계의 대응전략과 같은 자리에 둡니다. 모집 축소·정원외
                        의존·외국인 탈락에 대한 실행 항목은 다음 단계에서 채웁니다.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center px-6 text-center">
                  <p className={CHART_TYPO.bodyText}>좌측 목록에서 대학을 선택하세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentFillFrame>
  );
}
