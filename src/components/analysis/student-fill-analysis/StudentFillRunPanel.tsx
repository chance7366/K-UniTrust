"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { GraduationCap, Globe, Layers3, Users } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { DashboardKpiCard, type DashboardKpiAccent } from "@/components/analysis/DashboardKpiCard";
import { FinanceSectionTabRow, GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import {
  GlassHelpButton,
} from "@/components/analysis/GlassHelpButton";
import { HelpGuidePanel } from "@/components/analysis/FundSecureRateAdvancedHelp";
import { SchoolNameSearchInput } from "@/components/analysis/SchoolNameSearchInput";
import { StudentFillRunChartsDashboard } from "@/components/analysis/student-fill-analysis/StudentFillRunChartsDashboard";
import {
  SchoolKindTabBar,
  type SchoolKindTabId,
} from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  SFA_RUN_RESULTS_HELP_SUB,
  SFA_RUN_RESULTS_HELP_TITLE,
  sfaRunResultsHelp,
  type SfaResultStage,
} from "@/lib/analysis/student-fill-analysis/run-results-help";
import {
  pct,
  type StudentFillEdition,
  type StudentFillSchoolRow,
} from "@/lib/analysis/student-fill-analysis/types";
import {
  downloadExportCsv,
  downloadExportXlsx,
  type ExportCell,
} from "@/lib/competitiveness-analysis/export-run-results";
import { sfaFillStage } from "@/lib/analysis/student-fill-analysis/fill-stage";
import {
  studentFillRowMatchesEstb,
  type StudentFillEstbFilter,
} from "@/lib/analysis/student-fill-analysis/cohort-rules";

import "@/components/analysis/glass-help-button.css";
import "@/components/analysis/freshman-enrollment-alimi-table.css";
import "@/components/analysis/competitiveness-analysis/run-export-buttons.css";

type ResultStage = SfaResultStage;

type ColKind = "text" | "int" | "pct" | "signedPct";
type ColTone = "school" | "ratePrimary" | "rateSecondary";

type ResultCol = {
  label: string;
  align: "left" | "center" | "right";
  kind: ColKind;
  tone?: ColTone;
  get: (row: StudentFillSchoolRow) => string | number | null | undefined;
};

function metaCols(includeDivision: boolean): ResultCol[] {
  const divisionCol: ResultCol[] = includeDivision
    ? [{ label: "학교구분", align: "center", kind: "text", get: (row) => row.schoolDivision }]
    : [];
  return [
    { label: "학교명", align: "left", kind: "text", tone: "school", get: (row) => row.schoolName },
    ...divisionCol,
    { label: "재학생수", align: "right", kind: "int", get: (row) => row.enrolledTotal },
    { label: "규모", align: "center", kind: "text", get: (row) => row.scale ?? "" },
    { label: "지역", align: "center", kind: "text", get: (row) => row.region },
    { label: "권역", align: "center", kind: "text", get: (row) => row.zone ?? "" },
  ];
}

