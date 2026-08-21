"use client";

import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import {
  UploadPanelHelpButton,
  UploadPanelHideButton,
  UploadPanelSelectButton,
  UploadPanelTemplateLink,
} from "@/components/analysis/UploadPanelButtons";

import { DashboardEmeraldHeader } from "@/components/analysis/DashboardEmeraldHeader";
import { GlassMintTabGroup } from "@/components/analysis/GlassMintTabGroup";
import { ExcelUploadButton } from "@/components/analysis/ExcelUploadButton";
import { FinanceAnalysisDbExportButtons } from "@/components/analysis/FinanceAnalysisDbExportButtons";
import { RegionalDeclineChartDashboard } from "@/components/analysis/RegionalDeclineChartDashboard";
import { RegionalDeclineGradeMatrix } from "@/components/analysis/RegionalDeclineGradeMatrix";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Building2, MapPin } from "lucide-react";

import {
  buildRegionalDeclineDashboardModel,
  fmtRegionalIndex,
  type RegionalDeclineGradeGroup,
  type RegionalDeclineSection,
} from "@/lib/analysis/regional-decline-dashboard-analytics";
import {
  EXTINCTION_RISK_GRADE_COLORS,
  EXTINCTION_RISK_GRADE_LEGEND,
  getExtinctionRiskGradeStyle,
  getExtinctionRiskTextColor,
} from "@/lib/analysis/regional-decline-grade";
import type {
  RegionalDeclineCell,
  RegionalDeclineDashboardData,
  RegionalDeclineRow,
  RegionalDeclineSigunguRow,
} from "@/lib/data/regional-decline";
import { FDB_TABLE, FDB_TABLE_HEAD } from "@/lib/analysis/finance-db-table-density";
import { FDB_TABLE_COLOR } from "@/lib/analysis/finance-db-table-colors";
import {
  REGIONAL_DECLINE_CHART_START_YEAR,
  REGIONAL_DECLINE_TEMPLATE_SAMPLES,
  REGIONAL_DECLINE_UPLOAD_HEADERS,
  REGIONAL_DECLINE_UPLOAD_SUBHEADERS,
} from "@/lib/ingest/regional-decline-config";

import "./freshman-enrollment-alimi-table.css";
import "./regional-decline-dashboard.css";

type GeoTab = "sido" | "sigungu";

const ALL_FILTER = "";

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

function IndexCell({ cell }: { cell: RegionalDeclineCell | undefined }) {
  if (!cell) return <span className="text-muted">—</span>;
  return (
    <span className="font-mono text-sm font-semibold" style={{ color: getExtinctionRiskTextColor(cell.grade) }}>
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

function SectionTabRow({
  active,
  onChange,
  action,
}: {
  active: RegionalDeclineSection;
  onChange: (section: RegionalDeclineSection) => void;
  action?: ReactNode;
}) {
  const tabs: { id: RegionalDeclineSection; label: string; icon: typeof MapPin }[] = [
    { id: "sido-data", label: "시도별자료", icon: MapPin },
    { id: "dashboard", label: "지역소멸대시보드", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <GlassMintTabGroup
        active={active}
        onChange={onChange}
        items={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
        }))}
      />
      {action ?? null}
    </div>
  );
}

function GeoTabRow({
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
    <GlassMintTabGroup
      active={active}
      onChange={onChange}
      items={tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        icon: tab.icon,
      }))}
    />
  );
}

