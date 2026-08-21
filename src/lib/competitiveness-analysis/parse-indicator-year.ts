export type ParsedIndicatorYear =
  | { year: number; half?: undefined }
  | { year: number; half: "상반기" | "하반기" | "avg" };

export type EnrolledHalfSelection = {
  year: number;
  half: "상반기" | "하반기";
};

/** 재학생충원율 — 복수 반기 선택 구분자 (예: "2025년 상반기 + 2024년 하반기") */
export const ENROLLED_YEAR_LABEL_SEP = " + ";

/** 1~2개 반기 라벨 파싱 (레거시 "상하반기평균" 포함) */
export function parseEnrolledIndicatorYearLabels(
  label: string,
): EnrolledHalfSelection[] {
  const trimmed = label.trim();
  if (!trimmed) return [];

  if (trimmed.includes(ENROLLED_YEAR_LABEL_SEP)) {
    const out: EnrolledHalfSelection[] = [];
    for (const part of trimmed.split(ENROLLED_YEAR_LABEL_SEP)) {
      const parsed = parseIndicatorYearLabel(part.trim());
      if (
        parsed &&
        (parsed.half === "상반기" || parsed.half === "하반기")
      ) {
        out.push({ year: parsed.year, half: parsed.half });
      }
    }
    return out.slice(0, 2);
  }

  const parsed = parseIndicatorYearLabel(trimmed);
  if (!parsed) return [];
  if (parsed.half === "avg") {
    return [
      { year: parsed.year, half: "상반기" },
      { year: parsed.year, half: "하반기" },
    ];
  }
  if (parsed.half === "상반기" || parsed.half === "하반기") {
    return [{ year: parsed.year, half: parsed.half }];
  }
  return [
    { year: parsed.year, half: "상반기" },
    { year: parsed.year - 1, half: "하반기" },
  ];
}

/** 설정·화면에 쓰는 재학생충원율 연도. 계산은 해당연도 상반기 + 전년도 하반기 */
export function toEnrolledDisplayYearLabel(label: string): string {
  const parsed = parseIndicatorYearLabel(label);
  if (parsed) return `${parsed.year}년`;
  const selections = parseEnrolledIndicatorYearLabels(label);
  const firstHalf = selections.find((s) => s.half === "상반기");
  if (firstHalf) return `${firstHalf.year}년`;
  if (selections[0]) return `${selections[0].year}년`;
  return label;
}

export function normalizeIndicatorYearsRecord(
  indicatorYears: Record<string, string>,
): Record<string, string> {
  const enrolled = indicatorYears["enrolled-enrollment-rate"];
  if (!enrolled) return indicatorYears;
  const next = toEnrolledDisplayYearLabel(enrolled);
  if (next === enrolled) return indicatorYears;
  return { ...indicatorYears, "enrolled-enrollment-rate": next };
}

export function shiftEnrolledIndicatorYearLabel(
  label: string,
  yearDelta: number,
): string {
  return shiftIndicatorYearLabel(toEnrolledDisplayYearLabel(label), yearDelta);
}

/** "2025년", "2025년 상반기", "2025년 상하반기평균" 등 파싱 */
export function parseIndicatorYearLabel(label: string): ParsedIndicatorYear | null {
  const trimmed = label.trim();
  const m = trimmed.match(
    /^(\d{4})년(?:\s*(상반기|하반기|상하반기평균))?$/,
  );
  if (!m) return null;
  const year = Number(m[1]);
  if (!Number.isFinite(year)) return null;
  const halfToken = m[2];
  if (!halfToken) return { year };
  if (halfToken === "상하반기평균") return { year, half: "avg" };
  if (halfToken === "상반기") return { year, half: "상반기" };
  if (halfToken === "하반기") return { year, half: "하반기" };
  return null;
}

/** 적용연도 라벨의 연도를 delta만큼 이동 (예: 2025년 + (-1) → 2024년) */
export function shiftIndicatorYearLabel(
  label: string,
  yearDelta: number,
): string {
  if (!yearDelta) return label;
  const parsed = parseIndicatorYearLabel(label);
  if (!parsed) return label;
  const newYear = parsed.year + yearDelta;
  if (newYear < 2000 || newYear > 2100) return label;
  if (parsed.half === "상반기") return `${newYear}년 상반기`;
  if (parsed.half === "하반기") return `${newYear}년 하반기`;
  if (parsed.half === "avg") return `${newYear}년 상하반기평균`;
  return `${newYear}년`;
}

export function shiftIndicatorYearsRecord(
  indicatorYears: Record<string, string>,
  yearDelta: number,
): Record<string, string> {
  if (!yearDelta) return indicatorYears;
  return Object.fromEntries(
    Object.entries(indicatorYears).map(([id, label]) => [
      id,
      id === "enrolled-enrollment-rate"
        ? shiftEnrolledIndicatorYearLabel(label, yearDelta)
        : shiftIndicatorYearLabel(label, yearDelta),
    ]),
  );
}
