import type { AnalyticsGrade } from "@/lib/competitiveness-analysis/diagnostic-grade";
import type { SchoolScaleLabel } from "@/lib/competitiveness-analysis/school-scale";

export type MockCohort = "university" | "junior-college";

export type MockSidoRow = {
  region: string;
  schoolCount: number;
  avgScore: number;
  yoy: number;
  median: number;
  meanScore: number;
  riskCount: number;
};

export type MockRiskSchool = {
  name: string;
  enrolled: number;
  scale: SchoolScaleLabel;
  region: string;
  zone: string;
  studentIndex: number;
  univFinanceIndex: number;
  foundationIndex: number;
  totalScore: number;
  grade: Extract<AnalyticsGrade, "D" | "E">;
};

export const MOCK_SIDO_UNIVERSITY: MockSidoRow[] = [
  { region: "서울", schoolCount: 38, avgScore: 64.8, yoy: -0.4, median: 63.2, meanScore: 62.1, riskCount: 2 },
  { region: "세종", schoolCount: 2, avgScore: 61.4, yoy: 0.3, median: 61.4, meanScore: 61.4, riskCount: 0 },
  { region: "인천", schoolCount: 7, avgScore: 60.1, yoy: -0.6, median: 59.8, meanScore: 58.7, riskCount: 1 },
  { region: "경기", schoolCount: 32, avgScore: 59.6, yoy: -0.8, median: 58.4, meanScore: 57.2, riskCount: 3 },
  { region: "대전", schoolCount: 11, avgScore: 58.9, yoy: -0.5, median: 57.6, meanScore: 56.8, riskCount: 1 },
  { region: "충남", schoolCount: 14, avgScore: 57.2, yoy: -1.1, median: 56.4, meanScore: 55.1, riskCount: 2 },
  { region: "대구", schoolCount: 10, avgScore: 56.8, yoy: -0.9, median: 56.1, meanScore: 54.9, riskCount: 1 },
  { region: "부산", schoolCount: 14, avgScore: 55.4, yoy: -1.4, median: 54.8, meanScore: 53.6, riskCount: 2 },
  { region: "울산", schoolCount: 2, avgScore: 55.1, yoy: 0.2, median: 55.1, meanScore: 55.1, riskCount: 0 },
  { region: "충북", schoolCount: 9, avgScore: 54.6, yoy: -1.3, median: 53.9, meanScore: 52.8, riskCount: 2 },
  { region: "광주", schoolCount: 10, avgScore: 53.8, yoy: -1.6, median: 53.2, meanScore: 51.9, riskCount: 2 },
  { region: "경남", schoolCount: 12, avgScore: 52.4, yoy: -1.8, median: 51.7, meanScore: 50.6, riskCount: 2 },
  { region: "전북", schoolCount: 9, avgScore: 51.2, yoy: -2.1, median: 50.4, meanScore: 49.1, riskCount: 2 },
  { region: "경북", schoolCount: 13, avgScore: 50.6, yoy: -1.5, median: 49.8, meanScore: 48.4, riskCount: 3 },
  { region: "전남", schoolCount: 8, avgScore: 48.9, yoy: -2.4, median: 47.6, meanScore: 46.2, riskCount: 3 },
  { region: "강원", schoolCount: 8, avgScore: 47.4, yoy: -2.6, median: 46.1, meanScore: 45.0, riskCount: 3 },
  { region: "제주", schoolCount: 3, avgScore: 46.8, yoy: -1.9, median: 46.2, meanScore: 45.4, riskCount: 1 },
];

