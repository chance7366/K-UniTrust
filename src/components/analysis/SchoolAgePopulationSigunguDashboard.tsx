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
import { SchoolAgePopulationChartDashboard } from "@/components/analysis/SchoolAgePopulationChartDashboard";
import { SchoolAgePopulationDataTable } from "@/components/analysis/SchoolAgePopulationDataTable";
import { SchoolAgePopulationSigunguDataTable } from "@/components/analysis/SchoolAgePopulationSigunguDataTable";
import { SchoolAgeDeclineRiskMatrix2037 } from "@/components/analysis/SchoolAgeDeclineRiskMatrix2037";
import {
  buildDeclineDashboardModelFromRows,
  buildRiskTierGroupsFar,
  calcSchoolAgeIndex,
  fmtCount,
  fmtIndex,
  fmtSignedPct,
  type SchoolAgePopulationSection,
} from "@/lib/analysis/school-age-decline-analytics";
import { getExtinctionRiskGradeStyle } from "@/lib/analysis/regional-decline-grade";
import { schoolAgeDeclineRateToGrade } from "@/lib/analysis/school-age-population-decline-grade";
import type { SchoolAgeSigunguDashboardData, SchoolAgeSigunguRow } from "@/lib/data/school-age-population-sigungu";
import {
  SCHOOL_AGE_FAR_AGE,
  admissionYearFromAge,
} from "@/lib/ingest/school-age-population-config";
import {
  SCHOOL_AGE_SIGUNGU_TEMPLATE_SAMPLES,
  SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS,
} from "@/lib/ingest/school-age-population-sigungu-config";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Building2, MapPin } from "lucide-react";

import "./regional-decline-dashboard.css";

type GeoTab = "sido" | "sigungu";

const ALL_FILTER = "";

function fmtPreview(v: string | number): string {
  return String(v);
}

