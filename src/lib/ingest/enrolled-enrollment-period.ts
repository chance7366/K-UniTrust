export const ENROLLED_HALF_PERIODS = ["상반기", "하반기"] as const;

export type EnrolledHalfPeriod = (typeof ENROLLED_HALF_PERIODS)[number];

export function enrolledPeriodKey(year: string | number, half: string): string {
  return `${year}:${half}`;
}

export function parseEnrolledPeriodKey(
  key: string,
): { year: number; half: string } | null {
  const [yearStr, half] = key.split(":");
  const year = Number(yearStr);
  if (!Number.isFinite(year) || !half) return null;
  return { year, half };
}
