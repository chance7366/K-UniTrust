import {
  COHORT_HIGH_RISK_TAIL_PCT,
  COHORT_RISK_TAIL_PCT,
} from "@/lib/analysis/cohort-relative-risk";
import { pct, type StudentFillSchoolRow } from "./types";

export type StudentFillPeerRates = {
  n: number;
  rateAll: number | null;
  rateIn: number | null;
  outShare: number | null;
  enrolledFillRate: number | null;
  enrolledFillRateIn: number | null;
  dropoutRate: number | null;
  freshmanDropoutRate: number | null;
  foreignShare: number | null;
  langAbilityRate: number | null;
  foreignDropRate: number | null;
  leaveShare: number | null;
  enrolledOutShare: number | null;
  deferShare: number | null;
};

export type StudentFillPeerSliceKey = "nationwide" | "zone" | "sido" | "scale";

export type StudentFillPeerSlice = StudentFillPeerRates & {
  key: StudentFillPeerSliceKey;
  label: string;
};

export type StudentFillPeerMetricKey = keyof Omit<StudentFillPeerRates, "n">;

export type StudentFillPeerPosition = {
  metric: StudentFillPeerMetricKey;
  schoolValue: number | null;
  rank: number | null;
  n: number;
  percentile: number | null;
  median: number | null;
  weighted: number | null;
  riskCut: number | null;
  highRiskCut: number | null;
  inRisk: boolean;
  inHighRisk: boolean;
  higherIsBetter: boolean;
  histogram: { from: number; to: number; count: number }[];
};

export type StudentFillPeerNeighbor = {
  schoolCodeStd: string;
  schoolName: string;
  region: string;
  scale: string | null;
  value: number;
};

export type StudentFillPeerTrendRow = {
  year: number;
  school: StudentFillPeerRates;
  nationwide: StudentFillPeerRates | null;
  zone: StudentFillPeerRates | null;
  sido: StudentFillPeerRates | null;
  scale: StudentFillPeerRates | null;
};

export type StudentFillPeerPayload = {
  slices: Record<StudentFillPeerSliceKey, StudentFillPeerSlice | null>;
  positions: Record<StudentFillPeerMetricKey, StudentFillPeerPosition>;
  neighbors: Record<StudentFillPeerMetricKey, StudentFillPeerNeighbor[]>;
  trend: StudentFillPeerTrendRow[];
};

const METRIC_KEYS: StudentFillPeerMetricKey[] = [
  "rateAll",
  "rateIn",
  "outShare",
  "enrolledFillRate",
  "enrolledFillRateIn",
  "dropoutRate",
  "freshmanDropoutRate",
  "foreignShare",
  "langAbilityRate",
  "foreignDropRate",
  "leaveShare",
  "enrolledOutShare",
  "deferShare",
];

export function metricHigherIsBetter(metric: StudentFillPeerMetricKey): boolean {
  return (
    metric === "rateAll" ||
    metric === "rateIn" ||
    metric === "enrolledFillRate" ||
    metric === "enrolledFillRateIn" ||
    metric === "langAbilityRate"
  );
}

export function sameKindPeers(
  rows: StudentFillSchoolRow[],
  school: StudentFillSchoolRow,
): StudentFillSchoolRow[] {
  return rows.filter((row) => row.schoolDivision === school.schoolDivision);
}

