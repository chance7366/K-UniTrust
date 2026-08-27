import { zoneForSido } from "@/lib/analysis/korea-analytics-zones";
import type { SchoolScaleLabel } from "@/lib/competitiveness-analysis/school-scale";

export type StudentFillSchoolKind = "대학" | "전문대학";

export type StudentFillSchoolRow = {
  schoolCodeStd: string;
  schoolName: string;
  schoolDivision: StudentFillSchoolKind;
  schoolKind: string;
  estb: string;
  status: string;
  region: string;
  zone: string | null;
  metro: "수도권" | "비수도권";
  enrolledTotal: number | null;
  scale: SchoolScaleLabel | null;
  campusCount: number;
  recruitWithin: number;
  recruitOutside: number;
  recruitTotal: number;
  admitWithin: number;
  admitOutside: number;
  admitTotal: number;
  rateIn: number | null;
  rateAll: number | null;
  outShare: number | null;
  recruitChange: number | null;
  studentQuota: number | null;
  enrolledFill: number | null;
  enrolledFillDenom: number | null;
  enrolledFillRate: number | null;
  enrolledFillRateIn: number | null;
  enrolledFillOutside: number | null;
  enrolledFillOutShare: number | null;
  enrolledOutside: number | null;
  enrolledOutShare: number | null;
  rosterTotal: number | null;
  leaveCount: number | null;
  leaveShare: number | null;
  deferCount: number | null;
  deferShare: number | null;
  dropoutCount: number | null;
  dropoutEnrolled: number | null;
  dropoutRate: number | null;
  freshmanDropoutCount: number | null;
  freshmanDropoutEnrolled: number | null;
  freshmanDropoutRate: number | null;
  foreignDegree: number | null;
  foreignJoint: number | null;
  foreignTraining: number | null;
  foreignTotal: number | null;
  foreignShare: number | null;
  langAbilityRate: number | null;
  foreignDropCount: number | null;
  foreignDropEnrolled: number | null;
  foreignDropRate: number | null;
  foreignDropAllCount: number | null;
  foreignDropAllEnrolled: number | null;
  foreignDropAllRate: number | null;
};

export type StudentFillNationalYear = {
  year: number;
  schools: number;
  recruitIn: number;
  admitIn: number;
  rateIn: number | null;
  admitOut: number;
  outShare: number | null;
  rateAll: number | null;
};

export type StudentFillEdition = {
  analysisYear: number;
  lastRunAt: string;
  source: "freshman-rep";
  schoolCount: number;
  universityCount: number;
  juniorCollegeCount: number;
  schools: StudentFillSchoolRow[];
  national: {
    university: StudentFillNationalYear[];
    juniorCollege: StudentFillNationalYear[];
  };
};

export type StudentFillSettingsPayload = {
  years: number[];
  displayYear: number | null;
  lastRunAt: string | null;
  schoolCount: number;
  universityCount: number;
  juniorCollegeCount: number;
  schools: StudentFillSchoolRow[];
  sourceLabel: string;
  sourceHref: string;
};

export function pct(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return null;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function metroFromRegion(region: string): "수도권" | "비수도권" {
  return zoneForSido(region) === "수도권" ? "수도권" : "비수도권";
}
