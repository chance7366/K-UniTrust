import {
  COMPOSITE_GRADE_COLORS,
  COMPOSITE_GRADE_LABELS,
  COMPOSITE_GRADE_ORDER,
} from "@/lib/competitiveness-analysis/composite-competitiveness-analytics";
import type { AnalyticsGrade } from "@/lib/competitiveness-analysis/run-analytics";

export type SectorId = "student" | "univFinance" | "corpFinance";

export type ComparePoint = {
  region: string;
  avgRate: number;
  yoy: number;
  schoolCount?: number;
};

export type QuadrantPoint = {
  name: string;
  x: number;
  y: number;
  grade: AnalyticsGrade;
};

export type SectorMock = {
  id: SectorId;
  label: string;
  weightPct: number;
  scoreName: string;
  kpiSub: string;
  indicators: { label: string; weightPct: number }[];
  weighted: number;
  yoy: number;
  mean: number;
  median: number;
  iqr: number;
  q1: number;
  q3: number;
  riskD: number;
  riskE: number;
  schoolCount: number;
  zoneCompare: ComparePoint[];
  scaleCompare: ComparePoint[];
  sidoRank: ComparePoint[];
  density: { score: number; density: number }[];
  gradeBars: { grade: AnalyticsGrade; label: string; count: number; fill: string }[];
  histogram: { bin: string; count: number; fill: string }[];
  quadrant: QuadrantPoint[];
  quadrantX: string;
  quadrantY: string;
  zoneTrend: Record<string, string | number>[];
  scaleTrend: { year: string; 대규모: number; 중규모: number; 소규모: number }[];
};

const HIST_FILLS = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#4F46E5"];

function gradeBars(
  counts: Record<AnalyticsGrade, number>,
): SectorMock["gradeBars"] {
  return COMPOSITE_GRADE_ORDER.map((grade) => ({
    grade,
    label: COMPOSITE_GRADE_LABELS[grade],
    count: counts[grade],
    fill: COMPOSITE_GRADE_COLORS[grade],
  }));
}

function histogram(counts: [number, number, number, number, number]) {
  return (["0–20", "20–40", "40–60", "60–80", "80–100"] as const).map(
    (bin, i) => ({
      bin,
      count: counts[i],
      fill: HIST_FILLS[i]!,
    }),
  );
}

