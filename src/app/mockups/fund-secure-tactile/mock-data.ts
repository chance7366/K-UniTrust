export const MOCK_YEARS = [2020, 2021, 2022, 2023, 2024];

export const MOCK_KPIS = {
  avgRate: 128.4,
  yoy: 2.1,
  median: 121.6,
  iqr: 38.2,
  riskBelow100: 47,
  riskBelow100Pct: 15.1,
  riskBelow80: 12,
  riskBelow80Pct: 3.8,
  schoolCount: 312,
};

export const MOCK_ZONES = [
  { region: "수도권", avgRate: 156.2, yoy: 1.8, schoolCount: 98 },
  { region: "충청권", avgRate: 132.5, yoy: 2.4, schoolCount: 52 },
  { region: "강원권", avgRate: 118.3, yoy: -0.6, schoolCount: 28 },
  { region: "경상권", avgRate: 124.7, yoy: 1.2, schoolCount: 86 },
  { region: "전라권", avgRate: 119.8, yoy: 0.9, schoolCount: 48 },
];

export const MOCK_SIDO = [
  { region: "서울", schoolCount: 42, avgRate: 162.4, yoy: 2.1, median: 148.2, riskCount: 3 },
  { region: "세종", schoolCount: 2, avgRate: 158.1, yoy: 1.4, median: 158.1, riskCount: 0 },
  { region: "경기", schoolCount: 38, avgRate: 148.5, yoy: 1.9, median: 136.8, riskCount: 4 },
  { region: "대전", schoolCount: 8, avgRate: 142.3, yoy: 0.8, median: 138.6, riskCount: 1 },
  { region: "광주", schoolCount: 11, avgRate: 138.9, yoy: 1.1, median: 132.4, riskCount: 2 },
  { region: "울산", schoolCount: 5, avgRate: 135.2, yoy: -0.3, median: 128.9, riskCount: 1 },
  { region: "부산", schoolCount: 18, avgRate: 131.0, yoy: 0.6, median: 125.8, riskCount: 3 },
  { region: "대구", schoolCount: 14, avgRate: 125.4, yoy: -0.2, median: 118.6, riskCount: 4 },
  { region: "충북", schoolCount: 12, avgRate: 122.8, yoy: 1.5, median: 116.2, riskCount: 2 },
  { region: "충남", schoolCount: 15, avgRate: 120.6, yoy: 0.4, median: 114.8, riskCount: 3 },
  { region: "전북", schoolCount: 13, avgRate: 118.4, yoy: 0.7, median: 112.1, riskCount: 4 },
  { region: "경북", schoolCount: 22, avgRate: 116.9, yoy: -0.5, median: 110.4, riskCount: 6 },
  { region: "전남", schoolCount: 14, avgRate: 114.2, yoy: 0.3, median: 108.6, riskCount: 5 },
  { region: "경남", schoolCount: 19, avgRate: 112.8, yoy: -0.8, median: 106.2, riskCount: 7 },
  { region: "강원", schoolCount: 11, avgRate: 110.5, yoy: 0.2, median: 104.8, riskCount: 4 },
  { region: "제주", schoolCount: 4, avgRate: 108.3, yoy: 1.0, median: 106.1, riskCount: 1 },
  { region: "인천", schoolCount: 9, avgRate: 106.7, yoy: -1.2, median: 102.4, riskCount: 3 },
];

export const MOCK_RISK_TIERS = [
  { tier: "고위험", label: "<80%", count: 12, color: "#D93A48" },
  { tier: "위험", label: "80~100%", count: 35, color: "#FF9F1A" },
  { tier: "양호", label: "100~120%", count: 98, color: "#FFD24A" },
  { tier: "여유", label: "≥120%", count: 167, color: "#F08A24" },
];

export const MOCK_HISTOGRAM = [
  { bin: "<60%", count: 14, fill: "#D93A48" },
  { bin: "60~80%", count: 23, fill: "#E87800" },
  { bin: "80~100%", count: 35, fill: "#FF9F1A" },
  { bin: "100~120%", count: 52, fill: "#FFB020" },
  { bin: "120~150%", count: 68, fill: "#FFD24A" },
  { bin: "150~200%", count: 72, fill: "#FFE066" },
  { bin: "≥200%", count: 34, fill: "#FFF0A8" },
];

