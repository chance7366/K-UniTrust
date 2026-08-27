import { loadStudentFillFreshmanSchools, loadStudentFillNationalTrend } from "./load-freshman";
import { attachStudentFillAux } from "./load-join";
import type { StudentFillEdition } from "./types";

export async function computeStudentFillEdition(
  analysisYear: number,
): Promise<StudentFillEdition> {
  const [baseSchools, national] = await Promise.all([
    loadStudentFillFreshmanSchools(analysisYear),
    loadStudentFillNationalTrend(),
  ]);
  if (!baseSchools.length) {
    throw new Error(
      `${analysisYear}년 학부 신입생충원 자료가 없습니다. 대학현황 › 대학알리미 › 신입생충원(대학전문)을 확인하세요.`,
    );
  }
  const schools = await attachStudentFillAux(baseSchools, analysisYear);
  return {
    analysisYear,
    lastRunAt: new Date().toLocaleString("ko-KR"),
    source: "freshman-rep",
    schoolCount: schools.length,
    universityCount: schools.filter((row) => row.schoolDivision === "대학").length,
    juniorCollegeCount: schools.filter((row) => row.schoolDivision === "전문대학").length,
    schools,
    national,
  };
}