function stageCols(stage: ResultStage, includeDivision: boolean): ResultCol[] {
  const meta = metaCols(includeDivision);
  const rest: Record<ResultStage, ResultCol[]> = {
    freshman: [
      { label: "정원내모집", align: "right", kind: "int", get: (row) => row.recruitWithin },
      { label: "정원내입학", align: "right", kind: "int", get: (row) => row.admitWithin },
      { label: "정원내충원율", align: "right", kind: "pct", tone: "rateSecondary", get: (row) => row.rateIn },
      { label: "정원외모집", align: "right", kind: "int", get: (row) => row.recruitOutside },
      { label: "정원외입학", align: "right", kind: "int", get: (row) => row.admitOutside },
      { label: "정원외비중", align: "right", kind: "pct", get: (row) => row.outShare },
      { label: "정원내외충원율", align: "right", kind: "pct", tone: "ratePrimary", get: (row) => row.rateAll },
      { label: "신입생탈락", align: "right", kind: "int", get: (row) => row.freshmanDropoutCount },
      { label: "신입생탈락율", align: "right", kind: "pct", get: (row) => row.freshmanDropoutRate },
    ],
    enrolled: [
      { label: "학생정원", align: "right", kind: "int", get: (row) => row.studentQuota },
      { label: "재학생", align: "right", kind: "int", get: (row) => row.enrolledFill },
      { label: "재학생충원율", align: "right", kind: "pct", tone: "ratePrimary", get: (row) => row.enrolledFillRate },
      { label: "정원내충원율", align: "right", kind: "pct", get: (row) => row.enrolledFillRateIn },
      { label: "정원외재학생", align: "right", kind: "int", get: (row) => row.enrolledOutside },
      { label: "정원외비중", align: "right", kind: "pct", get: (row) => row.enrolledOutShare },
      { label: "재적", align: "right", kind: "int", get: (row) => row.rosterTotal },
      { label: "휴학", align: "right", kind: "int", get: (row) => row.leaveCount },
      { label: "유예", align: "right", kind: "int", get: (row) => row.deferCount },
      { label: "중도탈락", align: "right", kind: "int", get: (row) => row.dropoutCount },
      { label: "중도탈락율", align: "right", kind: "pct", tone: "rateSecondary", get: (row) => row.dropoutRate },
      { label: "신입생탈락", align: "right", kind: "int", get: (row) => row.freshmanDropoutCount },
      { label: "신입생탈락율", align: "right", kind: "pct", get: (row) => row.freshmanDropoutRate },
    ],
    foreign: [
      { label: "학위외국인", align: "right", kind: "int", get: (row) => row.foreignDegree },
      { label: "공동운영", align: "right", kind: "int", get: (row) => row.foreignJoint },
      { label: "연수", align: "right", kind: "int", get: (row) => row.foreignTraining },
      { label: "외국인계", align: "right", kind: "int", get: (row) => row.foreignTotal },
      { label: "재적대비비중", align: "right", kind: "pct", tone: "ratePrimary", get: (row) => row.foreignShare },
      { label: "언어능력충족율", align: "right", kind: "pct", get: (row) => row.langAbilityRate },
      { label: "외국인탈락", align: "right", kind: "int", get: (row) => row.foreignDropCount },
      { label: "외국인탈락율", align: "right", kind: "pct", tone: "rateSecondary", get: (row) => row.foreignDropRate },
      { label: "전체외국인탈락율", align: "right", kind: "pct", get: (row) => row.foreignDropAllRate },
    ],
    summary: [
      { label: "정원내외충원율", align: "right", kind: "pct", tone: "ratePrimary", get: (row) => row.rateAll },
      { label: "모집증감", align: "right", kind: "signedPct", get: (row) => row.recruitChange },
      { label: "정원외비중", align: "right", kind: "pct", get: (row) => row.outShare },
      { label: "휴학비중", align: "right", kind: "pct", get: (row) => row.leaveShare },
      { label: "유예비중", align: "right", kind: "pct", get: (row) => row.deferShare },
      { label: "학위외국인", align: "right", kind: "int", get: (row) => row.foreignDegree },
      { label: "외국인비중", align: "right", kind: "pct", get: (row) => row.foreignShare },
      { label: "연수인원", align: "right", kind: "int", get: (row) => row.foreignTraining },
      { label: "언어능력", align: "right", kind: "pct", get: (row) => row.langAbilityRate },
      { label: "신입생탈락율", align: "right", kind: "pct", get: (row) => row.freshmanDropoutRate },
      { label: "외국인탈락율", align: "right", kind: "pct", tone: "rateSecondary", get: (row) => row.foreignDropRate },
      { label: "전체외국인탈락율", align: "right", kind: "pct", get: (row) => row.foreignDropAllRate },
    ],
  };
  return [...meta, ...rest[stage]];
}

const TABLE_MIN_W: Record<ResultStage, string> = {
  freshman: "min-w-[1480px]",
  enrolled: "min-w-[1880px]",
  foreign: "min-w-[1580px]",
  summary: "min-w-[1780px]",
};

const TABLE_MIN_W_ALL: Record<ResultStage, string> = {
  freshman: "min-w-[1568px]",
  enrolled: "min-w-[1968px]",
  foreign: "min-w-[1668px]",
  summary: "min-w-[1868px]",
};

