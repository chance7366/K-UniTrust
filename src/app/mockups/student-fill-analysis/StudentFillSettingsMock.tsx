"use client";

import { useState } from "react";
import { Database, Play, School, SlidersHorizontal } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { sourceYearForAnalysisYear } from "@/lib/analysis/student-fill-analysis-tabs";
import { useAccessRole } from "@/components/auth/AccessRoleProvider";

import { SFA_MOCK_UNIVERSITIES, SFA_MOCK_YEARS, SFA_SOURCE_STATUS } from "./mock-data";
import { StudentFillFrame } from "./StudentFillMockShell";

import "@/components/analysis/glass-help-button.css";

type SettingsInner = "cohort" | "sources";
type MockRole = "admin" | "user";

const SOURCE_KEYS = [
  "freshman",
  "enrolled",
  "enrolled-students",
  "foreign",
  "dropout",
  "foreign-dropout",
] as const;

export function StudentFillSettingsMock({
  production = false,
}: {
  production?: boolean;
}) {
  const accessRole = useAccessRole();
  const [year, setYear] = useState(2025);
  const [inner, setInner] = useState<SettingsInner>("cohort");
  const [role, setRole] = useState<MockRole>("admin");
  const [ranAt, setRanAt] = useState<string | null>("2026. 8. 27. 오후 4:12");
  const canRun = production ? accessRole === "admin" : role === "admin";

  return (
    <StudentFillFrame production={production} activeLabel="기본설정">
      <div className="flex flex-col gap-4">
        <DashboardEmeraldHeader
          sectionLabel="학생충원분석"
          title="기본설정"
          subtitle="학부(대학·전문) · 국공립·사립 · 분석실행은 관리자만"
          note="재업로드 없음. 대학현황 › 대학알리미 자료를 조인합니다."
          action={
            <button
              type="button"
              disabled={!canRun}
              onClick={() =>
                setRanAt(
                  new Date().toLocaleString("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Play size={14} strokeWidth={2.4} />
              분석실행
            </button>
          }
        />

        <section className="rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <label className={FDB_TYPO.toolbarLabel} htmlFor="sfa-year">
                분석연도
              </label>
              <select
                id="sfa-year"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
              >
                {SFA_MOCK_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>
            {production ? null : (
            <div className="flex items-center gap-2">
              <span className={FDB_TYPO.toolbarLabel}>목업 역할</span>
              <GlassMintTabGroup
                ariaLabel="역할"
                active={role}
                onChange={setRole}
                items={[
                  { id: "admin", label: "관리자" },
                  { id: "user", label: "일반사용자" },
                ]}
              />
            </div>
            )}
            <p className={FDB_TYPO.legend}>
              {canRun
                ? "설정 저장·분석실행 가능"
                : "조회만 가능 · 저장·실행 버튼 비활성"}
              {ranAt ? ` · 최근 실행 ${ranAt}` : null}
            </p>
          </div>
        </section>

        <GlassMintTabGroup
          ariaLabel="기본설정 구역"
          active={inner}
          onChange={setInner}
          items={[
            { id: "cohort", label: "대상대학", icon: School },
            { id: "sources", label: "기초자료", icon: Database },
          ]}
        />

        {inner === "cohort" ? (
          <section className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className={FDB_TYPO.panelTitle}>대상 코호트</h2>
              <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
                경쟁력분석 분석대상(사립 위주)과 달리 국공립을 포함합니다. 목업은 6교.
              </p>
            </div>
            <div className="overflow-auto">
              <table className={`w-full min-w-[720px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
                <thead>
                  <tr className="border-b border-border bg-surface-2/80">
                    {["학교코드", "학교명", "구분", "설립", "지역", "권역"].map((h) => (
                      <th key={h} className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SFA_MOCK_UNIVERSITIES.map((row) => (
                    <tr key={row.schoolCodeStd} className="border-b border-border/40">
                      <td className={`font-mono ${FDB_TABLE.cell} ${FDB_TYPO.tableCode}`}>
                        {row.schoolCodeStd}
                      </td>
                      <td className={`${FDB_TABLE.cell} font-semibold text-[#1a5c3a]`}>
                        {row.schoolName}
                      </td>
                      <td className={FDB_TABLE.cell}>{row.schoolDivision}</td>
                      <td className={FDB_TABLE.cell}>{row.estb}</td>
                      <td className={FDB_TABLE.cell}>{row.region}</td>
                      <td className={FDB_TABLE.cell}>{row.metro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className={FDB_TYPO.panelTitle}>외국인 범위</h2>
              <p className={`mt-1 ${FDB_TYPO.bodyText}`}>
                기본값: 학위과정 소계(A)만. 공동운영(B)·연수(C)는 기본 제외. 정원외 입학 ≠
                외국인.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-600/40 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  학위과정 (A) · 사용
                </span>
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-sm text-muted">
                  공동운영 (B) · 제외
                </span>
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-sm text-muted">
                  연수 (C) · 제외
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="border-b border-border/60 px-4 py-3">
                <h2 className={FDB_TYPO.panelTitle}>자료 연도 시차</h2>
                <p className={`mt-1 ${FDB_TYPO.panelMeta}`}>
                  분석연도 {year}년 기준. 중도탈락·외국학생중도탈락만 Y−1 (
                  {year - 1}년). 재학생충원은 상반기.
                </p>
              </div>
              <div className="overflow-auto">
                <table className={`w-full min-w-[880px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
                  <thead>
                    <tr className="border-b border-border bg-surface-2/80">
                      {["자료", "대학현황 위치", "범위", "기간", "사용 연도"].map((h) => (
                        <th key={h} className={`${FDB_TABLE.headSingle} ${FDB_TABLE_HEAD.base}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SFA_SOURCE_STATUS.map((row) => {
                      const srcYear = sourceYearForAnalysisYear(
                        year,
                        row.id as (typeof SOURCE_KEYS)[number],
                      );
                      return (
                        <tr key={row.id} className="border-b border-border/40">
                          <td className={`${FDB_TABLE.cell} font-medium`}>{row.label}</td>
                          <td className={`${FDB_TABLE.cell} ${FDB_TYPO.legend}`}>{row.menu}</td>
                          <td className={FDB_TABLE.cell}>{row.dataset}</td>
                          <td className={FDB_TABLE.cell}>{row.period}</td>
                          <td className={`${FDB_TABLE.cell} font-semibold text-emerald-800`}>
                            {srcYear}년
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <p className={`flex items-center gap-1.5 ${FDB_TYPO.legend}`}>
          <SlidersHorizontal size={13} />
          {production
            ? "관리자만 이 화면에서 저장·실행합니다. 지금은 시범 데이터입니다."
            : "프로덕션에서는 관리자만 이 화면에서 저장·실행합니다. 이 페이지는 시안입니다."}
        </p>
      </div>
    </StudentFillFrame>
  );
}
