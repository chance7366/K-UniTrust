"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

import { SchoolKindTabBar } from "@/components/analysis/competitiveness-analysis/panels/SchoolKindTabBar";
import { FDB_TYPO } from "@/lib/analysis/finance-db-typography";
import { KOREA_SIDO_REGIONS } from "@/lib/analysis/korea-sido-regions";
import {
  gradeBadgeClass,
  gradeScoreClass,
  provinceToAnalyticsZone,
  schoolScaleFromEnrolled,
} from "@/lib/competitiveness-analysis/run-analytics";
import {
  calculateDiagnosticGrade,
  formatDiagnosticGradeLabel,
  indicatorRanksFromRow,
} from "@/lib/competitiveness-analysis/diagnostic-grade";
import { matchesSchoolKindFilter } from "@/lib/competitiveness-analysis/step1-indicators";
import { useCompetitivenessSettings } from "@/lib/competitiveness-analysis/store";
import { loadLocalEditionTrendSeries } from "@/lib/competitiveness-analysis/user-workspace";
import type { UniversityRunResult } from "@/lib/competitiveness-analysis/types";
import {
  buildGroupIndexYearRows,
  buildIndicatorYearRows,
  countSchoolKinds,
  groupIndicatorsByCategory,
  type EditionTrendPoint,
  type GroupIndexYearRow,
} from "@/lib/competitiveness-analysis/university-detail-data";

import { UniversityReportActions } from "@/components/analysis/competitiveness-analysis/UniversityReportActions";
import { UniversityReportGuidelinesPanel } from "@/components/analysis/competitiveness-analysis/UniversityReportGuidelinesPanel";
import { UniversityV2InsightsPanel } from "@/components/analysis/competitiveness-analysis/UniversityV2InsightsPanel";

import "./university-competitiveness-dashboard.css";
import "@/components/analysis/competitiveness-analysis/run-analytics.css";
import "@/components/analysis/competitiveness-analysis/step3-composite-table.css";

const CHART_COLORS = {
  school: "#059669",
  national: "#2563eb",
  zone: "#d97706",
  sido: "#7c3aed",
  scale: "#0ea5e9",
} as const;

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--accent) 5%, #ffffff)",
  border: "1px solid color-mix(in srgb, #2a7a55 50%, transparent)",
  borderRadius: 8,
  fontSize: 13,
  padding: "6px 10px",
} as const;

const GROUP_CHARTS = [
  { key: "studentEnrollment" as const, label: "학생충원 지수" },
  { key: "univFinance" as const, label: "대학재정 지수" },
  { key: "corpFinance" as const, label: "법인재정 지수" },
  { key: "composite" as const, label: "종합지수" },
];

