"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { SoftMintChartTooltip } from "@/components/analysis/SoftMintChartTooltip";
import {
  ANALYTICS_ZONES,
  ANALYTICS_ZONE_STROKES,
} from "@/lib/analysis/korea-analytics-zones";
import {
  buildAdvancedKpis,
  buildBoxPlots,
  buildHistogram,
  buildRiskTierBreakdown,
  buildScaleAggregates,
  buildSidoAggregates,
  buildTotalAggregate,
  buildZoneAggregates,
  buildScaleTrend,
  buildZoneTrend,
  CORP_TRANSFER_RISK_PROFILE,
  filterAdvancedRows,
  fmtPct,
  fmtYoy,
  fmtTransferThousand,
  type BoxPlotStats,
  type CorpTransferAdvancedFilters,
  type RegionAggregate,
  type CorpTransferRatioAdvancedRow,
} from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";
import type { AdvancedChartRiskProfile } from "@/lib/analysis/advanced-chart-risk-profile";
import {
  buildCohortCutoffDisplay,
  buildCohortRiskContext,
  COHORT_HIGH_RISK_LABEL,
  COHORT_RISK_LABEL,
  formatCohortRiskKpiSub,
  higherIsBetterFromRiskDirection,
  isRowCohortRelativeRisk,
} from "@/lib/analysis/cohort-relative-risk";
import type { AdvancedChartFunnelProfile } from "@/lib/analysis/advanced-chart-funnel-profile";
import { GeoCompareComposedChart } from "@/components/analysis/GeoCompareComposedChart";
import { ScaleTrendLineChart } from "@/components/analysis/ScaleTrendLineChart";
import { useEnrolledScaleLookup } from "@/components/analysis/EnrolledScaleLookupContext";
import { CHART_THEME } from "@/lib/theme/teal-glow";
import type { AdvancedChartHelpPack } from "@/lib/analysis/advanced-chart-help";
import { buildHelpSections } from "@/lib/analysis/advanced-chart-help";
import {
  CORP_TRANSFER_ADVANCED_CHART_HELP,
  CORP_TRANSFER_ADVANCED_HELP_OVERVIEW,
  CORP_TRANSFER_ADVANCED_KPI_HELP,
  CORP_TRANSFER_ADVANCED_TAB_HELP,
  type HelpSection,
} from "@/lib/analysis/corp-transfer-ratio-advanced-help";
import { ChartToolbarHelpButton } from "@/components/analysis/ChartToolbarHelpButton";
import { AdvancedChartGlobalFilters } from "@/components/analysis/AdvancedChartGlobalFilters";
import {
  buildAdvancedChartFilterOptions,
  latestAdvancedChartYear,
  matchesAdvancedChartRowFilters,
  sortAdvancedChartYears,
} from "@/lib/analysis/advanced-chart-filters";
import {
  HelpGuidePanel,
  HelpTip,
  PanelWithHelp,
} from "@/components/analysis/FundSecureRateAdvancedHelp";
import { FundSecureRateDensityDistributionChart } from "@/components/analysis/FundSecureRateDensityDistributionChart";
import { CHART_TYPO, RISK_HISTOGRAM_SPLIT } from "@/lib/analysis/finance-charts-typography";

const DEFAULT_ESTB = "사립";

const CORP_TRANSFER_DEFAULT_HELP: AdvancedChartHelpPack = {
  overview: CORP_TRANSFER_ADVANCED_HELP_OVERVIEW,
  kpi: CORP_TRANSFER_ADVANCED_KPI_HELP,
  tab: CORP_TRANSFER_ADVANCED_TAB_HELP,
  chart: CORP_TRANSFER_ADVANCED_CHART_HELP,
};

const CHART = {
  mint: CHART_THEME.amber,
  blue: "#3B82F6",
  amber: "#F59E0B",
  rose: "#F43F5E",
  emerald: "#10B981",
  violet: "#8B5CF6",
  grid: CHART_THEME.grid,
  axisLabel: CHART_THEME.axisLabel,
};

const RISK_TIER_COLORS: Record<string, string> = {
  high: CHART.rose,
  risk: CHART.amber,
  ok: CHART.blue,
  good: CHART.emerald,
};

type MainTab = "stats" | "risk" | "geo" | "distribution" | "pipeline";