export const MOCK_SIDO_JUNIOR: MockSidoRow[] = [
  { region: "서울", schoolCount: 9, avgScore: 61.2, yoy: -0.3, median: 60.4, meanScore: 59.1, riskCount: 1 },
  { region: "세종", schoolCount: 1, avgScore: 58.6, yoy: 0.4, median: 58.6, meanScore: 58.6, riskCount: 0 },
  { region: "인천", schoolCount: 6, avgScore: 57.8, yoy: -0.7, median: 57.1, meanScore: 56.0, riskCount: 1 },
  { region: "경기", schoolCount: 28, avgScore: 56.4, yoy: -0.9, median: 55.8, meanScore: 54.6, riskCount: 2 },
  { region: "대전", schoolCount: 5, avgScore: 55.9, yoy: -0.4, median: 55.2, meanScore: 54.4, riskCount: 1 },
  { region: "충남", schoolCount: 8, avgScore: 54.1, yoy: -1.2, median: 53.6, meanScore: 52.4, riskCount: 1 },
  { region: "대구", schoolCount: 7, avgScore: 53.8, yoy: -0.8, median: 53.1, meanScore: 52.0, riskCount: 0 },
  { region: "부산", schoolCount: 9, avgScore: 52.6, yoy: -1.5, median: 52.0, meanScore: 50.8, riskCount: 1 },
  { region: "울산", schoolCount: 2, avgScore: 52.2, yoy: 0.1, median: 52.2, meanScore: 52.2, riskCount: 0 },
  { region: "충북", schoolCount: 6, avgScore: 51.4, yoy: -1.4, median: 50.8, meanScore: 49.7, riskCount: 1 },
  { region: "광주", schoolCount: 6, avgScore: 50.8, yoy: -1.7, median: 50.1, meanScore: 48.9, riskCount: 1 },
  { region: "경남", schoolCount: 10, avgScore: 49.6, yoy: -1.9, median: 48.8, meanScore: 47.5, riskCount: 1 },
  { region: "전북", schoolCount: 7, avgScore: 48.2, yoy: -2.2, median: 47.4, meanScore: 46.1, riskCount: 1 },
  { region: "경북", schoolCount: 9, avgScore: 47.8, yoy: -1.6, median: 47.1, meanScore: 45.8, riskCount: 2 },
  { region: "전남", schoolCount: 8, avgScore: 46.1, yoy: -2.5, median: 45.2, meanScore: 43.9, riskCount: 2 },
  { region: "강원", schoolCount: 5, avgScore: 44.8, yoy: -2.8, median: 43.9, meanScore: 42.6, riskCount: 2 },
  { region: "제주", schoolCount: 2, avgScore: 44.2, yoy: -2.0, median: 44.2, meanScore: 44.2, riskCount: 0 },
];