function fmt(v: number | null | undefined, digits = 1) {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

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

function ChartLegend({
  scaleLabel,
}: {
  scaleLabel?: string;
}) {
  const items = [
    { label: "선택 대학", color: CHART_COLORS.school },
    { label: "전국 평균", color: CHART_COLORS.national },
    { label: "권역 평균", color: CHART_COLORS.zone },
    { label: "시·도 평균", color: CHART_COLORS.sido },
    ...(scaleLabel
      ? [{ label: scaleLabel, color: CHART_COLORS.scale }]
      : []),
  ];

  return (
    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="ucm-legend-dot"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function GroupIndexChart({
  title,
  dataKey,
  rows,
}: {
  title: string;
  dataKey: keyof Pick<
    GroupIndexYearRow,
    "studentEnrollment" | "univFinance" | "corpFinance" | "composite"
  >;
  rows: GroupIndexYearRow[];
}) {
  const chartData = rows.map((row) => ({
    year: `${row.analysisYear}`,
    school: row[dataKey],
    national: row.national[dataKey],
    zone: row.zone[dataKey],
    sido: row.sido[dataKey],
    scale: row.scale[dataKey],
  }));

  return (
    <div className="ucm-chart-card">
      <h4 className="ucm-chart-title">{title}</h4>
      <div className="mt-3 h-[180px]">
        {chartData.length === 0 ? (
          <p className={`flex h-full items-center justify-center ${FDB_TYPO.legend}`}>
            연도별 데이터 없음
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip
                formatter={(value) => fmt(typeof value === "number" ? value : null)}
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={{ fontSize: 13 }}
                itemStyle={{ fontSize: 13, paddingTop: 1, paddingBottom: 1 }}
              />
              <Line
                type="monotone"
                dataKey="school"
                name="선택 대학"
                stroke={CHART_COLORS.school}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="national"
                name="전국"
                stroke={CHART_COLORS.national}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="zone"
                name="권역"
                stroke={CHART_COLORS.zone}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="sido"
                name="시·도"
                stroke={CHART_COLORS.sido}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scale"
                name="규모"
                stroke={CHART_COLORS.scale}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function IndicatorTrendChart({
  rows,
  label,
  scaleLabel,
}: {
  rows: ReturnType<typeof buildIndicatorYearRows>;
  label: string;
  scaleLabel?: string;
}) {
  const chartData = rows.map((row) => ({
    year: `${row.analysisYear}`,
    school: row.indexScore,
    national: row.national.indexAvg,
    zone: row.zone.indexAvg,
    sido: row.sido.indexAvg,
    scale: row.scale.indexAvg,
  }));

  return (
    <div className="ucm-chart-card h-full">
      <h4 className="ucm-chart-title">{label} · 지수 추세</h4>
      <ChartLegend scaleLabel={scaleLabel} />
      <div className="mt-2 h-[260px] min-h-[220px]">
        {chartData.length === 0 ? (
          <p className={`flex h-full items-center justify-center ${FDB_TYPO.legend}`}>
            연도별 데이터 없음
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip
                formatter={(value) => fmt(typeof value === "number" ? value : null)}
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={{ fontSize: 13 }}
                itemStyle={{ fontSize: 13, paddingTop: 1, paddingBottom: 1 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="school"
                name="선택 대학"
                stroke={CHART_COLORS.school}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="national"
                name="전국"
                stroke={CHART_COLORS.national}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="zone"
                name="권역"
                stroke={CHART_COLORS.zone}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="sido"
                name="시·도"
                stroke={CHART_COLORS.sido}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scale"
                name="규모"
                stroke={CHART_COLORS.scale}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function DetailTableSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-[var(--glow-inset)]">
      <h3 className="text-sm font-semibold text-accent-cyan">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SchoolDetailPanel({
  school,
  analysisYear,
  series,
  settings,
  cohortSize,
  enrolledTotal,
  enrolledByCode,
}: {
  school: UniversityRunResult;
  analysisYear: number;
  series: EditionTrendPoint[];
  settings: ReturnType<typeof useCompetitivenessSettings>["settings"];
  cohortSize: number;
  enrolledTotal: number | null;
  enrolledByCode: Map<string, number | null>;
}) {
  const groupRows = useMemo(
    () =>
      buildGroupIndexYearRows(
        series,
        school.schoolCodeStd,
        settings,
        enrolledByCode,
      ),
    [series, school.schoolCodeStd, settings, enrolledByCode],
  );

  const groupedIndicators = useMemo(() => groupIndicatorsByCategory(), []);
  const [selectedIndicator, setSelectedIndicator] = useState(
    groupedIndicators["student-enrollment"][0]?.id ?? "freshman-enrollment-rate",
  );

  const indicatorRows = useMemo(
    () =>
      buildIndicatorYearRows(
        series,
        school.schoolCodeStd,
        selectedIndicator,
        enrolledByCode,
      ),
    [series, school.schoolCodeStd, selectedIndicator, enrolledByCode],
  );

  const currentYearGroup = groupRows.find(
    (row) => row.analysisYear === analysisYear,
  );

  const gradeResult = useMemo(() => {
    if (school.excludedFromRanking) return null;
    return calculateDiagnosticGrade(
      school.compositeIndex,
      indicatorRanksFromRow(school),
      cohortSize,
    );
  }, [school, cohortSize]);

  const zone = provinceToAnalyticsZone(school.region);
  const scale = schoolScaleFromEnrolled(
    enrolledTotal,
    matchesSchoolKindFilter(school.schoolKind, "junior-college")
      ? "전문대"
      : "4년제",
  );

  const { indicatorSummaryRows, indicatorYearRowsById } = useMemo(() => {
    const categoryLabels: Record<string, string> = {
      "student-enrollment": "학생충원",
      "univ-finance": "대학재정",
      "corp-finance": "법인재정",
    };
    const summaryRows: {
      categoryId: string;
      categoryLabel: string;
      indicatorId: string;
      indicatorLabel: string;
      rawValue: number | null;
      indexScore: number | null;
      rank: number | null;
      dataMissing: boolean;
      nationalIndexAvg: number | null;
    }[] = [];
    const yearById: Record<string, ReturnType<typeof buildIndicatorYearRows>> = {};

    for (const [categoryId, indicators] of Object.entries(groupedIndicators)) {
      for (const indicator of indicators) {
        const yearRows = buildIndicatorYearRows(
          series,
          school.schoolCodeStd,
          indicator.id,
          enrolledByCode,
        );
        yearById[indicator.id] = yearRows;
        const currentRow = yearRows.find((row) => row.analysisYear === analysisYear);
        summaryRows.push({
          categoryId,
          categoryLabel: categoryLabels[categoryId] ?? categoryId,
          indicatorId: indicator.id,
          indicatorLabel: indicator.label,
          rawValue: currentRow?.rawValue ?? null,
          indexScore: currentRow?.indexScore ?? null,
          rank: currentRow?.rank ?? null,
          dataMissing: currentRow?.dataMissing ?? true,
          nationalIndexAvg: currentRow?.national.indexAvg ?? null,
        });
      }
    }
    return { indicatorSummaryRows: summaryRows, indicatorYearRowsById: yearById };
  }, [groupedIndicators, series, school.schoolCodeStd, enrolledByCode, analysisYear]);

  const diagnosticGradeLabel = gradeResult
    ? formatDiagnosticGradeLabel(
        gradeResult.grade,
        gradeResult.gradeCapped,
        school.excludedFromRanking,
      )
    : school.excludedFromRanking
      ? "등급제외"
      : "—";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain pr-1">
      <section className="rounded-xl border border-accent/40 bg-[var(--glow-panel-kpi)] p-5 shadow-[var(--glow-inset)]">
        <p className="text-xs font-medium text-accent-cyan">
          {analysisYear}년 분석 · {zone === "기타" ? "권역 미분류" : zone}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{school.schoolName}</h2>
            <p className="mt-1 text-sm text-muted">
              {school.region} · {fmtEnrolledCount(enrolledTotal)}
              {scale ? ` · ${scale}` : ""}
            </p>
            {school.absoluteLabels.length ? (
              <p className="mt-1 text-xs text-danger">
                {school.absoluteLabels.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-accent">
                {fmt(school.compositeIndex)}
              </p>
              <p className={FDB_TYPO.legend}>종합지수</p>
            </div>
            <div>
              {school.excludedFromRanking || !school.compositeRank ? (
                <p className="text-3xl font-bold text-accent-orange">—</p>
              ) : (
                <p className="text-3xl font-bold text-accent-orange">
                  {school.compositeRank}
                  <span className="text-lg text-muted">/{cohortSize}</span>
                </p>
              )}
              <p className={FDB_TYPO.legend}>전국 순위</p>
            </div>
            <div>
              {gradeResult ? (
                <p
                  className={`text-3xl font-bold ${gradeScoreClass(gradeResult.grade)}`}
                >
                  {formatDiagnosticGradeLabel(
                    gradeResult.grade,
                    gradeResult.gradeCapped,
                    school.excludedFromRanking,
                  )}
                </p>
              ) : (
                <p className="text-3xl font-bold text-muted">—</p>
              )}
              <p className={FDB_TYPO.legend}>진단등급</p>
            </div>
          </div>
        </div>
      </section>

      <UniversityV2InsightsPanel
        analysisYear={analysisYear}
        schoolName={school.schoolName}
        compositeIndex={school.compositeIndex}
        diagnosticGrade={diagnosticGradeLabel}
        cohortSize={cohortSize}
        groupIndexRows={groupRows}
        indicatorSummaryRows={indicatorSummaryRows}
        indicatorYearRowsById={indicatorYearRowsById}
        settings={settings}
      />

      <DetailTableSection title="그룹 지수 · 연도별 추세 (분석실행 2~3단계)">
        <ChartLegend scaleLabel={scale ? `${scale} 평균` : "규모 평균"} />
        <div className="grid gap-4 md:grid-cols-2">
          {GROUP_CHARTS.map((chart) => (
            <GroupIndexChart
              key={chart.key}
              title={chart.label}
              dataKey={chart.key}
              rows={groupRows}
            />
          ))}
        </div>
        {currentYearGroup ? (
          <div className="ucm-table-wrap mt-4">
            <table className="ucm-table ucm-table-compare">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>선택 대학</th>
                  <th>전국 평균</th>
                  <th>권역 평균</th>
                  <th>시·도 평균</th>
                  <th>규모 평균</th>
                </tr>
              </thead>
              <tbody>
                {GROUP_CHARTS.map((chart) => (
                  <tr key={chart.key}>
                    <td>{chart.label}</td>
                    <td className="font-semibold text-[#db2777]">
                      {fmt(currentYearGroup[chart.key])}
                      {chart.key === "composite" && currentYearGroup.compositeRank
                        ? ` · ${currentYearGroup.compositeRank}위`
                        : ""}
                    </td>
                    <td>{fmt(currentYearGroup.national[chart.key])}</td>
                    <td>{fmt(currentYearGroup.zone[chart.key])}</td>
                    <td>{fmt(currentYearGroup.sido[chart.key])}</td>
                    <td>{fmt(currentYearGroup.scale[chart.key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </DetailTableSection>

      <DetailTableSection title="지표별 · 연도별 값·순위·평균 비교">
        <div className="flex flex-wrap gap-1">
          {Object.entries(groupedIndicators).map(([categoryId, indicators]) => (
            <div key={categoryId} className="flex flex-wrap gap-1">
              {indicators.map((indicator) => {
                const active = selectedIndicator === indicator.id;
                return (
                  <button
                    key={indicator.id}
                    type="button"
                    onClick={() => setSelectedIndicator(indicator.id)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      active
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface-2 text-muted hover:text-foreground"
                    }`}
                  >
                    {indicator.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(546px,1.2fr)_minmax(0,1.15fr)] xl:items-stretch">
          <div className="ucm-table-wrap min-w-0">
            <table className="ucm-table ucm-table-indicator">
              <thead>
                <tr>
                  <th>분석연도</th>
                  <th>원지표</th>
                  <th>지수</th>
                  <th>순위</th>
                  <th>전국(지수)</th>
                  <th>권역(지수)</th>
                  <th>시·도(지수)</th>
                  <th>규모(지수)</th>
                </tr>
              </thead>
              <tbody>
                {indicatorRows.map((row) => (
                  <tr
                    key={row.analysisYear}
                    className={
                      row.analysisYear === analysisYear ? "bg-accent/5" : undefined
                    }
                  >
                    <td>{row.analysisYear}년</td>
                    <td>{row.dataMissing ? "—" : fmt(row.rawValue)}</td>
                    <td className="font-semibold">
                      {row.dataMissing ? "—" : fmt(row.indexScore)}
                    </td>
                    <td className="ucm-rank">
                      {row.dataMissing || !row.rank ? "—" : `${row.rank}위`}
                    </td>
                    <td>{fmt(row.national.indexAvg)}</td>
                    <td>{fmt(row.zone.indexAvg)}</td>
                    <td>{fmt(row.sido.indexAvg)}</td>
                    <td>{fmt(row.scale.indexAvg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <IndicatorTrendChart
            rows={indicatorRows}
            scaleLabel={scale ? `${scale} 평균` : "규모 평균"}
            label={
              groupedIndicators["student-enrollment"]
                .concat(
                  groupedIndicators["univ-finance"],
                  groupedIndicators["corp-finance"],
                )
                .find((item) => item.id === selectedIndicator)?.label ?? "지표"
            }
          />
        </div>
      </DetailTableSection>

      <DetailTableSection title={`${analysisYear}년 전체 지표 요약 (표)`}>
        <div className="space-y-4">
          {(
            [
              ["student-enrollment", "학생충원"],
              ["univ-finance", "대학재정"],
              ["corp-finance", "법인재정"],
            ] as const
          ).map(([categoryId, categoryLabel]) => (
            <div key={categoryId}>
              <p className="ucm-summary-label">{categoryLabel}</p>
              <div className="ucm-table-wrap">
                <table className="ucm-table ucm-table-summary">
                  <thead>
                    <tr>
                      <th>지표</th>
                      <th>원지표</th>
                      <th>지수</th>
                      <th>순위</th>
                      <th>전국</th>
                      <th>권역</th>
                      <th>시·도</th>
                      <th>규모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedIndicators[categoryId].map((indicator) => {
                      const row = buildIndicatorYearRows(
                        series,
                        school.schoolCodeStd,
                        indicator.id,
                        enrolledByCode,
                      ).find((item) => item.analysisYear === analysisYear);

                      return (
                        <tr key={indicator.id}>
                          <td>{indicator.label}</td>
                          <td>{row?.dataMissing ? "—" : fmt(row?.rawValue ?? null)}</td>
                          <td className="font-semibold">
                            {row?.dataMissing ? "—" : fmt(row?.indexScore ?? null)}
                          </td>
                          <td className="ucm-rank">
                            {row?.dataMissing || !row?.rank ? "—" : `${row.rank}위`}
                          </td>
                          <td>{fmt(row?.national.indexAvg ?? null)}</td>
                          <td>{fmt(row?.zone.indexAvg ?? null)}</td>
                          <td>{fmt(row?.sido.indexAvg ?? null)}</td>
                          <td>{fmt(row?.scale.indexAvg ?? null)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </DetailTableSection>
    </div>
  );
}

export function UniversityCompetitivenessDashboard() {
  const {
    analysisYear,
    runResults,
    settings,
    step1RawResults,
    editionsLoading,
    lastRunAt,
  } = useCompetitivenessSettings();

  const [series, setSeries] = useState<EditionTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [selectedSidoId, setSelectedSidoId] = useState<string | null>(null);
  const [schoolKind, setSchoolKind] = useState<"university" | "junior-college">(
    "university",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    setTrendLoading(true);
    setTrendError(null);
    loadLocalEditionTrendSeries()
      .then((series) => {
        setSeries(series);
      })
      .catch((error) => {
        setTrendError(
          error instanceof Error ? error.message : "추세 데이터를 불러오지 못했습니다.",
        );
        setSeries([]);
      })
      .finally(() => setTrendLoading(false));
  }, [analysisYear, lastRunAt]);

  const analysisSchools = useMemo(() => {
    if (!runResults?.length) return [];
    return [...runResults].sort((a, b) =>
      a.schoolName.localeCompare(b.schoolName, "ko"),
    );
  }, [runResults]);

  const kindCounts = useMemo(
    () => countSchoolKinds(analysisSchools),
    [analysisSchools],
  );

  const filteredSchools = useMemo(() => {
    let rows = analysisSchools.filter((row) =>
      matchesSchoolKindFilter(row.schoolKind, schoolKind),
    );

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

    return rows;
  }, [analysisSchools, schoolKind, selectedSidoId, searchQuery]);

  const selectedSchool = useMemo(() => {
    if (!filteredSchools.length) return null;
    if (selectedCode) {
      const found = filteredSchools.find(
        (row) => row.schoolCodeStd === selectedCode,
      );
      if (found) return found;
    }
    return filteredSchools[0] ?? null;
  }, [filteredSchools, selectedCode]);

  useEffect(() => {
    if (!selectedSchool) {
      setSelectedCode(null);
      return;
    }
    setSelectedCode(selectedSchool.schoolCodeStd);
  }, [selectedSchool?.schoolCodeStd]);

  const cohortSize = useMemo(
    () =>
      analysisSchools.filter((row) =>
        matchesSchoolKindFilter(row.schoolKind, schoolKind),
      ).length,
    [analysisSchools, schoolKind],
  );

  const enrolledByCode = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const row of step1RawResults ?? []) {
      map.set(row.schoolCodeStd, row.enrolledTotal ?? null);
    }
    for (const row of settings.targetUniversities) {
      if (row.enrolledTotal != null) {
        map.set(row.schoolCodeStd, row.enrolledTotal);
      }
    }
    return map;
  }, [settings.targetUniversities, step1RawResults]);

  const selectedSido = KOREA_SIDO_REGIONS.find(
    (region) => region.id === selectedSidoId,
  );

  const loading = editionsLoading || trendLoading;
  const hasResults = Boolean(runResults?.length);

  return (
    <>
        <UniversityReportGuidelinesPanel
          analysisYear={analysisYear}
          settings={settings}
          hasRunResults={hasResults}
        />

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

        {loading ? (
          <p className={`px-1 ${FDB_TYPO.bodyText}`}>분석실행 데이터 불러오는 중…</p>
        ) : null}

        {trendError ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {trendError}
          </p>
        ) : null}

        {!loading && !hasResults ? (
          <section className="rounded-xl border border-dashed border-border bg-surface-2/50 px-5 py-12 text-center">
            <p className="text-sm font-medium">
              {analysisYear}년 분석결과가 없습니다.
            </p>
            <p className={`mt-1 ${FDB_TYPO.legend}`}>
              분석실행에서 {analysisYear}년 3단계를 실행하면 이 화면에서 확인할
              수 있습니다.
            </p>
            <Link
              href="/analysis/competitiveness-analysis/run"
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              분석실행으로 이동 →
            </Link>
          </section>
        ) : null}

        {!loading && hasResults && selectedSchool ? (
          <UniversityReportActions
            analysisYear={analysisYear}
            schoolCodeStd={selectedSchool.schoolCodeStd}
            schoolName={selectedSchool.schoolName}
            hasRunResults={hasResults}
          />
        ) : null}

        {!loading && hasResults ? (
          <div className="grid gap-4 lg:grid-cols-[324px_minmax(0,1fr)] lg:items-start">
            <aside className="flex max-h-[50vh] min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-[calc(100dvh-13rem)] lg:max-h-[780px]">
              <div className="border-b border-border px-4 py-3">
                <div className="ucm-school-list-header">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-accent-cyan">
                      <span className="block text-base">대학 목록</span>
                      <span className="text-sm">
                        (
                        {selectedSido ? selectedSido.label : "전국"}·
                        {filteredSchools.length.toLocaleString("ko-KR")}건)
                      </span>
                    </h2>
                  </div>
                  <SchoolKindTabBar
                    active={schoolKind}
                    universityCount={kindCounts.university}
                    juniorCollegeCount={kindCounts.juniorCollege}
                    onChange={setSchoolKind}
                    ariaLabel="대학별경쟁력 학교종류"
                  />
                </div>
              </div>

              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2"
                onWheel={handleSchoolListWheel}
              >
                {filteredSchools.length === 0 ? (
                  <p className={`px-2 py-6 text-center ${FDB_TYPO.bodyText}`}>
                    선택한 조건에 해당하는 분석대상학교가 없습니다.
                  </p>
                ) : (
                  <ul className="m-0 list-none space-y-1 p-0">
                    {filteredSchools.map((school) => {
                      const active =
                        selectedSchool?.schoolCodeStd === school.schoolCodeStd;
                      const gradeResult = school.excludedFromRanking
                        ? null
                        : calculateDiagnosticGrade(
                            school.compositeIndex,
                            indicatorRanksFromRow(school),
                            cohortSize,
                          );
                      return (
                        <li key={school.schoolCodeStd}>
                          <button
                            type="button"
                            onClick={() => setSelectedCode(school.schoolCodeStd)}
                            className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                              active
                                ? "border-accent-cyan/50 bg-accent/10"
                                : "border-transparent bg-surface-2/40 hover:border-border hover:bg-surface-2"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-accent-cyan">
                                  {school.schoolName}
                                </p>
                                <p className="mt-0.5 truncate text-[13px] text-[#92400e]">
                                  {school.region} ·{" "}
                                  {fmtEnrolledCount(
                                    enrolledByCode.get(school.schoolCodeStd),
                                  )}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${establishmentBadgeClass(school.estb)}`}
                              >
                                {school.estb}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-[#db2777]">
                                종합 {fmt(school.compositeIndex)} ·{" "}
                                {school.excludedFromRanking ||
                                !school.compositeRank
                                  ? "순위 —"
                                  : `${school.compositeRank}위`}
                              </p>
                              <span
                                className={`cra-grade-sm shrink-0 ${gradeBadgeClass(
                                  gradeResult?.grade ?? null,
                                )}`}
                              >
                                {formatDiagnosticGradeLabel(
                                  gradeResult?.grade ?? null,
                                  gradeResult?.gradeCapped ?? false,
                                  school.excludedFromRanking,
                                )}
                              </span>
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
              {selectedSchool ? (
                <SchoolDetailPanel
                  school={selectedSchool}
                  analysisYear={analysisYear}
                  series={
                    series.length
                      ? series
                      : [
                          {
                            analysisYear,
                            lastRunAt: null,
                            runResults: runResults ?? [],
                            settings,
                            step1RawResults,
                          },
                        ]
                  }
                  settings={settings}
                  cohortSize={cohortSize}
                  enrolledTotal={
                    enrolledByCode.get(selectedSchool.schoolCodeStd) ?? null
                  }
                  enrolledByCode={enrolledByCode}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center px-6 text-center">
                  <p className={FDB_TYPO.bodyText}>
                    좌측 목록에서 대학을 선택하세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
    </>
  );
}
