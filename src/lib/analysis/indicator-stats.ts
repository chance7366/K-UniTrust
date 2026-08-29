import {
  freshmanRateCohortForRow,
  sumCohortRates,
  type FreshmanRepCohort,
  type FreshmanRepRow,
  type FreshmanRepViewCohort,
} from "@/lib/analysis/freshman-enrollment-rep-rollup";
import {
  partitionIndicatorStats,
  type IndicatorStatsGroup,
  type IndicatorGeoSource,
} from "@/lib/analysis/indicator-stats-geo";
import {
  sumEnrolledCohortRates,
  type EnrolledRepRow,
} from "@/lib/analysis/enrolled-enrollment-rep-rollup";
import { sumDropoutCohortRates, type DropoutRepRow } from "@/lib/analysis/dropout-rate-rep-rollup";
import { sumFundSecureCohortRate, type FundSecureRepRow } from "@/lib/analysis/fund-secure-rate-rep-rollup";
import { sumFinSupportCohortRate, type FinSupportRepRow } from "@/lib/analysis/financial-support-benefit-rate-rep-rollup";
import { sumTuitionDepCohortRate, type TuitionDepRepRow } from "@/lib/analysis/tuition-dependency-rate-rep-rollup";
import { sumCorpTransferCohortRate, type CorpTransferRepRow } from "@/lib/analysis/corp-transfer-ratio-rep-rollup";
import { sumIncomePropertyCohortRate, type IncomePropertyRepRow } from "@/lib/analysis/income-property-secure-rate-rep-rollup";
import type { EnrolledScaleLookupJson } from "@/lib/analysis/school-scale-trend";
import { splitTwoSchoolByDivision } from "@/lib/analysis/all-universities-cohort";

export type IndicatorStatsFormat = "int" | "rate" | "million0";

export type IndicatorStatsColumn = {
  id: string;
  label: string;
  group?: string;
  format: IndicatorStatsFormat;
  rateTone?: "primary" | "secondary";
};

export type IndicatorStatsNumericRow = {
  label: string;
  schoolCount: number;
  values: Record<string, number | null>;
};

export type IndicatorStatsBundle = {
  division: IndicatorStatsNumericRow[] | null;
  estb?: IndicatorStatsNumericRow[] | null;
  scale: IndicatorStatsNumericRow[];
  zone: IndicatorStatsNumericRow[];
  region: IndicatorStatsNumericRow[];
};

export const FRESHMAN_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "admissionQuota", label: "입학정원", format: "int" },
  { id: "recruitTotal", label: "계", group: "모집인원", format: "int" },
  { id: "recruitWithin", label: "정원내", group: "모집인원", format: "int" },
  { id: "recruitOutside", label: "정원외", group: "모집인원", format: "int" },
  { id: "enrolledTotal", label: "계", group: "입학자", format: "int" },
  { id: "enrolledWithin", label: "정원내", group: "입학자", format: "int" },
  { id: "enrolledOutside", label: "정원외", group: "입학자", format: "int" },
  {
    id: "fillRateWithin",
    label: "정원내",
    group: "신입생충원율",
    format: "rate",
    rateTone: "primary",
  },
  {
    id: "fillRateWithinOutside",
    label: "정원내외",
    group: "신입생충원율",
    format: "rate",
    rateTone: "secondary",
  },
];

export const ENROLLED_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "studentQuota", label: "학생정원", format: "int" },
  { id: "recruitmentStop", label: "모집정지", format: "int" },
  { id: "enrolledTotal", label: "계", group: "재학생", format: "int" },
  { id: "enrolledWithin", label: "정원내", group: "재학생", format: "int" },
  { id: "enrolledOutside", label: "정원외", group: "재학생", format: "int" },
  {
    id: "fillRateWithin",
    label: "정원내",
    group: "재학생충원율",
    format: "rate",
    rateTone: "primary",
  },
  {
    id: "fillRateWithinOutside",
    label: "정원내외",
    group: "재학생충원율",
    format: "rate",
    rateTone: "secondary",
  },
];

export const DROPOUT_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "enrolledStudents", label: "재적학생", group: "재적", format: "int" },
  { id: "enrolledDropouts", label: "중도탈락", group: "재적", format: "int" },
  {
    id: "enrolledRate",
    label: "중도탈락비율",
    group: "재적",
    format: "rate",
    rateTone: "primary",
  },
  { id: "freshmanStudents", label: "신입생", group: "신입생", format: "int" },
  { id: "freshmanDropouts", label: "중도탈락", group: "신입생", format: "int" },
  {
    id: "freshmanRate",
    label: "중도탈락비율",
    group: "신입생",
    format: "rate",
    rateTone: "secondary",
  },
];