export function weightedPeerRates(rows: StudentFillSchoolRow[]): StudentFillPeerRates {
  let recruitIn = 0;
  let recruitAll = 0;
  let admitIn = 0;
  let admitOut = 0;
  let admitAll = 0;
  let enrolledFill = 0;
  let enrolledFillDenom = 0;
  let enrolledFillWithin = 0;
  let dropoutCount = 0;
  let dropoutEnrolled = 0;
  let freshmanDropoutCount = 0;
  let freshmanDropoutEnrolled = 0;
  let foreignDegree = 0;
  let enrolledTotal = 0;
  let foreignDropCount = 0;
  let foreignDropEnrolled = 0;
  let leaveCount = 0;
  let deferCount = 0;
  let rosterTotal = 0;
  let enrolledOutside = 0;
  let enrolledA = 0;
  let langNum = 0;
  let langDen = 0;

  for (const row of rows) {
    recruitIn += row.recruitWithin;
    recruitAll += row.recruitTotal;
    admitIn += row.admitWithin;
    admitOut += row.admitOutside;
    admitAll += row.admitTotal;
    if (row.enrolledFill != null) enrolledFill += row.enrolledFill;
    if (row.enrolledFillDenom != null && row.enrolledFillDenom > 0) {
      enrolledFillDenom += row.enrolledFillDenom;
      if (row.enrolledFillRateIn != null) {
        enrolledFillWithin += (row.enrolledFillRateIn / 100) * row.enrolledFillDenom;
      }
    }
    if (row.dropoutCount != null) dropoutCount += row.dropoutCount;
    if (row.dropoutEnrolled != null) dropoutEnrolled += row.dropoutEnrolled;
    if (row.freshmanDropoutCount != null) freshmanDropoutCount += row.freshmanDropoutCount;
    if (row.freshmanDropoutEnrolled != null) freshmanDropoutEnrolled += row.freshmanDropoutEnrolled;
    if (row.foreignDegree != null) foreignDegree += row.foreignDegree;
    if (row.enrolledTotal != null) enrolledTotal += row.enrolledTotal;
    if (row.foreignDropCount != null) foreignDropCount += row.foreignDropCount;
    if (row.foreignDropEnrolled != null) foreignDropEnrolled += row.foreignDropEnrolled;
    if (row.rosterTotal != null && row.rosterTotal > 0) {
      rosterTotal += row.rosterTotal;
      if (row.leaveCount != null) leaveCount += row.leaveCount;
      if (row.deferCount != null) deferCount += row.deferCount;
    }
    if (
      row.enrolledOutside != null &&
      row.enrolledOutShare != null &&
      row.enrolledOutShare > 0
    ) {
      enrolledOutside += row.enrolledOutside;
      enrolledA += row.enrolledOutside / (row.enrolledOutShare / 100);
    }
    if (row.foreignDegree != null && row.foreignDegree > 0 && row.langAbilityRate != null) {
      langNum += (row.langAbilityRate / 100) * row.foreignDegree;
      langDen += row.foreignDegree;
    }
  }

  return {
    n: rows.length,
    rateAll: pct(admitAll, recruitAll),
    rateIn: pct(admitIn, recruitIn),
    outShare: pct(admitOut, admitAll),
    enrolledFillRate: pct(enrolledFill, enrolledFillDenom),
    enrolledFillRateIn: pct(enrolledFillWithin, enrolledFillDenom),
    dropoutRate: pct(dropoutCount, dropoutEnrolled),
    freshmanDropoutRate: pct(freshmanDropoutCount, freshmanDropoutEnrolled),
    foreignShare: pct(foreignDegree, enrolledTotal),
    langAbilityRate: pct(langNum, langDen),
    foreignDropRate: pct(foreignDropCount, foreignDropEnrolled),
    leaveShare: pct(leaveCount, rosterTotal),
    enrolledOutShare: pct(enrolledOutside, enrolledA),
    deferShare: pct(deferCount, rosterTotal),
  };
}