function TemplatePreviewTable() {
  return (
    <div className="mt-4 w-full basis-full overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="border-b border-border bg-surface-2">
          <tr>
            {REGIONAL_DECLINE_UPLOAD_HEADERS.map((h) => (
              <th key={h} className="text-table-head whitespace-nowrap px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
          <tr>
            {REGIONAL_DECLINE_UPLOAD_SUBHEADERS.map((h, i) => (
              <th key={`${h}-${i}`} className="text-table-head whitespace-nowrap px-2 py-1 font-normal text-muted">
                {h || " "}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {REGIONAL_DECLINE_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              {row.map((value, j) => (
                <td key={j} className="whitespace-nowrap px-2 py-1.5 font-mono">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        2행 헤더 · 시도(행정기관 한 단어)와 시군구가 한 시트에 있습니다. 인구소멸지수가 비어 있는 행(출장소 등)은 제외됩니다.
      </p>
    </div>
  );
}

function UploadPanel({
  uploadedAt,
  rowCount,
  onClose,
}: {
  uploadedAt: string | null;
  rowCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  function handleFile(file: File) {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch(
          "/api/ingest/finance-analysis/regional-decline/upload",
          { method: "POST", body: fd },
        );
        const body = (await res.json()) as {
          ok?: boolean;
          rowCount?: number;
          years?: number[];
          overwrittenYears?: number[];
          newYears?: number[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "업로드에 실패했습니다.");
        }
        const parts: string[] = [];
        if (body.overwrittenYears?.length) {
          parts.push(`덮어쓰기 연도: ${body.overwrittenYears.join(", ")}`);
        }
        if (body.newYears?.length) {
          parts.push(`신규 연도: ${body.newYears.join(", ")}`);
        }
        setMessage(
          `${body.rowCount ?? 0}건 저장됨${parts.length ? ` · ${parts.join(" · ")}` : ""}`,
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <section className="rounded-xl border border-dashed border-accent-cyan/40 bg-surface/60 p-5">
      <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`${FDB_TYPO.legend} font-medium uppercase tracking-wide text-accent-cyan`}>
            엑셀업로드
          </p>
          <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>지역소멸</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            시도·시군구 연령별 인구 엑셀을 업로드하면{" "}
            <code className="text-accent">data/csv/finance_analysis_regional_decline.csv</code>
            에 저장됩니다. 동일 연도는 덮어쓰기, 신규 연도는 추가됩니다.
          </p>
          {uploadedAt ? (
            <p className={`mt-2 ${FDB_TYPO.legend}`}>
              최근 업로드: {new Date(uploadedAt).toLocaleString("ko-KR")} ·{" "}
              {rowCount.toLocaleString("ko-KR")}행
            </p>
          ) : (
            <p className={`mt-2 ${FDB_TYPO.legend} text-warning`}>
              아직 업로드된 데이터가 없습니다.
            </p>
          )}
          {message ? <p className={`mt-2 ${FDB_TYPO.legend} text-accent`}>{message}</p> : null}
          {error ? <p className={`mt-2 ${FDB_TYPO.legend} text-accent-orange`}>{error}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <UploadPanelTemplateLink
            href="/api/ingest/finance-analysis/regional-decline/template"
            download="regional_decline_upload_template.xlsx"
          />
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <UploadPanelSelectButton disabled={pending} pending={pending} onClick={() => inputRef.current?.click()} />
          <UploadPanelHideButton onClick={onClose} />
          <UploadPanelHelpButton active={helpOpen} onClick={() => setHelpOpen((prev) => !prev)} />
        </div>
        </div>
        <FinanceAnalysisDbExportButtons
          exportBasePath="/api/ingest/finance-analysis/regional-decline/export"
          campusRowCount={rowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">지역소멸위험지수</span> = 20~39세
              여성인구 / 65세 이상 인구 × 100
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">지역소멸위험분류</span>는
              지방소멸위험지수 10 미만 5, 20 미만 4, 40 미만 3, 60 미만 2, 100 미만 1, 100 이상 0
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> : 행정안전부 주민등록
              인구통계의 [연령별 인구현황]
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">관리</span> : 조회기간을 연간으로
              선택한 후 연령구분단위 1세, 연령조회범위를 0세~20세로 선택하여 대학입학자원 자료를
              추출하고, 20세~29세의 남여구분에서 여성인구, 65세 이상으로 노인인구를 추출합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">특이사항</span> : 없음.
            </p>
          </div>
        ) : null}
        <TemplatePreviewTable />
      </div>
    </section>
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
  rows: RegionalDeclineRow[];
  displayYears: number[];
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="feam-table-wrap rd-table-wrap rounded-lg border border-border/60">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-surface-2 text-xs">
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan}  w-[62px] min-w-[62px] max-w-[62px] bg-surface-2 text-center`}
              >
                구분
              </th>
              {displayYears.map((y) => (
                <th
                  key={y}
                  colSpan={2}
                  className={`${FDB_TABLE_HEAD.base} text-center ${FDB_TABLE.headGroup} ${
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
                  <th className={`${FDB_TABLE_HEAD.base} min-w-[72px] text-center ${FDB_TABLE.headSub}`}>
                    지수
                  </th>
                  <th
                    className={`${FDB_TABLE_HEAD.base} min-w-[56px] text-center ${FDB_TABLE.headSub} ${
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
                  className={` w-[62px] min-w-[62px] max-w-[62px] border-r border-border/50 ${FDB_TABLE.cellSticky} text-center ${FDB_TABLE_COLOR.schoolName} ${
                    i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                >
                  {row.region}
                </td>
                {displayYears.map((y) => {
                  const cell = row.byYear[y] ?? null;
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
          전국은 시도의 20~39세 여성·65세 이상 인구를 합산해 지수를 산출합니다. 등급은 기존
          공식(10 미만 5 … 100 이상 0)입니다.
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
  rows: RegionalDeclineSigunguRow[];
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
      <div className="feam-table-wrap rd-table-wrap rounded-lg border border-border/60">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="bg-surface-2 text-xs">
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan}  w-[72px] min-w-[72px] max-w-[72px] bg-surface-2 text-center`}
              >
                시도
              </th>
              <th
                rowSpan={2}
                className={`${FDB_TABLE_HEAD.rowSpan} rd-th-col-2 w-[72px] min-w-[72px] max-w-[72px] bg-surface-2 text-center`}
              >
                시군구
              </th>
              {displayYears.map((y) => (
                <th
                  key={y}
                  colSpan={2}
                  className={`${FDB_TABLE_HEAD.base} text-center ${FDB_TABLE.headGroup} ${
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
                  <th className={`${FDB_TABLE_HEAD.base} min-w-[72px] text-center ${FDB_TABLE.headSub}`}>
                    지수
                  </th>
                  <th
                    className={`${FDB_TABLE_HEAD.base} min-w-[56px] text-center ${FDB_TABLE.headSub} ${
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
                  className={` w-[72px] min-w-[72px] max-w-[72px] border-r border-border/50 ${FDB_TABLE.cellSticky} text-center ${
                    i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                >
                  {row.sido}
                </td>
                <td
                  className={`${FDB_TABLE.cellSticky} rd-td-col-2 w-[72px] min-w-[72px] max-w-[72px] border-r border-border/50 text-center ${FDB_TABLE_COLOR.schoolName} ${
                    i % 2 === 0 ? "bg-surface" : "bg-surface-2/30"
                  }`}
                >
                  {row.name}
                </td>
                {displayYears.map((y) => {
                  const cell = row.byYear[y] ?? null;
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
  rows: RegionalDeclineSigunguRow[],
  year: number,
): RegionalDeclineGradeGroup[] {
  const entries = rows
    .map((row) => {
      const cell = row.byYear[year];
      if (!cell) return null;
      return { region: `${row.sido} ${row.name}`, index: cell.index, grade: cell.grade };
    })
    .filter(
      (entry): entry is { region: string; index: number; grade: number } => entry != null,
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
        regions: listed.map((entry) => ({ region: entry.region, index: entry.index })),
      };
    })
    .filter((group) => group.regions.length > 0);
}

function SigunguDashboard({
  rows,
  years,
  sidoOptions,
}: {
  rows: RegionalDeclineSigunguRow[];
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
          (
            item,
          ): item is {
            row: RegionalDeclineSigunguRow;
            cell: NonNullable<RegionalDeclineCell>;
          } => item != null,
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
                    <div className="rd-rank-bar">
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
    <div className={`rounded-xl border border-border border-l-4 bg-surface p-4 ${border}`}>
      <p className="mb-1 text-xs font-medium text-muted">{title}</p>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

export function RegionalDeclineDashboard({
  data,
}: {
  data: RegionalDeclineDashboardData;
}) {
  const allYears = data.years;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [section, setSection] = useState<RegionalDeclineSection>("sido-data");
  const [geoTab, setGeoTab] = useState<GeoTab>("sido");
  const [displayYears, setDisplayYears] = useState<number[]>(data.defaultDisplayYears);
  const [sidoFilter, setSidoFilter] = useState(ALL_FILTER);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDisplayYears(data.defaultDisplayYears);
  }, [data.defaultDisplayYears]);

  const sidoOptions = useMemo(
    () => data.rows.filter((row) => row.region !== "전국").map((row) => row.region),
    [data.rows],
  );

  const chartModel = useMemo(() => {
    if (!data.hasData) return null;
    return buildRegionalDeclineDashboardModel(data.rows);
  }, [data.hasData, data.rows]);

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
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="지방소멸위험지수 · 시도·시군구 현황"
        title="지역소멸"
      />

      {uploadOpen ? (
        <UploadPanel uploadedAt={data.uploadedAt} rowCount={data.rowCount} onClose={() => setUploadOpen(false)} />
      ) : null}

      <div className="flex flex-col gap-2">
        <SectionTabRow
          active={section}
          onChange={setSection}
          action={
            !uploadOpen ? (
              <div className="ml-auto shrink-0">
                <ExcelUploadButton variant="emerald" onClick={() => setUploadOpen(true)} />
              </div>
            ) : null
          }
        />

        {!data.hasData ? (
          <section className="rounded-xl border border-border bg-surface p-5">
            <p className={FDB_TYPO.bodyText}>
              데이터가 없습니다. 상단의{" "}
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="text-accent underline-offset-2 hover:underline"
              >
                엑셀업로드
              </button>
              에서 양식을 다운로드한 뒤 엑셀을 업로드하세요.
            </p>
          </section>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <GeoTabRow active={geoTab} onChange={setGeoTab} />
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
                    <span className={FDB_TYPO.toolbarLabel}>검색</span>
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
                {allYears.length > 0 ? (
                  <YearToggles allYears={allYears} displayYears={displayYears} onToggle={toggleYear} />
                ) : null}
                {geoTab === "sido" ? (
                  <SidoDataTable rows={data.rows} displayYears={displayYears} />
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
                  <p className={FDB_TYPO.bodyText}>
                    {REGIONAL_DECLINE_CHART_START_YEAR}년 이후 데이터로 대시보드를 구성할 수
                    없습니다. 전국·시·도 소멸위험지수·등급이 모두 채워져 있는지 확인해 주세요.
                  </p>
                </section>
              )
            ) : (
              <SigunguDashboard
                rows={data.sigunguRows}
                years={data.years}
                sidoOptions={sidoOptions}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