export const MOCK_DENSITY = [
  { x: 40, y: 2 },
  { x: 55, y: 5 },
  { x: 70, y: 12 },
  { x: 85, y: 22 },
  { x: 100, y: 38 },
  { x: 115, y: 52 },
  { x: 130, y: 48 },
  { x: 145, y: 32 },
  { x: 160, y: 18 },
  { x: 175, y: 10 },
  { x: 190, y: 5 },
  { x: 210, y: 2 },
];

export const MOCK_RISK_SCHOOLS = [
  { name: "○○대학교", region: "경남", totalFunds: 892, tuition: 810, rate: 72.4, tier: "고위험" as const },
  { name: "△△대학교", region: "전남", totalFunds: 654, tuition: 720, rate: 78.2, tier: "고위험" as const },
  { name: "□□대학교", region: "강원", totalFunds: 1_120, tuition: 1_180, rate: 88.6, tier: "위험" as const },
  { name: "◇◇대학교", region: "경북", totalFunds: 980, tuition: 1_050, rate: 93.4, tier: "위험" as const },
  { name: "☆☆대학교", region: "인천", totalFunds: 1_340, tuition: 1_420, rate: 96.8, tier: "위험" as const },
];

export const MOCK_TABLE_ROWS = [
  {
    code: "0000019",
    name: "서울대학교",
    schoolFundsCarryover: 4_521_000,
    schoolFundsEndowment: 6_832_000,
    industryCarryover: 892_000,
    industryEndowment: 205_320,
    totalFunds: 12_450_320,
    tuitionRevenue: 6_720_180,
    fundSecureRate: 185.2,
  },
  {
    code: "0000123",
    name: "연세대학교",
    schoolFundsCarryover: 1_820_000,
    schoolFundsEndowment: 1_654_000,
    industryCarryover: 412_000,
    industryEndowment: 345_880,
    totalFunds: 4_231_880,
    tuitionRevenue: 2_768_540,
    fundSecureRate: 152.8,
  },
  {
    code: "0000088",
    name: "부산대학교",
    schoolFundsCarryover: 980_000,
    schoolFundsEndowment: 756_000,
    industryCarryover: 245_000,
    industryEndowment: 124_670,
    totalFunds: 2_105_670,
    tuitionRevenue: 1_229_480,
    fundSecureRate: 171.3,
  },
  {
    code: "0000312",
    name: "전남대학교",
    schoolFundsCarryover: 720_000,
    schoolFundsEndowment: 612_000,
    industryCarryover: 312_000,
    industryEndowment: 232_420,
    totalFunds: 1_876_420,
    tuitionRevenue: 1_147_660,
    fundSecureRate: 163.5,
  },
  {
    code: "0002748",
    name: "가야대학교(김해)",
    schoolFundsCarryover: 412_000,
    schoolFundsEndowment: 328_000,
    industryCarryover: 98_000,
    industryEndowment: 54_140,
    totalFunds: 892_140,
    tuitionRevenue: 752_180,
    fundSecureRate: 118.6,
  },
  {
    code: "0000891",
    name: "○○대학교",
    schoolFundsCarryover: 312_000,
    schoolFundsEndowment: 248_000,
    industryCarryover: 86_000,
    industryEndowment: 42_320,
    totalFunds: 688_320,
    tuitionRevenue: 810_240,
    fundSecureRate: 84.9,
  },
  {
    code: "0000456",
    name: "△△대학교",
    schoolFundsCarryover: 198_000,
    schoolFundsEndowment: 156_000,
    industryCarryover: 42_000,
    industryEndowment: 28_140,
    totalFunds: 424_140,
    tuitionRevenue: 542_180,
    fundSecureRate: 78.2,
  },
];

export function rateStatus(rate: number): "ok" | "warn" | "danger" {
  if (rate < 80) return "danger";
  if (rate < 100) return "warn";
  return "ok";
}

export function rateStatusLabel(rate: number): string {
  if (rate < 80) return "고위험";
  if (rate < 100) return "위험";
  if (rate < 120) return "양호";
  return "여유";
}
