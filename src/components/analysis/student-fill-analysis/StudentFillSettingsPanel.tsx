"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Database, School, SlidersHorizontal } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import {
  GlassActionButton,
  GlassHelpButton,
} from "@/components/analysis/GlassHelpButton";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { useAccessRole } from "@/components/auth/AccessRoleProvider";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import {
  FDB_SCHOOL_NAME_COL_PX,
  FDB_TABLE,
  FDB_TABLE_HEAD,
} from "@/lib/analysis/finance-db-table-density";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { sourceYearForAnalysisYear } from "@/lib/analysis/student-fill-analysis-tabs";
import {
  SFA_TARGET_UNIV_HELP,
  SFA_TARGET_UNIV_HELP_SUB,
  SFA_TARGET_UNIV_HELP_TITLE,
} from "@/lib/analysis/student-fill-analysis/target-univ-help";
import {
  SFA_SOURCES_HELP_SUB,
  SFA_SOURCES_HELP_TITLE,
  sfaSourcesHelp,
} from "@/lib/analysis/student-fill-analysis/sources-help";
import type {
  StudentFillSchoolKind,
  StudentFillSchoolRow,
  StudentFillSettingsPayload,
} from "@/lib/analysis/student-fill-analysis/types";
import type { SchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";

import { SFA_SOURCE_STATUS } from "@/app/mockups/student-fill-analysis/mock-data";

import "@/components/analysis/glass-help-button.css";
import "@/components/analysis/freshman-enrollment-alimi-table.css";

type SettingsInner = "cohort" | "sources";

export function StudentFillSettingsPanel() {
  const router = useRouter();
  const accessRole = useAccessRole();
  const canRun = accessRole === "admin";
  const [inner, setInner] = useState<SettingsInner>("cohort");
  const [schoolKind, setSchoolKind] = useState<SchoolKindFilter>("university");
  const [search, setSearch] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [payload, setPayload] = useState<StudentFillSettingsPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const qs = year != null ? `?year=${year}` : "";
    fetch(`/api/student-fill-analysis/settings${qs}`)
      .then(async (res) => {
        const body = (await res.json()) as StudentFillSettingsPayload & {
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "대상대학을 불러오지 못했습니다.");
        setPayload(body);
        setYear((prev) => prev ?? body.displayYear);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "대상대학을 불러오지 못했습니다.");
      });
  }, [year]);

  const schools = payload?.schools ?? [];
  const filtered = useMemo(() => {
    const kind: StudentFillSchoolKind =
      schoolKind === "junior-college" ? "전문대학" : "대학";
    const q = search.trim().toLowerCase();
    return schools.filter((row) => {
      if (row.schoolDivision !== kind) return false;
      if (!q) return true;
      return (
        row.schoolName.toLowerCase().includes(q) ||
        row.schoolCodeStd.toLowerCase().includes(q)
      );
    });
  }, [schools, schoolKind, search]);

  async function runAnalysis() {
    if (year == null || !canRun || running) return;
    setRunning(true);
    setRunError(null);
    try {
      const res = await fetch("/api/student-fill-analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisYear: year }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "분석실행에 실패했습니다.");
      router.push(`/analysis/student-fill-analysis/run?year=${year}`);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "분석실행에 실패했습니다.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardEmeraldHeader
        sectionLabel="학생충원분석"
        title="기본설정"
        subtitle="학부 대학·전문대학(국공립·사립) · 분석실행은 관리자만"
        note="대상대학은 별도 엑셀이 아닙니다. 오른쪽 도움말에서 포함·제외 조건을 확인하세요."
      />

      <section className="rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <label className={FDB_TYPO.toolbarLabel} htmlFor="sfa-prod-year">
              분석연도
            </label>
            <select
              id="sfa-prod-year"
              value={year ?? ""}
              onChange={(event) => setYear(Number(event.target.value))}
              className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
            >
              {(payload?.years ?? []).map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
          <p className={FDB_TYPO.legend}>
            {canRun ? "관리자 · 분석실행 가능" : "일반사용자 · 조회만 가능"}
            {payload?.lastRunAt ? ` · 최근 실행 ${payload.lastRunAt}` : " · 아직 실행 없음"}
            {payload
              ? ` · 대상 ${payload.schoolCount.toLocaleString("ko-KR")}교`
              : null}
          </p>
        </div>
        {runError ? <p className={`mt-2 ${FDB_TYPO.legend} text-danger`}>{runError}</p> : null}
        {loadError ? <p className={`mt-2 ${FDB_TYPO.legend} text-danger`}>{loadError}</p> : null}
      </section>

      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <GlassMintTabGroup
          ariaLabel="기본설정 구역"
          active={inner}
          onChange={setInner}
          items={[
            {
              id: "cohort",
              label: "대상대학",
              icon: School,
              count: payload ? String(payload.schoolCount) : undefined,
            },
            { id: "sources", label: "기초자료", icon: Database },
          ]}
        />
        <GlassActionButton
          tone="green"
          disabled={!canRun || running || !payload?.schoolCount}
          title={
            canRun
              ? "신입생충원 학부 자료를 묶어 분석결과를 만듭니다"
              : "관리자만 분석실행할 수 있습니다"
          }
          onClick={() => void runAnalysis()}
        >
          {running ? "실행 중…" : "분석실행"}
        </GlassActionButton>
      </div>

      {inner === "cohort" ? (
        <div className="flex flex-col gap-3">
          {helpOpen ? (
            <HelpGuidePanel
              sections={SFA_TARGET_UNIV_HELP}
              onClose={() => setHelpOpen(false)}
              eyebrow={SFA_TARGET_UNIV_HELP_TITLE}
              title="대상대학 설정 규칙"
              description={SFA_TARGET_UNIV_HELP_SUB}
            />
          ) : null}
          <section className="overflow-hidden rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SchoolKindTabBar
                active={schoolKind}
                universityCount={payload?.universityCount ?? 0}
                juniorCollegeCount={payload?.juniorCollegeCount ?? 0}
                onChange={(next) => {
                  setSearch("");
                  setSchoolKind(next);
                }}
                ariaLabel="대상대학 학교종류"
              />
              <div className="flex flex-wrap items-center gap-2">
                <SchoolNameSearchInput
                  value={search}
                  onSearch={setSearch}
                  className="shrink-0"
                  inputClassName={`h-7 w-36 rounded-md border border-border bg-surface-2 px-2 py-0 outline-none focus:border-accent sm:w-44 ${FDB_TYPO.toolbarControl}`}
                />
                <GlassHelpButton
                  active={helpOpen}
                  onClick={() => setHelpOpen((open) => !open)}
                />
              </div>
            </div>
            <div className="feam-table-wrap mt-3 overflow-auto rounded-lg border border-border/60">
              <table
                className={`w-full min-w-[960px] table-fixed border-collapse ${FDB_TYPO.tableBody}`}
              >
                <colgroup>
                  <col style={{ width: FDB_SCHOOL_NAME_COL_PX }} />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    {(
                      [
                        { label: "학교명", align: "left" as const },
                        { label: "재학생수", align: "right" as const },
                        { label: "설립", align: "center" as const },
                        { label: "학교종류", align: "center" as const },
                        { label: "상태", align: "center" as const },
                        { label: "규모", align: "center" as const },
                        { label: "지역", align: "center" as const },
                        { label: "권역", align: "center" as const },
                      ] as const
                    ).map((col) => (
                      <th
                        key={col.label}
                        className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} ${
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                              ? "pr-[5ch] text-right"
                              : "text-left"
                        } last:border-r-0`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <SchoolTableRow key={row.schoolCodeStd} row={row} even={i % 2 === 0} />
                  ))}
                </tbody>
              </table>
              {!payload ? (
                <p className={`px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>불러오는 중…</p>
              ) : filtered.length === 0 ? (
                <p className={`px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
                  {search.trim()
                    ? "검색어에 맞는 학교가 없습니다. 학교명을 지운 뒤 Enter를 누르면 전체 목록이 다시 나옵니다."
                    : "조건에 맞는 학교가 없습니다. 대학현황에서 해당 연도 신입생충원(학부)을 확인하세요."}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : (
        <SourcesPanel year={year ?? payload?.displayYear ?? 2025} />
      )}

      <p className={`flex items-center gap-1.5 ${FDB_TYPO.legend}`}>
        <SlidersHorizontal size={13} />
        분석실행은 신입생충원 학부 자료를 대표학교코드로 묶어 분석결과·대학별분석에
        넣습니다. 재학·외국인 탭은 다음 단계입니다.
      </p>
    </div>
  );
}

function fmtEnrolled(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return Math.trunc(n).toLocaleString("ko-KR");
}

function SchoolTableRow({ row, even }: { row: StudentFillSchoolRow; even: boolean }) {
  const cell = `whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} last:border-r-0 ${FDB_TYPO.tableBody}`;
  return (
    <tr className={`border-b border-border/40 ${even ? "bg-surface" : "bg-surface-2/30"}`}>
      <td
        className={`overflow-hidden border-r border-border/40 ${FDB_TABLE.cellSticky} ${FDB_TABLE.schoolNameCol} ${FDB_TABLE_COLOR.schoolName}`}
      >
        {row.schoolName}
      </td>
      <td className={`${cell} pr-[5ch] text-right font-mono tabular-nums`}>
        {fmtEnrolled(row.enrolledTotal)}
      </td>
      <td className={`${cell} text-center`}>{row.estb}</td>
      <td className={`${cell} text-center`}>{row.schoolKind}</td>
      <td className={`${cell} text-center`}>{row.status}</td>
      <td className={`${cell} text-center`}>{row.scale ?? ""}</td>
      <td className={`${cell} text-center`}>{row.region}</td>
      <td className={`${cell} text-center`}>{row.zone ?? ""}</td>
    </tr>
  );
}

function SourcesPanel({ year }: { year: number }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {helpOpen ? (
        <HelpGuidePanel
          sections={sfaSourcesHelp(year)}
          onClose={() => setHelpOpen(false)}
          eyebrow={SFA_SOURCES_HELP_TITLE}
          title="기초자료 설정 규칙"
          description={SFA_SOURCES_HELP_SUB}
        />
      ) : null}
      <section className="overflow-hidden rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <GlassHelpButton
            active={helpOpen}
            onClick={() => setHelpOpen((open) => !open)}
          />
        </div>
        <div className="feam-table-wrap mt-3 overflow-auto rounded-lg border border-border/60">
          <table className={`w-full min-w-[880px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {["자료", "대학현황 위치", "범위", "기간", "사용 연도"].map((h) => (
                  <th
                    key={h}
                    className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] bg-surface-2 whitespace-nowrap border-r border-border/50 ${FDB_TABLE.headSingle} text-left last:border-r-0`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SFA_SOURCE_STATUS.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-border/40 ${i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"}`}
                >
                  <td className={`${FDB_TABLE.cell} font-medium`}>{row.label}</td>
                  <td className={`${FDB_TABLE.cell} ${FDB_TYPO.legend}`}>{row.menu}</td>
                  <td className={FDB_TABLE.cell}>{row.dataset}</td>
                  <td className={FDB_TABLE.cell}>{row.period}</td>
                  <td className={`${FDB_TABLE.cell} font-semibold text-emerald-800`}>
                    {sourceYearForAnalysisYear(
                      year,
                      row.id as
                        | "freshman"
                        | "enrolled"
                        | "enrolled-students"
                        | "foreign"
                        | "dropout"
                        | "foreign-dropout",
                    )}
                    년
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