function SectionTabRow({
  active,
  onChange,
  action,
}: {
  active: SchoolAgePopulationSection;
  onChange: (section: SchoolAgePopulationSection) => void;
  action?: ReactNode;
}) {
  const tabs: {
    id: SchoolAgePopulationSection;
    label: string;
    icon: typeof MapPin;
  }[] = [
    { id: "sido-data", label: "시도별자료", icon: MapPin },
    { id: "dashboard", label: "학령인구대시보드", icon: BarChart3 },
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
      <table className={`w-full min-w-[960px] border-collapse text-left ${FDB_TYPO.tableBody}`}>
        <thead className="border-b border-border bg-surface-2">
          <tr>
            {SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS.map((h) => (
              <th key={h} className="text-table-head whitespace-nowrap px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCHOOL_AGE_SIGUNGU_TEMPLATE_SAMPLES.map((row, i) => (
            <tr key={i} className="border-b border-border/40 text-muted">
              {row.map((value, j) => (
                <td key={j} className="whitespace-nowrap px-2 py-1.5 font-mono">
                  {fmtPreview(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`border-t border-border/40 px-3 py-2 ${FDB_TYPO.legend}`}>
        1행 헤더 · 시도와 시군구가 한 시트에 있습니다. 입학자원가중치 칼럼은 없습니다.
        인구가 비어 있는 출장소 등은 제외됩니다.
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
          "/api/ingest/univ-map/school-age-population-sigungu/upload",
          { method: "POST", body: fd },
        );
        const body = (await res.json()) as {
          ok?: boolean;
          rowCount?: number;
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
          <h4 className={`mt-1 ${FDB_TYPO.panelTitle}`}>학령인구(시군구)</h4>
          <p className={`mt-2 max-w-xl ${FDB_TYPO.bodyText}`}>
            시도·시군구 0세~20세 주민등록 인구 엑셀을 업로드하면{" "}
            <code className="text-accent">
              data/csv/univ_map_school_age_population_sigungu.csv
            </code>
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
          {message ? (
            <p className={`mt-2 ${FDB_TYPO.legend} text-accent`}>{message}</p>
          ) : null}
          {error ? (
            <p className={`mt-2 ${FDB_TYPO.legend} text-accent-orange`}>{error}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <UploadPanelTemplateLink
            href="/api/ingest/univ-map/school-age-population-sigungu/template"
            download="school_age_population_sigungu_upload_template.xlsx"
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
          exportBasePath="/api/ingest/univ-map/school-age-population-sigungu/export"
          campusRowCount={rowCount}
        />
        {helpOpen ? (
          <div className={`rounded-lg border border-border/60 bg-surface-2/50 p-4 ${FDB_TYPO.bodyText}`}>
            <p>
              <span className="font-medium text-foreground">학령인구지수</span> =
              해당 연령 인구 / 18세 인구 × 100
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">대입연도</span> =
              자료연도 + (19 − 연령). 18세는 차년도 대학입학자원 기준 연령입니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">자료출처</span> :
              행정안전부 주민등록 인구통계의 [연령별 인구현황]
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">관리</span> :
              조회기간을 연간으로 선택한 후 연령구분단위 1세, 연령조회범위를
              0세~20세로 선택하여 시군구 자료를 추출합니다. 시도와 시군구를 한
              파일에서 연도별 관리합니다.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">특이사항</span> :
              입학자원가중치 칼럼은 없습니다. 전국 행은 파일에 없으며 시도
              인구를 합산해 산출합니다.
            </p>
          </div>
        ) : null}
        <TemplatePreviewTable />
      </div>
    </section>
  );
}

function SigunguChartDashboard({
  rows,
  displayYear,
  sidoOptions,
}: {
  rows: SchoolAgeSigunguRow[];
  displayYear: number;
  sidoOptions: string[];
}) {
  const [sidoFilter, setSidoFilter] = useState(ALL_FILTER);
  const farYear = admissionYearFromAge(displayYear, SCHOOL_AGE_FAR_AGE);

  const scoped = useMemo(
    () => (sidoFilter ? rows.filter((row) => row.sido === sidoFilter) : rows),
    [rows, sidoFilter],
  );

  const ranked = useMemo(() => {
    return scoped
      .map((row) => {
        const cell = row.byYear[displayYear];
        const baseline = cell?.ages.age_18 ?? null;
        const far = cell?.ages.age_0 ?? null;
        if (baseline == null || far == null) return null;
        const index = calcSchoolAgeIndex(far, baseline);
        return { row, baseline, far, index };
      })
      .filter(
        (
          item,
        ): item is {
          row: SchoolAgeSigunguRow;
          baseline: number;
          far: number;
          index: number;
        } => item != null,
      )
      .sort((a, b) => a.index - b.index);
  }, [displayYear, scoped]);

  const highRisk = ranked.filter((item) => item.index < 45);
  const worst = ranked[0];
  const best = ranked[ranked.length - 1];
  const worst20 = ranked.slice(0, 20);
  const barMax = Math.max(...worst20.map((item) => item.index), 1);

  const groups = useMemo(
    () =>
      buildRiskTierGroupsFar(
        ranked.map((item) => ({
          region: `${item.row.sido} ${item.row.name}`,
          index: item.index,
          count: item.far,
          changePct: item.index - 100,
          isHighRisk: item.index < 45,
          color: "",
        })),
      ),
    [ranked],
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
          title={`${displayYear}년 시군구`}
          value={ranked.length.toLocaleString("ko-KR")}
          sub={sidoFilter ? `${sidoFilter} 공시 단위` : "18세·0세 인구가 있는 시군구"}
        />
        <KpiCard
          accent="red"
          title={`${farYear}년 고위험 시군구`}
          value={highRisk.length.toLocaleString("ko-KR")}
          sub="0세 지수 45 미만"
        />
        <KpiCard
          accent="amber"
          title="최대 인구감소"
          value={worst ? `${worst.row.sido} ${worst.row.name}` : "—"}
          sub={
            worst
              ? `${farYear}년 지수 ${fmtIndex(worst.index)} (${fmtSignedPct(worst.index - 100)})`
              : "데이터 없음"
          }
        />
        <KpiCard
          accent="emerald"
          title="최고 유지"
          value={best ? `${best.row.sido} ${best.row.name}` : "—"}
          sub={
            best
              ? `${farYear}년 지수 ${fmtIndex(best.index)} (${fmtSignedPct(best.index - 100)})`
              : "데이터 없음"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="border-b border-border pb-3 text-base font-bold text-foreground">
            {farYear}년 학령인구 지수 하위 20개 시군구
          </h3>
          <p className={`mt-2 ${FDB_TYPO.legend}`}>
            0세 / 18세 × 100. 지수가 낮을수록 향후 대입 자원 감소가 큽니다.
          </p>
          <ol className="mt-4 space-y-2">
            {worst20.map((item, i) => {
              const grade = schoolAgeDeclineRateToGrade(-(item.index - 100));
              const style = getExtinctionRiskGradeStyle(grade);
              const width = Math.max(6, (item.index / barMax) * 100);
              return (
                <li
                  key={`${item.row.regionCode}-${item.row.name}`}
                  className="flex items-center gap-3"
                >
                  <span className="w-5 shrink-0 text-right font-mono text-xs text-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {item.row.sido} {item.row.name}
                      </span>
                      <span className="font-mono text-xs font-semibold" style={{ color: style.bg }}>
                        {fmtIndex(item.index)} · {fmtCount(item.far)}명
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
          <SchoolAgeDeclineRiskMatrix2037
            groups={groups}
            farYear={farYear}
            farAgeLabel={`${SCHOOL_AGE_FAR_AGE}세`}
          />
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

export function SchoolAgePopulationSigunguDashboard({
  data,
}: {
  data: SchoolAgeSigunguDashboardData;
}) {
  const allYears = data.years;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [section, setSection] = useState<SchoolAgePopulationSection>("sido-data");
  const [geoTab, setGeoTab] = useState<GeoTab>("sido");
  const [displayYear, setDisplayYear] = useState<number | null>(data.defaultDisplayYear);
  const [sidoFilter, setSidoFilter] = useState(ALL_FILTER);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDisplayYear(data.defaultDisplayYear);
  }, [data.defaultDisplayYear]);

  const sidoOptions = useMemo(
    () => data.rows.filter((row) => row.region !== "전국").map((row) => row.region),
    [data.rows],
  );

  const declineModel = useMemo(() => {
    if (!data.hasData || displayYear == null) return null;
    return buildDeclineDashboardModelFromRows(data.rows, displayYear);
  }, [data.hasData, data.rows, displayYear]);

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <DashboardEmeraldHeader
        sectionLabel="대학현황"
        subtitle="주민등록 인구통계 · 시도·시군구 0~20세"
        title="학령인구(시군구)"
      />

      {uploadOpen ? (
        <UploadPanel
          uploadedAt={data.uploadedAt}
          rowCount={data.rowCount}
          onClose={() => setUploadOpen(false)}
        />
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

        {!data.hasData || displayYear == null ? (
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

            {allYears.length > 0 ? (
              <section className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={FDB_TYPO.toolbarLabel}>표시 연도</span>
                  {allYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setDisplayYear(y)}
                      className={`h-[30px] rounded-md border px-2.5 py-1 transition-colors ${FDB_TYPO.toolbarControl} ${
                        displayYear === y
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      {y}년
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {section === "dashboard" ? (
              geoTab === "sido" ? (
                declineModel ? (
                  <SchoolAgePopulationChartDashboard model={declineModel} />
                ) : (
                  <section className="rounded-xl border border-border bg-surface p-5">
                    <p className={FDB_TYPO.bodyText}>
                      {displayYear}년 데이터로 대시보드를 구성할 수 없습니다.
                    </p>
                  </section>
                )
              ) : (
                <SigunguChartDashboard
                  rows={data.sigunguRows}
                  displayYear={displayYear}
                  sidoOptions={sidoOptions}
                />
              )
            ) : (
              <section className="rounded-xl border border-border bg-surface p-5">
                {geoTab === "sido" ? (
                  <SchoolAgePopulationDataTable
                    rows={data.rows}
                    displayYear={displayYear}
                    showWeight={false}
                  />
                ) : (
                  <SchoolAgePopulationSigunguDataTable
                    rows={data.sigunguRows}
                    displayYear={displayYear}
                    sidoFilter={sidoFilter}
                    query={query}
                  />
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
