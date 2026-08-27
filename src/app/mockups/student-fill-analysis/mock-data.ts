import { sfaFillStage, type SfaFillStage } from "@/lib/analysis/student-fill-analysis/fill-stage";

export type { SfaFillStage };
export { sfaFillStage };

export const SFA_MOCK_YEARS = [2025, 2024, 2023];

export const SFA_SOURCE_STATUS = [
  {
    id: "freshman",
    label: "신입생충원",
    menu: "대학현황 › 대학알리미 › 신입생충원",
    dataset: "대학전문",
    period: "연간",
    years: "2020–2025",
  },
  {
    id: "enrolled",
    label: "재학생충원",
    menu: "대학현황 › 대학알리미 › 재학생충원",
    dataset: "대학전문 · 상반기",
    period: "상반기",
    years: "2020–2025",
  },
  {
    id: "enrolled-students",
    label: "재적학생",
    menu: "대학현황 › 대학알리미 › 재적학생",
    dataset: "대학전문",
    period: "연간",
    years: "2020–2025",
  },
  {
    id: "foreign",
    label: "외국인학생",
    menu: "대학현황 › 대학알리미 › 외국인학생",
    dataset: "대학전문 · 학위(A) 기본",
    period: "상반기",
    years: "2020–2025",
  },
  {
    id: "dropout",
    label: "중도탈락",
    menu: "대학현황 › 대학알리미 › 중도탈락",
    dataset: "대학전문",
    period: "분석연도 − 1",
    years: "2019–2024",
  },
  {
    id: "foreign-dropout",
    label: "외국학생중도탈락",
    menu: "대학현황 › 대학알리미 › 외국학생중도탈락",
    dataset: "대학전문 · 학위 범위",
    period: "분석연도 − 1",
    years: "2019–2024",
  },
] as const;

/** 목업 예시. 프로덕션 CSV와 일치한다고 보지 않음. */
export const SFA_MOCK_FRESHMAN_TREND = [
  {
    year: 2020,
    univSchools: 211,
    univRecruitIn: 312629,
    univAdmitIn: 309042,
    univRateIn: 98.9,
    univAdmitOut: 33638,
    univOutShare: 9.8,
    univRateAll: 99.1,
    colSchools: 136,
    colRecruitIn: 162580,
    colAdmitIn: 152057,
    colRateIn: 93.5,
    colAdmitOut: 36438,
    colOutShare: 19.3,
    colRateAll: 94.8,
  },
  {
    year: 2021,
    univSchools: 212,
    univRecruitIn: 313614,
    univAdmitIn: 297610,
    univRateIn: 94.9,
    univAdmitOut: 31689,
    univOutShare: 9.6,
    univRateAll: 95.3,
    colSchools: 134,
    colRecruitIn: 155746,
    colAdmitIn: 131551,
    colRateIn: 84.5,
    colAdmitOut: 35173,
    colOutShare: 21.1,
    colRateAll: 87.2,
  },
  {
    year: 2022,
    univSchools: 211,
    univRecruitIn: 311454,
    univAdmitIn: 300042,
    univRateIn: 96.3,
    univAdmitOut: 29806,
    univOutShare: 9.0,
    univRateAll: 96.6,
    colSchools: 134,
    colRecruitIn: 148250,
    colAdmitIn: 129063,
    colRateIn: 87.1,
    colAdmitOut: 34649,
    colOutShare: 21.2,
    colRateAll: 89.4,
  },
  {
    year: 2023,
    univSchools: 210,
    univRecruitIn: 306931,
    univAdmitIn: 298670,
    univRateIn: 97.3,
    univAdmitOut: 31894,
    univOutShare: 9.6,
    univRateAll: 97.6,
    colSchools: 133,
    colRecruitIn: 140718,
    colAdmitIn: 125184,
    colRateIn: 89.0,
    colAdmitOut: 34813,
    colOutShare: 21.8,
    colRateAll: 91.1,
  },
  {
    year: 2024,
    univSchools: 210,
    univRecruitIn: 306645,
    univAdmitIn: 300537,
    univRateIn: 98.0,
    univAdmitOut: 36804,
    univOutShare: 10.9,
    univRateAll: 98.3,
    colSchools: 131,
    colRecruitIn: 136435,
    colAdmitIn: 122983,
    colRateIn: 90.1,
    colAdmitOut: 37447,
    colOutShare: 23.3,
    colRateAll: 92.4,
  },
  {
    year: 2025,
    univSchools: 210,
    univRecruitIn: 308814,
    univAdmitIn: 305509,
    univRateIn: 98.9,
    univAdmitOut: 41605,
    univOutShare: 12.0,
    univRateAll: 99.1,
    colSchools: 130,
    colRecruitIn: 134388,
    colAdmitIn: 123703,
    colRateIn: 92.0,
    colAdmitOut: 47317,
    colOutShare: 27.7,
    colRateAll: 94.1,
  },
];

