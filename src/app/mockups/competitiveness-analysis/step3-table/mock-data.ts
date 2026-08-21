import type { AnalyticsGrade } from "@/lib/competitiveness-analysis/diagnostic-grade";
import { gradeFromCompositeScore } from "@/lib/competitiveness-analysis/diagnostic-grade";

export type Step3TableMockRow = {
  schoolCodeStd: string;
  rank: number;
  name: string;
  province: string;
  zone: string;
  studentScore: number;
  univFinanceScore: number;
  foundationScore: number;
  totalScore: number;
  grade: AnalyticsGrade | null;
  gradeCapped: boolean;
  absoluteLabels: string[];
  excludedFromRanking: boolean;
  isJuniorCollege: boolean;
};

const UNIV_SEEDS: Omit<
  Step3TableMockRow,
  "rank" | "grade" | "gradeCapped" | "isJuniorCollege"
>[] = [
  {
    schoolCodeStd: "0000188",
    name: "포항공과대학교",
    province: "경북",
    zone: "대경권",
    studentScore: 96.2,
    univFinanceScore: 91.8,
    foundationScore: 88.4,
    totalScore: 94.4,
    absoluteLabels: [],
    excludedFromRanking: false,
  },
  {
    schoolCodeStd: "0000189",
    name: "한국기술교육대학교",
    province: "충남",
    zone: "충청권",
    studentScore: 93.5,
    univFinanceScore: 89.1,
    foundationScore: 86.2,
    totalScore: 92.4,
    absoluteLabels: [],
    excludedFromRanking: false,
  },
  {
    schoolCodeStd: "0000198",
    name: "한림대학교",
    province: "강원",
    zone: "강원제주",
    studentScore: 88.4,
    univFinanceScore: 92.6,
    foundationScore: 84.1,
    totalScore: 91.0,
    absoluteLabels: [],
    excludedFromRanking: false,
  },
  {
    schoolCodeStd: "0000149",
    name: "연세대학교",
    province: "서울",
    zone: "수도권",
    studentScore: 90.1,
    univFinanceScore: 86.4,
    foundationScore: 79.2,
    totalScore: 88.7,
    absoluteLabels: [],
    excludedFromRanking: false,
  },
  {
    schoolCodeStd: "0000100",
    name: "경북대학교",
    province: "대구",
    zone: "대경권",
    studentScore: 82.3,
    univFinanceScore: 78.5,
    foundationScore: 71.2,
    totalScore: 79.6,
    absoluteLabels: [],
    excludedFromRanking: false,
  },
  {
    schoolCodeStd: "0000046",
    name: "가톨릭대학교",
    province: "경기",
    zone: "수도권",
    studentScore: 74.2,
    univFinanceScore: 68.9,
    foundationScore: 62.1,
    totalScore: 71.3,
    absoluteLabels: [],
    excludedFromRanking: false,
  },
  {
    schoolCodeStd: "0000248",
    name: "제주국제대학교",
    province: "제주",
    zone: "강원제주",
    studentScore: 58.4,
    univFinanceScore: 52.1,
    foundationScore: 48.6,
    totalScore: 55.2,
    absoluteLabels: ["자금확보율"],
    excludedFromRanking: false,
  },
  {
    schoolCodeStd: "0000098",
    name: "서울기독대학교",
    province: "서울",
    zone: "수도권",
    studentScore: 48.2,
    univFinanceScore: 44.5,
    foundationScore: 41.0,
    totalScore: 46.8,
    absoluteLabels: ["신입생충원율", "재학생충원율"],
    excludedFromRanking: true,
  },
  {
    schoolCodeStd: "0000155",
    name: "영산선학대학교",
    province: "경남",
    zone: "동남권",
    studentScore: 38.6,
    univFinanceScore: 35.2,
    foundationScore: 32.4,
    totalScore: 37.1,
    absoluteLabels: ["중도탈락율"],
    excludedFromRanking: false,
  },
];

function buildUniversityRows(): Step3TableMockRow[] {
  return UNIV_SEEDS.map((seed, idx) => ({
    ...seed,
    rank: idx + 1,
    isJuniorCollege: false,
    grade: seed.excludedFromRanking
      ? null
      : gradeFromCompositeScore(seed.totalScore),
    gradeCapped: false,
  }));
}

function buildJuniorCollegeRows(): Step3TableMockRow[] {
  const zones = ["수도권", "충청권", "호남권", "대경권", "동남권", "강원제주"] as const;
  const provinces: Record<(typeof zones)[number], string> = {
    수도권: "경기",
    충청권: "충남",
    호남권: "전남",
    대경권: "경북",
    동남권: "부산",
    강원제주: "강원",
  };

  return Array.from({ length: 12 }, (_, i) => {
    const zone = zones[i % zones.length]!;
    const totalScore = Math.round((78 - i * 2.8) * 10) / 10;
    return {
      schoolCodeStd: `0004${500 + i}`,
      rank: i + 1,
      name: `전문대학 ${i + 1}`,
      province: provinces[zone],
      zone,
      studentScore: Math.round((totalScore + 4 - (i % 3)) * 10) / 10,
      univFinanceScore: Math.round((totalScore - 2 + (i % 2)) * 10) / 10,
      foundationScore: Math.round((totalScore - 5) * 10) / 10,
      totalScore,
      grade: gradeFromCompositeScore(totalScore),
      gradeCapped: false,
      absoluteLabels: i === 10 ? ["등록금의존율"] : [],
      excludedFromRanking: false,
      isJuniorCollege: true,
    };
  });
}

export const MOCK_STEP3_UNIVERSITY_ROWS = buildUniversityRows();
export const MOCK_STEP3_JUNIOR_ROWS = buildJuniorCollegeRows();

export const MOCK_STEP3_UNIVERSITY_COUNT = 150;
export const MOCK_STEP3_JUNIOR_COUNT = 122;
