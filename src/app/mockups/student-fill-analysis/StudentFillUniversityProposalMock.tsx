"use client";

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

import {
  FpAnalysisYearBar,
  RiskStageChip,
  SlimTabs,
} from "@/app/mockups/competitiveness-analysis/financial-projection/fpm-shared";

import {
  SFA_MOCK_UNIVERSITIES,
  SFA_MOCK_YEARS,
  sfaFillStage,
  sfaMetricTrendFor,
  sfaMockDetail,
  type SfaMockUniversity,
} from "./mock-data";
import { StudentFillFrame } from "./StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";
import "@/components/analysis/competitiveness-analysis/run-export-buttons.css";
import "@/components/analysis/competitiveness-analysis/university-competitiveness-dashboard.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/financial-projection-ui-mock.css";
import "@/app/mockups/competitiveness-analysis/financial-projection/university/fp-university-lookup-mock.css";
import "./student-fill-mock.css";

type LookupTab = "result" | "diagnosis" | "action";
type ResultTab = "roster" | "freshman" | "enrolled" | "foreign" | "summary";

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
  if ((event.deltaY < 0 && canScrollUp) || (event.deltaY > 0 && canScrollDown)) {
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

function buildDiagnosis(univ: SfaMockUniversity) {
  const d = sfaMockDetail(univ);
  const items: { title: string; body: string; tone: "warn" | "ok" | "info" }[] = [];
  const stage = sfaFillStage(univ.rateAll);
  items.push({
    title: `신입생충원 ${stage.label}`,
    body: `정원내외 충원율 ${univ.rateAll.toFixed(1)}%, 정원내 ${d.rateIn.toFixed(1)}%, 정원외 입학 비중 ${univ.outShare}%. 정원외를 외국인으로 보지 않습니다.`,
    tone: stage.tone === "ok" ? "ok" : stage.tone === "crisis" || stage.tone === "warn" ? "warn" : "info",
  });
  items.push({
    title: univ.recruitChange <= -8 ? "모집 축소로 충원율 방어" : "모집 규모는 완만",
    body: `전년 대비 모집인원 ${univ.recruitChange}%. 축소가 크면 충원율만으로 수요를 판단하기 어렵습니다.`,
    tone: univ.recruitChange <= -8 ? "warn" : "ok",
  });
  items.push({
    title: "재적 구성",
    body: `재학생 ${fmtCount(d.enrolledFill)} · 휴학 ${fmtCount(d.leaveCount)}(${((d.leaveCount / d.rosterTotal) * 100).toFixed(1)}%) · 유예 ${fmtCount(d.deferCount)}. 정원외 재학생 ${fmtCount(d.enrolledOutside)}(${d.enrolledOutShare}%).`,
    tone: d.leaveCount / d.rosterTotal >= 0.06 ? "warn" : "info",
  });
  items.push({
    title: "탈락",
    body: `전체 중도탈락율 ${d.dropoutRate}% (Y−1), 신입생 중도탈락율 ${d.freshmanDropoutRate}%. 신입 코호트 이탈이 전체보다 ${Math.abs(d.freshmanDropoutRate - d.dropoutRate).toFixed(1)}%p 차이입니다.`,
    tone: d.freshmanDropoutRate >= 8 ? "warn" : "info",
  });
  items.push({
    title: "외국인 대체·이탈",
    body: `학위(A) ${fmtCount(d.foreignDegree)} · 재적대비 ${d.foreignShare}% · 연수(C) ${fmtCount(d.foreignTraining)} · 언어능력충족 ${d.langAbilityRate}%. 학위 탈락율 ${d.foreignDrop}%, 비학위 포함 ${d.foreignDropAllRate}%.`,
    tone: d.foreignDrop >= 12 || d.foreignShare >= 20 ? "warn" : "ok",
  });
  return items;
}

function buildActions(univ: SfaMockUniversity) {
  const d = sfaMockDetail(univ);
  const actions: { title: string; body: string }[] = [];
  if (univ.rateAll < 98) {
    actions.push({
      title: "정원내 충원 경로 점검",
      body: "수시·정시 등록률과 학과별 미충원을 분리해 정원 조정 여부를 결정합니다.",
    });
  }
  if (univ.recruitChange <= -8) {
    actions.push({
      title: "모집 축소의 재정 효과 명시",
      body: "충원율 개선이 모집 축소 효과인지 실제 수요 회복인지 구분하고, 등록금 수입 영향을 재정추계와 맞춥니다.",
    });
  }
  if (d.enrolledOutShare >= 18 || univ.outShare >= 20) {
    actions.push({
      title: "정원외 의존 관리",
      body: "정원외 입학·재학생 비중을 학과별로 공개하고, 외국인 학위과정과 섞어 해석하지 않습니다.",
    });
  }
  if (d.freshmanDropoutRate >= 7) {
    actions.push({
      title: "1학년 적응·이탈 프로그램",
      body: "신입생 중도탈락율이 전체 탈락율보다 높으면 첫 학기 학습지원·상담 대상을 확대합니다.",
    });
  }
  if (d.foreignShare >= 8) {
    actions.push({
      title: "학위 외국인 유지",
      body: `언어능력충족 ${d.langAbilityRate}% · 학위 탈락 ${d.foreignDrop}%. 연수(C) 규모와 학위 전환 경로를 분리해 관리합니다.`,
    });
  }
  if (!actions.length) {
    actions.push({
      title: "현 수준 유지·모니터링",
      body: "충원·탈락·외국인 지표가 안정적입니다. 연 1회 권역·규모 동일집단과 비교합니다.",
    });
  }
  return actions;
}

function MetricGrid({ items }: { items: [string, string, boolean?][] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([k, v, added]) => (
        <div
          key={k}
          className={`rounded-lg border px-3 py-2 ${
            added ? "border-emerald-400/70 bg-emerald-50" : "border-border/70 bg-surface-2"
          }`}
        >
          <dt className={FDB_TYPO.legend}>
            {k}
            {added ? <span className="sfa-new-col">추가</span> : null}
          </dt>
          <dd className="mt-0.5 text-lg font-bold text-emerald-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StudentFillUniversityProposalMock() {
  const [analysisYear, setAnalysisYear] = useState(2025);
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [selectedSidoId, setSelectedSidoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState(SFA_MOCK_UNIVERSITIES[0]!.schoolCodeStd);
  const [lookupTab, setLookupTab] = useState<LookupTab>("result");
  const [resultTab, setResultTab] = useState<ResultTab>("roster");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStamp, setReportStamp] = useState<string | null>(null);

  const kindCounts = useMemo(
    () => ({
      university: SFA_MOCK_UNIVERSITIES.filter((u) => u.schoolDivision === "대학").length,
      juniorCollege: SFA_MOCK_UNIVERSITIES.filter((u) => u.schoolDivision === "전문대학").length,
    }),
    [],
  );

  const roster = SFA_MOCK_UNIVERSITIES;
  const filteredSchools = useMemo(
    () => filterSchools(roster, schoolKind, selectedSidoId, searchQuery),
    [roster, schoolKind, selectedSidoId, searchQuery],
  );

  const selectedUniv =
    roster.find((row) => row.schoolCodeStd === selectedCode) ?? filteredSchools[0] ?? null;

  useEffect(() => {
    if (!selectedUniv) return;
    const next = selectedUniv.schoolDivision === "전문대학" ? "junior-college" : "university";
    setSchoolKind((prev) => (prev === next ? prev : next));
  }, [selectedUniv]);

  useEffect(() => {
    if (filteredSchools.some((row) => row.schoolCodeStd === selectedCode)) return;
    if (filteredSchools[0]) setSelectedCode(filteredSchools[0].schoolCodeStd);
  }, [filteredSchools, selectedCode]);

  function changeSchoolKind(kind: SchoolKindFilter) {
    setSchoolKind(kind);
    const rows = filterSchools(roster, kind, selectedSidoId, searchQuery);
    if (rows[0]) setSelectedCode(rows[0].schoolCodeStd);
  }

  const listRef = useRef<HTMLDivElement>(null);
  const selectedSido = KOREA_SIDO_REGIONS.find((region) => region.id === selectedSidoId);
  const detail = selectedUniv ? sfaMockDetail(selectedUniv) : null;
  const trend = selectedUniv ? sfaMetricTrendFor(selectedUniv) : [];
  const selectedZone = selectedUniv ? zoneForSido(selectedUniv.region) : null;
  const selectedScale = selectedUniv
    ? schoolScaleFromEnrolled(
        selectedUniv.enrolledTotal,
        selectedUniv.schoolDivision === "전문대학" ? "전문대" : "4년제",
      )
    : null;
  const selectedStage = selectedUniv ? sfaFillStage(selectedUniv.rateAll) : null;
  const diagnosis = selectedUniv ? buildDiagnosis(selectedUniv) : [];
  const actions = selectedUniv ? buildActions(selectedUniv) : [];

  return (
    <StudentFillFrame activeLabel="대학별분석">
      <div className="flex flex-col gap-4 pb-10">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석 · 목업"
          title="대학별분석 제안"
          subtitle="대학별경쟁력·대학별추계와 같은 좌측 목록 · 분석결과·진단·대응과제 · 보고서 생성"
          note="프로덕션 미적용 · 시범 수치 · 초록 ‘추가’는 현재 대학별분석에 없는 항목"
        />

        <FpAnalysisYearBar
          analysisYear={analysisYear}
          availableYears={[...SFA_MOCK_YEARS]}
          settlementYear={analysisYear - 1}
          endYear={analysisYear}
          hasRun
          showYearMeta={false}
          showAddYear={false}
          onAddYear={() => undefined}
          onChange={setAnalysisYear}
          afterStatus={
            <span className={FDB_TYPO.legend}>
              충원·재적·외국인 {analysisYear}년 · 탈락 {analysisYear - 1}년
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
                <ul className="m-0 list-none space-y-1 p-0">
                  {filteredSchools.map((univ) => {
                    const active = selectedUniv?.schoolCodeStd === univ.schoolCodeStd;
                    const stage = sfaFillStage(univ.rateAll);
                    return (
                      <li key={univ.schoolCodeStd}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCode(univ.schoolCodeStd);
                            setReportOpen(false);
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
              </div>
            </aside>

            <div className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface p-4 lg:h-[calc(100dvh-13rem)] lg:max-h-[780px]">
              {selectedUniv && detail ? (
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
                          onClick={() => {
                            setReportStamp(new Date().toLocaleString("ko-KR"));
                            setReportOpen(true);
                            setLookupTab("diagnosis");
                          }}
                        >
                          보고서 생성
                        </GlassActionButton>
                        <button
                          type="button"
                          className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
                          onClick={() => setReportOpen(true)}
                          disabled={!reportStamp}
                        >
                          화면보기
                        </button>
                        <button type="button" className={`run-export-btn ${FDB_TYPO.toolbarControl}`} disabled>
                          PDF
                        </button>
                      </div>
                    </div>
                    {lookupTab === "result" ? (
                      <div className="fpm-univ-tab-row">
                        <span className="fpm-univ-tab-label">자료</span>
                        <SlimTabs
                          ariaLabel="분석결과 자료"
                          active={resultTab}
                          onChange={setResultTab}
                          tabs={[
                            { id: "roster", label: "재적현황" },
                            { id: "freshman", label: "신입생충원" },
                            { id: "enrolled", label: "재학·탈락" },
                            { id: "foreign", label: "외국인" },
                            { id: "summary", label: "종합" },
                          ]}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain pr-1">
                    <section className="rounded-xl border border-accent/40 bg-[var(--glow-panel-kpi)] p-5 shadow-[var(--glow-inset)]">
                      <p className="text-xs font-medium text-accent-cyan">
                        {analysisYear}년 분석 · {selectedZone ?? "권역 미분류"} · 학위(A) 기본
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
                            <p className="text-2xl font-bold text-accent-orange">{selectedUniv.rateAll.toFixed(1)}%</p>
                            <p className={FDB_TYPO.legend}>정원내외 충원율</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-accent">{detail.enrolledFillRate.toFixed(1)}%</p>
                            <p className={FDB_TYPO.legend}>재학생충원율</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{detail.foreignShare.toFixed(1)}%</p>
                            <p className={FDB_TYPO.legend}>학위외국인 비중</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {lookupTab === "result" && resultTab === "roster" ? (
                      <section className="rounded-xl border border-border p-4">
                        <h3 className="text-sm font-semibold">재적학생 현황</h3>
                        <p className={`mt-1 ${FDB_TYPO.legend}`}>
                          재학생(A) + 휴학(B) + 학사학위취득유예(C) = 재적(D). 초록은 현재 대학별분석에 없는 항목.
                        </p>
                        <div className="mt-4">
                          <MetricGrid
                            items={[
                              ["재학생", fmtCount(detail.enrolledFill)],
                              ["정원외 재학생", fmtCount(detail.enrolledOutside), true],
                              ["정원외 재학생 비중", `${detail.enrolledOutShare}%`, true],
                              ["휴학생", fmtCount(detail.leaveCount), true],
                              ["학사학위취득유예", fmtCount(detail.deferCount), true],
                              ["재적학생", fmtCount(detail.rosterTotal), true],
                              ["휴학 비중", `${((detail.leaveCount / detail.rosterTotal) * 100).toFixed(1)}%`, true],
                              ["유예 비중", `${((detail.deferCount / detail.rosterTotal) * 100).toFixed(1)}%`, true],
                            ]}
                          />
                        </div>
                      </section>
                    ) : null}

                    {lookupTab === "result" && resultTab === "freshman" ? (
                      <section className="rounded-xl border border-border p-4">
                        <h3 className="text-sm font-semibold">신입생충원 · 시계열</h3>
                        <div className="mt-3 h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} domain={[80, 110]} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="rateAll" name="정원내외충원율" stroke="#2a7a55" dot={false} />
                              <Line type="monotone" dataKey="rateIn" name="정원내충원율" stroke="#3B82F6" dot={false} />
                              <Line type="monotone" dataKey="outShare" name="정원외비중" stroke="#d97706" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4">
                          <MetricGrid
                            items={[
                              ["정원내 모집", fmtCount(detail.recruitWithin)],
                              ["정원내 입학", fmtCount(detail.admitWithin)],
                              ["정원내 충원율", `${detail.rateIn}%`],
                              ["정원외 모집", fmtCount(detail.recruitOutside), true],
                              ["정원외 입학", fmtCount(detail.admitOutside)],
                              ["정원외 비중", `${detail.outShare}%`],
                              ["정원내외 충원율", `${detail.rateAll}%`],
                              ["모집증감", `${detail.recruitChange}%`],
                            ]}
                          />
                        </div>
                      </section>
                    ) : null}

                    {lookupTab === "result" && resultTab === "enrolled" ? (
                      <section className="rounded-xl border border-border p-4">
                        <h3 className="text-sm font-semibold">재학생충원 · 중도탈락</h3>
                        <div className="mt-3 h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="enrolledFillRate" name="재학생충원율" stroke="#2a7a55" dot={false} />
                              <Line type="monotone" dataKey="dropoutRate" name="중도탈락율" stroke="#dc2626" dot={false} />
                              <Line type="monotone" dataKey="freshmanDropoutRate" name="신입생탈락율" stroke="#7c3aed" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4">
                          <MetricGrid
                            items={[
                              ["학생정원", fmtCount(detail.studentQuota)],
                              ["재학생(충원)", fmtCount(detail.enrolledFill)],
                              ["재학생충원율", `${detail.enrolledFillRate}%`],
                              ["정원내 충원율", `${detail.enrolledFillRateIn}%`, true],
                              ["중도탈락", fmtCount(detail.dropoutCount)],
                              ["중도탈락율", `${detail.dropoutRate}%`],
                              ["신입생 탈락", fmtCount(detail.freshmanDropoutCount), true],
                              ["신입생 탈락율", `${detail.freshmanDropoutRate}%`, true],
                            ]}
                          />
                        </div>
                      </section>
                    ) : null}

                    {lookupTab === "result" && resultTab === "foreign" ? (
                      <section className="rounded-xl border border-border p-4">
                        <h3 className="text-sm font-semibold">외국인학생 · 탈락</h3>
                        <p className={`mt-1 ${FDB_TYPO.legend}`}>
                          기본 화면은 학위(A). 연수(C)·언어능력·전체 탈락율은 추가 제안입니다.
                        </p>
                        <div className="mt-3 h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="foreignShare" name="학위 비중" stroke="#2a7a55" dot={false} />
                              <Line type="monotone" dataKey="foreignDrop" name="학위 탈락율" stroke="#dc2626" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4">
                          <MetricGrid
                            items={[
                              ["학위(A)", fmtCount(detail.foreignDegree)],
                              ["공동운영(B)", fmtCount(detail.foreignJoint), true],
                              ["연수(C)", fmtCount(detail.foreignTraining), true],
                              ["외국인 계", fmtCount(detail.foreignTotal), true],
                              ["재적대비 학위비중", `${detail.foreignShare}%`],
                              ["언어능력충족율", `${detail.langAbilityRate}%`, true],
                              ["학위 탈락율", `${detail.foreignDrop}%`],
                              ["전체 탈락율", `${detail.foreignDropAllRate}%`, true],
                            ]}
                          />
                        </div>
                      </section>
                    ) : null}

                    {lookupTab === "result" && resultTab === "summary" ? (
                      <section className="overflow-hidden rounded-xl border border-border">
                        <div className="border-b border-border/60 px-4 py-3">
                          <h3 className="text-sm font-semibold">종합 시계열</h3>
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
                                    {row.rateAll.toFixed(1)}%
                                  </td>
                                  <td className={`${FDB_TABLE.cellMetric} font-mono`}>{row.enrolledFillRate.toFixed(1)}%</td>
                                  <td className={`${FDB_TABLE.cellMetric} font-mono`}>{row.dropoutRate.toFixed(1)}%</td>
                                  <td className={`${FDB_TABLE.cellMetric} font-mono`}>{row.freshmanDropoutRate.toFixed(1)}%</td>
                                  <td className={`${FDB_TABLE.cellMetric} font-mono`}>{row.foreignShare.toFixed(1)}%</td>
                                  <td className={`${FDB_TABLE.cellMetric} font-mono`}>{row.leaveShare.toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
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

                    {reportOpen ? (
                      <section className="rounded-xl border border-accent/40 bg-white px-4 py-4">
                        <p className={FDB_TYPO.legend}>보고서 시안 (목업 · PDF 미생성)</p>
                        <h3 className="mt-1 text-base font-bold">
                          {selectedUniv.schoolName} 학생충원 진단 보고서 ({analysisYear})
                        </h3>
                        {reportStamp ? (
                          <p className={`mt-1 ${FDB_TYPO.legend}`}>생성 시각 {reportStamp} · 관리자만 실제 생성 예정</p>
                        ) : (
                          <p className={`mt-1 ${FDB_TYPO.legend}`}>먼저 「보고서 생성」을 누르면 시안이 채워집니다.</p>
                        )}
                        <ol className={`mt-3 list-decimal space-y-2 pl-5 ${FDB_TYPO.bodyText}`}>
                          {diagnosis.map((item) => (
                            <li key={item.title}>
                              <strong>{item.title}.</strong> {item.body}
                            </li>
                          ))}
                        </ol>
                        <h4 className="mt-4 text-sm font-semibold">대응과제</h4>
                        <ul className={`mt-2 list-disc space-y-1 pl-5 ${FDB_TYPO.bodyText}`}>
                          {actions.map((item) => (
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