export type SfaMockUniversity = {
  schoolCodeStd: string;
  schoolName: string;
  schoolDivision: "대학" | "전문대학";
  estb: "국립" | "사립" | "공립";
  region: string;
  metro: "수도권" | "비수도권";
  enrolledTotal: number;
  rateAll: number;
  recruitChange: number;
  outShare: number;
  foreignDegree: number;
  foreignDrop: number;
};

export type SfaUnivTrendRow = {
  year: number;
  rateIn: number;
  rateAll: number;
  outShare: number;
  recruitIn: number;
};

export type SfaUnivMetricTrendRow = SfaUnivTrendRow & {
  enrolledFillRate: number;
  dropoutRate: number;
  freshmanDropoutRate: number;
  foreignShare: number;
  foreignDrop: number;
  leaveShare: number;
};

export function sfaMetricTrendFor(univ: SfaMockUniversity): SfaUnivMetricTrendRow[] {
  const base = sfaFreshmanTrendFor(univ);
  const detail = sfaMockDetail(univ);
  return base.map((row) => {
    const t = (row.year - 2020) / 5;
    return {
      ...row,
      enrolledFillRate: Math.round((detail.enrolledFillRate - 2.4 + t * 1.6) * 10) / 10,
      dropoutRate: Math.round((detail.dropoutRate + 0.6 - t * 0.4) * 10) / 10,
      freshmanDropoutRate: Math.round((detail.freshmanDropoutRate + 0.8 - t * 0.3) * 10) / 10,
      foreignShare: Math.round((detail.foreignShare * (0.72 + t * 0.28)) * 10) / 10,
      foreignDrop: Math.round((univ.foreignDrop + 1.2 - t * 0.5) * 10) / 10,
      leaveShare: Math.round((3.8 + (1 - t) * 0.7) * 10) / 10,
    };
  });
}
export function sfaFreshmanTrendFor(univ: SfaMockUniversity): SfaUnivTrendRow[] {
  const isUniv = univ.schoolDivision === "대학";
  const natLast = SFA_MOCK_FRESHMAN_TREND[SFA_MOCK_FRESHMAN_TREND.length - 1]!;
  const natRateAll = isUniv ? natLast.univRateAll : natLast.colRateAll;
  const delta = univ.rateAll - natRateAll;
  const recruitBase = Math.max(400, Math.round(univ.enrolledTotal * 0.22));

  return SFA_MOCK_FRESHMAN_TREND.map((n) => {
    const natAll = isUniv ? n.univRateAll : n.colRateAll;
    const natIn = isUniv ? n.univRateIn : n.colRateIn;
    const natOut = isUniv ? n.univOutShare : n.colOutShare;
    const yearGap = n.year - 2025;
    const recruitFactor = 1 + (univ.recruitChange / 100) * (yearGap / 5);
    return {
      year: n.year,
      rateAll: Math.round((natAll + delta) * 10) / 10,
      rateIn: Math.round((natIn + delta) * 10) / 10,
      outShare: Math.round((natOut + (univ.outShare - natOut) * 0.65) * 10) / 10,
      recruitIn: Math.round(recruitBase * recruitFactor),
    };
  });
}

