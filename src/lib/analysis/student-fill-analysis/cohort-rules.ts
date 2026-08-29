/** 학생충원분석 대상대학 포함 조건 (학부 신입생충원 행 기준) */

export const STUDENT_FILL_ALLOWED_ESTB = [
  "공립",
  "사립",
  "국립",
  "국립대법인",
] as const;

export const STUDENT_FILL_ALLOWED_SCHOOL_KIND = [
  "교육대학",
  "대학교",
  "산업대학",
  "전문대학",
] as const;

export const STUDENT_FILL_ALLOWED_STATUS = ["기존", "신설"] as const;

const ESTB = new Set<string>(STUDENT_FILL_ALLOWED_ESTB);
const KIND = new Set<string>(STUDENT_FILL_ALLOWED_SCHOOL_KIND);
const STATUS = new Set<string>(STUDENT_FILL_ALLOWED_STATUS);

export type StudentFillEligibility = {
  estb: string;
  schoolKind: string;
  status: string;
};

export function isStudentFillPrivateEstb(estb: string): boolean {
  return estb.trim() === "사립";
}

export function isStudentFillPublicEstb(estb: string): boolean {
  const value = estb.trim();
  return value === "국립" || value === "공립" || value === "국립대법인";
}

export type StudentFillEstbFilter = "public" | "private" | "all";

export function studentFillRowMatchesEstb(
  estb: string,
  filter: StudentFillEstbFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "private") return isStudentFillPrivateEstb(estb);
  return isStudentFillPublicEstb(estb);
}

export function isStudentFillEligibleCampus(row: StudentFillEligibility): boolean {
  return (
    ESTB.has(row.estb.trim()) &&
    KIND.has(row.schoolKind.trim()) &&
    STATUS.has(row.status.trim())
  );
}

export function studentFillDivisionFromKind(
  schoolKind: string,
): "대학" | "전문대학" | null {
  const kind = schoolKind.trim();
  if (kind === "전문대학") return "전문대학";
  if (kind === "교육대학" || kind === "대학교" || kind === "산업대학") return "대학";
  return null;
}

export function studentFillCohortRuleSummary(): string {
  return `설립 ${STUDENT_FILL_ALLOWED_ESTB.join("·")} · 학교종류 ${STUDENT_FILL_ALLOWED_SCHOOL_KIND.join("·")} · 상태 ${STUDENT_FILL_ALLOWED_STATUS.join("·")}`;
}