export const FUND_SECURE_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "eduCarryover", label: "이월자금", group: "교비회계", format: "million0" },
  { id: "eduEndowment", label: "기금", group: "교비회계", format: "million0" },
  { id: "industryCarryover", label: "이월자금", group: "산단회계", format: "million0" },
  { id: "industryEndowment", label: "기금", group: "산단회계", format: "million0" },
  { id: "totalFunds", label: "자금합계", format: "million0" },
  { id: "tuitionRevenue", label: "등록금수입", format: "million0" },
  {
    id: "fundSecureRate",
    label: "자금확보율",
    format: "rate",
    rateTone: "primary",
  },
];

export const FIN_SUPPORT_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "centralMinistries", label: "중앙부처", group: "재정지원", format: "million0" },
  { id: "nationalScholarship", label: "(국가장학금)", group: "재정지원", format: "million0" },
  { id: "centralSubtotal", label: "소계", group: "재정지원", format: "million0" },
  { id: "localGovernment", label: "지자체", format: "million0" },
  { id: "totalSupport", label: "지원액합계", format: "million0" },
  { id: "tuitionRevenue", label: "등록금수입", format: "million0" },
  {
    id: "benefitRate",
    label: "재정지원수혜율",
    format: "rate",
    rateTone: "primary",
  },
];

export const TUITION_DEP_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "tuitionRevenue", label: "등록금수입", format: "million0" },
  { id: "eduOperatingRevenue", label: "교비회계", group: "운영수입", format: "million0" },
  { id: "industryOperatingRevenue", label: "산단회계", group: "운영수입", format: "million0" },
  { id: "totalOperatingRevenue", label: "운영수입합계", group: "운영수입", format: "million0" },
  {
    id: "tuitionDependencyRate",
    label: "등록금의존율",
    format: "rate",
    rateTone: "primary",
  },
];

export const CORP_TRANSFER_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "ordinaryExpenseTransfer", label: "경상비", group: "전입금", format: "million0" },
  { id: "legalObligationTransfer", label: "법정부담", group: "전입금", format: "million0" },
  { id: "assetTransfer", label: "자산", group: "전입금", format: "million0" },
  { id: "totalTransfer", label: "전입금합계", group: "전입금", format: "million0" },
  { id: "tuitionRevenue", label: "등록금수입", format: "million0" },
  {
    id: "transferRatio",
    label: "전입금비율",
    format: "rate",
    rateTone: "primary",
  },
];

export const INCOME_PROPERTY_INDICATOR_STATS_COLUMNS: IndicatorStatsColumn[] = [
  { id: "appraisedGross", label: "평가액", group: "수익용재산", format: "million0" },
  { id: "collateralDeduction", label: "담보차감액", group: "수익용재산", format: "million0" },
  { id: "appraisedNet", label: "소계", group: "수익용재산", format: "million0" },
  { id: "incomeTotal", label: "수입액", format: "million0" },
  { id: "tuitionRevenue", label: "등록금수입", format: "million0" },
  {
    id: "secureRate",
    label: "확보율",
    format: "rate",
    rateTone: "primary",
  },
  {
    id: "revenueRate",
    label: "수익율",
    format: "rate",
    rateTone: "secondary",
  },
];

const STUDENT_DIVISIONS: { id: "all" | FreshmanRepCohort; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "university", label: "대학" },
  { id: "graduate", label: "대학원" },
  { id: "combined", label: "대학통합" },
  { id: "junior-college", label: "전문대학" },
];

const TWO_SCHOOL_DIVISIONS: { id: "all" | "university" | "junior-college"; label: string }[] =
  [
    { id: "all", label: "전체" },
    { id: "university", label: "대학" },
    { id: "junior-college", label: "전문대학" },
  ];

function mapGroups<T>(
  groups: IndicatorStatsGroup<T>[],
  agg: (label: string, rows: T[]) => IndicatorStatsNumericRow,
): IndicatorStatsNumericRow[] {
  return groups.map((g) => agg(g.label, g.rows));
}