export type SfaMockSchoolDetail = SfaMockUniversity & {
  recruitWithin: number;
  recruitOutside: number;
  admitWithin: number;
  admitOutside: number;
  rateIn: number;
  studentQuota: number;
  enrolledFill: number;
  enrolledFillRate: number;
  enrolledFillRateIn: number;
  enrolledOutside: number;
  enrolledOutShare: number;
  rosterTotal: number;
  leaveCount: number;
  deferCount: number;
  dropoutCount: number;
  dropoutRate: number;
  freshmanDropoutCount: number;
  freshmanDropoutRate: number;
  foreignJoint: number;
  foreignTraining: number;
  foreignTotal: number;
  foreignShare: number;
  langAbilityRate: number;
  foreignDropCount: number;
  foreignDropAllRate: number;
};

export function sfaMockDetail(univ: SfaMockUniversity): SfaMockSchoolDetail {
  const recruitWithin = Math.max(80, Math.round(univ.enrolledTotal * 0.22));
  const admitOutside = Math.round((recruitWithin * univ.outShare) / (100 - univ.outShare + 0.01));
  const admitWithin = Math.round((recruitWithin * univ.rateAll) / 100);
  const recruitOutside = Math.max(admitOutside, Math.round(admitOutside * 1.05));
  const rateIn = Math.round((admitWithin / recruitWithin) * 1000) / 10;
  const studentQuota = Math.round(univ.enrolledTotal * 0.98);
  const enrolledFill = univ.enrolledTotal;
  const enrolledFillRate = Math.round((enrolledFill / Math.max(1, studentQuota)) * 1000) / 10;
  const enrolledOutside = Math.round(univ.enrolledTotal * (univ.outShare / 100) * 0.85);
  const enrolledOutShare = Math.round((enrolledOutside / Math.max(1, univ.enrolledTotal)) * 1000) / 10;
  const leaveCount = Math.round(univ.enrolledTotal * 0.045);
  const deferCount = Math.round(univ.enrolledTotal * 0.012);
  const rosterTotal = univ.enrolledTotal + leaveCount + deferCount;
  const dropoutRate = Math.round((3.2 + univ.foreignDrop * 0.18 + (univ.rateAll < 94 ? 1.4 : 0)) * 10) / 10;
  const dropoutCount = Math.round((rosterTotal * dropoutRate) / 100);
  const freshmanDropoutRate = Math.round((dropoutRate + 1.8) * 10) / 10;
  const freshmanDropoutCount = Math.round((recruitWithin * freshmanDropoutRate) / 100);
  const foreignJoint = Math.round(univ.foreignDegree * 0.04);
  const foreignTraining = Math.round(univ.foreignDegree * (univ.outShare > 20 ? 0.55 : 0.22));
  const foreignTotal = univ.foreignDegree + foreignJoint + foreignTraining;
  const foreignShare = Math.round((univ.foreignDegree / Math.max(1, univ.enrolledTotal)) * 1000) / 10;
  const langAbilityRate = Math.round((58 + (100 - univ.foreignDrop) * 0.28) * 10) / 10;
  const foreignDropCount = Math.round((univ.foreignDegree * univ.foreignDrop) / 100);
  const foreignDropAllRate = Math.round((univ.foreignDrop + foreignTraining * 0.004) * 10) / 10;
  return {
    ...univ,
    recruitWithin,
    recruitOutside,
    admitWithin,
    admitOutside,
    rateIn,
    studentQuota,
    enrolledFill,
    enrolledFillRate,
    enrolledFillRateIn: Math.round((enrolledFillRate - enrolledOutShare * 0.15) * 10) / 10,
    enrolledOutside,
    enrolledOutShare,
    rosterTotal,
    leaveCount,
    deferCount,
    dropoutCount,
    dropoutRate,
    freshmanDropoutCount,
    freshmanDropoutRate,
    foreignJoint,
    foreignTraining,
    foreignTotal,
    foreignShare,
    langAbilityRate,
    foreignDropCount,
    foreignDropAllRate,
  };
}

