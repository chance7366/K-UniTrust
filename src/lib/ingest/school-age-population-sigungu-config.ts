import {
  classifyRegionalDeclineAdmin,
  type RegionalDeclineGeoLevel,
} from "@/lib/ingest/regional-decline-config";
import {
  SCHOOL_AGE_AGES,
  schoolAgeKey,
} from "@/lib/ingest/school-age-population-config";

export const SCHOOL_AGE_SIGUNGU_UPLOAD_HEADERS = [
  "기준연도",
  "행정기관코드",
  "행정기관",
  ...SCHOOL_AGE_AGES.map((age) => `${age}세`),
] as const;

export const SCHOOL_AGE_SIGUNGU_CSV_COLUMNS = [
  "year",
  "region_code",
  "region",
  "region_full",
  "sido",
  "geo_level",
  ...SCHOOL_AGE_AGES.map((age) => schoolAgeKey(age)),
  "uploaded_at",
] as const;

export type SchoolAgeSigunguCsvRow = Record<
  (typeof SCHOOL_AGE_SIGUNGU_CSV_COLUMNS)[number],
  string
>;

export type SchoolAgeSigunguGeoLevel = RegionalDeclineGeoLevel;

export { classifyRegionalDeclineAdmin as classifySchoolAgeSigunguAdmin };

export const SCHOOL_AGE_SIGUNGU_TEMPLATE_SAMPLES: (string | number)[][] = [
  [
    2025,
    "1100000000",
    "서울특별시",
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
  [
    2025,
    "1111000000",
    "서울특별시 종로구",
    "427",
    "444",
    "416",
    "445",
    "472",
    "477",
    "526",
    "546",
    "634",
    "703",
    "814",
    "768",
    "816",
    "934",
    "854",
    "960",
    "862",
    "942",
    "1,081",
    "1,162",
    "1,216",
  ],
];