function tableMinW(stage: ResultStage, includeDivision: boolean): string {
  return includeDivision ? TABLE_MIN_W_ALL[stage] : TABLE_MIN_W[stage];
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return Math.trunc(n).toLocaleString("ko-KR");
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return `${n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function fmtSignedPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  const body = n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${n > 0 ? "+" : ""}${body}%`;
}

function formatCell(col: ResultCol, row: StudentFillSchoolRow): string {
  const value = col.get(row);
  if (col.kind === "int") return fmtInt(typeof value === "number" ? value : null);
  if (col.kind === "pct") return fmtPct(typeof value === "number" ? value : null);
  if (col.kind === "signedPct") return fmtSignedPct(typeof value === "number" ? value : null);
  return value == null ? "" : String(value);
}

function exportCell(col: ResultCol, row: StudentFillSchoolRow): ExportCell {
  const value = col.get(row);
  if (col.kind === "int") {
    return typeof value === "number" && !Number.isNaN(value) ? Math.trunc(value) : "";
  }
  if (col.kind === "pct" || col.kind === "signedPct") {
    return typeof value === "number" && !Number.isNaN(value) ? Math.round(value * 10) / 10 : "";
  }
  return value == null ? "" : String(value);
}

function countStages(rows: StudentFillSchoolRow[]) {
  const counts = { 충원양호: 0, 충원보통: 0, 충원취약: 0, 충원위기: 0 };
  for (const row of rows) {
    if (row.rateAll == null) continue;
    counts[sfaFillStage(row.rateAll).label] += 1;
  }
  return counts;
}

function weightedPct(
  rows: StudentFillSchoolRow[],
  num: (row: StudentFillSchoolRow) => number | null | undefined,
  den: (row: StudentFillSchoolRow) => number | null | undefined,
): number | null {
  let n = 0;
  let d = 0;
  for (const row of rows) {
    const a = num(row);
    const b = den(row);
    if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) || b <= 0) continue;
    n += a;
    d += b;
  }
  return pct(n, d);
}

function sumInt(
  rows: StudentFillSchoolRow[],
  pick: (row: StudentFillSchoolRow) => number | null | undefined,
): number {
  let total = 0;
  for (const row of rows) {
    const n = pick(row);
    if (n == null || !Number.isFinite(n)) continue;
    total += n;
  }
  return total;
}

type KpiItem = { accent: DashboardKpiAccent; title: string; value: string; sub: string };

