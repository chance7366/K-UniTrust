"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Building2, MapPin } from "lucide-react";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { RegionalDeclineChartDashboard } from "@/components/analysis/RegionalDeclineChartDashboard";
import { RegionalDeclineGradeMatrix } from "@/components/analysis/RegionalDeclineGradeMatrix";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  buildRegionalDeclineDashboardModel,
  fmtRegionalIndex,
  type RegionalDeclineGradeGroup,
} from "@/lib/analysis/regional-decline-dashboard-analytics";
import {
  EXTINCTION_RISK_GRADE_COLORS,
  EXTINCTION_RISK_GRADE_LEGEND,
  getExtinctionRiskGradeStyle,
} from "@/lib/analysis/regional-decline-grade";
import type { RegionalDeclineRow } from "@/lib/data/regional-decline";

import "@/components/analysis/freshman-enrollment-alimi-table.css";
import "./regional-decline-sigungu-mock.css";

import type {
  RegionalDeclineMockCell,
  RegionalDeclineMockSigunguRow,
  RegionalDeclineSigunguMockData,
} from "./types";

type MainSection = "sido-data" | "dashboard";
type GeoTab = "sido" | "sigungu";

const ALL_FILTER = "";

const NEW_HEADERS = [
  "기준연도",
  "행정기관코드",
  "행정기관",
  "여성인구(20~39세)",
  "노인인구(65세이상)",
  "인구소멸지수",
] as const;

function toChartRows(
  rows: RegionalDeclineSigunguMockData["sidoRows"],
): RegionalDeclineRow[] {
  return rows.map((row) => ({
    region: row.region,
    regionCode: row.regionCode,
    byYear: Object.fromEntries(
      Object.entries(row.byYear).map(([year, cell]) => [
        Number(year),
        { index: cell.index, grade: cell.grade },
      ]),
    ),
  }));
}

function GradeBadge({ grade }: { grade: number }) {
  const style = getExtinctionRiskGradeStyle(grade);
  return (
    <span
      className="inline-flex min-w-[1.75rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

function IndexCell({ cell }: { cell: RegionalDeclineMockCell | undefined }) {
  if (!cell) return <span className="text-muted">—</span>;
  const style = getExtinctionRiskGradeStyle(cell.grade);
  return (
    <span className="font-mono text-sm font-semibold" style={{ color: style.bg }}>
      {cell.index.toFixed(2)}
    </span>
  );
}

function GradeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-muted">소멸위험등급</span>
      {EXTINCTION_RISK_GRADE_LEGEND.map((grade) => {
        const style = EXTINCTION_RISK_GRADE_COLORS[grade];
        return (
          <span
            key={grade}
            className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded px-1.5 text-xs font-bold"
            style={{ backgroundColor: style.bg, color: style.text }}
          >
            {grade}
          </span>
        );
      })}
    </div>
  );
}