export const SFA_RUN_ADDITIONS: {
  stage: "신입생충원" | "재학생충원" | "외국인" | "종합";
  now: string;
  add: string;
}[] = [
  {
    stage: "신입생충원",
    now: "정원내모집·입학·충원율, 정원외입학·비중, 정원내외충원율",
    add: "정원외모집, 신입생중도탈락인원·율(Y−1)",
  },
  {
    stage: "재학생충원",
    now: "학생정원, 재학생(충원 분자), 재학생충원율, 중도탈락 인원·율",
    add: "정원내 재학생충원율, 정원외 재학생·비중, 재적·휴학·학사학위취득유예, 신입생 중도탈락 인원·율",
  },
  {
    stage: "외국인",
    now: "학위외국인(A), 재적대비비중, 학위 외국인탈락·율",
    add: "공동운영(B), 연수(C), 외국인 계, 언어능력충족율, 비학위 포함 외국인탈락율",
  },
  {
    stage: "종합",
    now: "정원내외충원율, 모집증감, 정원외비중, 학위외국인, 외국인비중, 외국인탈락율",
    add: "휴학비중, 유예비중, 연수인원, 언어능력, 신입생탈락율, 전체외국인탈락율",
  },
];

export const SFA_MOCK_UNIVERSITIES: SfaMockUniversity[] = [
  {
    schoolCodeStd: "0000063",
    schoolName: "가천대학교",
    schoolDivision: "대학",
    estb: "사립",
    region: "경기",
    metro: "수도권",
    enrolledTotal: 18240,
    rateAll: 101.2,
    recruitChange: -1.4,
    outShare: 14.8,
    foreignDegree: 2840,
    foreignDrop: 5.1,
  },
  {
    schoolCodeStd: "0000076",
    schoolName: "동양대학교",
    schoolDivision: "대학",
    estb: "사립",
    region: "경북",
    metro: "비수도권",
    enrolledTotal: 4180,
    rateAll: 96.4,
    recruitChange: -8.2,
    outShare: 18.6,
    foreignDegree: 412,
    foreignDrop: 11.4,
  },
  {
    schoolCodeStd: "0000190",
    schoolName: "초당대학교",
    schoolDivision: "대학",
    estb: "사립",
    region: "전남",
    metro: "비수도권",
    enrolledTotal: 2760,
    rateAll: 94.1,
    recruitChange: -12.0,
    outShare: 22.4,
    foreignDegree: 860,
    foreignDrop: 14.8,
  },
  {
    schoolCodeStd: "0000032",
    schoolName: "강원대학교",
    schoolDivision: "대학",
    estb: "국립",
    region: "강원",
    metro: "비수도권",
    enrolledTotal: 21480,
    rateAll: 99.0,
    recruitChange: -3.1,
    outShare: 7.2,
    foreignDegree: 980,
    foreignDrop: 4.6,
  },
  {
    schoolCodeStd: "0000513",
    schoolName: "부천대학교",
    schoolDivision: "전문대학",
    estb: "사립",
    region: "경기",
    metro: "수도권",
    enrolledTotal: 8920,
    rateAll: 93.5,
    recruitChange: -11.6,
    outShare: 26.1,
    foreignDegree: 1540,
    foreignDrop: 9.8,
  },
  {
    schoolCodeStd: "0000557",
    schoolName: "전주비전대학교",
    schoolDivision: "전문대학",
    estb: "사립",
    region: "전북",
    metro: "비수도권",
    enrolledTotal: 3140,
    rateAll: 91.2,
    recruitChange: -18.4,
    outShare: 29.3,
    foreignDegree: 1210,
    foreignDrop: 16.2,
  },
];