export const MOCK_RISK_UNIVERSITY: MockRiskSchool[] = [
  { name: "초당대학교", enrolled: 1840, scale: "소규모", region: "전남", zone: "호남권", studentIndex: 22.4, univFinanceIndex: 18.6, foundationIndex: 16.2, totalScore: 20.8, grade: "E" },
  { name: "경주대학교", enrolled: 2110, scale: "소규모", region: "경북", zone: "대경권", studentIndex: 24.1, univFinanceIndex: 21.8, foundationIndex: 19.4, totalScore: 22.6, grade: "E" },
  { name: "영산선학대학교", enrolled: 420, scale: "소규모", region: "경남", zone: "동남권", studentIndex: 26.8, univFinanceIndex: 23.1, foundationIndex: 21.0, totalScore: 24.9, grade: "E" },
  { name: "금강대학교", enrolled: 980, scale: "소규모", region: "충남", zone: "충청권", studentIndex: 27.4, univFinanceIndex: 24.6, foundationIndex: 22.8, totalScore: 25.7, grade: "E" },
  { name: "루터대학교", enrolled: 760, scale: "소규모", region: "경기", zone: "수도권", studentIndex: 28.2, univFinanceIndex: 25.4, foundationIndex: 23.1, totalScore: 26.4, grade: "E" },
  { name: "한일장신대학교", enrolled: 1120, scale: "소규모", region: "전북", zone: "호남권", studentIndex: 28.9, univFinanceIndex: 26.1, foundationIndex: 24.0, totalScore: 27.1, grade: "E" },
  { name: "호남신학대학교", enrolled: 890, scale: "소규모", region: "광주", zone: "호남권", studentIndex: 29.4, univFinanceIndex: 26.8, foundationIndex: 25.2, totalScore: 27.8, grade: "E" },
  { name: "부산장신대학교", enrolled: 640, scale: "소규모", region: "부산", zone: "동남권", studentIndex: 29.8, univFinanceIndex: 27.2, foundationIndex: 25.6, totalScore: 28.3, grade: "E" },
  { name: "대구예술대학교", enrolled: 1580, scale: "소규모", region: "대구", zone: "대경권", studentIndex: 30.6, univFinanceIndex: 27.9, foundationIndex: 26.1, totalScore: 29.1, grade: "E" },
  { name: "세한대학교", enrolled: 3240, scale: "소규모", region: "전남", zone: "호남권", studentIndex: 32.4, univFinanceIndex: 29.8, foundationIndex: 28.1, totalScore: 30.8, grade: "D" },
  { name: "제주국제대학교", enrolled: 1960, scale: "소규모", region: "제주", zone: "강원제주", studentIndex: 33.1, univFinanceIndex: 30.4, foundationIndex: 28.6, totalScore: 31.4, grade: "D" },
  { name: "위덕대학교", enrolled: 2480, scale: "소규모", region: "경북", zone: "대경권", studentIndex: 34.2, univFinanceIndex: 31.6, foundationIndex: 29.4, totalScore: 32.5, grade: "D" },
  { name: "중원대학교", enrolled: 2710, scale: "소규모", region: "충북", zone: "충청권", studentIndex: 35.0, univFinanceIndex: 32.1, foundationIndex: 30.2, totalScore: 33.1, grade: "D" },
  { name: "가톨릭관동대학교", enrolled: 6120, scale: "중규모", region: "강원", zone: "강원제주", studentIndex: 36.4, univFinanceIndex: 33.8, foundationIndex: 31.0, totalScore: 34.6, grade: "D" },
  { name: "칼빈대학교", enrolled: 1340, scale: "소규모", region: "경기", zone: "수도권", studentIndex: 36.8, univFinanceIndex: 34.2, foundationIndex: 32.4, totalScore: 35.1, grade: "D" },
  { name: "상지대학교", enrolled: 5480, scale: "중규모", region: "강원", zone: "강원제주", studentIndex: 37.2, univFinanceIndex: 34.9, foundationIndex: 32.8, totalScore: 35.7, grade: "D" },
  { name: "예수대학교", enrolled: 1620, scale: "소규모", region: "전북", zone: "호남권", studentIndex: 37.9, univFinanceIndex: 35.4, foundationIndex: 33.1, totalScore: 36.2, grade: "D" },
  { name: "영산대학교", enrolled: 4860, scale: "소규모", region: "경남", zone: "동남권", studentIndex: 38.4, univFinanceIndex: 36.1, foundationIndex: 33.8, totalScore: 36.8, grade: "D" },
  { name: "유원대학교", enrolled: 2190, scale: "소규모", region: "충북", zone: "충청권", studentIndex: 38.8, univFinanceIndex: 36.6, foundationIndex: 34.2, totalScore: 37.2, grade: "D" },
  { name: "서울기독대학교", enrolled: 710, scale: "소규모", region: "서울", zone: "수도권", studentIndex: 39.2, univFinanceIndex: 37.0, foundationIndex: 34.8, totalScore: 37.6, grade: "D" },
  { name: "동신대학교", enrolled: 5340, scale: "중규모", region: "전남", zone: "호남권", studentIndex: 39.8, univFinanceIndex: 37.4, foundationIndex: 35.1, totalScore: 38.1, grade: "D" },
  { name: "김천대학교", enrolled: 2680, scale: "소규모", region: "경북", zone: "대경권", studentIndex: 40.2, univFinanceIndex: 37.9, foundationIndex: 35.6, totalScore: 38.5, grade: "D" },
  { name: "한라대학교", enrolled: 3920, scale: "소규모", region: "강원", zone: "강원제주", studentIndex: 40.6, univFinanceIndex: 38.2, foundationIndex: 36.0, totalScore: 38.9, grade: "D" },
  { name: "광주여자대학교", enrolled: 4180, scale: "소규모", region: "광주", zone: "호남권", studentIndex: 41.1, univFinanceIndex: 38.8, foundationIndex: 36.4, totalScore: 39.4, grade: "D" },
  { name: "나사렛대학교", enrolled: 4460, scale: "소규모", region: "충남", zone: "충청권", studentIndex: 41.6, univFinanceIndex: 39.2, foundationIndex: 36.9, totalScore: 39.8, grade: "D" },
  { name: "동명대학교", enrolled: 6720, scale: "중규모", region: "부산", zone: "동남권", studentIndex: 42.0, univFinanceIndex: 39.6, foundationIndex: 37.2, totalScore: 40.2, grade: "D" },
  { name: "인천가톨릭대학교", enrolled: 1840, scale: "소규모", region: "인천", zone: "수도권", studentIndex: 42.4, univFinanceIndex: 40.1, foundationIndex: 37.8, totalScore: 40.7, grade: "D" },
  { name: "신한대학교", enrolled: 7240, scale: "중규모", region: "경기", zone: "수도권", studentIndex: 42.9, univFinanceIndex: 40.6, foundationIndex: 38.2, totalScore: 41.2, grade: "D" },
  { name: "목원대학교", enrolled: 8120, scale: "중규모", region: "대전", zone: "충청권", studentIndex: 43.4, univFinanceIndex: 41.0, foundationIndex: 38.6, totalScore: 41.6, grade: "D" },
  { name: "감리교신학대학교", enrolled: 980, scale: "소규모", region: "서울", zone: "수도권", studentIndex: 43.8, univFinanceIndex: 41.4, foundationIndex: 39.1, totalScore: 42.1, grade: "D" },
];