function stageKpis(stage: ResultStage, rows: StudentFillSchoolRow[], year: number): KpiItem[] {
  const prior = year - 1;
  if (stage === "enrolled") {
    return [
      {
        accent: "emerald",
        title: "재학생충원율",
        value: fmtPct(weightedPct(rows, (r) => r.enrolledFill, (r) => r.enrolledFillDenom)) || "—",
        sub: `${year}년 상반기 · 가중`,
      },
      {
        accent: "amber",
        title: "중도탈락율",
        value: fmtPct(weightedPct(rows, (r) => r.dropoutCount, (r) => r.dropoutEnrolled)) || "—",
        sub: `${prior}년 · 가중`,
      },
      {
        accent: "blue",
        title: "학생정원",
        value: `${fmtInt(sumInt(rows, (r) => r.studentQuota))}명`,
        sub: `${year}년 상반기 합`,
      },
      {
        accent: "red",
        title: "중도탈락",
        value: `${fmtInt(sumInt(rows, (r) => r.dropoutCount))}명`,
        sub: `${prior}년 합`,
      },
    ];
  }
  if (stage === "foreign") {
    return [
      {
        accent: "blue",
        title: "학위외국인",
        value: `${fmtInt(sumInt(rows, (r) => r.foreignDegree))}명`,
        sub: `${year}년 학위과정 소계(A)`,
      },
      {
        accent: "emerald",
        title: "재적대비비중",
        value: fmtPct(weightedPct(rows, (r) => r.foreignDegree, (r) => r.enrolledTotal)) || "—",
        sub: "학위외국인 ÷ 재학생수",
      },
      {
        accent: "amber",
        title: "외국인탈락율",
        value: fmtPct(weightedPct(rows, (r) => r.foreignDropCount, (r) => r.foreignDropEnrolled)) || "—",
        sub: `${prior}년 학위 범위 · 가중`,
      },
      {
        accent: "red",
        title: "외국인탈락",
        value: `${fmtInt(sumInt(rows, (r) => r.foreignDropCount))}명`,
        sub: `${prior}년 학위 탈락 합`,
      },
    ];
  }
  if (stage === "summary") {
    const shrink = rows.filter((row) => row.recruitChange != null && row.recruitChange < 0).length;
    return [
      {
        accent: "emerald",
        title: "정원내외충원율",
        value: fmtPct(weightedPct(rows, (r) => r.admitTotal, (r) => r.recruitTotal)) || "—",
        sub: `${year}년 · 가중`,
      },
      {
        accent: "red",
        title: "모집축소",
        value: `${shrink.toLocaleString("ko-KR")}교`,
        sub: "전년 대비 모집인원 감소",
      },
      {
        accent: "amber",
        title: "정원외비중",
        value: fmtPct(weightedPct(rows, (r) => r.admitOutside, (r) => r.admitTotal)) || "—",
        sub: "정원외입학 ÷ 입학 합",
      },
      {
        accent: "blue",
        title: "외국인비중",
        value: fmtPct(weightedPct(rows, (r) => r.foreignDegree, (r) => r.enrolledTotal)) || "—",
        sub: "학위외국인 ÷ 재학생수",
      },
    ];
  }
  const stages = countStages(rows);
  return [
    {
      accent: "red",
      title: "충원위기",
      value: `${stages.충원위기.toLocaleString("ko-KR")}교`,
      sub: "정원내외 충원율 90% 미만",
    },
    {
      accent: "amber",
      title: "충원취약",
      value: `${stages.충원취약.toLocaleString("ko-KR")}교`,
      sub: "90% 이상 94% 미만",
    },
    {
      accent: "blue",
      title: "충원보통",
      value: `${stages.충원보통.toLocaleString("ko-KR")}교`,
      sub: "94% 이상 98% 미만",
    },
    {
      accent: "emerald",
      title: "충원양호",
      value: `${stages.충원양호.toLocaleString("ko-KR")}교`,
      sub: "정원내외 충원율 98% 이상",
    },
  ];
}

