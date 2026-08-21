import {
  REGIONAL_DECLINE_REGION_ORDER,
  toShortSidoName,
} from "@/lib/ingest/regional-decline-config";

export const SCHOOL_AGE_AGES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
] as const;

export type SchoolAgeAge = (typeof SCHOOL_AGE_AGES)[number];
export type SchoolAgeAgeKey = `age_${SchoolAgeAge}`;

export function schoolAgeKey(age: SchoolAgeAge): SchoolAgeAgeKey {
  return `age_${age}`;
}

export const SCHOOL_AGE_AGE_COLUMNS = SCHOOL_AGE_AGES.map((age) => ({
  age,
  key: schoolAgeKey(age),
  header: `${age}세`,
}));

/** 대입 자원 전망에 쓰는 연령 (18세 → 0세). 19·20세는 이미 대학 학령 */
export const SCHOOL_AGE_FUTURE_AGES = [
  18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
] as const satisfies readonly SchoolAgeAge[];

export const SCHOOL_AGE_BASELINE_AGE = 18 satisfies SchoolAgeAge;
export const SCHOOL_AGE_BASELINE_KEY = schoolAgeKey(SCHOOL_AGE_BASELINE_AGE);
export const SCHOOL_AGE_FAR_AGE = 0 satisfies SchoolAgeAge;

export const SCHOOL_AGE_AGE_GROUPS = [
  { label: "미취학", ages: [0, 1, 2, 3, 4, 5, 6] as const },
  { label: "초등학령", ages: [7, 8, 9, 10, 11, 12] as const },
  { label: "중등학령", ages: [13, 14, 15] as const },
  { label: "고등학령", ages: [16, 17, 18] as const },
  { label: "대학학령", ages: [19, 20] as const },
] as const;

export const SCHOOL_AGE_UPLOAD_HEADERS = [
  "기준연도",
  "행정기관코드",
  "행정기관",
  "입학자원가중치",
  ...SCHOOL_AGE_AGES.map((age) => `${age}세`),
] as const;

export const SCHOOL_AGE_POPULATION_CSV_COLUMNS = [
  "year",
  "region_code",
  "region",
  "region_full",
  "admission_weight",
  ...SCHOOL_AGE_AGES.map((age) => schoolAgeKey(age)),
  "uploaded_at",
] as const;

export type SchoolAgePopulationCsvRow = Record<
  (typeof SCHOOL_AGE_POPULATION_CSV_COLUMNS)[number],
  string
>;

export const SCHOOL_AGE_POPULATION_REGION_ORDER = REGIONAL_DECLINE_REGION_ORDER;

export function schoolAgeRegionSortKey(name: string): number {
  const idx = SCHOOL_AGE_POPULATION_REGION_ORDER.indexOf(
    name as (typeof SCHOOL_AGE_POPULATION_REGION_ORDER)[number],
  );
  return idx >= 0 ? idx : 999;
}

export function classifySchoolAgeSido(fullName: string): {
  short: string;
  full: string;
} | null {
  const name = fullName.replace(/\s+/g, " ").trim();
  if (!name) return null;
  if (name === "전국") return { short: "전국", full: "전국" };
  if (
    (SCHOOL_AGE_POPULATION_REGION_ORDER as readonly string[]).includes(name)
  ) {
    return { short: name, full: name };
  }
  const short = toShortSidoName(name);
  if (!short) return null;
  return { short, full: name };
}

/**
 * 18세(자료연도 Y) → Y+1학년도 대입.
 * 연령 A → 대입연도 Y + (19 − A)
 */
export function admissionYearFromAge(dataYear: number, age: number): number {
  return dataYear + (19 - age);
}

export type SchoolAgeAdmissionSlot = {
  age: SchoolAgeAge;
  year: number;
  ageLabel: string;
  axisLabel: string;
};

export function buildSchoolAgeAdmissionTimeline(
  dataYear: number,
): SchoolAgeAdmissionSlot[] {
  return SCHOOL_AGE_FUTURE_AGES.map((age) => {
    const year = admissionYearFromAge(dataYear, age);
    return {
      age,
      year,
      ageLabel: `${age}세`,
      axisLabel: `${year}년 (${age}세)`,
    };
  });
}

/** 양식 다운로드·화면 미리보기용 샘플 (2025년 전국·서울) */
export const SCHOOL_AGE_POPULATION_TEMPLATE_SAMPLES: (string | number)[][] = [
  [
    2025,
    "0000000000",
    "전국",
    "1.15",
    "252,212",
    "243,765",
    "235,297",
    "255,233",
    "267,994",
    "280,450",
    "310,444",
    "334,444",
    "365,325",
    "414,059",
    "445,457",
    "441,512",
    "442,131",
    "490,313",
    "476,544",
    "473,708",
    "447,924",
    "468,145",
    "494,672",
    "447,937",
    "434,325",
  ],
  [
    2025,
    "1100000000",
    "서울특별시",
    "1.42",
    "43,645",
    "39,703",
    "37,268",
    "39,955",
    "42,056",
    "43,053",
    "47,447",
    "50,486",
    "54,961",
    "62,088",
    "66,913",
    "66,610",
    "67,029",
    "74,629",
    "71,635",
    "72,718",
    "69,117",
    "73,390",
    "78,039",
    "77,791",
    "79,530",
  ],
];

export const SCHOOL_AGE_POPULATION_DISPLAY_YEAR_COUNT = 5;

export function pickDefaultDisplayYears(years: number[]): number[] {
  const sorted = [...years].sort((a, b) => a - b);
  if (sorted.length <= SCHOOL_AGE_POPULATION_DISPLAY_YEAR_COUNT) return sorted;
  return sorted.slice(-SCHOOL_AGE_POPULATION_DISPLAY_YEAR_COUNT);
}
