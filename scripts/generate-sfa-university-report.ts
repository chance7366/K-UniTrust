/**
 * Usage: npx tsx scripts/generate-sfa-university-report.ts --year=2026 --code=0000032
 */
import {
  buildStudentFillActions,
  buildStudentFillDiagnosis,
  buildStudentFillReportHtml,
} from "../src/lib/analysis/student-fill-analysis/diagnosis.ts";
import { STUDENT_FILL_REPORT_GUIDELINES_VERSION } from "../src/lib/analysis/student-fill-analysis/generation-guidelines.ts";
import { loadStudentFillUniversityPeer } from "../src/lib/analysis/student-fill-analysis/load-university-peer.ts";
import { writeStudentFillUniversityReport } from "../src/lib/analysis/student-fill-analysis/store.ts";
import { padSchoolCode } from "../src/lib/ingest/school-code-campus-index.ts";

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((item) => item.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const year = Number(arg("year", "2026"));
  const code = padSchoolCode(arg("code", "0000032"));

  const ctx = await loadStudentFillUniversityPeer({
    analysisYear: year,
    schoolCodeStd: code,
  });
  if (!ctx) {
    throw new Error(`${year}년 ${code} 분석결과를 찾지 못했습니다.`);
  }

  const diagnosis = buildStudentFillDiagnosis(ctx.school, ctx.peer);
  const actions = buildStudentFillActions(ctx.school, ctx.peer);
  const generatedAt = new Date().toLocaleString("ko-KR");
  const report = {
    analysisYear: year,
    schoolCodeStd: code,
    schoolName: ctx.school.schoolName,
    generatedAt,
    guidelinesVersion: STUDENT_FILL_REPORT_GUIDELINES_VERSION,
    diagnosis,
    actions,
    html: buildStudentFillReportHtml({
      schoolName: ctx.school.schoolName,
      analysisYear: year,
      generatedAt,
      diagnosis,
      actions,
      school: ctx.school,
      lastRunAt: ctx.lastRunAt,
      peer: ctx.peer,
    }),
  };
  await writeStudentFillUniversityReport(report);
  console.log(
    JSON.stringify(
      {
        ok: true,
        schoolName: report.schoolName,
        year,
        code,
        version: report.guidelinesVersion,
        diagnosisCount: diagnosis.length,
        actionCount: actions.length,
      },
      null,
      2,
    ),
  );
}

void main();
