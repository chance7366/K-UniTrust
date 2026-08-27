"use client";

import { useState } from "react";
import { Globe, GraduationCap, Layers3, Users } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardKpiCard } from "@/components/analysis/DashboardKpiCard";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import {
  SFA_MOCK_UNIVERSITIES,
  SFA_RUN_ADDITIONS,
  sfaFillStage,
  sfaMockDetail,
} from "./mock-data";
import { StudentFillFrame } from "./StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";
import "./student-fill-mock.css";

type Stage = "freshman" | "enrolled" | "foreign" | "summary";

type Col = { label: string; added?: boolean; value: (d: ReturnType<typeof sfaMockDetail>) => string };

function fmtInt(n: number) {
  return Math.trunc(n).toLocaleString("ko-KR");
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

const META: Col[] = [
  { label: "학교명", value: (d) => d.schoolName },
  { label: "재학생수", value: (d) => fmtInt(d.enrolledTotal) },
  { label: "규모", value: (d) => (d.enrolledTotal >= 10000 ? "대규모" : d.enrolledTotal >= 5000 ? "중규모" : "소규모") },
  { label: "지역", value: (d) => d.region },
  { label: "권역", value: (d) => (d.metro === "수도권" ? "수도권" : "비수도권") },
];

const STAGE_COLS: Record<Stage, Col[]> = {
  freshman: [
    ...META,
    { label: "정원내모집", value: (d) => fmtInt(d.recruitWithin) },
    { label: "정원내입학", value: (d) => fmtInt(d.admitWithin) },
    { label: "정원내충원율", value: (d) => fmtPct(d.rateIn) },
    { label: "정원외모집", added: true, value: (d) => fmtInt(d.recruitOutside) },
    { label: "정원외입학", value: (d) => fmtInt(d.admitOutside) },
    { label: "정원외비중", value: (d) => fmtPct(d.outShare) },
    { label: "정원내외충원율", value: (d) => fmtPct(d.rateAll) },
    { label: "신입생탈락", added: true, value: (d) => fmtInt(d.freshmanDropoutCount) },
    { label: "신입생탈락율", added: true, value: (d) => fmtPct(d.freshmanDropoutRate) },
  ],
  enrolled: [
    ...META,
    { label: "학생정원", value: (d) => fmtInt(d.studentQuota) },
    { label: "재학생", value: (d) => fmtInt(d.enrolledFill) },
    { label: "재학생충원율", value: (d) => fmtPct(d.enrolledFillRate) },
    { label: "정원내충원율", added: true, value: (d) => fmtPct(d.enrolledFillRateIn) },
    { label: "정원외재학생", added: true, value: (d) => fmtInt(d.enrolledOutside) },
    { label: "정원외비중", added: true, value: (d) => fmtPct(d.enrolledOutShare) },
    { label: "재적", added: true, value: (d) => fmtInt(d.rosterTotal) },
    { label: "휴학생", added: true, value: (d) => fmtInt(d.leaveCount) },
    { label: "유예", added: true, value: (d) => fmtInt(d.deferCount) },
    { label: "중도탈락", value: (d) => fmtInt(d.dropoutCount) },
    { label: "중도탈락율", value: (d) => fmtPct(d.dropoutRate) },
    { label: "신입생탈락율", added: true, value: (d) => fmtPct(d.freshmanDropoutRate) },
  ],
  foreign: [
    ...META,
    { label: "학위외국인", value: (d) => fmtInt(d.foreignDegree) },
    { label: "공동운영B", added: true, value: (d) => fmtInt(d.foreignJoint) },
    { label: "연수C", added: true, value: (d) => fmtInt(d.foreignTraining) },
    { label: "외국인계", added: true, value: (d) => fmtInt(d.foreignTotal) },
    { label: "재적대비비중", value: (d) => fmtPct(d.foreignShare) },
    { label: "언어능력충족", added: true, value: (d) => fmtPct(d.langAbilityRate) },
    { label: "학위탈락", value: (d) => fmtInt(d.foreignDropCount) },
    { label: "학위탈락율", value: (d) => fmtPct(d.foreignDrop) },
    { label: "전체탈락율", added: true, value: (d) => fmtPct(d.foreignDropAllRate) },
  ],
  summary: [
    ...META,
    { label: "정원내외충원율", value: (d) => fmtPct(d.rateAll) },
    { label: "모집증감", value: (d) => `${d.recruitChange > 0 ? "+" : ""}${d.recruitChange.toFixed(1)}%` },
    { label: "정원외비중", value: (d) => fmtPct(d.outShare) },
    { label: "휴학비중", added: true, value: (d) => fmtPct((d.leaveCount / d.rosterTotal) * 100) },
    { label: "유예비중", added: true, value: (d) => fmtPct((d.deferCount / d.rosterTotal) * 100) },
    { label: "학위외국인", value: (d) => fmtInt(d.foreignDegree) },
    { label: "외국인비중", value: (d) => fmtPct(d.foreignShare) },
    { label: "연수인원", added: true, value: (d) => fmtInt(d.foreignTraining) },
    { label: "언어능력", added: true, value: (d) => fmtPct(d.langAbilityRate) },
    { label: "신입생탈락율", added: true, value: (d) => fmtPct(d.freshmanDropoutRate) },
    { label: "학위탈락율", value: (d) => fmtPct(d.foreignDrop) },
    { label: "전체탈락율", added: true, value: (d) => fmtPct(d.foreignDropAllRate) },
  ],
};

export function StudentFillRunMock() {
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [stage, setStage] = useState<Stage>("freshman");

  const rows = SFA_MOCK_UNIVERSITIES.filter((u) =>
    schoolKind === "junior-college" ? u.schoolDivision === "전문대학" : u.schoolDivision === "대학",
  ).map(sfaMockDetail);
  const cols = STAGE_COLS[stage];
  const addedCount = cols.filter((c) => c.added).length;
  const stages = { 충원위기: 0, 충원취약: 0, 충원보통: 0, 충원양호: 0 };
  for (const row of rows) stages[sfaFillStage(row.rateAll).label as keyof typeof stages] += 1;

  return (
    <StudentFillFrame activeLabel="분석결과">
      <div className="flex flex-col gap-4">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석 · 목업"
          title="분석결과 제안"
          subtitle="프로덕션 미적용 · 아래 초록 ‘추가’ 칼럼이 현재 분석결과에 없는 항목입니다"
          note="시범 수치입니다. 대학알리미 원본·분석실행 결과와 일치하지 않습니다."
        />

        <section className="sfa-add-panel">
          <h2 className={FDB_TYPO.panelTitle}>현재 분석결과 대비 추가 내용</h2>
          <p className={`mt-1 ${FDB_TYPO.legend}`}>
            2025년 분석 = 신입생·재학생충원(상반기)·재적·외국인 2025 + 중도탈락·외국인탈락 2024. 정원외 ≠ 외국인.
          </p>
          <div className="mt-3 overflow-auto">
            <table className={`w-full min-w-[720px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
              <thead>
                <tr className="border-b border-amber-300/60 bg-amber-50/80">
                  {["탭", "지금 프로덕션", "이 목업에서 추가"].map((h) => (
                    <th key={h} className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SFA_RUN_ADDITIONS.map((row) => (
                  <tr key={row.stage} className="border-b border-amber-200/70">
                    <td className={`${FDB_TABLE.cell} font-semibold`}>{row.stage}</td>
                    <td className={FDB_TABLE.cell}>{row.now}</td>
                    <td className={`${FDB_TABLE.cell} text-emerald-800`}>{row.add}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className={FDB_TYPO.toolbarLabel}>분석연도</span>
            <select
              className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 ${FDB_TYPO.toolbarControl}`}
              defaultValue="2025"
            >
              <option value="2025">2025년</option>
            </select>
            <span className={`rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 ${FDB_TYPO.legend} text-accent`}>
              목업
            </span>
          </div>
          <GlassMintTabGroup
            ariaLabel="분석결과 단계"
            active={stage}
            onChange={setStage}
            items={[
              { id: "freshman", label: "신입생충원", icon: GraduationCap },
              { id: "enrolled", label: "재학생충원", icon: Users },
              { id: "foreign", label: "외국인", icon: Globe },
              { id: "summary", label: "종합", icon: Layers3 },
            ]}
          />
          <SchoolKindTabBar
            active={schoolKind}
            universityCount={SFA_MOCK_UNIVERSITIES.filter((u) => u.schoolDivision === "대학").length}
            juniorCollegeCount={SFA_MOCK_UNIVERSITIES.filter((u) => u.schoolDivision === "전문대학").length}
            onChange={setSchoolKind}
            ariaLabel="학교종류"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DashboardKpiCard accent="red" title="충원위기" value={`${stages.충원위기}교`} sub="정원내외 90% 미만" />
          <DashboardKpiCard accent="amber" title="충원취약" value={`${stages.충원취약}교`} sub="90% 이상 94% 미만" />
          <DashboardKpiCard accent="blue" title="충원보통" value={`${stages.충원보통}교`} sub="94% 이상 98% 미만" />
          <DashboardKpiCard accent="emerald" title="충원양호" value={`${stages.충원양호}교`} sub="98% 이상" />
        </div>

        <p className={FDB_TYPO.legend}>
          이 탭 칼럼 {cols.length}개 중 <strong className="text-emerald-800">추가 {addedCount}개</strong>
          (초록 배지). 대학 {rows.length}교 목업 예시.
        </p>

        <section className="overflow-hidden rounded-xl border border-border bg-surface p-4">
          <div className="overflow-auto">
            <table className={`w-full min-w-[1280px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}>
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  {cols.map((col) => (
                    <th
                      key={col.label}
                      className={`${FDB_TABLE_HEAD.base} ${FDB_TABLE.headSingle} whitespace-nowrap text-right first:text-left ${
                        col.added ? "bg-emerald-50 text-emerald-900" : ""
                      }`}
                    >
                      {col.label}
                      {col.added ? <span className="sfa-new-col">추가</span> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.schoolCodeStd} className={`border-b border-border/40 ${i % 2 ? "bg-surface-2/30" : ""}`}>
                    {cols.map((col) => (
                      <td
                        key={col.label}
                        className={`${FDB_TABLE.cell} ${
                          col.label === "학교명"
                            ? `text-left ${FDB_TABLE_COLOR.schoolName}`
                            : "text-right font-mono tabular-nums"
                        } ${col.added ? "bg-emerald-50/60" : ""}`}
                      >
                        {col.value(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </StudentFillFrame>
  );
}
