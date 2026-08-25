import { loadCorpTransferRepMockDashboard } from "@/lib/data/corp-transfer-ratio-rep-mock";
import { loadFinSupportRepMockDashboard } from "@/lib/data/financial-support-benefit-rate-rep-mock";
import { loadFreshmanRepMockDashboard } from "@/lib/data/freshman-enrollment-rep-mock";
import { loadFundSecureRepMockDashboard } from "@/lib/data/fund-secure-rate-rep-mock";
import { loadIncomePropertyRepMockDashboard } from "@/lib/data/income-property-secure-rate-rep-mock";
import { loadTuitionDepRepMockDashboard } from "@/lib/data/tuition-dependency-rate-rep-mock";
import {
  FRESHMAN_REP_COHORT_LABEL,
  toRepFreshmanEnrollmentRows,
  type FreshmanRepCohort,
  type FreshmanRepRow,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import { toFundSecureRateRows } from "@/lib/analysis/fund-secure-rate-rep-rollup";
import { toTuitionDependencyRateRows } from "@/lib/analysis/tuition-dependency-rate-rep-rollup";
import { toFinancialSupportBenefitRateRows } from "@/lib/analysis/financial-support-benefit-rate-rep-rollup";
import { toCorpTransferRatioRows } from "@/lib/analysis/corp-transfer-ratio-rep-rollup";
import { toIncomePropertyDisplayRows } from "@/lib/analysis/income-property-secure-rate-rep-rollup";
import type { FundSecureRateRow } from "@/lib/ingest/fund-secure-rate-config";
import type { TuitionDependencyRateRow } from "@/lib/ingest/tuition-dependency-rate-config";
import type { FinancialSupportBenefitRateRow } from "@/lib/ingest/financial-support-benefit-rate-config";
import type { CorpTransferRatioRow } from "@/lib/ingest/corp-transfer-ratio-config";
import type { IncomePropertySecureRateDisplayRow } from "@/lib/ingest/income-property-secure-rate-config";
import type { FreshmanEnrollmentRow } from "@/lib/ingest/freshman-enrollment-config";

import {
  ALL_UNIV_METRICS,
  type AllUnivMetricId,
  type AllUnivSection,
  type CohortTabItem,
  type FinanceTableRow,
  type FreshmanTableRow,
} from "./types";

function fmtCount(n: number): string {
  return n.toLocaleString("ko-KR");
}

function sourceFromDivision(
  schoolDivision: string,
): FinanceTableRow["sourceLabel"] {
  return schoolDivision.includes("전문") ? "전문대학" : "대학";
}

function freshmanSource(
  cohort: FreshmanRepCohort,
  schoolDivision: string,
): FreshmanTableRow["sourceLabel"] {
  if (cohort === "combined") return "대학통합";
  if (cohort === "junior-college") return "전문대학";
  if (cohort === "graduate") return "대학원";
  if (schoolDivision.includes("전문")) return "전문대학";
  return "대학";
}

function toFreshmanTableRows(
  rows: FreshmanRepRow[],
  cohort: FreshmanRepCohort,
): FreshmanTableRow[] {
  const showRecruit = cohort !== "graduate";
  return rows.map((row) => ({
    year: row.year,
    schoolRepCode: row.schoolRepCode,
    schoolRepName: row.schoolRepName,
    schoolDivision: row.schoolDivision,
    region: row.region,
    sourceLabel: freshmanSource(cohort, row.schoolDivision),
    campusCount: row.campusCount,
    gradProgramCount: row.gradProgramCount,
    admissionQuota: row.admissionQuota,
    recruitTotal: row.recruit.total,
    recruitWithin: row.recruit.within,
    recruitOutside: row.recruit.outside,
    enrolledTotal: row.enrolled.total,
    enrolledWithin: row.enrolled.within,
    enrolledOutside: row.enrolled.outside,
    fillRateWithin: row.fillRateWithin,
    fillRateWithinOutside: row.fillRateWithinOutside,
    hasAlimi: row.hasAlimi,
    showRecruit,
  }));
}

function filterFinanceRows<T extends { region: string; schoolRepName: string; schoolRepCode: string }>(
  rows: T[],
  region: string,
  q: string,
): T[] {
  const query = q.trim().toLowerCase();
  return rows.filter((row) => {
    if (region && row.region !== region) return false;
    if (query) {
      const hay = `${row.schoolRepName} ${row.schoolRepCode}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function parseAllUnivMetric(
  value: string | undefined,
): AllUnivMetricId {
  return ALL_UNIV_METRICS.some((item) => item.id === value)
    ? (value as AllUnivMetricId)
    : "freshman-enrollment-rate";
}

export function parseAllUnivSection(
  value: string | undefined,
): AllUnivSection {
  return value === "charts" ? "charts" : "data";
}

export type AllUnivMockPayload = {
  metric: AllUnivMetricId;
  section: AllUnivSection;
  cohort: string;
  year: number | null;
  years: number[];
  title: string;
  subtitle: string;
  note: string;
  rateLabel: string;
  cohortItems: CohortTabItem[];
  regions: string[];
  region: string;
  q: string;
  hasData: boolean;
  freshmanRows: FreshmanTableRow[];
  financeRows: FinanceTableRow[];
  freshmanChartRows: FreshmanEnrollmentRow[];
  fundChartRows: FundSecureRateRow[];
  tuitionChartRows: TuitionDependencyRateRow[];
  finSupportChartRows: FinancialSupportBenefitRateRow[];
  corpChartRows: CorpTransferRatioRow[];
  incomeChartRows: IncomePropertySecureRateDisplayRow[];
};

function emptyCharts() {
  return {
    freshmanChartRows: [] as FreshmanEnrollmentRow[],
    fundChartRows: [] as FundSecureRateRow[],
    tuitionChartRows: [] as TuitionDependencyRateRow[],
    finSupportChartRows: [] as FinancialSupportBenefitRateRow[],
    corpChartRows: [] as CorpTransferRatioRow[],
    incomeChartRows: [] as IncomePropertySecureRateDisplayRow[],
  };
}

export async function loadAllUnivMockPayload(sp: {
  metric?: string;
  section?: string;
  cohort?: string;
  year?: string;
  region?: string;
  q?: string;
}): Promise<AllUnivMockPayload> {
  const metric = parseAllUnivMetric(sp.metric);
  const section = parseAllUnivSection(sp.section);
  const yearNum = Number(sp.year);
  const year = Number.isFinite(yearNum) ? yearNum : null;
  const region = sp.region?.trim() ?? "";
  const q = sp.q?.trim() ?? "";
  const charts = emptyCharts();

  if (metric === "freshman-enrollment-rate") {
    const requested = sp.cohort;
    const baseCohort: FreshmanRepCohort =
      requested === "junior-college" ||
      requested === "graduate" ||
      requested === "combined"
        ? requested
        : requested === "all-universities"
          ? "combined"
          : "university";

    const [primary, junior] = await Promise.all([
      loadFreshmanRepMockDashboard({
        year,
        cohort: baseCohort,
        section,
        region,
        q,
      }),
      requested === "all-universities"
        ? loadFreshmanRepMockDashboard({
            year,
            cohort: "junior-college",
            section,
            region,
            q,
          })
        : Promise.resolve(null),
    ]);

    const counts = primary.cohortCounts;
    const allCount = counts.combined + counts["junior-college"];
    const cohortItems: CohortTabItem[] = [
      { id: "university", label: FRESHMAN_REP_COHORT_LABEL.university, count: fmtCount(counts.university) },
      { id: "graduate", label: FRESHMAN_REP_COHORT_LABEL.graduate, count: fmtCount(counts.graduate) },
      { id: "combined", label: FRESHMAN_REP_COHORT_LABEL.combined, count: fmtCount(counts.combined) },
      { id: "junior-college", label: FRESHMAN_REP_COHORT_LABEL["junior-college"], count: fmtCount(counts["junior-college"]) },
      { id: "all-universities", label: "전체대학", count: fmtCount(allCount) },
    ];

    const isAll = requested === "all-universities";
    const combinedDisplay = primary.allCohortRows.combined;
    const juniorDisplay = primary.allCohortRows["junior-college"];

    const freshmanRows = isAll
      ? [
          ...toFreshmanTableRows(filterFinanceRows(combinedDisplay, region, q), "combined"),
          ...toFreshmanTableRows(filterFinanceRows(juniorDisplay, region, q), "junior-college"),
        ].sort((a, b) => a.schoolRepName.localeCompare(b.schoolRepName, "ko"))
      : toFreshmanTableRows(primary.rows, baseCohort);

    const regions = [
      ...new Set(
        (isAll ? [...combinedDisplay, ...juniorDisplay] : primary.rows).map(
          (row) => row.region,
        ).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "ko"));

    charts.freshmanChartRows = isAll
      ? [
          ...toRepFreshmanEnrollmentRows(primary.chartRows, "combined"),
          ...toRepFreshmanEnrollmentRows(junior?.chartRows ?? [], "junior-college"),
        ]
      : toRepFreshmanEnrollmentRows(primary.chartRows, baseCohort);

    const note = isAll
      ? "전체대학 = 대학통합 행 + 전문대학 행. 율은 각 행의 기존 분모 규칙을 유지한 뒤 합산합니다. 규모는 대학 1만/5천명, 전문대학 4천/2천명 기준을 행별로 적용합니다."
      : baseCohort === "combined"
        ? "입학정원=대학+대학원 · 모집인원=대학전문만 · 입학자=대학+대학원"
        : baseCohort === "graduate"
          ? "모집인원 없음 · 정원내 = 입학자 정원내 ÷ 입학정원"
          : "정원내 = 입학자 정원내 ÷ 모집인원 정원내 · 정원내외 = 입학자 계 ÷ 모집인원 계";

    return {
      metric,
      section,
      cohort: isAll ? "all-universities" : baseCohort,
      year: primary.displayYear,
      years: primary.years,
      title: "신입생충원율",
      subtitle: "분석대상 대표학교 + 대학알리미 합산",
      note,
      rateLabel: "신입생충원율",
      cohortItems,
      regions,
      region,
      q,
      hasData: primary.hasData,
      freshmanRows,
      financeRows: [],
      ...charts,
    };
  }

  type Pair = {
    years: number[];
    displayYear: number | null;
    hasData: boolean;
    university: { region: string; schoolRepName: string; schoolRepCode: string; schoolDivision: string; rate: number | null }[];
    junior: { region: string; schoolRepName: string; schoolRepCode: string; schoolDivision: string; rate: number | null }[];
    universityChart: unknown[];
    juniorChart: unknown[];
    title: string;
    rateLabel: string;
    note: string;
    kind: AllUnivMetricId;
  };

  const isAll = sp.cohort === "all-universities";
  const financeCohort = sp.cohort === "junior-college" ? "junior-college" : "university";

  async function financePair(): Promise<Pair> {
    if (metric === "tuition-dependency-rate") {
      const [u, j] = await Promise.all([
        loadTuitionDepRepMockDashboard({ year, cohort: "university", section, region, q }),
        loadTuitionDepRepMockDashboard({ year, cohort: "junior-college", section, region, q }),
      ]);
      return {
        years: u.years,
        displayYear: u.displayYear,
        hasData: u.hasData,
        university: u.allCohortRows.university.map((r) => ({ ...r, rate: r.tuitionDependencyRate })),
        junior: u.allCohortRows["junior-college"].map((r) => ({ ...r, rate: r.tuitionDependencyRate })),
        universityChart: u.chartRows,
        juniorChart: j.chartRows,
        title: "등록금의존율",
        rateLabel: "등록금의존율",
        note: "전체대학 = 대학 행 + 전문대학 행을 함께 표시합니다. 규모 구분은 대학·전문대학 각각의 재학생수 기준을 유지합니다.",
        kind: metric,
      };
    }
    if (metric === "financial-support-benefit-rate") {
      const [u, j] = await Promise.all([
        loadFinSupportRepMockDashboard({ year, cohort: "university", section, region, q }),
        loadFinSupportRepMockDashboard({ year, cohort: "junior-college", section, region, q }),
      ]);
      return {
        years: u.years,
        displayYear: u.displayYear,
        hasData: u.hasData,
        university: u.allCohortRows.university.map((r) => ({ ...r, rate: r.benefitRate })),
        junior: u.allCohortRows["junior-college"].map((r) => ({ ...r, rate: r.benefitRate })),
        universityChart: u.chartRows,
        juniorChart: j.chartRows,
        title: "재정지원수혜율",
        rateLabel: "재정지원수혜율",
        note: "전체대학 = 대학 행 + 전문대학 행을 함께 표시합니다. 규모 구분은 대학·전문대학 각각의 재학생수 기준을 유지합니다.",
        kind: metric,
      };
    }
    if (metric === "corp-transfer-ratio") {
      const [u, j] = await Promise.all([
        loadCorpTransferRepMockDashboard({ year, cohort: "university", section, region, q }),
        loadCorpTransferRepMockDashboard({ year, cohort: "junior-college", section, region, q }),
      ]);
      return {
        years: u.years,
        displayYear: u.displayYear,
        hasData: u.hasData,
        university: u.allCohortRows.university.map((r) => ({ ...r, rate: r.transferRatio })),
        junior: u.allCohortRows["junior-college"].map((r) => ({ ...r, rate: r.transferRatio })),
        universityChart: u.chartRows,
        juniorChart: j.chartRows,
        title: "법인전입금비율",
        rateLabel: "법인전입금비율",
        note: "전체대학 = 대학 행 + 전문대학 행을 함께 표시합니다. 규모 구분은 대학·전문대학 각각의 재학생수 기준을 유지합니다.",
        kind: metric,
      };
    }
    if (metric === "income-property-secure-rate") {
      const [u, j] = await Promise.all([
        loadIncomePropertyRepMockDashboard({ year, cohort: "university", section, region, q }),
        loadIncomePropertyRepMockDashboard({ year, cohort: "junior-college", section, region, q }),
      ]);
      return {
        years: u.years,
        displayYear: u.displayYear,
        hasData: u.hasData,
        university: u.allCohortRows.university.map((r) => ({ ...r, rate: r.secureRate })),
        junior: u.allCohortRows["junior-college"].map((r) => ({ ...r, rate: r.secureRate })),
        universityChart: u.chartRows,
        juniorChart: j.chartRows,
        title: "수익용재산확보율",
        rateLabel: "수익용재산확보율",
        note: "전체대학 = 대학 행 + 전문대학 행을 함께 표시합니다. 규모 구분은 대학·전문대학 각각의 재학생수 기준을 유지합니다.",
        kind: metric,
      };
    }
    const [u, j] = await Promise.all([
      loadFundSecureRepMockDashboard({ year, cohort: "university", section, region, q }),
      loadFundSecureRepMockDashboard({ year, cohort: "junior-college", section, region, q }),
    ]);
    return {
      years: u.years,
      displayYear: u.displayYear,
      hasData: u.hasData,
      university: u.allCohortRows.university.map((r) => ({ ...r, rate: r.fundSecureRate })),
      junior: u.allCohortRows["junior-college"].map((r) => ({ ...r, rate: r.fundSecureRate })),
      universityChart: u.chartRows,
      juniorChart: j.chartRows,
      title: "자금확보율",
      rateLabel: "자금확보율",
      note: "전체대학 = 대학 행 + 전문대학 행을 함께 표시합니다. 규모 구분은 대학·전문대학 각각의 재학생수 기준을 유지합니다.",
      kind: "fund-secure-rate",
    };
  }

  const pair = await financePair();
  const univCount = pair.university.length;
  const juniorCount = pair.junior.length;
  const cohortItems: CohortTabItem[] = [
    { id: "university", label: "대학", count: fmtCount(univCount) },
    { id: "junior-college", label: "전문대학", count: fmtCount(juniorCount) },
    { id: "all-universities", label: "전체대학", count: fmtCount(univCount + juniorCount) },
  ];

  const sourceRows = isAll
    ? [...pair.university, ...pair.junior]
    : financeCohort === "junior-college"
      ? pair.junior
      : pair.university;

  const financeRows: FinanceTableRow[] = filterFinanceRows(sourceRows, region, q)
    .map((row) => ({
      schoolRepName: row.schoolRepName,
      schoolRepCode: row.schoolRepCode,
      schoolDivision: row.schoolDivision,
      region: row.region,
      sourceLabel: sourceFromDivision(row.schoolDivision),
      rate: row.rate,
    }))
    .sort((a, b) => a.schoolRepName.localeCompare(b.schoolRepName, "ko"));

  const regions = [
    ...new Set(sourceRows.map((row) => row.region).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "ko"));

  if (metric === "tuition-dependency-rate") {
    const rows = isAll
      ? [...pair.universityChart, ...pair.juniorChart]
      : financeCohort === "junior-college"
        ? pair.juniorChart
        : pair.universityChart;
    charts.tuitionChartRows = toTuitionDependencyRateRows(
      rows as Parameters<typeof toTuitionDependencyRateRows>[0],
    );
  } else if (metric === "financial-support-benefit-rate") {
    const rows = isAll
      ? [...pair.universityChart, ...pair.juniorChart]
      : financeCohort === "junior-college"
        ? pair.juniorChart
        : pair.universityChart;
    charts.finSupportChartRows = toFinancialSupportBenefitRateRows(
      rows as Parameters<typeof toFinancialSupportBenefitRateRows>[0],
    );
  } else if (metric === "corp-transfer-ratio") {
    const rows = isAll
      ? [...pair.universityChart, ...pair.juniorChart]
      : financeCohort === "junior-college"
        ? pair.juniorChart
        : pair.universityChart;
    charts.corpChartRows = toCorpTransferRatioRows(
      rows as Parameters<typeof toCorpTransferRatioRows>[0],
    );
  } else if (metric === "income-property-secure-rate") {
    const rows = isAll
      ? [...pair.universityChart, ...pair.juniorChart]
      : financeCohort === "junior-college"
        ? pair.juniorChart
        : pair.universityChart;
    charts.incomeChartRows = toIncomePropertyDisplayRows(
      rows as Parameters<typeof toIncomePropertyDisplayRows>[0],
    );
  } else {
    const rows = isAll
      ? [...pair.universityChart, ...pair.juniorChart]
      : financeCohort === "junior-college"
        ? pair.juniorChart
        : pair.universityChart;
    charts.fundChartRows = toFundSecureRateRows(
      rows as Parameters<typeof toFundSecureRateRows>[0],
    );
  }

  return {
    metric,
    section,
    cohort: isAll ? "all-universities" : financeCohort,
    year: pair.displayYear,
    years: pair.years,
    title: pair.title,
    subtitle: "분석대상 대표학교 합산",
    note: pair.note,
    rateLabel: pair.rateLabel,
    cohortItems,
    regions,
    region,
    q,
    hasData: pair.hasData,
    freshmanRows: [],
    financeRows,
    ...charts,
  };
}