function KpiCard({
  label,
  value,
  sub,
  delta,
  accent,
  help,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string | null;
  accent?: "mint" | "amber" | "rose" | "blue" | "default";
  help?: HelpSection;
}) {
  const valueClass =
    accent === "mint"
      ? "text-accent"
      : accent === "amber"
        ? "text-accent-orange"
        : accent === "rose"
          ? "text-rose-600"
          : accent === "blue"
            ? "text-sky-600"
            : "text-foreground";

  const deltaPositive = delta?.startsWith("▲");

  return (
    <div className="rounded-xl border border-border bg-surface p-5 border-l-4 border-l-border/80">
      <div className="flex items-start justify-between gap-2">
        <div className={`inline-flex items-center gap-1.5 ${CHART_TYPO.kpiLabel}`}>
          {label}
          {help ? <HelpTip help={help} /> : null}
        </div>
        {delta ? (
          <span
            className={`rounded-full px-2 py-0.5 ${CHART_TYPO.kpiDelta} ${
              deltaPositive
                ? "bg-emerald-500/15 text-emerald-600"
                : delta.startsWith("▼")
                  ? "bg-rose-500/15 text-rose-600"
                  : "bg-surface-2 text-muted"
            }`}
          >
            {delta}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${valueClass}`}>
        {value}
      </p>
      {sub ? <p className={`mt-1.5 ${CHART_TYPO.kpiSub}`}>{sub}</p> : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 transition-colors ${CHART_TYPO.toolbarControl} ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-border bg-surface-2 text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function fmtAmount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function fmtTuitionEok(eok: number | null | undefined): string {
  if (eok == null || Number.isNaN(eok)) return "—";
  return eok.toLocaleString("ko-KR");
}

function BoxPlotChart({
  data,
  rateLabel = "전입금비율",
}: {
  data: BoxPlotStats[];
  rateLabel?: string;
}) {
  const { scaleMin, scaleMax } = useMemo(() => {
    if (!data.length) return { scaleMin: 0, scaleMax: 200 };

    const whiskerVals = data.flatMap((d) => [d.min, d.max]);
    const sorted = [...whiskerVals].sort((a, b) => a - b);
    let lo = sorted[0] ?? 0;
    let hi = sorted[sorted.length - 1] ?? 200;

    const pad = Math.max(6, (hi - lo) * 0.08);
    return { scaleMin: lo - pad, scaleMax: hi + pad };
  }, [data]);

  const span = scaleMax - scaleMin || 1;
  const pct = (v: number) => `${((v - scaleMin) / span) * 100}%`;

  if (!data.length) {
    return <p className={CHART_TYPO.bodyText}>표시할 분포 데이터가 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${CHART_TYPO.legend}`}>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-4 rounded-sm border border-[#5EEAD4]"
            style={{ background: `${CHART.mint}33` }}
          />
          Q1~Q3 (10% 구간)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-[#F59E0B]" />
          중앙값
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-px w-4 bg-[#5EEAD4]" />
          수염(min~max)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#F43F5E]" />
          이상치
        </span>
      </div>
      {data.map((box) => (
        <div key={box.label} className="flex items-center gap-3">
          <span className={`w-14 shrink-0 font-medium text-foreground ${CHART_TYPO.toolbarControl}`}>
            {box.label}
          </span>
          <div className="relative h-9 flex-1 rounded-md bg-surface-2/40">
            <div
              className="absolute top-1/2 h-px -translate-y-1/2 bg-[#5EEAD4]/80"
              style={{
                left: pct(box.min),
                width: `calc(${pct(box.max)} - ${pct(box.min)})`,
              }}
            />
            <div
              className="absolute top-1/2 h-6 -translate-y-1/2 rounded border border-[#5EEAD4]"
              style={{
                left: pct(box.q1),
                width: `calc(${pct(box.q3)} - ${pct(box.q1)})`,
                background: `${CHART.mint}33`,
              }}
            />
            <div
              className="absolute top-1/2 h-6 w-0.5 -translate-y-1/2 bg-[#F59E0B]"
              style={{ left: pct(box.median) }}
            />
            {box.outliers.map((o, oi) => (
              <span
                key={oi}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F43F5E]"
                style={{ left: pct(o) }}
                title={`이상치 ${fmtPct(o)}`}
              />
            ))}
          </div>
          <div className={`w-[108px] shrink-0 text-right font-mono leading-tight text-muted ${CHART_TYPO.legend}`}>
            <div>{fmtPct(box.median)}</div>
            <div className="opacity-80">
              {fmtPct(box.min)}~{fmtPct(box.max)}
            </div>
          </div>
        </div>
      ))}
      <p className={CHART_TYPO.legend}>
        그룹별 {rateLabel}(%) 분포 — 상자=중간 10%, 가로선=중앙값, 양끝 수염=일반 범위
      </p>
    </div>
  );
}

function RegionalTable({
  rows,
  total,
  selectedRegion,
  onSelect,
  rateLabel = "전입금비율",
  riskProfile = CORP_TRANSFER_RISK_PROFILE,
}: {
  rows: RegionAggregate[];
  total: RegionAggregate;
  selectedRegion: string | null;
  onSelect: (region: string | null) => void;
  rateLabel?: string;
  riskProfile?: AdvancedChartRiskProfile;
}) {
  const sorted = [...rows].sort((a, b) => (b.avgRate ?? 0) - (a.avgRate ?? 0));
  const display = [total, ...sorted];

  return (
    <div className="overflow-x-auto">
      <table className={`w-full table-fixed border-collapse ${CHART_TYPO.tableBody}`}>
        <colgroup>
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[20%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-surface-2 text-center">
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>지역</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>학교 수</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>평균 {rateLabel}</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>전년 대비</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>중앙값</th>
            <th className={`px-3 py-2 ${CHART_TYPO.tableHead}`}>평균값</th>
            <th className={`px-3 py-2 text-rose-600 ${CHART_TYPO.tableHead}`}>
              {riskProfile.regionalRiskHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {display.map((row) => {
            const isTotal = row.region === "전체";
            return (
            <tr
              key={row.region}
              onClick={() =>
                isTotal
                  ? onSelect(null)
                  : onSelect(selectedRegion === row.region ? null : row.region)
              }
              className={`cursor-pointer border-b border-border/40 transition-colors hover:bg-accent/5 ${
                isTotal
                  ? "bg-surface-2 font-semibold"
                  : selectedRegion === row.region
                    ? "bg-accent/10"
                    : ""
              }`}
            >
              <td className="px-3 py-2 text-center font-bold text-accent">{row.region}</td>
              <td className="px-3 py-2 text-center font-mono">{row.schoolCount}</td>
              <td className="px-3 py-2 text-center font-mono font-semibold text-accent">
                {fmtPct(row.avgRate)}
              </td>
              <td
                className={`px-3 py-2 text-center font-mono ${
                  (row.yoy ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {fmtYoy(row.yoy) ?? "—"}
              </td>
              <td className="px-3 py-2 text-center font-mono">
                {fmtPct(row.median)}
              </td>
              <td className="px-3 py-2 text-center font-mono">
                {fmtPct(row.meanRate)}
              </td>
              <td className="px-3 py-2 text-center font-mono text-rose-600">
                {row.riskCount}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      <p className={`mt-2 ${CHART_TYPO.legend}`}>
        평균 {rateLabel}은 가중 평균, 평균값은 학교별 산술평균입니다. 행 클릭 시 하단 위험군 대학 목록이 해당 지역으로 필터링됩니다.
      </p>
    </div>
  );
}

function RiskSchoolList({
  rows,
  region,
  rateLabel = "전입금비율",
  riskProfile = CORP_TRANSFER_RISK_PROFILE,
}: {
  rows: CorpTransferRatioAdvancedRow[];
  region: string | null;
  rateLabel?: string;
  riskProfile?: AdvancedChartRiskProfile;
}) {
  const formatAmount =
    riskProfile.formatAmount ??
    ((value: number) => fmtTransferThousand(value));

  const higherIsBetter = higherIsBetterFromRiskDirection(
    riskProfile.riskDirection,
  );
  const cohortCtx = buildCohortRiskContext(
    rows,
    (r) => r.transferRatio,
    higherIsBetter,
  );

  const riskRows = rows
    .filter((r) => isRowCohortRelativeRisk(r, cohortCtx, "risk"))
    .filter((r) => (region ? r.region === region : true))
    .sort((a, b) =>
      higherIsBetter
        ? a.transferRatio - b.transferRatio
        : b.transferRatio - a.transferRatio,
    );

  const highRiskCount = riskRows.filter((r) =>
    isRowCohortRelativeRisk(r, cohortCtx, "high"),
  ).length;

  if (riskRows.length === 0) {
    return (
      <p className={CHART_TYPO.bodyText}>
        {region
          ? `${region} · ${rateLabel} ${COHORT_RISK_LABEL} 위험군 대학이 없습니다.`
          : `선택 필터 기준 위험군(${COHORT_RISK_LABEL}) 대학이 없습니다.`}
      </p>
    );
  }

  return (
    <div>
      <div className="max-h-[420px] overflow-auto rounded-lg border border-border/60">
        <table className={`w-full min-w-[960px] border-collapse ${CHART_TYPO.tableBody}`}>
          <thead className="sticky top-0 z-10 bg-surface-2">
            <tr className="border-b border-border">
              <th className={`px-2 py-2 text-left ${CHART_TYPO.tableHead}`}>학교명</th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>지역</th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                {riskProfile.riskListColumns.numerator}
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>
                {riskProfile.riskListColumns.denominator}
              </th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>{rateLabel}</th>
              <th className={`px-2 py-2 text-center ${CHART_TYPO.tableHead}`}>구분</th>
            </tr>
          </thead>
          <tbody>
            {riskRows.map((r) => {
              const isHighRisk = isRowCohortRelativeRisk(r, cohortCtx, "high");
              return (
                <tr key={r.schoolCodeStd} className="border-b border-border/30">
                  <td className="px-2 py-1.5 font-bold text-accent">{r.schoolName}</td>
                  <td className="px-2 py-1.5 text-center">{r.region}</td>
                  <td className="px-2 py-1.5 text-center font-mono text-muted">
                    {formatAmount(r.totalTransfer)}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono text-muted">
                    {formatAmount(r.tuitionRevenue)}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-center font-mono font-semibold ${
                      isHighRisk ? "text-rose-600" : "text-accent-orange"
                    }`}
                  >
                    {fmtPct(r.transferRatio, riskProfile.rateDigits)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 font-medium ${CHART_TYPO.legend} ${
                        isHighRisk
                          ? "bg-rose-500/15 text-rose-600"
                          : "bg-accent-orange/15 text-accent-orange"
                      }`}
                    >
                      {isHighRisk ? "고위험" : "위험"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={`mt-2 ${CHART_TYPO.legend}`}>
        {region ? `${region} · ` : ""}
        위험군 {riskRows.length.toLocaleString("ko-KR")}개교 전체 표시
        {" · "}
        {COHORT_HIGH_RISK_LABEL} 고위험{" "}
        {highRiskCount.toLocaleString("ko-KR")}개교
        {" · "}
        {riskProfile.riskListFooter}
      </p>
    </div>
  );
}

function formatTooltipPercent(value: number | string | undefined) {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n}%`;
}

/** Soft Mint 칩형 툴팁 (시리즈 색 매칭) */
function ChartTooltip({
  formatter,
}: {
  formatter?: (value: number | string | undefined) => string;
}) {
  return <SoftMintChartTooltip formatter={formatter} />;
}

type GeoChartsLayout = "stacked" | "split";
type DistributionTabLayout = "default" | "density-v2";

type CorpTransferRatioAdvancedChartDashboardProps = {
  rows: CorpTransferRatioAdvancedRow[];
  years: number[];
  hasData?: boolean;
  showMockupNotice?: boolean;
  /** 차트·KPI에 표시할 지표명 (기본: 전입금비율) */
  rateLabel?: string;
  /** 전국 평균 KPI 부제 */
  kpiSub?: string;
  /** 위험군·히스토그램·밀도분포 구간 (기본: 법인전입금비율 20%/10%) */
  riskProfile?: AdvancedChartRiskProfile;
  /** @deprecated 파이프라인 차트 제거 — 호출부 호환용 */
  funnelProfile?: AdvancedChartFunnelProfile;
  /** 목업 안내 문구 (미지정 시 법인전입금비율 기본 문구) */
  mockupNoticeLines?: string[];
  /** @deprecated 지역·권역 탭은 권역|규모 + 시·도 전폭으로 고정 */
  geoChartsLayout?: GeoChartsLayout;
  /** default=BoxPlot+위험단계 / density-v2=밀도분포+위험단계·히스토그램 2열(목업) */
  distributionTabLayout?: DistributionTabLayout;
  initialMainTab?: MainTab;
  /** 위험군대학 탭(시·도 테이블·위험군 목록)을 숨김 */
  hideRiskTab?: boolean;
  /** 목업 등 — 지표통계 탭을 맨 앞에 추가. 없으면 기존 4탭만 표시 */
  statsTabContent?: (ctx: {
    year: number;
    estb: string;
    schoolDivision: string;
    schoolKinds: string[];
  }) => ReactNode;
  statsTabHelp?: HelpSection;
  /** 학생충원 등 — 글로벌 필터 DB 보기 */
  dbViewMode?: "campus" | "consolidated";
  onDbViewModeChange?: (mode: "campus" | "consolidated") => void;
  /** KPI·탭·차트 도움말 (미지정 시 전입금비율 기본 문구) */
  helpPack?: AdvancedChartHelpPack;
  /** financeToolbar — 표시 연도 앞 컨트롤(예: 수익·재산 지표 전환) */
  filterToolbarLeading?: React.ReactNode;
  /** 툴바 도움말 버튼 교체 (미지정 시 기본 파란 필 버튼) */
  renderHelpButton?: (args: {
    active: boolean;
    onClick: () => void;
  }) => React.ReactNode;
};

export function CorpTransferRatioAdvancedChartDashboard({
  rows: allRows,
  years,
  hasData = true,
  showMockupNotice = false,
  rateLabel = "전입금비율",
  kpiSub = "Σ전입금 ÷ Σ등록금수입 · 높을수록 좋음",
  riskProfile = CORP_TRANSFER_RISK_PROFILE,
  mockupNoticeLines,
  geoChartsLayout: _geoChartsLayout = "stacked",
  distributionTabLayout = "default",
  initialMainTab = "risk",
  hideRiskTab = false,
  statsTabContent,
  statsTabHelp,
  dbViewMode,
  onDbViewModeChange,
  helpPack = CORP_TRANSFER_DEFAULT_HELP,
  filterToolbarLeading,
  renderHelpButton,
}: CorpTransferRatioAdvancedChartDashboardProps) {
  const chartYears = useMemo(() => sortAdvancedChartYears(years), [years]);
  const [year, setYear] = useState(() => latestAdvancedChartYear(years));
  const [estb, setEstb] = useState(DEFAULT_ESTB);
  const [schoolDivision, setSchoolDivision] = useState("");
  const [schoolKinds, setSchoolKinds] = useState<string[]>([]);
  const [mainTab, setMainTab] = useState<MainTab>(() =>
    hideRiskTab && initialMainTab === "risk"
      ? statsTabContent
        ? "stats"
        : "geo"
      : initialMainTab,
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const enrolledScaleLookup = useEnrolledScaleLookup();

  const helpSections = useMemo(() => buildHelpSections(helpPack), [helpPack]);
  const HELP = helpPack;
  const helpControl = renderHelpButton ? (
    renderHelpButton({
      active: helpOpen,
      onClick: () => setHelpOpen((v) => !v),
    })
  ) : (
    <ChartToolbarHelpButton
      active={helpOpen}
      onClick={() => setHelpOpen((v) => !v)}
    />
  );

  const filters = useMemo(
    () => ({ year, estb, schoolDivision, schoolKinds }),
    [year, estb, schoolDivision, schoolKinds],
  );

  const yearRows = useMemo(
    () => allRows.filter((r) => r.year === year),
    [allRows, year],
  );

  const filterOptions = useMemo(
    () => buildAdvancedChartFilterOptions(yearRows, { estb, schoolDivision }),
    [yearRows, estb, schoolDivision],
  );

  const hasActiveFilter =
    estb !== DEFAULT_ESTB ||
    schoolDivision !== "" ||
    schoolKinds.length > 0;

  function resetFilters() {
    setEstb(DEFAULT_ESTB);
    setSchoolDivision("");
    setSchoolKinds([]);
  }

  function changeYear(nextYear: number) {
    setYear(nextYear);
    resetFilters();
  }

  const currentRows = useMemo(
    () => filterAdvancedRows(allRows, filters),
    [allRows, filters],
  );
  const prevRows = useMemo(
    () =>
      filterAdvancedRows(allRows, {
        ...filters,
        year: year - 1,
      }),
    [allRows, filters, year],
  );

  const kpis = useMemo(
    () => buildAdvancedKpis(currentRows, prevRows, riskProfile),
    [currentRows, prevRows, riskProfile],
  );
  const cohortCutoffs = useMemo(
    () =>
      buildCohortCutoffDisplay(
        currentRows,
        (r) => r.transferRatio,
        higherIsBetterFromRiskDirection(riskProfile.riskDirection),
        riskProfile.rateDigits,
      ),
    [currentRows, riskProfile],
  );
  const zoneAgg = useMemo(
    () => buildZoneAggregates(currentRows, prevRows, riskProfile),
    [currentRows, prevRows, riskProfile],
  );
  const sidoAgg = useMemo(
    () => buildSidoAggregates(currentRows, prevRows, riskProfile),
    [currentRows, prevRows, riskProfile],
  );
  const totalAgg = useMemo(
    () => buildTotalAggregate(currentRows, prevRows, riskProfile),
    [currentRows, prevRows, riskProfile],
  );
  const scaleAgg = useMemo(
    () =>
      buildScaleAggregates(
        currentRows,
        prevRows,
        enrolledScaleLookup,
        riskProfile,
      ),
    [currentRows, prevRows, enrolledScaleLookup, riskProfile],
  );
  const boxPlots = useMemo(() => buildBoxPlots(currentRows), [currentRows]);
  const riskTiers = useMemo(
    () => buildRiskTierBreakdown(currentRows, riskProfile),
    [currentRows, riskProfile],
  );
  const histogram = useMemo(
    () => buildHistogram(currentRows, riskProfile),
    [currentRows, riskProfile],
  );
  const trendFiltered = useMemo(() => {
    const filtered = allRows.filter((r) =>
      matchesAdvancedChartRowFilters(r, {
        estb,
        schoolDivision,
        schoolKinds,
      }),
    );
    return buildZoneTrend(filtered, chartYears);
  }, [allRows, chartYears, estb, schoolDivision, schoolKinds]);
  const scaleTrendFiltered = useMemo(() => {
    const filtered = allRows.filter((r) =>
      matchesAdvancedChartRowFilters(r, {
        estb,
        schoolDivision,
        schoolKinds,
      }),
    );
    return buildScaleTrend(filtered, chartYears, enrolledScaleLookup);
  }, [allRows, chartYears, estb, schoolDivision, schoolKinds, enrolledScaleLookup]);

  const zoneBarData = zoneAgg.map((z) => ({
    region: z.region,
    avgRate: z.avgRate,
    yoy: z.yoy,
    schoolCount: z.schoolCount,
  }));

  const sidoBarData = [...sidoAgg]
    .sort((a, b) => (b.avgRate ?? 0) - (a.avgRate ?? 0))
    .map((s) => ({
      region: s.region,
      avgRate: s.avgRate,
      yoy: s.yoy,
    }));

  const scaleBarData = scaleAgg.map((z) => ({
    region: z.region,
    avgRate: z.avgRate,
    yoy: z.yoy,
    schoolCount: z.schoolCount,
  }));

  const avgRateName = `평균 ${rateLabel}`;

  const zoneComparePanel = (
    <PanelWithHelp title="5극 3특 권역 비교" help={HELP.chart.zoneCompare}>
      <GeoCompareComposedChart
        data={zoneBarData}
        avgRateName={avgRateName}
        xAxisAngle={-20}
        xAxisHeight={48}
        barCategoryGap="18%"
        maxBarSize={32}
      />
    </PanelWithHelp>
  );

  const scaleComparePanel = (
    <PanelWithHelp title="학생 규모 비교" help={HELP.chart.scaleCompare}>
      <GeoCompareComposedChart data={scaleBarData} avgRateName={avgRateName} />
    </PanelWithHelp>
  );

  const sidoRankPanel = (
    <PanelWithHelp title="17개 시·도 순위" help={HELP.chart.sidoRank}>
      <GeoCompareComposedChart
        data={sidoBarData}
        avgRateName={avgRateName}
        xAxisAngle={-45}
        xAxisHeight={56}
        barCategoryGap="28%"
        maxBarSize={36}
      />
    </PanelWithHelp>
  );

  const riskTierPanel = (
    <PanelWithHelp
      title={`${rateLabel} 위험 단계별 분포`}
      subtitle="고위험·위험·양호·여유 구간별 학교 수"
      help={HELP.chart.riskTier}
    >
      <div className={RISK_HISTOGRAM_SPLIT.heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={riskTiers} margin={{ ...RISK_HISTOGRAM_SPLIT.margin }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              interval={0}
              angle={RISK_HISTOGRAM_SPLIT.xAxisAngle}
              textAnchor="end"
              height={RISK_HISTOGRAM_SPLIT.xAxisHeight}
            />
            <YAxis
              allowDecimals={false}
              width={RISK_HISTOGRAM_SPLIT.yAxisWidth}
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
            />
            <ChartTooltip />
            <Bar dataKey="count" name="학교 수" radius={[4, 4, 0, 0]}>
              {riskTiers.map((entry) => (
                <Cell key={entry.tier} fill={RISK_TIER_COLORS[entry.tier] ?? CHART.mint} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PanelWithHelp>
  );

  const histogramPanel = (
    <PanelWithHelp
      title="히스토그램"
      subtitle={riskProfile.histogramSubtitle}
      help={HELP.chart.histogram}
    >
      <div className={RISK_HISTOGRAM_SPLIT.heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ ...RISK_HISTOGRAM_SPLIT.margin }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="bin"
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
              interval={0}
              angle={RISK_HISTOGRAM_SPLIT.xAxisAngle}
              textAnchor="end"
              height={RISK_HISTOGRAM_SPLIT.xAxisHeight}
            />
            <YAxis
              allowDecimals={false}
              width={RISK_HISTOGRAM_SPLIT.yAxisWidth}
              tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
            />
            <ChartTooltip />
            <Bar dataKey="count" name="학교 수" radius={[4, 4, 0, 0]}>
              {histogram.map((entry) => (
                <Cell key={entry.bin} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PanelWithHelp>
  );

  const densityDistributionPanel = (
    <PanelWithHelp
      title={`${rateLabel} 밀도 분포 (Density / Violin)`}
      subtitle={`대학/그룹 수 × ${rateLabel}(%) — ${riskProfile.densitySubtitle}`}
      help={HELP.chart.density}
    >
      <FundSecureRateDensityDistributionChart
        rates={currentRows.map((r) => r.transferRatio)}
        densityScale={riskProfile.densityScale}
        rateDigits={riskProfile.rateDigits}
        xAxisLabel={`${rateLabel} (%)`}
        weightedMean={kpis.avgRate}
        cohortTopCutoffs={{
          top15: cohortCutoffs.top15,
          top7: cohortCutoffs.top7,
        }}
      />
    </PanelWithHelp>
  );

  const mainTabs: { id: MainTab; label: string; help: HelpSection }[] = [
    ...(statsTabContent
      ? [
          {
            id: "stats" as const,
            label: "지표통계",
            help: statsTabHelp ?? {
              title: "지표통계 탭",
              body: "지역별·권역별·규모별로 입학정원·모집인원·입학자 원자료를 합산합니다.",
            },
          },
        ]
      : []),
    ...(hideRiskTab
      ? []
      : [{ id: "risk" as const, label: "위험군대학", help: HELP.tab.risk }]),
    { id: "geo", label: "지역·규모", help: HELP.tab.geo },
    {
      id: "distribution",
      label: "분포·위험",
      help: HELP.tab.distribution,
    },
    {
      id: "pipeline",
      label: "시계열",
      help: HELP.tab.pipeline,
    },
  ];

  if (!hasData || chartYears.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className={CHART_TYPO.bodyText}>
          {rateLabel} 데이터가 없습니다. 대학별DB 탭에서 엑셀 데이터를 업로드하세요.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-surface px-4 py-3">
        {dbViewMode != null && onDbViewModeChange ? (
          <AdvancedChartGlobalFilters
            layout="financeToolbar"
            filterToolbarLeading={filterToolbarLeading}
            filterHeaderActions={helpControl}
            years={chartYears}
            year={year}
            onYearChange={changeYear}
            estb={estb}
            onEstbChange={setEstb}
            schoolDivision={schoolDivision}
            onSchoolDivisionChange={setSchoolDivision}
            schoolKinds={schoolKinds}
            onSchoolKindsChange={setSchoolKinds}
            filterOptions={filterOptions}
            hasActiveFilter={hasActiveFilter}
            onResetFilters={resetFilters}
            dbViewMode={dbViewMode}
            onDbViewModeChange={onDbViewModeChange}
          />
        ) : (
          <>
            <AdvancedChartGlobalFilters
              layout="financeToolbar"
              filterToolbarLeading={filterToolbarLeading}
              filterHeaderActions={helpControl}
              years={chartYears}
              year={year}
              onYearChange={changeYear}
              estb={estb}
              onEstbChange={setEstb}
              schoolDivision={schoolDivision}
              onSchoolDivisionChange={setSchoolDivision}
              schoolKinds={schoolKinds}
              onSchoolKindsChange={setSchoolKinds}
              filterOptions={filterOptions}
              hasActiveFilter={hasActiveFilter}
              onResetFilters={resetFilters}
            />
          </>
        )}
      </section>

      {helpOpen ? (
        <HelpGuidePanel
          sections={helpSections}
          onClose={() => setHelpOpen(false)}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`전국 평균 ${rateLabel}`}
          value={fmtPct(kpis.avgRate)}
          delta={fmtYoy(kpis.yoy)}
          sub={kpiSub}
          accent="mint"
          help={HELP.kpi.avgRate}
        />
        <KpiCard
          label="중앙값 & IQR"
          value={fmtPct(kpis.median)}
          sub={
            kpis.iqr != null ? `IQR( Q3−Q1 ) = ${kpis.iqr.toFixed(1)}%p` : undefined
          }
          accent="blue"
          help={HELP.kpi.medianIqr}
        />
        <KpiCard
          label="위험군 대학 수"
          value={`${kpis.riskBelow20.toLocaleString("ko-KR")}개교`}
          sub={formatCohortRiskKpiSub(cohortCutoffs)}
          accent="rose"
          help={HELP.kpi.riskCount}
        />
        <KpiCard
          label="분석 대상"
          value={`${kpis.schoolCount.toLocaleString("ko-KR")}개교`}
          sub={`${year}년 · 선택 필터 적용`}
          accent="amber"
          help={HELP.kpi.schoolCount}
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {mainTabs.map((tab) => (
          <span key={tab.id} className="inline-flex items-center">
            <button
              type="button"
              onClick={() => setMainTab(tab.id)}
              className={`rounded-md px-4 py-2 transition-colors ${
                mainTab === tab.id
                  ? `${CHART_TYPO.sectionTab} bg-surface text-foreground shadow-sm ring-1 ring-border`
                  : `${CHART_TYPO.sectionTabInactive} hover:text-foreground`}
              }`}
            >
              {tab.label}
            </button>
            <HelpTip help={tab.help} className="mr-1" />
          </span>
        ))}
      </div>

      {mainTab === "stats" && statsTabContent
        ? statsTabContent({
            year,
            estb,
            schoolDivision,
            schoolKinds,
          })
        : null}

      {mainTab === "risk" && !hideRiskTab ? (
        <>
          <PanelWithHelp
            title="17개 시·도 상세 테이블"
            help={HELP.chart.sidoTable}
          >
            <RegionalTable
              rows={sidoAgg}
              total={totalAgg}
              selectedRegion={selectedRegion}
              onSelect={setSelectedRegion}
              rateLabel={rateLabel}
              riskProfile={riskProfile}
            />
          </PanelWithHelp>
          <PanelWithHelp
            title="위험군 대학 목록"
            help={HELP.chart.schoolPreview}
          >
            <RiskSchoolList
              rows={currentRows}
              region={selectedRegion}
              rateLabel={rateLabel}
              riskProfile={riskProfile}
            />
          </PanelWithHelp>
        </>
      ) : null}

      {mainTab === "geo" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {zoneComparePanel}
            {scaleComparePanel}
          </div>
          {sidoRankPanel}
        </>
      ) : null}

      {mainTab === "distribution" ? (
        distributionTabLayout === "density-v2" ? (
          <>
            {densityDistributionPanel}
            <div className={RISK_HISTOGRAM_SPLIT.gridClass}>
              {riskTierPanel}
              {histogramPanel}
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
              <PanelWithHelp
                title={`${rateLabel} 분포 (Box Plot)`}
                subtitle="수도권/비수도권 · 대학/전문대학 — 사분위·이상치"
                help={HELP.chart.boxPlot}
              >
                <BoxPlotChart data={boxPlots} rateLabel={rateLabel} />
              </PanelWithHelp>
              {riskTierPanel}
            </div>
            {histogramPanel}
          </>
        )
      ) : null}

      {mainTab === "pipeline" ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <PanelWithHelp
            title="5개년 권역별 추이"
            subtitle={`5극 3특 권역 ${avgRateName} · 변동성 비교`}
            help={HELP.chart.trend}
          >
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendFiltered}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: CHART_TYPO.tickPx, fill: CHART.axisLabel }}
                  />
                  <ChartTooltip formatter={formatTooltipPercent} />
                  <Legend
                    itemSorter={null}
                    wrapperStyle={{
                      fontSize: CHART_TYPO.tickPx,
                      color: CHART.axisLabel,
                    }}
                  />
                  {ANALYTICS_ZONES.map((zone, i) => (
                      <Line
                        key={zone}
                        type="monotone"
                        dataKey={zone}
                        stroke={ANALYTICS_ZONE_STROKES[i]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PanelWithHelp>
          <PanelWithHelp
            title="5개년 규모별 추이"
            subtitle={`대규모·중규모·소규모 ${avgRateName} · 변동성 비교`}
            help={HELP.chart.funnel}
          >
            <ScaleTrendLineChart data={scaleTrendFiltered} />
          </PanelWithHelp>
        </div>
      ) : null}

      {showMockupNotice ? (
      <section className={`rounded-lg border border-accent-orange/30 bg-accent-orange/5 px-4 py-3 ${CHART_TYPO.bodyText}`}>
        <p className="font-medium text-foreground">목업 안내</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {(mockupNoticeLines ?? [
            `${rateLabel} 통계분석 — 설립구분 기본 사립 · 자금확보율 통계분석과 동일 구조입니다.`,
            "권역/시도 다차원 분석·밀도 분포·위험군 목록으로 구성했습니다.",
            "전입금.xlsx 파싱 목업 사용 · 프로덕션 미연동",
          ]).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      ) : null}
    </div>
  );
}