function rowMetric(row: StudentFillSchoolRow, metric: StudentFillPeerMetricKey): number | null {
  const value = row[metric];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function percentileCut(sortedAsc: number[], tailPct: number): number | null {
  if (!sortedAsc.length) return null;
  const idx = Math.floor((sortedAsc.length - 1) * (tailPct / 100));
  return sortedAsc[Math.max(0, idx)]!;
}

function histogram(values: number[]): { from: number; to: number; count: number }[] {
  const bins: { from: number; to: number; count: number }[] = [];
  for (let i = 0; i < 10; i += 1) {
    const from = i * 10;
    const to = i === 9 ? 100 : (i + 1) * 10;
    bins.push({
      from,
      to,
      count: values.filter((v) => (i === 9 ? v >= from && v <= to : v >= from && v < to)).length,
    });
  }
  return bins;
}

function positionForMetric(
  peers: StudentFillSchoolRow[],
  school: StudentFillSchoolRow,
  metric: StudentFillPeerMetricKey,
  nationwide: StudentFillPeerRates,
): StudentFillPeerPosition {
  const higherIsBetter = metricHigherIsBetter(metric);
  const schoolValue = rowMetric(school, metric);
  const scored = peers
    .map((row) => ({ row, value: rowMetric(row, metric) }))
    .filter((item): item is { row: StudentFillSchoolRow; value: number } => item.value != null);
  const n = scored.length;
  const sortedAsc = [...scored.map((item) => item.value)].sort((a, b) => a - b);
  const median =
    n === 0
      ? null
      : n % 2 === 1
        ? sortedAsc[(n - 1) / 2]!
        : Number((((sortedAsc[n / 2 - 1]! + sortedAsc[n / 2]!) / 2) * 10) / 10);
  const perfSorted = [...scored].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value,
  );
  const idx = schoolValue == null ? -1 : perfSorted.findIndex((item) => item.row.schoolCodeStd === school.schoolCodeStd);
  const rank = idx >= 0 ? idx + 1 : null;
  const percentile = rank != null && n > 0 ? Number((((n - rank + 1) / n) * 100).toFixed(1)) : null;
  const riskCut = percentileCut(sortedAsc, higherIsBetter ? COHORT_RISK_TAIL_PCT : 100 - COHORT_RISK_TAIL_PCT);
  const highRiskCut = percentileCut(
    sortedAsc,
    higherIsBetter ? COHORT_HIGH_RISK_TAIL_PCT : 100 - COHORT_HIGH_RISK_TAIL_PCT,
  );
  let inRisk = false;
  let inHighRisk = false;
  if (schoolValue != null && n >= 8) {
    if (higherIsBetter) {
      inRisk = riskCut != null && schoolValue <= riskCut;
      inHighRisk = highRiskCut != null && schoolValue <= highRiskCut;
    } else {
      inRisk = riskCut != null && schoolValue >= riskCut;
      inHighRisk = highRiskCut != null && schoolValue >= highRiskCut;
    }
  }
  return {
    metric,
    schoolValue,
    rank,
    n,
    percentile,
    median: median != null ? Number(median.toFixed(1)) : null,
    weighted: nationwide[metric],
    riskCut: riskCut != null ? Number(riskCut.toFixed(1)) : null,
    highRiskCut: highRiskCut != null ? Number(highRiskCut.toFixed(1)) : null,
    inRisk,
    inHighRisk,
    higherIsBetter,
    histogram: histogram(sortedAsc),
  };
}

function neighborsForMetric(
  peers: StudentFillSchoolRow[],
  school: StudentFillSchoolRow,
  metric: StudentFillPeerMetricKey,
): StudentFillPeerNeighbor[] {
  const schoolValue = rowMetric(school, metric);
  if (schoolValue == null) return [];
  const tight = peers.filter(
    (row) =>
      row.schoolCodeStd !== school.schoolCodeStd &&
      row.region === school.region &&
      row.scale === school.scale,
  );
  const pool =
    tight.length >= 3
      ? tight
      : peers.filter((row) => row.schoolCodeStd !== school.schoolCodeStd && row.scale === school.scale);
  const scored = pool
    .map((row) => ({ row, value: rowMetric(row, metric) }))
    .filter((item): item is { row: StudentFillSchoolRow; value: number } => item.value != null)
    .sort((a, b) => Math.abs(a.value - schoolValue) - Math.abs(b.value - schoolValue))
    .slice(0, 5);
  return scored.map((item) => ({
    schoolCodeStd: item.row.schoolCodeStd,
    schoolName: item.row.schoolName,
    region: item.row.region,
    scale: item.row.scale,
    value: item.value,
  }));
}