function SubTabRow({
  active,
  onChange,
}: {
  active: GeoTab;
  onChange: (tab: GeoTab) => void;
}) {
  const tabs: { id: GeoTab; label: string; icon: typeof MapPin }[] = [
    { id: "sido", label: "시도", icon: MapPin },
    { id: "sigungu", label: "시군구", icon: Building2 },
  ];

  return (
    <div className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-[28px] items-center gap-1 rounded px-2.5 text-sm transition-colors ${
              isActive
                ? "bg-surface font-semibold text-indigo-700 shadow-sm ring-1 ring-border/60"
                : "font-medium text-muted hover:text-foreground"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-700" : "text-muted"}`} aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function MainTabRow({
  active,
  onChange,
  action,
}: {
  active: MainSection;
  onChange: (section: MainSection) => void;
  action?: ReactNode;
}) {
  const tabs: { id: MainSection; label: string; icon: typeof MapPin }[] = [
    { id: "sido-data", label: "시도별자료", icon: MapPin },
    { id: "dashboard", label: "지역소멸대시보드", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="inline-flex gap-0.5 rounded-md border border-border bg-surface-2 p-0.5" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
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
              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-indigo-700" : "text-muted"}`} aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>
      {action ?? null}
    </div>
  );
}

function YearToggles({
  allYears,
  displayYears,
  onToggle,
}: {
  allYears: number[];
  displayYears: number[];
  onToggle: (year: number) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={FDB_TYPO.toolbarLabel}>표시 연도</span>
        {allYears.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onToggle(y)}
            className={`h-[30px] rounded-md border px-2.5 py-1 transition-colors ${FDB_TYPO.toolbarControl} ${
              displayYears.includes(y)
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {y}년
          </button>
        ))}
      </div>
    </section>
  );
}

function SidoDataTable({
  rows,
  displayYears,
}: {
  rows: RegionalDeclineSigunguMockData["sidoRows"];
  displayYears: number[];
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="feam-table-wrap rounded-lg border border-border/60">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2 text-xs">
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} feam-th-sticky-col sticky top-0 z-20 min-w-[88px] bg-surface-2 text-left`}
              >
                구분
              </th>
              {displayYears.map((y) => (
                <th
                  key={y}
                  colSpan={2}
                  className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] text-center ${FDB_TABLE.headGroup} ${
                    y !== displayYears[displayYears.length - 1] ? "border-r border-border/50" : ""
                  }`}
                >
                  {y}년
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 text-xs">
              {displayYears.map((y) => (
                <Fragment key={y}>
                  <th className={`${FDB_TABLE_HEAD.base} sticky top-8 z-[2] min-w-[72px] text-center ${FDB_TABLE.headSub}`}>
                    지수
                  </th>
                  <th
                    className={`${FDB_TABLE_HEAD.base} sticky top-8 z-[2] min-w-[56px] text-center ${FDB_TABLE.headSub} ${
                      y !== displayYears[displayYears.length - 1] ? "border-r border-border/50" : ""
                    }`}
                  >
                    등급
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.region} className="border-b border-border/50 hover:bg-accent/5">
                <td
                  className={`feam-td-sticky-col border-r border-border/50 ${FDB_TABLE.cellSticky} ${FDB_TABLE_COLOR.schoolName} ${
                    i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                >
                  {row.region}
                </td>
                {displayYears.map((y) => {
                  const cell = row.byYear[y];
                  const isLastYear = y === displayYears[displayYears.length - 1];
                  return (
                    <Fragment key={`${row.region}-${y}`}>
                      <td className={`${FDB_TABLE.cell} text-center align-middle`}>
                        <IndexCell cell={cell} />
                      </td>
                      <td
                        className={`${FDB_TABLE.cell} text-center align-middle ${
                          !isLastYear ? "border-r border-border/40" : ""
                        }`}
                      >
                        {cell ? <GradeBadge grade={cell.grade} /> : <span className="text-muted">—</span>}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <GradeLegend />
        <p className={`mt-2 ${FDB_TYPO.legend}`}>
          전국은 파일에 없어 시도의 20~39세 여성·65세 이상 인구를 합산해 지수를 산출했습니다. 등급은 기존 공식(10 미만 5 … 100 이상 0)으로 계산합니다.
        </p>
      </div>
    </section>
  );
}

function SigunguDataTable({
  rows,
  displayYears,
  sidoFilter,
  query,
}: {
  rows: RegionalDeclineMockSigunguRow[];
  displayYears: number[];
  sidoFilter: string;
  query: string;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (sidoFilter && row.sido !== sidoFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.fullName.toLowerCase().includes(q) ||
        row.sido.toLowerCase().includes(q) ||
        row.regionCode.includes(q)
      );
    });
  }, [query, rows, sidoFilter]);

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <p className={`mb-3 ${FDB_TYPO.legend}`}>
        {filtered.length.toLocaleString("ko-KR")}개 시군구
        {sidoFilter ? ` · ${sidoFilter}` : ""}
        {query ? ` · “${query}”` : ""}
      </p>
      <div className="feam-table-wrap rounded-lg border border-border/60">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2 text-xs">
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} feam-th-sticky-col sticky top-0 z-20 min-w-[72px] bg-surface-2 text-left`}
              >
                시도
              </th>
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} sticky top-0 left-[72px] z-20 min-w-[140px] bg-surface-2 text-left`}
              >
                시군구
              </th>
              {displayYears.map((y) => (
                <th
                  key={y}
                  colSpan={2}
                  className={`${FDB_TABLE_HEAD.base} sticky top-0 z-[2] text-center ${FDB_TABLE.headGroup} ${
                    y !== displayYears[displayYears.length - 1] ? "border-r border-border/50" : ""
                  }`}
                >
                  {y}년
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-2 text-xs">
              {displayYears.map((y) => (
                <Fragment key={y}>
                  <th className={`${FDB_TABLE_HEAD.base} sticky top-8 z-[2] min-w-[72px] text-center ${FDB_TABLE.headSub}`}>
                    지수
                  </th>
                  <th
                    className={`${FDB_TABLE_HEAD.base} sticky top-8 z-[2] min-w-[56px] text-center ${FDB_TABLE.headSub} ${
                      y !== displayYears[displayYears.length - 1] ? "border-r border-border/50" : ""
                    }`}
                  >
                    등급
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={`${row.sido}-${row.regionCode}-${row.name}`}
                className="border-b border-border/50 hover:bg-accent/5"
              >
                <td
                  className={`feam-td-sticky-col border-r border-border/50 ${FDB_TABLE.cellSticky} ${
                    i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                >
                  {row.sido}
                </td>
                <td
                  className={`${FDB_TABLE.cellSticky} sticky left-[72px] z-[1] border-r border-border/50 ${FDB_TABLE_COLOR.schoolName} ${
                    i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                >
                  {row.name}
                </td>
                {displayYears.map((y) => {
                  const cell = row.byYear[y];
                  const isLastYear = y === displayYears[displayYears.length - 1];
                  return (
                    <Fragment key={`${row.regionCode}-${y}`}>
                      <td className={`${FDB_TABLE.cell} text-center align-middle`}>
                        <IndexCell cell={cell} />
                      </td>
                      <td
                        className={`${FDB_TABLE.cell} text-center align-middle ${
                          !isLastYear ? "border-r border-border/40" : ""
                        }`}
                      >
                        {cell ? <GradeBadge grade={cell.grade} /> : <span className="text-muted">—</span>}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <GradeLegend />
      </div>
    </section>
  );
}

function buildSigunguGradeGroups(
  rows: RegionalDeclineMockSigunguRow[],
  year: number,
): RegionalDeclineGradeGroup[] {
  const entries = rows
    .map((row) => {
      const cell = row.byYear[year];
      if (!cell) return null;
      return {
        region: `${row.sido} ${row.name}`,
        index: cell.index,
        grade: cell.grade,
      };
    })
    .filter(
      (entry): entry is { region: string; index: number; grade: number } =>
        entry != null,
    );

  return [0, 1, 2, 3, 4, 5]
    .map((grade) => {
      const style = getExtinctionRiskGradeStyle(grade);
      const regions = entries
        .filter((entry) => entry.grade === grade)
        .sort((a, b) => a.index - b.index);
      const listed = regions.slice(0, 12);
      return {
        grade,
        label: `등급 ${style.label}`,
        color: style.bg,
        countLabel:
          regions.length > 12
            ? `${regions.length}개 시군구 · 위험 순 12곳`
            : `${regions.length}개 시군구`,
        regions: listed.map((entry) => ({
          region: entry.region,
          index: entry.index,
        })),
      };
    })
    .filter((group) => group.regions.length > 0);
}

function SigunguDashboard({
  rows,
  years,
  sidoOptions,
}: {
  rows: RegionalDeclineMockSigunguRow[];
  years: number[];
  sidoOptions: string[];
}) {
  const latestYear = years[years.length - 1] ?? 0;
  const [sidoFilter, setSidoFilter] = useState(ALL_FILTER);

  const scoped = useMemo(
    () => (sidoFilter ? rows.filter((row) => row.sido === sidoFilter) : rows),
    [rows, sidoFilter],
  );

  const latest = useMemo(
    () =>
      scoped
        .map((row) => {
          const cell = row.byYear[latestYear];
          if (!cell) return null;
          return { row, cell };
        })
        .filter(
          (item): item is { row: RegionalDeclineMockSigunguRow; cell: RegionalDeclineMockCell } =>
            item != null,
        )
        .sort((a, b) => a.cell.index - b.cell.index),
    [latestYear, scoped],
  );

  const highRisk = latest.filter((item) => item.cell.grade >= 4);
  const worst = latest[0];
  const best = latest[latest.length - 1];
  const worst20 = latest.slice(0, 20);
  const barMax = Math.max(...worst20.map((item) => item.cell.index), 1);
  const groups = useMemo(
    () => buildSigunguGradeGroups(scoped, latestYear),
    [latestYear, scoped],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className={FDB_TYPO.toolbarLabel}>시도</span>
          <select
            value={sidoFilter}
            onChange={(e) => setSidoFilter(e.target.value)}
            className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
          >
            <option value={ALL_FILTER}>전국 시군구</option>
            {sidoOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          accent="blue"
          title={`${latestYear}년 시군구`}
          value={latest.length.toLocaleString("ko-KR")}
          sub={sidoFilter ? `${sidoFilter} 공시 단위` : "지수 있는 시군구"}
        />
        <KpiCard
          accent="red"
          title="4~5등급 시군구"
          value={highRisk.length.toLocaleString("ko-KR")}
          sub="절대 고위험 구간"
        />
        <KpiCard
          accent="amber"
          title="최고 위험"
          value={worst ? `${worst.row.sido} ${worst.row.name}` : "—"}
          sub={worst ? `지수 ${fmtRegionalIndex(worst.cell.index)}` : "데이터 없음"}
        />
        <KpiCard
          accent="emerald"
          title="최저 위험"
          value={best ? `${best.row.sido} ${best.row.name}` : "—"}
          sub={best ? `지수 ${fmtRegionalIndex(best.cell.index)}` : "데이터 없음"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="border-b border-border pb-3 text-base font-bold text-foreground">
            {latestYear}년 소멸위험지수 하위 20개 시군구
          </h3>
          <p className={`mt-2 ${FDB_TYPO.legend}`}>
            지수가 낮을수록 위험이 큽니다. 막대는 해당 목록의 최고 지수 대비 상대 길이입니다.
          </p>
          <ol className="mt-4 space-y-2">
            {worst20.map((item, i) => {
              const style = getExtinctionRiskGradeStyle(item.cell.grade);
              const width = Math.max(6, (item.cell.index / barMax) * 100);
              return (
                <li key={`${item.row.regionCode}-${item.row.name}`} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right font-mono text-xs text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {item.row.sido} {item.row.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold" style={{ color: style.bg }}>
                          {item.cell.index.toFixed(2)}
                        </span>
                        <GradeBadge grade={item.cell.grade} />
                      </span>
                    </div>
                    <div className="rdsm-rank-bar">
                      <span style={{ width: `${width}%`, background: style.bg }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
        <section className="rounded-xl border border-border bg-surface p-5">
          <RegionalDeclineGradeMatrix latestYear={latestYear} groups={groups} />
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  accent,
  title,
  value,
  sub,
}: {
  accent: "blue" | "amber" | "red" | "emerald";
  title: string;
  value: string;
  sub: string;
}) {
  const border = {
    blue: "border-l-blue-500",
    amber: "border-l-amber-500",
    red: "border-l-red-500",
    emerald: "border-l-emerald-500",
  }[accent];
  const valueColor = {
    blue: "text-foreground",
    amber: "text-amber-400",
    red: "text-red-400",
    emerald: "text-emerald-600",
  }[accent];

  return (
    <div className={`rounded-xl border border-border bg-surface p-4 border-l-4 ${border}`}>
      <p className="mb-1 text-xs font-medium text-muted">{title}</p>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

export function RegionalDeclineSigunguMock({
  data,
}: {
  data: RegionalDeclineSigunguMockData;
}) {
  const [section, setSection] = useState<MainSection>("sido-data");
  const [geoTab, setGeoTab] = useState<GeoTab>("sido");
  const [displayYears, setDisplayYears] = useState<number[]>(data.defaultDisplayYears);
  const [sidoFilter, setSidoFilter] = useState(ALL_FILTER);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDisplayYears(data.defaultDisplayYears);
  }, [data.defaultDisplayYears]);

  const sidoOptions = useMemo(
    () => data.sidoRows.filter((row) => row.region !== "전국").map((row) => row.region),
    [data.sidoRows],
  );

  const chartModel = useMemo(
    () => buildRegionalDeclineDashboardModel(toChartRows(data.sidoRows)),
    [data.sidoRows],
  );

  function toggleYear(year: number) {
    setDisplayYears((prev) => {
      if (prev.includes(year)) {
        const next = prev.filter((y) => y !== year);
        return next.length > 0 ? next.sort((a, b) => a - b) : prev;
      }
      return [...prev, year].sort((a, b) => a - b);
    });
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <div className="rdsm-banner" role="note">
        <strong>지역소멸 시군구 목업</strong>
        <p className="mt-1">
          프로덕션에는 아직 적용하지 않았습니다. 원본{" "}
          <span className="font-medium text-foreground">{data.sourceFileName}</span>
          {" · "}
          {data.years[0]}–{data.years[data.years.length - 1]}년 · 시도 {data.sidoCount} · 시군구{" "}
          {data.sigunguCount} · {data.rowCount.toLocaleString("ko-KR")}행
          {" · "}
          <Link href="/analysis/univ-map?tab=regional-decline" className="text-accent hover:underline">
            프로덕션 지역소멸
          </Link>
        </p>
      </div>

      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="지방소멸위험지수 · 시도·시군구 현황 (목업)"
        title="지역소멸"
      />

      <section className="rounded-xl border border-dashed border-accent-cyan/40 bg-surface/60 p-4">
        <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
          변경된 업로드 양식 (목업 미리보기)
        </p>
        <p className={`mt-1 ${FDB_TYPO.bodyText}`}>
          2행 헤더 · 시도·시군구 혼재 · 소멸위험등급 컬럼 없음(지수를 기존 공식으로 등급 환산)
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
          <table className={`w-full min-w-[720px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
            <thead className="border-b border-border bg-surface-2">
              <tr>
                {NEW_HEADERS.map((h) => (
                  <th key={h} className="text-table-head whitespace-nowrap px-2 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <MainTabRow
          active={section}
          onChange={setSection}
          action={
            <div className="ml-auto shrink-0">
              <ExcelUploadButton variant="emerald" disabled />
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <SubTabRow active={geoTab} onChange={setGeoTab} />
          {section === "sido-data" && geoTab === "sigungu" ? (
            <>
              <label className="flex items-center gap-2">
                <span className={FDB_TYPO.toolbarLabel}>시도</span>
                <select
                  value={sidoFilter}
                  onChange={(e) => setSidoFilter(e.target.value)}
                  className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
                >
                  <option value={ALL_FILTER}>전체</option>
                  {sidoOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className={FDB_TYPO.legend}>검색</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="시군구·코드"
                  className={`rounded-md border border-border bg-surface-2 px-2.5 py-1 outline-none focus:border-accent ${FDB_TYPO.toolbarControl}`}
                />
              </label>
            </>
          ) : null}
        </div>

        {section === "sido-data" ? (
          <>
            <YearToggles allYears={data.years} displayYears={displayYears} onToggle={toggleYear} />
            {geoTab === "sido" ? (
              <SidoDataTable rows={data.sidoRows} displayYears={displayYears} />
            ) : (
              <SigunguDataTable
                rows={data.sigunguRows}
                displayYears={displayYears}
                sidoFilter={sidoFilter}
                query={query}
              />
            )}
          </>
        ) : geoTab === "sido" ? (
          chartModel ? (
            <RegionalDeclineChartDashboard model={chartModel} />
          ) : (
            <section className="rounded-xl border border-border bg-surface p-5">
              <p className={FDB_TYPO.bodyText}>시도 대시보드를 구성할 수 없습니다.</p>
            </section>
          )
        ) : (
          <SigunguDashboard rows={data.sigunguRows} years={data.years} sidoOptions={sidoOptions} />
        )}
      </div>
    </div>
  );
}