function bundleFrom<T extends IndicatorGeoSource>(
  viewRows: T[],
  lookup: EnrolledScaleLookupJson,
  agg: (label: string, rows: T[]) => IndicatorStatsNumericRow,
  division: IndicatorStatsNumericRow[] | null,
): IndicatorStatsBundle {
  const parts = partitionIndicatorStats(viewRows, lookup);
  return {
    division,
    estb: mapGroups(parts.estb, agg),
    scale: mapGroups(parts.scale, agg),
    zone: mapGroups(parts.zone, agg),
    region: mapGroups(parts.region, agg),
  };
}

function freshmanAgg(
  label: string,
  rows: FreshmanRepRow[],
  view: FreshmanRepViewCohort,
): IndicatorStatsNumericRow {
  const rates = sumCohortRates(rows, view);
  let admissionQuota = 0;
  let recruitTotal = 0;
  let recruitWithin = 0;
  let recruitOutside = 0;
  let enrolledTotal = 0;
  let enrolledWithin = 0;
  let enrolledOutside = 0;
  for (const row of rows) {
    admissionQuota += row.admissionQuota;
    recruitTotal += row.recruit.total;
    recruitWithin += row.recruit.within;
    recruitOutside += row.recruit.outside;
    enrolledTotal += row.enrolled.total;
    enrolledWithin += row.enrolled.within;
    enrolledOutside += row.enrolled.outside;
  }
  return {
    label,
    schoolCount: rows.length,
    values: {
      admissionQuota,
      recruitTotal,
      recruitWithin,
      recruitOutside,
      enrolledTotal,
      enrolledWithin,
      enrolledOutside,
      fillRateWithin: rates.fillRateWithin,
      fillRateWithinOutside: rates.fillRateWithinOutside,
    },
  };
}

function freshmanViewFor(
  rows: FreshmanRepRow[],
  fallback: FreshmanRepViewCohort,
): FreshmanRepViewCohort {
  if (fallback !== "all-universities") return fallback;
  const kinds = new Set(rows.map((row) => freshmanRateCohortForRow(row, fallback)));
  if (kinds.size === 1) return [...kinds][0];
  return "all-universities";
}

