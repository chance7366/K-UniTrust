import { NextResponse } from "next/server";

import { attachStudentFillAux } from "@/lib/analysis/student-fill-analysis/load-join";
import {
  buildPeerSnapshot,
  buildPeerTrendRow,
  sameKindPeers,
  type StudentFillPeerPayload,
} from "@/lib/analysis/student-fill-analysis/peer-aggregates";
import { padSchoolCode } from "@/lib/ingest/school-code-campus-index";
import {
  listStudentFillEditionYears,
  readStudentFillEdition,
  readStudentFillUniversityReport,
} from "@/lib/analysis/student-fill-analysis/store";

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

export type StudentFillTrendPoint = import("@/lib/analysis/student-fill-analysis/types").StudentFillSchoolRow & {
  year: number;
};

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
        peer: null,
        report: null,
      });
    }

    const stored = await readStudentFillEdition(year);
    const schools = stored ? await attachStudentFillAux(stored.schools, year) : [];
    const code = codeParam ? padSchoolCode(codeParam) : "";
    const school = code ? (schools.find((row) => padSchoolCode(row.schoolCodeStd) === code) ?? null) : null;

    let trend: StudentFillTrendPoint[] = [];
    let peer: StudentFillPeerPayload | null = null;
    let report = null;
    if (code && school) {
      report = await readStudentFillUniversityReport(year, code);
      const points: StudentFillTrendPoint[] = [];
      const trendRows = [];
      const trendYears = [...years]
        .filter((y) => y <= year)
        .sort((a, b) => b - a)
        .slice(0, 5)
        .sort((a, b) => a - b);

      for (const y of trendYears) {
        const edition = y === year ? stored : await readStudentFillEdition(y);
        if (!edition) continue;
        const attached = y === year ? schools : await attachStudentFillAux(edition.schools, y);
        const peers = sameKindPeers(attached, school);
        const hit = attached.find((row) => padSchoolCode(row.schoolCodeStd) === code) ?? null;
        if (hit) points.push({ ...hit, year: y });
        trendRows.push(buildPeerTrendRow(y, hit, peers, school));
      }
      trend = points;
      const currentPeers = sameKindPeers(schools, school);
      peer = {
        ...buildPeerSnapshot(currentPeers, school),
        trend: trendRows,
      };
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
      peer,
      report,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "대학별분석을 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