function ratesFromSchool(row: StudentFillSchoolRow): StudentFillPeerRates {
  return {
    n: 1,
    rateAll: row.rateAll,
    rateIn: row.rateIn,
    outShare: row.outShare,
    enrolledFillRate: row.enrolledFillRate,
    enrolledFillRateIn: row.enrolledFillRateIn,
    dropoutRate: row.dropoutRate,
    freshmanDropoutRate: row.freshmanDropoutRate,
    foreignShare: row.foreignShare,
    langAbilityRate: row.langAbilityRate,
    foreignDropRate: row.foreignDropRate,
    leaveShare: row.leaveShare,
    enrolledOutShare: row.enrolledOutShare,
    deferShare: row.deferShare,
  };
}

export function buildPeerSnapshot(
  peers: StudentFillSchoolRow[],
  school: StudentFillSchoolRow,
): Omit<StudentFillPeerPayload, "trend"> {
  const nationwide = weightedPeerRates(peers);
  const zonePeers = school.zone ? peers.filter((row) => row.zone === school.zone) : [];
  const sidoPeers = peers.filter((row) => row.region === school.region);
  const scalePeers = school.scale ? peers.filter((row) => row.scale === school.scale) : [];

  const slices: Record<StudentFillPeerSliceKey, StudentFillPeerSlice | null> = {
    nationwide: { key: "nationwide", label: `동종 전국 (${school.schoolDivision})`, ...nationwide },
    zone:
      zonePeers.length > 0
        ? { key: "zone", label: school.zone ?? "권역", ...weightedPeerRates(zonePeers) }
        : null,
    sido:
      sidoPeers.length > 0
        ? { key: "sido", label: school.region, ...weightedPeerRates(sidoPeers) }
        : null,
    scale:
      scalePeers.length > 0
        ? { key: "scale", label: school.scale ?? "규모", ...weightedPeerRates(scalePeers) }
        : null,
  };

  const positions = {} as Record<StudentFillPeerMetricKey, StudentFillPeerPosition>;
  const neighborMap = {} as Record<StudentFillPeerMetricKey, StudentFillPeerNeighbor[]>;
  for (const metric of METRIC_KEYS) {
    positions[metric] = positionForMetric(peers, school, metric, nationwide);
    neighborMap[metric] = neighborsForMetric(peers, school, metric);
  }

  return { slices, positions, neighbors: neighborMap };
}

export function buildPeerTrendRow(
  year: number,
  schoolRow: StudentFillSchoolRow | null,
  peers: StudentFillSchoolRow[],
  focus: StudentFillSchoolRow,
): StudentFillPeerTrendRow {
  const zonePeers = focus.zone ? peers.filter((row) => row.zone === focus.zone) : [];
  const sidoPeers = peers.filter((row) => row.region === focus.region);
  const scalePeers = focus.scale ? peers.filter((row) => row.scale === focus.scale) : [];
  return {
    year,
    school: schoolRow
      ? ratesFromSchool(schoolRow)
      : { n: 0, rateAll: null, rateIn: null, outShare: null, enrolledFillRate: null, enrolledFillRateIn: null, dropoutRate: null, freshmanDropoutRate: null, foreignShare: null, langAbilityRate: null, foreignDropRate: null, leaveShare: null, enrolledOutShare: null, deferShare: null },
    nationwide: peers.length ? weightedPeerRates(peers) : null,
    zone: zonePeers.length ? weightedPeerRates(zonePeers) : null,
    sido: sidoPeers.length >= 2 ? weightedPeerRates(sidoPeers) : null,
    scale: scalePeers.length ? weightedPeerRates(scalePeers) : null,
  };
}
