export const ZONE_COMPARE = [
  { region: "수도권", avgRate: 62.4, yoy: -0.4, schoolCount: 77 },
  { region: "충청권", avgRate: 58.1, yoy: -0.8, schoolCount: 36 },
  { region: "호남권", avgRate: 51.6, yoy: -1.9, schoolCount: 27 },
  { region: "대경권", avgRate: 53.8, yoy: -1.2, schoolCount: 23 },
  { region: "동남권", avgRate: 54.2, yoy: -1.5, schoolCount: 28 },
  { region: "강원제주", avgRate: 47.1, yoy: -2.4, schoolCount: 11 },
];

export const SCALE_COMPARE = [
  { region: "대규모", avgRate: 68.6, yoy: 0.3, schoolCount: 24 },
  { region: "중규모", avgRate: 58.9, yoy: -0.7, schoolCount: 51 },
  { region: "소규모", avgRate: 49.4, yoy: -2.1, schoolCount: 127 },
];

export const SIDO_RANK = [
  { region: "서울", avgRate: 64.8, yoy: -0.4 },
  { region: "세종", avgRate: 61.4, yoy: 0.3 },
  { region: "인천", avgRate: 60.1, yoy: -0.6 },
  { region: "경기", avgRate: 59.6, yoy: -0.8 },
  { region: "대전", avgRate: 58.9, yoy: -0.5 },
  { region: "충남", avgRate: 57.2, yoy: -1.1 },
  { region: "대구", avgRate: 56.8, yoy: -0.9 },
  { region: "부산", avgRate: 55.4, yoy: -1.4 },
  { region: "울산", avgRate: 55.1, yoy: 0.2 },
  { region: "충북", avgRate: 54.6, yoy: -1.3 },
  { region: "광주", avgRate: 53.8, yoy: -1.6 },
  { region: "경남", avgRate: 52.4, yoy: -1.8 },
  { region: "전북", avgRate: 51.2, yoy: -2.1 },
  { region: "경북", avgRate: 50.6, yoy: -1.5 },
  { region: "전남", avgRate: 48.9, yoy: -2.4 },
  { region: "강원", avgRate: 47.4, yoy: -2.6 },
  { region: "제주", avgRate: 46.8, yoy: -1.9 },
];

export const GRADE_BARS = [
  { grade: "S", label: "S (77+)", count: 16, fill: "#4F46E5" },
  { grade: "A", label: "A (65+)", count: 28, fill: "#10B981" },
  { grade: "B", label: "B (56+)", count: 41, fill: "#3B82F6" },
  { grade: "C", label: "C (44+)", count: 48, fill: "#F59E0B" },
  { grade: "D", label: "D (30+)", count: 43, fill: "#EC4899" },
  { grade: "E", label: "E (<30)", count: 26, fill: "#EF4444" },
];

/** 진단등급 컷오프에 맞춘 종합지수 구간 */
export const SCORE_HISTOGRAM = [
  { bin: "0–30 E", count: 26, fill: "#EF4444" },
  { bin: "30–44 D", count: 43, fill: "#EC4899" },
  { bin: "44–56 C", count: 48, fill: "#F59E0B" },
  { bin: "56–65 B", count: 41, fill: "#3B82F6" },
  { bin: "65–77 A", count: 28, fill: "#10B981" },
  { bin: "77–100 S", count: 16, fill: "#4F46E5" },
];

export const DENSITY_POINTS = [
  { score: 12, density: 4 },
  { score: 20, density: 9 },
  { score: 28, density: 18 },
  { score: 36, density: 28 },
  { score: 44, density: 36 },
  { score: 52, density: 34 },
  { score: 60, density: 26 },
  { score: 68, density: 16 },
  { score: 76, density: 9 },
  { score: 84, density: 5 },
  { score: 92, density: 2 },
];

export const QUADRANT_POINTS = [
  { name: "연세대학교", student: 90, finance: 86, grade: "S" },
  { name: "경북대학교", student: 82, finance: 78, grade: "A" },
  { name: "한림대학교", student: 88, finance: 93, grade: "A" },
  { name: "가톨릭대학교", student: 74, finance: 69, grade: "A" },
  { name: "목원대학교", student: 43, finance: 41, grade: "D" },
  { name: "신한대학교", student: 43, finance: 41, grade: "D" },
  { name: "동명대학교", student: 42, finance: 40, grade: "D" },
  { name: "제주국제대학교", student: 33, finance: 30, grade: "D" },
  { name: "초당대학교", student: 22, finance: 19, grade: "E" },
  { name: "루터대학교", student: 28, finance: 25, grade: "E" },
  { name: "한국기술교육대학교", student: 94, finance: 89, grade: "S" },
  { name: "포항공과대학교", student: 96, finance: 92, grade: "S" },
  { name: "상지대학교", student: 37, finance: 35, grade: "D" },
  { name: "나사렛대학교", student: 42, finance: 39, grade: "D" },
  { name: "위덕대학교", student: 34, finance: 32, grade: "D" },
  { name: "한남대학교", student: 61, finance: 58, grade: "B" },
  { name: "대구가톨릭대학교", student: 55, finance: 71, grade: "B" },
  { name: "선문대학교", student: 72, finance: 48, grade: "B" },
  { name: "우석대학교", student: 48, finance: 62, grade: "C" },
  { name: "세한대학교", student: 32, finance: 30, grade: "D" },
];

export const ZONE_TREND = [
  { year: "2021", 수도권: 63.1, 충청권: 59.4, 호남권: 54.8, 대경권: 55.9, 동남권: 56.8, 강원제주: 51.2 },
  { year: "2022", 수도권: 62.8, 충청권: 59.1, 호남권: 53.9, 대경권: 55.4, 동남권: 56.1, 강원제주: 50.1 },
  { year: "2023", 수도권: 62.9, 충청권: 58.8, 호남권: 53.1, 대경권: 54.9, 동남권: 55.6, 강원제주: 49.0 },
  { year: "2024", 수도권: 62.8, 충청권: 58.9, 호남권: 53.5, 대경권: 55.0, 동남권: 55.7, 강원제주: 49.5 },
  { year: "2025", 수도권: 62.4, 충청권: 58.1, 호남권: 51.6, 대경권: 53.8, 동남권: 54.2, 강원제주: 47.1 },
];

export const SCALE_TREND = [
  { year: "2021", 대규모: 67.8, 중규모: 60.2, 소규모: 53.6 },
  { year: "2022", 대규모: 68.1, 중규모: 59.8, 소규모: 52.4 },
  { year: "2023", 대규모: 68.0, 중규모: 59.4, 소규모: 51.1 },
  { year: "2024", 대규모: 68.3, 중규모: 59.6, 소규모: 51.5 },
  { year: "2025", 대규모: 68.6, 중규모: 58.9, 소규모: 49.4 },
];
