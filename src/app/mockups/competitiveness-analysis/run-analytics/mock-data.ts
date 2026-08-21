export type Grade = "S" | "A" | "B" | "C" | "D" | "E";

export type UniversityAnalyticsRow = {
  id: number;
  rank: number;
  name: string;
  type: "4년제" | "전문대";
  region: string;
  freshRate: number;
  enrolledRate: number;
  dropRate: number;
  fundRate: number;
  studentSectorScore: number;
  univFinanceScore: number;
  foundationScore: number;
  totalScore: number;
  grade: Grade;
};

export const REGIONS = [
  "수도권",
  "충청권",
  "호남권",
  "대경권",
  "동남권",
  "강원제주",
] as const;

const UNIV_NAMES = [
  "고려대학교",
  "연세대학교",
  "성균관대학교",
  "한양대학교",
  "중앙대학교",
  "경희대학교",
  "이화여자대학교",
  "숙명여자대학교",
  "국민대학교",
  "세종대학교",
];

function pseudo(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function gradeFromScore(score: number, isJunior: boolean): Grade {
  const t = isJunior ? [82, 72, 62, 52, 42] : [85, 75, 65, 55, 45];
  if (score >= t[0]!) return "S";
  if (score >= t[1]!) return "A";
  if (score >= t[2]!) return "B";
  if (score >= t[3]!) return "C";
  if (score >= t[4]!) return "D";
  return "E";
}

function buildRows(count: number, isJunior: boolean): UniversityAnalyticsRow[] {
  const rows: UniversityAnalyticsRow[] = [];
  for (let i = 1; i <= count; i++) {
    const region = REGIONS[i % REGIONS.length]!;
    const base =
      region === "수도권" ? 0.82 : region === "충청권" ? 0.68 : 0.55;
    const rand = pseudo(i, isJunior ? 2 : 1) * 0.35 + base * (isJunior ? 0.92 : 1);

    const freshRate = Math.min(100, Math.round((rand * 35 + 65) * 10) / 10);
    const enrolledRate = Math.min(
      100,
      Math.round((rand * 30 + 70) * 10) / 10,
    );
    const dropRate = Math.round(Math.max(2, (1.2 - rand) * 12) * 10) / 10;
    const fundRate = Math.round((rand * 30 + 85) * 10) / 10;

    const studentSectorScore =
      Math.round(
        (freshRate * 0.4 +
          enrolledRate * 0.4 +
          (15 - dropRate) * 2.5) *
          10,
      ) / 10;
    const univFinanceScore =
      Math.round((fundRate * 0.35 + rand * 40) * 10) / 10;
    const foundationScore = Math.round((rand * 70 + 20) * 10) / 10;
    const totalScore =
      Math.round(
        (studentSectorScore * 0.5 +
          univFinanceScore * 0.4 +
          foundationScore * 0.1) *
          10,
      ) / 10;

    rows.push({
      id: i,
      rank: 0,
      name: isJunior
        ? `전문대학 ${i}`
        : i <= UNIV_NAMES.length
          ? UNIV_NAMES[i - 1]!
          : `사립대학 ${i}`,
      type: isJunior ? "전문대" : "4년제",
      region,
      freshRate,
      enrolledRate,
      dropRate,
      fundRate,
      studentSectorScore,
      univFinanceScore,
      foundationScore,
      totalScore,
      grade: gradeFromScore(totalScore, isJunior),
    });
  }
  rows.sort((a, b) => b.totalScore - a.totalScore);
  rows.forEach((r, idx) => {
    r.rank = idx + 1;
  });
  return rows;
}

export const MOCK_UNIVERSITY_DATA = buildRows(150, false);
export const MOCK_JUNIOR_COLLEGE_DATA = buildRows(122, true);

export function gradeBadgeClass(grade: Grade): string {
  switch (grade) {
    case "S":
      return "cra-grade cra-grade-s";
    case "A":
      return "cra-grade cra-grade-a";
    case "B":
      return "cra-grade cra-grade-b";
    case "C":
      return "cra-grade cra-grade-c";
    case "D":
      return "cra-grade cra-grade-d";
    default:
      return "cra-grade cra-grade-e";
  }
}