export function StudentFillRunPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = Number(searchParams.get("year"));
  const yearFromUrl = Number.isInteger(yearParam) && yearParam >= 2000 ? yearParam : null;
  const [section, setSection] = useState<"data" | "charts">("data");
  const [schoolKind, setSchoolKind] = useState<SchoolKindTabId>("university");
  const [estbFilter, setEstbFilter] = useState<StudentFillEstbFilter>("all");
  const [resultStage, setResultStage] = useState<ResultStage>("freshman");
  const [search, setSearch] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [edition, setEdition] = useState<StudentFillEdition | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [analysisYear, setAnalysisYear] = useState<number | null>(yearFromUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (analysisYear != null) qs.set("year", String(analysisYear));
    let cancelled = false;
    setLoading(true);
    fetch(`/api/student-fill-analysis/run?${qs.toString()}`)
      .then(async (res) => {
        const body = (await res.json()) as {
          years?: number[];
          analysisYear?: number | null;
          edition?: StudentFillEdition | null;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "분석결과를 불러오지 못했습니다.");
        if (cancelled) return;
        setYears(body.years ?? []);
        setEdition(body.edition ?? null);
        if (body.analysisYear) setAnalysisYear(body.analysisYear);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "분석결과를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [analysisYear]);

  const estbRows = useMemo(() => {
    if (!edition) return [];
    return edition.schools.filter((row) =>
      studentFillRowMatchesEstb(row.estb, estbFilter),
    );
  }, [edition, estbFilter]);

  const cohortRows = useMemo(() => {
    if (schoolKind === "all") return estbRows;
    const division = schoolKind === "junior-college" ? "전문대학" : "대학";
    return estbRows.filter((row) => row.schoolDivision === division);
  }, [estbRows, schoolKind]);

  const schoolKindCounts = useMemo(() => {
    let universityCount = 0;
    let juniorCollegeCount = 0;
    for (const row of estbRows) {
      if (row.schoolDivision === "전문대학") juniorCollegeCount += 1;
      else universityCount += 1;
    }
    return {
      universityCount,
      juniorCollegeCount,
      allCount: universityCount + juniorCollegeCount,
    };
  }, [estbRows]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? cohortRows.filter(
          (row) =>
            row.schoolName.toLowerCase().includes(q) ||
            row.schoolCodeStd.toLowerCase().includes(q),
        )
      : cohortRows;
    return [...rows].sort((a, b) => a.schoolName.localeCompare(b.schoolName, "ko"));
  }, [cohortRows, search]);

  const year = analysisYear ?? edition?.analysisYear ?? years[0] ?? 2025;
  const includeDivision = schoolKind === "all";
  const cols = stageCols(resultStage, includeDivision);
  const kpis = useMemo(
    () => stageKpis(resultStage, cohortRows, year),
    [resultStage, cohortRows, year],
  );

  function changeYear(next: number) {
    setSearch("");
    setAnalysisYear(next);
    router.replace(`/analysis/student-fill-analysis/run?year=${next}`);
  }

  function exportRows(format: "csv" | "xlsx") {
    const aoa: ExportCell[][] = [
      cols.map((col) => col.label),
      ...visibleRows.map((row) => cols.map((col) => exportCell(col, row))),
    ];
    const kindLabel =
      schoolKind === "all" ? "all" : schoolKind === "junior-college" ? "junior_college" : "university";
    const estbLabel =
      estbFilter === "public" ? "public" : estbFilter === "private" ? "private" : "all_estb";
    const filename = `student_fill_${year}_${kindLabel}_${estbLabel}_${resultStage}.${format}`;
    if (format === "csv") downloadExportCsv(filename, aoa);
    else downloadExportXlsx(filename, aoa, "분석결과");
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardEmeraldHeader
        sectionLabel="학생충원분석"
        title="분석결과"
        subtitle="신입생충원 · 재학생충원 · 외국인 · 종합 결과를 분석연도별로 조회합니다"
        note={
          edition
            ? `${edition.analysisYear}년 실행 · ${edition.lastRunAt}`
            : "기본설정에서 분석실행하면 이 화면에 저장됩니다."
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <label className={FDB_TYPO.toolbarLabel} htmlFor="sfa-run-year">
            분석연도
          </label>
          <select
            id="sfa-run-year"
            value={year}
            onChange={(event) => changeYear(Number(event.target.value))}
            className={`h-[30px] rounded-md border border-border bg-surface-2 px-2.5 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
          >
            {(years.length ? years : [year]).map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <span
            className={`rounded-md border px-2 py-0.5 ${FDB_TYPO.legend} ${
              edition
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-surface-2 text-muted"
            }`}
          >
            {edition ? "분석결과 있음" : "분석결과 없음"}
          </span>
        </div>
        <FinanceSectionTabRow
          active={section}
          onChange={(next) => {
            setSection(next);
            if (next === "charts" && resultStage === "summary") {
              setResultStage("freshman");
            }
          }}
        />
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
        {(section === "data" || section === "charts") ? (
          <>
            <GlassMintTabGroup
              ariaLabel="분석결과 단계"
              active={resultStage}
              onChange={setResultStage}
              items={
                section === "charts"
                  ? [
                      { id: "freshman", label: "신입생충원", icon: GraduationCap },
                      { id: "enrolled", label: "재학생충원", icon: Users },
                      { id: "foreign", label: "외국인", icon: Globe },
                    ]
                  : [
                      { id: "freshman", label: "신입생충원", icon: GraduationCap },
                      { id: "enrolled", label: "재학생충원", icon: Users },
                      { id: "foreign", label: "외국인", icon: Globe },
                      { id: "summary", label: "종합", icon: Layers3 },
                    ]
              }
            />
            <SchoolKindTabBar
              showAll
              active={schoolKind}
              universityCount={schoolKindCounts.universityCount}
              juniorCollegeCount={schoolKindCounts.juniorCollegeCount}
              allCount={schoolKindCounts.allCount}
              onChange={(next) => {
                setSearch("");
                setSchoolKind(next);
              }}
              ariaLabel="분석결과 학교종류"
            />
          </>
        ) : null}
      </div>

      {error ? <p className={`${FDB_TYPO.legend} text-danger`}>{error}</p> : null}

      {section === "charts" ? (
        <StudentFillRunChartsDashboard
          preferredYear={analysisYear}
          currentSchools={edition?.schools ?? null}
          stage={resultStage === "summary" ? "freshman" : resultStage}
          schoolKind={schoolKind}
          estbFilter={estbFilter}
        />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <DashboardKpiCard
            key={kpi.title}
            accent={kpi.accent}
            title={kpi.title}
            value={kpi.value}
            sub={kpi.sub}
          />
        ))}
      </div>

      {!loading && !edition ? (
        <p className={`rounded-lg border border-border bg-surface-2 px-4 py-6 ${FDB_TYPO.bodyText}`}>
          {year}년 저장된 분석결과가 없습니다.{" "}
          <Link
            href={`/analysis/student-fill-analysis/settings`}
            className="font-medium text-accent hover:underline"
          >
            기본설정에서 분석실행
          </Link>
          을 누르면 해당 연도 결과가 만들어집니다.
        </p>
      ) : null}

      {helpOpen ? (
        <HelpGuidePanel
          sections={sfaRunResultsHelp(year, resultStage)}
          onClose={() => setHelpOpen(false)}
          eyebrow={SFA_RUN_RESULTS_HELP_TITLE}
          title="분석결과 조회"
          description={SFA_RUN_RESULTS_HELP_SUB}
        />
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <SchoolNameSearchInput
            value={search}
            onSearch={setSearch}
            className="shrink-0"
          />
          <button
            type="button"
            onClick={() => exportRows("csv")}
            disabled={visibleRows.length === 0}
            className={`run-export-btn ${FDB_TYPO.toolbarControl}`}
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportRows("xlsx")}
            disabled={visibleRows.length === 0}
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
        <div className="feam-table-wrap mt-3 overflow-auto rounded-lg border border-border/60">
          <table className={`w-full ${tableMinW(resultStage, includeDivision)} table-fixed border-collapse ${FDB_TYPO.tableBody}`}>
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {cols.map((col) => (
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
              {visibleRows.map((row, i) => (
                <ResultTableRow
                  key={row.schoolCodeStd}
                  row={row}
                  cols={cols}
                  even={i % 2 === 0}
                />
              ))}
            </tbody>
          </table>
          {loading ? (
            <p className={`px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>불러오는 중…</p>
          ) : edition && visibleRows.length === 0 ? (
            <p className={`px-4 py-8 text-center ${FDB_TYPO.bodyText}`}>
              {search.trim()
                ? "검색어에 맞는 학교가 없습니다. 학교명을 지운 뒤 Enter를 누르면 전체 목록이 다시 나옵니다."
                : "표시할 분석결과가 없습니다."}
            </p>
          ) : null}
        </div>
      </section>
        </>
      )}
    </div>
  );
}

function ResultTableRow({
  row,
  cols,
  even,
}: {
  row: StudentFillSchoolRow;
  cols: ResultCol[];
  even: boolean;
}) {
  const cell = `whitespace-nowrap border-r border-border/40 ${FDB_TABLE.cell} last:border-r-0`;
  const num = `${cell} pr-[5ch] text-right font-mono tabular-nums`;
  return (
    <tr className={`border-b border-border/40 ${even ? "bg-surface" : "bg-surface-2/30"}`}>
      {cols.map((col) => {
        const tone =
          col.tone === "school"
            ? FDB_TABLE_COLOR.schoolName
            : col.tone === "ratePrimary"
              ? FDB_TABLE_COLOR.ratePrimary
              : col.tone === "rateSecondary"
                ? FDB_TABLE_COLOR.rateSecondary
                : "";
        const alignClass =
          col.align === "right" ? num : col.align === "center" ? `${cell} text-center` : cell;
        return (
          <td
            key={col.label}
            className={`${alignClass} ${tone} ${col.tone === "school" ? "overflow-hidden" : ""}`}
          >
            {formatCell(col, row)}
          </td>
        );
      })}
    </tr>
  );
}