export const SECTOR_MOCKS: Record<SectorId, SectorMock> = {
  student: {
    id: "student",
    label: "학생충원",
    weightPct: 50,
    scoreName: "학생충원 지수",
    kpiSub: "신입생·재학생·중도탈락 가중",
    indicators: [
      { label: "신입생충원율", weightPct: 40 },
      { label: "재학생충원율", weightPct: 40 },
      { label: "중도탈락율", weightPct: 20 },
    ],
    weighted: 58.6,
    yoy: -1.4,
    mean: 56.1,
    median: 55.8,
    iqr: 19.2,
    q1: 46.2,
    q3: 65.4,
    riskD: 38,
    riskE: 22,
    schoolCount: 202,
    zoneCompare: [
      { region: "수도권", avgRate: 66.8, yoy: -0.3, schoolCount: 77 },
      { region: "충청권", avgRate: 60.4, yoy: -0.9, schoolCount: 36 },
      { region: "동남권", avgRate: 55.1, yoy: -1.6, schoolCount: 28 },
      { region: "대경권", avgRate: 54.2, yoy: -1.4, schoolCount: 23 },
      { region: "서남권", avgRate: 50.8, yoy: -2.2, schoolCount: 18 },
      { region: "강원권", avgRate: 47.6, yoy: -2.5, schoolCount: 8 },
      { region: "전북권", avgRate: 49.1, yoy: -2.8, schoolCount: 9 },
      { region: "제주권", avgRate: 45.4, yoy: -2.1, schoolCount: 3 },
    ],
    scaleCompare: [
      { region: "대규모", avgRate: 72.4, yoy: 0.2, schoolCount: 24 },
      { region: "중규모", avgRate: 61.8, yoy: -0.8, schoolCount: 51 },
      { region: "소규모", avgRate: 50.2, yoy: -2.4, schoolCount: 127 },
    ],
    sidoRank: [
      { region: "서울", avgRate: 69.2, yoy: -0.2 },
      { region: "인천", avgRate: 64.8, yoy: -0.5 },
      { region: "경기", avgRate: 63.6, yoy: -0.6 },
      { region: "세종", avgRate: 62.1, yoy: 0.4 },
      { region: "대전", avgRate: 61.4, yoy: -0.7 },
      { region: "충남", avgRate: 59.8, yoy: -1.1 },
      { region: "대구", avgRate: 57.2, yoy: -1.0 },
      { region: "부산", avgRate: 56.4, yoy: -1.5 },
      { region: "울산", avgRate: 55.8, yoy: 0.1 },
      { region: "충북", avgRate: 55.1, yoy: -1.4 },
      { region: "광주", avgRate: 52.6, yoy: -1.8 },
      { region: "경남", avgRate: 52.0, yoy: -2.0 },
      { region: "전북", avgRate: 49.1, yoy: -2.8 },
      { region: "경북", avgRate: 51.4, yoy: -1.7 },
      { region: "전남", avgRate: 48.4, yoy: -2.6 },
      { region: "강원", avgRate: 47.6, yoy: -2.5 },
      { region: "제주", avgRate: 45.4, yoy: -2.1 },
    ],
    density: [
      { score: 10, density: 3 },
      { score: 20, density: 8 },
      { score: 30, density: 16 },
      { score: 40, density: 27 },
      { score: 50, density: 38 },
      { score: 60, density: 32 },
      { score: 70, density: 22 },
      { score: 80, density: 12 },
      { score: 90, density: 5 },
    ],
    gradeBars: gradeBars({ S: 18, A: 31, B: 44, C: 49, D: 38, E: 22 }),
    histogram: histogram([14, 36, 68, 58, 26]),
    quadrantX: "신입생충원 지수",
    quadrantY: "재학생충원 지수",
    quadrant: [
      { name: "연세대학교", x: 92, y: 88, grade: "S" },
      { name: "포항공과대학교", x: 96, y: 91, grade: "S" },
      { name: "한국기술교육대학교", x: 94, y: 86, grade: "S" },
      { name: "경북대학교", x: 84, y: 80, grade: "A" },
      { name: "한림대학교", x: 86, y: 90, grade: "A" },
      { name: "가톨릭대학교", x: 76, y: 71, grade: "A" },
      { name: "한남대학교", x: 64, y: 60, grade: "B" },
      { name: "선문대학교", x: 74, y: 52, grade: "B" },
      { name: "대구가톨릭대학교", x: 58, y: 70, grade: "B" },
      { name: "우석대학교", x: 50, y: 61, grade: "C" },
      { name: "목원대학교", x: 44, y: 40, grade: "D" },
      { name: "신한대학교", x: 41, y: 43, grade: "D" },
      { name: "동명대학교", x: 40, y: 38, grade: "D" },
      { name: "상지대학교", x: 36, y: 34, grade: "D" },
      { name: "나사렛대학교", x: 42, y: 37, grade: "D" },
      { name: "위덕대학교", x: 33, y: 31, grade: "D" },
      { name: "세한대학교", x: 30, y: 28, grade: "D" },
      { name: "제주국제대학교", x: 32, y: 29, grade: "D" },
      { name: "초당대학교", x: 21, y: 18, grade: "E" },
      { name: "루터대학교", x: 26, y: 24, grade: "E" },
    ],
    zoneTrend: [
      { year: "2021", 수도권: 67.6, 충청권: 62.1, 동남권: 58.4, 대경권: 57.2, 서남권: 54.8, 강원권: 52.4, 전북권: 54.1, 제주권: 49.8 },
      { year: "2022", 수도권: 67.4, 충청권: 61.8, 동남권: 57.6, 대경권: 56.6, 서남권: 53.6, 강원권: 51.1, 전북권: 52.8, 제주권: 48.6 },
      { year: "2023", 수도권: 67.2, 충청권: 61.4, 동남권: 56.8, 대경권: 55.8, 서남권: 52.6, 강원권: 49.8, 전북권: 51.6, 제주권: 47.4 },
      { year: "2024", 수도권: 67.1, 충청권: 61.3, 동남권: 56.7, 대경권: 55.6, 서남권: 53.0, 강원권: 50.1, 전북권: 51.9, 제주권: 47.5 },
      { year: "2025", 수도권: 66.8, 충청권: 60.4, 동남권: 55.1, 대경권: 54.2, 서남권: 50.8, 강원권: 47.6, 전북권: 49.1, 제주권: 45.4 },
    ],
    scaleTrend: [
      { year: "2021", 대규모: 71.6, 중규모: 63.4, 소규모: 54.8 },
      { year: "2022", 대규모: 71.8, 중규모: 63.0, 소규모: 53.4 },
      { year: "2023", 대규모: 71.9, 중규모: 62.6, 소규모: 52.2 },
      { year: "2024", 대규모: 72.2, 중규모: 62.6, 소규모: 52.6 },
      { year: "2025", 대규모: 72.4, 중규모: 61.8, 소규모: 50.2 },
    ],
  },
  univFinance: {
    id: "univFinance",
    label: "대학재정",
    weightPct: 40,
    scoreName: "대학재정 지수",
    kpiSub: "자금확보·수혜·등록금의존 가중",
    indicators: [
      { label: "자금확보율", weightPct: 30 },
      { label: "재정지원수혜율", weightPct: 30 },
      { label: "등록금의존율", weightPct: 40 },
    ],
    weighted: 54.8,
    yoy: -0.8,
    mean: 53.2,
    median: 52.6,
    iqr: 17.4,
    q1: 43.9,
    q3: 61.3,
    riskD: 41,
    riskE: 24,
    schoolCount: 202,
    zoneCompare: [
      { region: "수도권", avgRate: 60.2, yoy: -0.2, schoolCount: 77 },
      { region: "충청권", avgRate: 56.8, yoy: -0.6, schoolCount: 36 },
      { region: "동남권", avgRate: 52.4, yoy: -1.1, schoolCount: 28 },
      { region: "대경권", avgRate: 53.6, yoy: -0.9, schoolCount: 23 },
      { region: "서남권", avgRate: 49.8, yoy: -1.5, schoolCount: 18 },
      { region: "강원권", avgRate: 51.2, yoy: -0.4, schoolCount: 8 },
      { region: "전북권", avgRate: 48.6, yoy: -1.8, schoolCount: 9 },
      { region: "제주권", avgRate: 47.1, yoy: -1.2, schoolCount: 3 },
    ],
    scaleCompare: [
      { region: "대규모", avgRate: 66.1, yoy: 0.5, schoolCount: 24 },
      { region: "중규모", avgRate: 56.4, yoy: -0.4, schoolCount: 51 },
      { region: "소규모", avgRate: 48.8, yoy: -1.6, schoolCount: 127 },
    ],
    sidoRank: [
      { region: "서울", avgRate: 62.4, yoy: -0.1 },
      { region: "세종", avgRate: 59.8, yoy: 0.6 },
      { region: "인천", avgRate: 58.2, yoy: -0.3 },
      { region: "대전", avgRate: 57.6, yoy: -0.4 },
      { region: "경기", avgRate: 57.1, yoy: -0.5 },
      { region: "충남", avgRate: 55.8, yoy: -0.8 },
      { region: "대구", avgRate: 55.2, yoy: -0.7 },
      { region: "강원", avgRate: 51.2, yoy: -0.4 },
      { region: "부산", avgRate: 53.4, yoy: -1.0 },
      { region: "울산", avgRate: 52.8, yoy: 0.3 },
      { region: "충북", avgRate: 52.1, yoy: -1.1 },
      { region: "경북", avgRate: 51.8, yoy: -1.2 },
      { region: "광주", avgRate: 51.0, yoy: -1.4 },
      { region: "경남", avgRate: 50.2, yoy: -1.5 },
      { region: "전북", avgRate: 48.6, yoy: -1.8 },
      { region: "전남", avgRate: 47.8, yoy: -1.7 },
      { region: "제주", avgRate: 47.1, yoy: -1.2 },
    ],
    density: [
      { score: 10, density: 5 },
      { score: 20, density: 11 },
      { score: 30, density: 19 },
      { score: 40, density: 30 },
      { score: 50, density: 36 },
      { score: 60, density: 28 },
      { score: 70, density: 18 },
      { score: 80, density: 9 },
      { score: 90, density: 3 },
    ],
    gradeBars: gradeBars({ S: 12, A: 26, B: 42, C: 57, D: 41, E: 24 }),
    histogram: histogram([18, 42, 72, 52, 18]),
    quadrantX: "자금확보 지수",
    quadrantY: "재정지원수혜 지수",
    quadrant: [
      { name: "포항공과대학교", x: 94, y: 90, grade: "S" },
      { name: "한국기술교육대학교", x: 91, y: 88, grade: "S" },
      { name: "연세대학교", x: 88, y: 84, grade: "S" },
      { name: "한림대학교", x: 90, y: 86, grade: "A" },
      { name: "경북대학교", x: 80, y: 76, grade: "A" },
      { name: "가톨릭대학교", x: 71, y: 68, grade: "A" },
      { name: "대구가톨릭대학교", x: 74, y: 58, grade: "B" },
      { name: "한남대학교", x: 60, y: 57, grade: "B" },
      { name: "선문대학교", x: 49, y: 70, grade: "B" },
      { name: "우석대학교", x: 64, y: 46, grade: "C" },
      { name: "목원대학교", x: 42, y: 39, grade: "D" },
      { name: "신한대학교", x: 40, y: 42, grade: "D" },
      { name: "동명대학교", x: 39, y: 37, grade: "D" },
      { name: "상지대학교", x: 36, y: 33, grade: "D" },
      { name: "나사렛대학교", x: 38, y: 41, grade: "D" },
      { name: "위덕대학교", x: 31, y: 30, grade: "D" },
      { name: "세한대학교", x: 29, y: 27, grade: "D" },
      { name: "제주국제대학교", x: 28, y: 32, grade: "D" },
      { name: "초당대학교", x: 18, y: 16, grade: "E" },
      { name: "루터대학교", x: 24, y: 22, grade: "E" },
    ],
    zoneTrend: [
      { year: "2021", 수도권: 60.8, 충청권: 57.6, 동남권: 54.2, 대경권: 55.1, 서남권: 52.4, 강원권: 51.8, 전북권: 51.6, 제주권: 49.2 },
      { year: "2022", 수도권: 60.6, 충청권: 57.4, 동남권: 53.8, 대경권: 54.8, 서남권: 51.8, 강원권: 51.6, 전북권: 50.8, 제주권: 48.6 },
      { year: "2023", 수도권: 60.4, 충청권: 57.2, 동남권: 53.4, 대경권: 54.4, 서남권: 51.2, 강원권: 51.4, 전북권: 50.2, 제주권: 48.2 },
      { year: "2024", 수도권: 60.4, 충청권: 57.4, 동남권: 53.5, 대경권: 54.5, 서남권: 51.3, 강원권: 51.6, 전북권: 50.4, 제주권: 48.3 },
      { year: "2025", 수도권: 60.2, 충청권: 56.8, 동남권: 52.4, 대경권: 53.6, 서남권: 49.8, 강원권: 51.2, 전북권: 48.6, 제주권: 47.1 },
    ],
    scaleTrend: [
      { year: "2021", 대규모: 64.8, 중규모: 57.6, 소규모: 51.4 },
      { year: "2022", 대규모: 65.2, 중규모: 57.2, 소규모: 50.6 },
      { year: "2023", 대규모: 65.4, 중규모: 56.8, 소규모: 50.0 },
      { year: "2024", 대규모: 65.6, 중규모: 56.8, 소규모: 50.4 },
      { year: "2025", 대규모: 66.1, 중규모: 56.4, 소규모: 48.8 },
    ],
  },
  corpFinance: {
    id: "corpFinance",
    label: "법인재정",
    weightPct: 10,
    scoreName: "법인재정 지수",
    kpiSub: "수익용재산·전입금 가중",
    indicators: [
      { label: "수익용기본재산확보율", weightPct: 70 },
      { label: "전입금비율", weightPct: 30 },
    ],
    weighted: 49.4,
    yoy: 0.6,
    mean: 47.8,
    median: 46.2,
    iqr: 22.8,
    q1: 34.8,
    q3: 57.6,
    riskD: 46,
    riskE: 31,
    schoolCount: 202,
    zoneCompare: [
      { region: "수도권", avgRate: 56.4, yoy: 0.8, schoolCount: 77 },
      { region: "충청권", avgRate: 54.2, yoy: 1.2, schoolCount: 36 },
      { region: "동남권", avgRate: 46.8, yoy: 0.2, schoolCount: 28 },
      { region: "대경권", avgRate: 45.1, yoy: -0.4, schoolCount: 23 },
      { region: "서남권", avgRate: 42.6, yoy: 0.1, schoolCount: 18 },
      { region: "강원권", avgRate: 48.8, yoy: 1.6, schoolCount: 8 },
      { region: "전북권", avgRate: 41.2, yoy: -0.8, schoolCount: 9 },
      { region: "제주권", avgRate: 39.6, yoy: -0.3, schoolCount: 3 },
    ],
    scaleCompare: [
      { region: "대규모", avgRate: 61.8, yoy: 1.4, schoolCount: 24 },
      { region: "중규모", avgRate: 52.4, yoy: 0.6, schoolCount: 51 },
      { region: "소규모", avgRate: 44.1, yoy: 0.2, schoolCount: 127 },
    ],
    sidoRank: [
      { region: "서울", avgRate: 58.6, yoy: 0.9 },
      { region: "세종", avgRate: 57.2, yoy: 1.8 },
      { region: "대전", avgRate: 55.4, yoy: 1.1 },
      { region: "인천", avgRate: 54.8, yoy: 0.6 },
      { region: "충남", avgRate: 53.6, yoy: 1.0 },
      { region: "경기", avgRate: 53.1, yoy: 0.5 },
      { region: "강원", avgRate: 48.8, yoy: 1.6 },
      { region: "충북", avgRate: 51.2, yoy: 0.8 },
      { region: "대구", avgRate: 47.4, yoy: -0.2 },
      { region: "부산", avgRate: 47.1, yoy: 0.1 },
      { region: "울산", avgRate: 46.2, yoy: 0.4 },
      { region: "광주", avgRate: 44.8, yoy: 0.2 },
      { region: "경북", avgRate: 43.6, yoy: -0.6 },
      { region: "경남", avgRate: 45.4, yoy: 0.0 },
      { region: "전남", avgRate: 40.8, yoy: -0.2 },
      { region: "전북", avgRate: 41.2, yoy: -0.8 },
      { region: "제주", avgRate: 39.6, yoy: -0.3 },
    ],
    density: [
      { score: 10, density: 8 },
      { score: 20, density: 16 },
      { score: 30, density: 24 },
      { score: 40, density: 32 },
      { score: 50, density: 30 },
      { score: 60, density: 22 },
      { score: 70, density: 14 },
      { score: 80, density: 7 },
      { score: 90, density: 3 },
    ],
    gradeBars: gradeBars({ S: 9, A: 21, B: 36, C: 59, D: 46, E: 31 }),
    histogram: histogram([24, 48, 66, 46, 18]),
    quadrantX: "수익용기본재산 지수",
    quadrantY: "전입금 지수",
    quadrant: [
      { name: "한림대학교", x: 93, y: 88, grade: "S" },
      { name: "연세대학교", x: 86, y: 90, grade: "S" },
      { name: "포항공과대학교", x: 90, y: 72, grade: "A" },
      { name: "한국기술교육대학교", x: 78, y: 84, grade: "A" },
      { name: "경북대학교", x: 70, y: 64, grade: "B" },
      { name: "가톨릭대학교", x: 68, y: 74, grade: "A" },
      { name: "대구가톨릭대학교", x: 76, y: 48, grade: "B" },
      { name: "한남대학교", x: 54, y: 58, grade: "C" },
      { name: "선문대학교", x: 46, y: 66, grade: "C" },
      { name: "우석대학교", x: 61, y: 42, grade: "C" },
      { name: "목원대학교", x: 38, y: 44, grade: "D" },
      { name: "신한대학교", x: 41, y: 36, grade: "D" },
      { name: "동명대학교", x: 34, y: 40, grade: "D" },
      { name: "상지대학교", x: 32, y: 30, grade: "D" },
      { name: "나사렛대학교", x: 44, y: 28, grade: "D" },
      { name: "위덕대학교", x: 28, y: 33, grade: "D" },
      { name: "세한대학교", x: 26, y: 24, grade: "E" },
      { name: "제주국제대학교", x: 30, y: 22, grade: "E" },
      { name: "초당대학교", x: 16, y: 19, grade: "E" },
      { name: "루터대학교", x: 21, y: 18, grade: "E" },
    ],
    zoneTrend: [
      { year: "2021", 수도권: 54.2, 충청권: 51.6, 동남권: 46.1, 대경권: 45.8, 서남권: 42.2, 강원권: 45.4, 전북권: 42.8, 제주권: 40.1 },
      { year: "2022", 수도권: 54.8, 충청권: 52.2, 동남권: 46.4, 대경권: 45.6, 서남권: 42.4, 강원권: 46.2, 전북권: 42.4, 제주권: 39.8 },
      { year: "2023", 수도권: 55.2, 충청권: 52.8, 동남권: 46.6, 대경권: 45.4, 서남권: 42.5, 강원권: 47.0, 전북권: 42.0, 제주권: 39.6 },
      { year: "2024", 수도권: 55.6, 충청권: 53.0, 동남권: 46.6, 대경권: 45.5, 서남권: 42.5, 강원권: 47.2, 전북권: 42.0, 제주권: 39.9 },
      { year: "2025", 수도권: 56.4, 충청권: 54.2, 동남권: 46.8, 대경권: 45.1, 서남권: 42.6, 강원권: 48.8, 전북권: 41.2, 제주권: 39.6 },
    ],
    scaleTrend: [
      { year: "2021", 대규모: 58.4, 중규모: 51.2, 소규모: 43.6 },
      { year: "2022", 대규모: 59.2, 중규모: 51.6, 소규모: 43.8 },
      { year: "2023", 대규모: 60.1, 중규모: 51.8, 소규모: 43.9 },
      { year: "2024", 대규모: 60.4, 중규모: 51.8, 소규모: 43.9 },
      { year: "2025", 대규모: 61.8, 중규모: 52.4, 소규모: 44.1 },
    ],
  },
};

export const SECTOR_ORDER: SectorId[] = ["student", "univFinance", "corpFinance"];