export function buildFreshmanIndicatorStats(args: {
  viewRows: FreshmanRepRow[];
  viewCohort: FreshmanRepViewCohort;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<FreshmanRepCohort, FreshmanRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (label: string, rows: FreshmanRepRow[]) =>
    freshmanAgg(label, rows, freshmanViewFor(rows, args.viewCohort));
  let division: IndicatorStatsNumericRow[] | null = null;
  if (args.viewCohort === "all-universities" && args.rowsByCohort) {
    division = STUDENT_DIVISIONS.map((tab) => {
      if (tab.id === "all") return freshmanAgg("전체", args.viewRows, args.viewCohort);
      const rows = args.rowsByCohort![tab.id];
      return freshmanAgg(tab.label, rows, tab.id);
    });
  }
  return bundleFrom(args.viewRows, args.lookup, agg, division);
}

export function buildEnrolledIndicatorStats(args: {
  viewRows: EnrolledRepRow[];
  viewCohort: FreshmanRepViewCohort;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<FreshmanRepCohort, EnrolledRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (label: string, rows: EnrolledRepRow[]): IndicatorStatsNumericRow => {
    const rates = sumEnrolledCohortRates(rows);
    let studentQuota = 0;
    let recruitmentStop = 0;
    let enrolledTotal = 0;
    let enrolledWithin = 0;
    let enrolledOutside = 0;
    for (const row of rows) {
      studentQuota += row.studentQuota;
      recruitmentStop += row.recruitmentStop;
      enrolledTotal += row.enrolled.total;
      enrolledWithin += row.enrolled.within;
      enrolledOutside += row.enrolled.outside;
    }
    return {
      label,
      schoolCount: rows.length,
      values: {
        studentQuota,
        recruitmentStop,
        enrolledTotal,
        enrolledWithin,
        enrolledOutside,
        fillRateWithin: rates.fillRateWithin,
        fillRateWithinOutside: rates.fillRateWithinOutside,
      },
    };
  };
  let division: IndicatorStatsNumericRow[] | null = null;
  if (args.viewCohort === "all-universities" && args.rowsByCohort) {
    division = STUDENT_DIVISIONS.map((tab) => {
      if (tab.id === "all") return agg("전체", args.viewRows);
      return agg(tab.label, args.rowsByCohort![tab.id]);
    });
  }
  return bundleFrom(args.viewRows, args.lookup, agg, division);
}

export function buildDropoutIndicatorStats(args: {
  viewRows: DropoutRepRow[];
  viewCohort: FreshmanRepViewCohort;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<FreshmanRepCohort, DropoutRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (label: string, rows: DropoutRepRow[]): IndicatorStatsNumericRow => {
    const rates = sumDropoutCohortRates(rows);
    let enrolledStudents = 0;
    let enrolledDropouts = 0;
    let freshmanStudents = 0;
    let freshmanDropouts = 0;
    for (const row of rows) {
      enrolledStudents += row.enrolled.students;
      enrolledDropouts += row.enrolled.dropouts;
      freshmanStudents += row.freshman.students;
      freshmanDropouts += row.freshman.dropouts;
    }
    return {
      label,
      schoolCount: rows.length,
      values: {
        enrolledStudents,
        enrolledDropouts,
        enrolledRate: rates.enrolledRate,
        freshmanStudents,
        freshmanDropouts,
        freshmanRate: rates.freshmanRate,
      },
    };
  };
  let division: IndicatorStatsNumericRow[] | null = null;
  if (args.viewCohort === "all-universities" && args.rowsByCohort) {
    division = STUDENT_DIVISIONS.map((tab) => {
      if (tab.id === "all") return agg("전체", args.viewRows);
      return agg(tab.label, args.rowsByCohort![tab.id]);
    });
  }
  return bundleFrom(args.viewRows, args.lookup, agg, division);
}

function twoSchoolDivision<T extends { schoolDivision: string }>(
  viewCohort: string,
  viewRows: T[],
  rowsByCohort: Record<"university" | "junior-college", T[]> | undefined,
  agg: (label: string, rows: T[]) => IndicatorStatsNumericRow,
): IndicatorStatsNumericRow[] | null {
  if (viewCohort !== "all-universities") return null;
  const split = rowsByCohort ?? splitTwoSchoolByDivision(viewRows);
  return TWO_SCHOOL_DIVISIONS.map((tab) => {
    if (tab.id === "all") return agg("전체", viewRows);
    return agg(tab.label, split[tab.id]);
  });
}

export function buildFundSecureIndicatorStats(args: {
  viewRows: FundSecureRepRow[];
  viewCohort: string;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<"university" | "junior-college", FundSecureRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (label: string, rows: FundSecureRepRow[]): IndicatorStatsNumericRow => {
    const rates = sumFundSecureCohortRate(rows);
    let eduCarryover = 0;
    let eduEndowment = 0;
    let industryCarryover = 0;
    let industryEndowment = 0;
    let totalFunds = 0;
    let tuitionRevenue = 0;
    for (const row of rows) {
      eduCarryover += row.eduCarryover;
      eduEndowment += row.eduEndowment;
      industryCarryover += row.industryCarryover;
      industryEndowment += row.industryEndowment;
      totalFunds += row.totalFunds;
      tuitionRevenue += row.tuitionRevenue;
    }
    return {
      label,
      schoolCount: rows.length,
      values: {
        eduCarryover,
        eduEndowment,
        industryCarryover,
        industryEndowment,
        totalFunds,
        tuitionRevenue,
        fundSecureRate: rates.fundSecureRate,
      },
    };
  };
  return bundleFrom(
    args.viewRows,
    args.lookup,
    agg,
    twoSchoolDivision(args.viewCohort, args.viewRows, args.rowsByCohort, agg),
  );
}

export function buildFinSupportIndicatorStats(args: {
  viewRows: FinSupportRepRow[];
  viewCohort: string;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<"university" | "junior-college", FinSupportRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (label: string, rows: FinSupportRepRow[]): IndicatorStatsNumericRow => {
    const rates = sumFinSupportCohortRate(rows);
    let centralMinistries = 0;
    let nationalScholarship = 0;
    let centralSubtotal = 0;
    let localGovernment = 0;
    let totalSupport = 0;
    let tuitionRevenue = 0;
    for (const row of rows) {
      centralMinistries += row.centralMinistries / 1000;
      nationalScholarship += row.nationalScholarship / 1000;
      centralSubtotal += row.centralSubtotal / 1000;
      localGovernment += row.localGovernment / 1000;
      totalSupport += row.totalSupport / 1000;
      tuitionRevenue += row.tuitionRevenue;
    }
    return {
      label,
      schoolCount: rows.length,
      values: {
        centralMinistries,
        nationalScholarship,
        centralSubtotal,
        localGovernment,
        totalSupport,
        tuitionRevenue,
        benefitRate: rates.benefitRate,
      },
    };
  };
  return bundleFrom(
    args.viewRows,
    args.lookup,
    agg,
    twoSchoolDivision(args.viewCohort, args.viewRows, args.rowsByCohort, agg),
  );
}

export function buildTuitionDepIndicatorStats(args: {
  viewRows: TuitionDepRepRow[];
  viewCohort: string;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<"university" | "junior-college", TuitionDepRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (label: string, rows: TuitionDepRepRow[]): IndicatorStatsNumericRow => {
    const rates = sumTuitionDepCohortRate(rows);
    let tuitionRevenue = 0;
    let eduOperatingRevenue = 0;
    let industryOperatingRevenue = 0;
    let totalOperatingRevenue = 0;
    for (const row of rows) {
      tuitionRevenue += row.tuitionRevenue;
      eduOperatingRevenue += row.eduOperatingRevenue;
      industryOperatingRevenue += row.industryOperatingRevenue;
      totalOperatingRevenue += row.totalOperatingRevenue;
    }
    return {
      label,
      schoolCount: rows.length,
      values: {
        tuitionRevenue,
        eduOperatingRevenue,
        industryOperatingRevenue,
        totalOperatingRevenue,
        tuitionDependencyRate: rates.tuitionDependencyRate,
      },
    };
  };
  return bundleFrom(
    args.viewRows,
    args.lookup,
    agg,
    twoSchoolDivision(args.viewCohort, args.viewRows, args.rowsByCohort, agg),
  );
}

export function buildCorpTransferIndicatorStats(args: {
  viewRows: CorpTransferRepRow[];
  viewCohort: string;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<"university" | "junior-college", CorpTransferRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (label: string, rows: CorpTransferRepRow[]): IndicatorStatsNumericRow => {
    const rates = sumCorpTransferCohortRate(rows);
    let ordinaryExpenseTransfer = 0;
    let legalObligationTransfer = 0;
    let assetTransfer = 0;
    let totalTransfer = 0;
    let tuitionRevenue = 0;
    for (const row of rows) {
      ordinaryExpenseTransfer += row.ordinaryExpenseTransfer;
      legalObligationTransfer += row.legalObligationTransfer;
      assetTransfer += row.assetTransfer;
      totalTransfer += row.totalTransfer;
      tuitionRevenue += row.tuitionRevenue;
    }
    return {
      label,
      schoolCount: rows.length,
      values: {
        ordinaryExpenseTransfer,
        legalObligationTransfer,
        assetTransfer,
        totalTransfer,
        tuitionRevenue,
        transferRatio: rates.transferRatio,
      },
    };
  };
  return bundleFrom(
    args.viewRows,
    args.lookup,
    agg,
    twoSchoolDivision(args.viewCohort, args.viewRows, args.rowsByCohort, agg),
  );
}

export function buildIncomePropertyIndicatorStats(args: {
  viewRows: IncomePropertyRepRow[];
  viewCohort: string;
  lookup: EnrolledScaleLookupJson;
  rowsByCohort?: Record<"university" | "junior-college", IncomePropertyRepRow[]>;
}): IndicatorStatsBundle {
  const agg = (
    label: string,
    rows: IncomePropertyRepRow[],
  ): IndicatorStatsNumericRow => {
    const rates = sumIncomePropertyCohortRate(rows);
    let appraisedGross = 0;
    let collateralDeduction = 0;
    let appraisedNet = 0;
    let incomeTotal = 0;
    let tuitionRevenue = 0;
    for (const row of rows) {
      appraisedGross += row.appraisedGross;
      collateralDeduction += row.collateralDeduction;
      appraisedNet += row.appraisedNet;
      incomeTotal += row.incomeTotal;
      tuitionRevenue += row.tuitionRevenue;
    }
    return {
      label,
      schoolCount: rows.length,
      values: {
        appraisedGross,
        collateralDeduction,
        appraisedNet,
        incomeTotal,
        tuitionRevenue,
        secureRate: rates.secureRate,
        revenueRate: rates.revenueRate,
      },
    };
  };
  return bundleFrom(
    args.viewRows,
    args.lookup,
    agg,
    twoSchoolDivision(args.viewCohort, args.viewRows, args.rowsByCohort, agg),
  );
}
