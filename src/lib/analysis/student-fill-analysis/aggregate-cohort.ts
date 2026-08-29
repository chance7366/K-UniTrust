import { pct, type StudentFillSchoolRow } from "./types";

export type StudentFillCohortSnapshot = {
  year: number;
  schoolCount: number;
  recruitWithin: number;
  admitWithin: number;
  recruitOutside: number;
  admitOutside: number;
  recruitTotal: number;
  admitTotal: number;
  rateIn: number | null;
  outShare: number | null;
  rateAll: number | null;
  freshmanDropoutRate: number | null;
  studentQuota: number;
  enrolledFill: number;
  enrolledFillDenom: number;
  enrolledFillRate: number | null;
  enrolledFillRateIn: number | null;
  enrolledOutShare: number | null;
  rosterTotal: number;
  leaveCount: number;
  deferCount: number;
  leaveShare: number | null;
  deferShare: number | null;
  dropoutRate: number | null;
  foreignTotal: number;
  foreignShare: number | null;
  langAbilityRate: number | null;
  foreignDropRate: number | null;
  foreignDropAllRate: number | null;
};

function sum(
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

function weighted(
  rows: StudentFillSchoolRow[],
  num: (row: StudentFillSchoolRow) => number | null | undefined,
  den: (row: StudentFillSchoolRow) => number | null | undefined,
): number | null {
  let n = 0;
  let d = 0;
  for (const row of rows) {
    const a = num(row);
    const b = den(row);
    if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b) || b <= 0) {
      continue;
    }
    n += a;
    d += b;
  }
  return pct(n, d);
}

export function aggregateStudentFillCohort(
  rows: StudentFillSchoolRow[],
  year: number,
): StudentFillCohortSnapshot {
  const recruitWithin = sum(rows, (r) => r.recruitWithin);
  const admitWithin = sum(rows, (r) => r.admitWithin);
  const recruitOutside = sum(rows, (r) => r.recruitOutside);
  const admitOutside = sum(rows, (r) => r.admitOutside);
  const recruitTotal = sum(rows, (r) => r.recruitTotal);
  const admitTotal = sum(rows, (r) => r.admitTotal);
  const rosterTotal = sum(rows, (r) => r.rosterTotal);
  const leaveCount = sum(rows, (r) => r.leaveCount);
  const deferCount = sum(rows, (r) => r.deferCount);
  const foreignTotal = sum(rows, (r) => r.foreignTotal);
  const enrolledFill = sum(rows, (r) => r.enrolledFill);
  const enrolledFillDenom = sum(rows, (r) => r.enrolledFillDenom);
  const studentQuota = sum(rows, (r) => r.studentQuota);

  return {
    year,
    schoolCount: rows.length,
    recruitWithin,
    admitWithin,
    recruitOutside,
    admitOutside,
    recruitTotal,
    admitTotal,
    rateIn: pct(admitWithin, recruitWithin),
    outShare: pct(admitOutside, admitTotal),
    rateAll: pct(admitTotal, recruitTotal),
    freshmanDropoutRate: weighted(
      rows,
      (r) => r.freshmanDropoutCount,
      (r) => r.freshmanDropoutEnrolled,
    ),
    studentQuota,
    enrolledFill,
    enrolledFillDenom,
    enrolledFillRate: pct(enrolledFill, enrolledFillDenom),
    enrolledFillRateIn: weighted(
      rows,
      (r) =>
        r.enrolledFillRateIn != null && r.enrolledFillDenom
          ? (r.enrolledFillRateIn / 100) * r.enrolledFillDenom
          : null,
      (r) => r.enrolledFillDenom,
    ),
    enrolledOutShare: weighted(
      rows,
      (r) => r.enrolledOutside,
      (r) => r.enrolledFill,
    ),
    rosterTotal,
    leaveCount,
    deferCount,
    leaveShare: pct(leaveCount, rosterTotal),
    deferShare: pct(deferCount, rosterTotal),
    dropoutRate: weighted(rows, (r) => r.dropoutCount, (r) => r.dropoutEnrolled),
    foreignTotal,
    foreignShare: pct(foreignTotal, rosterTotal),
    langAbilityRate: weighted(
      rows,
      (r) =>
        r.langAbilityRate != null && r.foreignDegree
          ? (r.langAbilityRate / 100) * r.foreignDegree
          : null,
      (r) => r.foreignDegree,
    ),
    foreignDropRate: weighted(
      rows,
      (r) => r.foreignDropCount,
      (r) => r.foreignDropEnrolled,
    ),
    foreignDropAllRate: weighted(
      rows,
      (r) => r.foreignDropAllCount,
      (r) => r.foreignDropAllEnrolled,
    ),
  };
}