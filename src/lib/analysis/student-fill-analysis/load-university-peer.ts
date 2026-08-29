import { attachStudentFillAux } from "@/lib/analysis/student-fill-analysis/load-join";
import {
  buildPeerSnapshot,
  buildPeerTrendRow,
  sameKindPeers,
  type StudentFillPeerPayload,
} from "@/lib/analysis/student-fill-analysis/peer-aggregates";
import {
  listStudentFillEditionYears,
  readStudentFillEdition,
} from "@/lib/analysis/student-fill-analysis/store";
import type { StudentFillSchoolRow } from "@/lib/analysis/student-fill-analysis/types";
import { padSchoolCode } from "@/lib/ingest/school-code-campus-index";

export async function loadStudentFillUniversityPeer(args: {
  analysisYear: number;
  schoolCodeStd: string;
}): Promise<{
  school: StudentFillSchoolRow;
  peer: StudentFillPeerPayload;
  lastRunAt: string | null;
} | null> {
  const code = padSchoolCode(args.schoolCodeStd);
  const years = await listStudentFillEditionYears();
  const stored = await readStudentFillEdition(args.analysisYear);
  if (!stored) return null;
  const schools = await attachStudentFillAux(stored.schools, args.analysisYear);
  const school = schools.find((row) => padSchoolCode(row.schoolCodeStd) === code);
  if (!school) return null;

  const trendYears = [...years]
    .filter((year) => year <= args.analysisYear)
    .sort((a, b) => b - a)
    .slice(0, 5)
    .sort((a, b) => a - b);

  const trend = [];
  for (const year of trendYears) {
    const edition = year === args.analysisYear ? stored : await readStudentFillEdition(year);
    if (!edition) continue;
    const attached =
      year === args.analysisYear
        ? schools
        : await attachStudentFillAux(edition.schools, year);
    const peers = sameKindPeers(attached, school);
    const hit =
      attached.find((row) => padSchoolCode(row.schoolCodeStd) === code) ?? null;
    trend.push(buildPeerTrendRow(year, hit, peers, school));
  }

  const currentPeers = sameKindPeers(schools, school);
  return {
    school,
    lastRunAt: stored.lastRunAt ?? null,
    peer: {
      ...buildPeerSnapshot(currentPeers, school),
      trend,
    },
  };
}