export const MOCK_RISK_JUNIOR: MockRiskSchool[] = [
  { name: "강원관광대학교", enrolled: 620, scale: "소규모", region: "강원", zone: "강원제주", studentIndex: 21.8, univFinanceIndex: 19.2, foundationIndex: 17.4, totalScore: 20.4, grade: "E" },
  { name: "고구려대학교", enrolled: 880, scale: "소규모", region: "전남", zone: "호남권", studentIndex: 24.6, univFinanceIndex: 22.1, foundationIndex: 20.0, totalScore: 23.1, grade: "E" },
  { name: "경남도립거창대학", enrolled: 1120, scale: "소규모", region: "경남", zone: "동남권", studentIndex: 27.4, univFinanceIndex: 24.8, foundationIndex: 23.2, totalScore: 25.8, grade: "E" },
  { name: "송곡대학교", enrolled: 940, scale: "소규모", region: "강원", zone: "강원제주", studentIndex: 31.2, univFinanceIndex: 28.6, foundationIndex: 26.4, totalScore: 29.6, grade: "D" },
  { name: "전남과학대학교", enrolled: 1860, scale: "소규모", region: "전남", zone: "호남권", studentIndex: 33.8, univFinanceIndex: 31.2, foundationIndex: 29.1, totalScore: 32.1, grade: "D" },
  { name: "김포대학교", enrolled: 3240, scale: "중규모", region: "경기", zone: "수도권", studentIndex: 35.4, univFinanceIndex: 33.0, foundationIndex: 30.8, totalScore: 33.8, grade: "D" },
  { name: "대경대학교", enrolled: 2480, scale: "중규모", region: "경북", zone: "대경권", studentIndex: 36.9, univFinanceIndex: 34.4, foundationIndex: 32.1, totalScore: 35.2, grade: "D" },
  { name: "서해대학", enrolled: 1320, scale: "소규모", region: "전북", zone: "호남권", studentIndex: 37.6, univFinanceIndex: 35.1, foundationIndex: 32.8, totalScore: 35.9, grade: "D" },
  { name: "웅지세무대학교", enrolled: 760, scale: "소규모", region: "경기", zone: "수도권", studentIndex: 38.4, univFinanceIndex: 36.2, foundationIndex: 33.9, totalScore: 36.8, grade: "D" },
  { name: "충북보건과학대학교", enrolled: 1680, scale: "소규모", region: "충북", zone: "충청권", studentIndex: 39.1, univFinanceIndex: 36.8, foundationIndex: 34.4, totalScore: 37.4, grade: "D" },
  { name: "광주보건대학교", enrolled: 2920, scale: "중규모", region: "광주", zone: "호남권", studentIndex: 40.2, univFinanceIndex: 37.6, foundationIndex: 35.1, totalScore: 38.4, grade: "D" },
  { name: "인하공업전문대학", enrolled: 6120, scale: "대규모", region: "인천", zone: "수도권", studentIndex: 41.4, univFinanceIndex: 38.8, foundationIndex: 36.2, totalScore: 39.6, grade: "D" },
  { name: "동부산대학교", enrolled: 2140, scale: "중규모", region: "부산", zone: "동남권", studentIndex: 42.1, univFinanceIndex: 39.4, foundationIndex: 36.8, totalScore: 40.2, grade: "D" },
  { name: "배화여자대학교", enrolled: 1480, scale: "소규모", region: "서울", zone: "수도권", studentIndex: 42.8, univFinanceIndex: 40.1, foundationIndex: 37.4, totalScore: 40.8, grade: "D" },
  { name: "영남외국어대학", enrolled: 980, scale: "소규모", region: "경북", zone: "대경권", studentIndex: 43.2, univFinanceIndex: 40.6, foundationIndex: 38.0, totalScore: 41.3, grade: "D" },
  { name: "대덕대학교", enrolled: 2360, scale: "중규모", region: "대전", zone: "충청권", studentIndex: 43.6, univFinanceIndex: 41.0, foundationIndex: 38.4, totalScore: 41.7, grade: "D" },
];

export const MOCK_TOTAL_UNIVERSITY: MockSidoRow = {
  region: "전체",
  schoolCount: 202,
  avgScore: 56.4,
  yoy: -1.2,
  median: 55.1,
  meanScore: 54.2,
  riskCount: 30,
};

export const MOCK_TOTAL_JUNIOR: MockSidoRow = {
  region: "전체",
  schoolCount: 128,
  avgScore: 52.8,
  yoy: -1.4,
  median: 51.6,
  meanScore: 50.4,
  riskCount: 16,
};
