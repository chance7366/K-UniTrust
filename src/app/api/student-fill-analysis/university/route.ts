import { NextResponse } from "next/server";

import { attachStudentFillAux } from "@/lib/analysis/student-fill-analysis/load-join";
import { padSchoolCode } from "@/lib/ingest/school-code-campus-index";
import {
  listStudentFillEditionYears,
  readStudentFillEdition,
  readStudentFillUniversityReport,
} from "@/lib/analysis/student-fill-analysis/store";
import type { StudentFillSchoolRow, StudentFillNationalYear } from "@/lib/analysis/student-fill-analysis/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function parseYear(value: unknown, years: number[]): number | null {
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  if (years.length && !years.includes(year)) return null;
  if (year < 2000 || year > 2100) return null;
  return year;
}

export type StudentFillTrendPoint = StudentFillSchoolRow & { year: number };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const years = await listStudentFillEditionYears();
    const year = parseYear(url.searchParams.get("year"), years) ?? years[0] ?? null;
    const codeParam = url.searchParams.get("code");
    if (year == null) {
      return NextResponse.json({
        years,
        analysisYear: null,
        schools: [],
        school: null,
        trend: [],
        report: null,
      });
    }

    const stored = await readStudentFillEdition(year);
    const schools = stored ? await attachStudentFillAux(stored.schools, year) : [];
    const code = codeParam ? padSchoolCode(codeParam) : "";
    const school = code ? (schools.find((row) => padSchoolCode(row.schoolCodeStd) === code) ?? null) : null;

    let trend: StudentFillTrendPoint[] = [];
    let nationalTrend: StudentFillNationalYear[] = [];
    let report = null;
    if (code && school) {
      report = await readStudentFillUniversityReport(year, code);
      const points: StudentFillTrendPoint[] = [];
      const natPoints: StudentFillNationalYear[] = [];
      for (const y of [...years].sort((a, b) => a - b)) {
        const edition = y === year ? stored : await readStudentFillEdition(y);
        if (!edition) continue;
        const attached = y === year ? schools : await attachStudentFillAux(edition.schools, y);
        const hit = attached.find((row) => padSchoolCode(row.schoolCodeStd) === code);
        if (hit) points.push({ ...hit, year: y });

        // Calculate national average for the same school division
        const divisionSchools = attached.filter((row) => row.schoolDivision === school.schoolDivision);
        const pct = (num: number, den: number) => (den > 0 ? Number(((num / den) * 100).toFixed(1)) : null);
        
        const recruitIn = divisionSchools.reduce((s, r) => s + r.recruitWithin, 0);
        const recruitAll = divisionSchools.reduce((s, r) => s + r.recruitTotal, 0);
        const admitIn = divisionSchools.reduce((s, r) => s + r.admitWithin, 0);
        const admitOut = divisionSchools.reduce((s, r) => s + r.admitOutside, 0);
        const admitAll = divisionSchools.reduce((s, r) => s + r.admitTotal, 0);
        
        const enrolledFill = divisionSchools.reduce((s, r) => s + (r.enrolledFill ?? 0), 0);
        const enrolledFillDenom = divisionSchools.reduce((s, r) => s + (r.enrolledFillDenom ?? 0), 0);
        
        const dropoutCount = divisionSchools.reduce((s, r) => s + (r.dropoutCount ?? 0), 0);
        const dropoutEnrolled = divisionSchools.reduce((s, r) => s + (r.dropoutEnrolled ?? 0), 0);
        
        const freshmanDropoutCount = divisionSchools.reduce((s, r) => s + (r.freshmanDropoutCount ?? 0), 0);
        const freshmanDropoutEnrolled = divisionSchools.reduce((s, r) => s + (r.freshmanDropoutEnrolled ?? 0), 0);
        
        const foreignDegree = divisionSchools.reduce((s, r) => s + (r.foreignDegree ?? 0), 0);
        const enrolledTotal = divisionSchools.reduce((s, r) => s + (r.enrolledTotal ?? 0), 0);
        
        const foreignDropCount = divisionSchools.reduce((s, r) => s + (r.foreignDropCount ?? 0), 0);
        const foreignDropEnrolled = divisionSchools.reduce((s, r) => s + (r.foreignDropEnrolled ?? 0), 0);

        const leaveCount = divisionSchools.reduce((s, r) => s + (r.leaveCount ?? 0), 0);
        const rosterTotal = divisionSchools.reduce((s, r) => s + (r.rosterTotal ?? 0), 0);

        natPoints.push({
          year: y,
          schools: divisionSchools.length,
          recruitIn,
          admitIn,
          rateIn: pct(admitIn, recruitIn),
          admitOut,
          outShare: pct(admitOut, admitAll),
          rateAll: pct(admitAll, recruitAll),
          enrolledFillRate: pct(enrolledFill, enrolledFillDenom),
          enrolledFillRateIn: null, // Skip for now if we don't have the raw number
          dropoutRate: pct(dropoutCount, dropoutEnrolled),
          freshmanDropoutRate: pct(freshmanDropoutCount, freshmanDropoutEnrolled),
          foreignShare: pct(foreignDegree, enrolledTotal),
          foreignDropRate: pct(foreignDropCount, foreignDropEnrolled),
          leaveShare: pct(leaveCount, rosterTotal),
        });
      }
      trend = points;
      nationalTrend = natPoints;
    }

    return NextResponse.json({
      years,
      analysisYear: year,
      lastRunAt: stored?.lastRunAt ?? null,
      universityCount: stored?.universityCount ?? 0,
      juniorCollegeCount: stored?.juniorCollegeCount ?? 0,
      schools: code ? undefined : schools,
      school,
      trend,
      nationalTrend,
      report,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "대학별분석을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
