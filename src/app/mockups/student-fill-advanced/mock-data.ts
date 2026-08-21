import type { CorpTransferRatioAdvancedRow } from "@/lib/analysis/corp-transfer-ratio-advanced-analytics";

import type { StudentFillMockMetric } from "./profiles";

const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
/** 중도탈락율은 실데이터에 2025가 없어 목업에서도 제외 */
const DROPOUT_YEARS = [2021, 2022, 2023, 2024] as const;

const SIDOS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

const SCHOOL_KINDS_UNIV = ["대학교", "교육대학", "산업대학"] as const;
const SCHOOL_KINDS_JC = ["전문대학", "각종학교(전문)"] as const;

export type StudentFillViewMode = "campus" | "consolidated";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

type SchoolSeed = {
  code: string;
  repCode: string;
  name: string;
  region: (typeof SIDOS)[number];
  estb: "사립" | "국·공립";
  schoolDivision: "대학" | "전문대학";
  schoolKind: string;
  baseSize: number;
  quality: number;
  isMain: boolean;
};

/** 본교 + 일부 분교/캠퍼스 시드 (캠퍼스별 DB용) */
function buildSchoolSeeds(rand: () => number): SchoolSeed[] {
  const seeds: SchoolSeed[] = [];
  let idx = 1;
  for (const region of SIDOS) {
    const mainCount = region === "서울" || region === "경기" ? 10 : 5;
    for (let i = 0; i < mainCount; i++) {
      const isJc = rand() < 0.38;
      const schoolDivision = isJc ? "전문대학" : "대학";
      const schoolKind = isJc
        ? SCHOOL_KINDS_JC[Math.floor(rand() * SCHOOL_KINDS_JC.length)]!
        : SCHOOL_KINDS_UNIV[Math.floor(rand() * SCHOOL_KINDS_UNIV.length)]!;
      const estb = rand() < 0.72 ? "사립" : "국·공립";
      const repCode = String(2000000 + idx).padStart(7, "0");
      const baseName = `${region}${isJc ? "전문" : ""}대학교 ${String.fromCharCode(65 + (i % 26))}`;
      const quality = rand();
      const baseSize = Math.round(500 + rand() * 2400);

      seeds.push({
        code: repCode,
        repCode,
        name: `${baseName}(본교)`,
        region,
        estb,
        schoolDivision,
        schoolKind,
        baseSize,
        quality,
        isMain: true,
      });

      // ~35% 학교는 분교 1개, ~12%는 제2캠퍼스까지
      if (rand() < 0.35) {
        const branchRegion =
          SIDOS[Math.floor(rand() * SIDOS.length)] ?? region;
        idx += 1;
        seeds.push({
          code: String(2000000 + idx).padStart(7, "0"),
          repCode,
          name: `${baseName}(${branchRegion}캠퍼스)`,
          region: branchRegion,
          estb,
          schoolDivision,
          schoolKind,
          baseSize: Math.round(baseSize * (0.25 + rand() * 0.35)),
          quality: clamp(quality + (rand() - 0.5) * 0.2, 0, 1),
          isMain: false,
        });
        if (rand() < 0.35) {
          const branch2 =
            SIDOS[Math.floor(rand() * SIDOS.length)] ?? region;
          idx += 1;
          seeds.push({
            code: String(2000000 + idx).padStart(7, "0"),
            repCode,
            name: `${baseName}(제2캠퍼스)`,
            region: branch2,
            estb,
            schoolDivision,
            schoolKind,
            baseSize: Math.round(baseSize * (0.15 + rand() * 0.25)),
            quality: clamp(quality + (rand() - 0.5) * 0.25, 0, 1),
            isMain: false,
          });
        }
      }
      idx += 1;
    }
  }
  return seeds;
}

function buildFreshmanRows(
  schools: SchoolSeed[],
  rand: () => number,
): CorpTransferRatioAdvancedRow[] {
  const rows: CorpTransferRatioAdvancedRow[] = [];
  for (const year of YEARS) {
    const yearDrift = (year - 2023) * 0.6;
    for (const s of schools) {
      const metroBoost = ["서울", "경기", "인천"].includes(s.region) ? 4 : 0;
      const target = clamp(
        88 + s.quality * 22 + metroBoost + yearDrift + (rand() - 0.5) * 18,
        45,
        118,
      );
      const admissionQuota = s.baseSize + Math.round((rand() - 0.5) * 40);
      const recruitWithin = Math.max(
        1,
        Math.round(admissionQuota * (0.98 + rand() * 0.06)),
      );
      const recruitOutside = Math.round(recruitWithin * (0.03 + rand() * 0.08));
      const recruitTotal = recruitWithin + recruitOutside;
      const enrolledWithin = Math.max(
        0,
        Math.round((recruitWithin * target) / 100),
      );
      const enrolledOutside = Math.max(
        0,
        Math.round(recruitOutside * (0.7 + rand() * 0.5)),
      );
      const enrolledTotal = enrolledWithin + enrolledOutside;
      const rate = round1((enrolledWithin / recruitWithin) * 100);

      rows.push({
        year,
        schoolCodeStd: s.code,
        schoolName: s.name,
        schoolDivision: s.schoolDivision,
        schoolKind: s.schoolKind,
        region: s.region,
        estb: s.estb,
        tuitionRevenue: recruitWithin,
        ordinaryExpenseTransfer: admissionQuota,
        legalObligationTransfer: recruitTotal,
        assetTransfer: enrolledTotal,
        totalTransfer: enrolledWithin,
        transferRatio: rate,
      });
    }
  }
  return rows;
}

function buildEnrolledRows(
  schools: SchoolSeed[],
  rand: () => number,
): CorpTransferRatioAdvancedRow[] {
  const rows: CorpTransferRatioAdvancedRow[] = [];
  for (const year of YEARS) {
    const yearDrift = (year - 2023) * 0.4;
    for (const s of schools) {
      const metroBoost = ["서울", "경기", "인천"].includes(s.region) ? 3 : -1;
      const target = clamp(
        86 + s.quality * 20 + metroBoost + yearDrift + (rand() - 0.5) * 16,
        50,
        115,
      );
      const studentQuota = Math.round(s.baseSize * (3.2 + rand() * 0.6));
      const suspension = Math.round(studentQuota * rand() * 0.04);
      const quotaNet = Math.max(1, studentQuota - suspension);
      const enrolledWithin = Math.max(0, Math.round((quotaNet * target) / 100));
      const enrolledOutside = Math.round(enrolledWithin * (0.04 + rand() * 0.08));
      const enrolledTotal = enrolledWithin + enrolledOutside;
      const rate = round1((enrolledWithin / quotaNet) * 100);

      rows.push({
        year,
        schoolCodeStd: s.code,
        schoolName: s.name,
        schoolDivision: s.schoolDivision,
        schoolKind: s.schoolKind,
        region: s.region,
        estb: s.estb,
        ordinaryExpenseTransfer: studentQuota,
        tuitionRevenue: quotaNet,
        legalObligationTransfer: enrolledTotal,
        assetTransfer: suspension,
        totalTransfer: enrolledWithin,
        transferRatio: rate,
      });
    }
  }
  return rows;
}

function buildDropoutRows(
  schools: SchoolSeed[],
  rand: () => number,
): CorpTransferRatioAdvancedRow[] {
  const rows: CorpTransferRatioAdvancedRow[] = [];
  for (const year of DROPOUT_YEARS) {
    const yearDrift = (2023 - year) * 0.15;
    for (const s of schools) {
      const metroEase = ["서울", "경기", "인천"].includes(s.region) ? -0.8 : 0.6;
      const target = clamp(
        2.2 + (1 - s.quality) * 7 + metroEase + yearDrift + (rand() - 0.5) * 3.5,
        0.4,
        15,
      );
      const enrolled = Math.round(s.baseSize * (3.4 + rand() * 0.5));
      const freshman = Math.round(s.baseSize * (0.9 + rand() * 0.2));
      const dropouts = Math.max(0, Math.round((enrolled * target) / 100));
      const freshmanDropouts = Math.max(
        0,
        Math.round(freshman * ((target + 1.2) / 100)),
      );
      const rate = round2((dropouts / enrolled) * 100);

      rows.push({
        year,
        schoolCodeStd: s.code,
        schoolName: s.name,
        schoolDivision: s.schoolDivision,
        schoolKind: s.schoolKind,
        region: s.region,
        estb: s.estb,
        tuitionRevenue: enrolled,
        ordinaryExpenseTransfer: freshman,
        legalObligationTransfer: freshmanDropouts,
        assetTransfer: 0,
        totalTransfer: dropouts,
        transferRatio: rate,
      });
    }
  }
  return rows;
}

/**
 * 학교대표코드 기준 본교통합 — 분자·분모·Funnel 필드를 합산 후 비율 재계산
 * (프로덕션 신입생/재학생/중도탈락 본교통합과 동일 개념)
 */
function consolidateByRep(
  campusRows: CorpTransferRatioAdvancedRow[],
  schools: SchoolSeed[],
  rateDigits: 1 | 2,
): CorpTransferRatioAdvancedRow[] {
  const repByCode = new Map(schools.map((s) => [s.code, s]));
  type Agg = {
    year: number;
    repCode: string;
    schoolName: string;
    schoolDivision: string;
    schoolKind: string;
    region: string;
    estb: string;
    tuitionRevenue: number;
    ordinaryExpenseTransfer: number;
    legalObligationTransfer: number;
    assetTransfer: number;
    totalTransfer: number;
  };

  const groups = new Map<string, Agg>();

  for (const row of campusRows) {
    const seed = repByCode.get(row.schoolCodeStd);
    const repCode = seed?.repCode ?? row.schoolCodeStd;
    const key = `${row.year}|${repCode}|${row.schoolKind}|${row.estb}`;
    const existing = groups.get(key);
    if (!existing) {
      const main =
        schools.find((s) => s.repCode === repCode && s.isMain) ?? seed;
      groups.set(key, {
        year: row.year,
        repCode,
        schoolName: main
          ? main.name.replace(/\(본교\)$/, "").trim() || main.name
          : row.schoolName,
        schoolDivision: row.schoolDivision,
        schoolKind: row.schoolKind,
        region: main?.region ?? row.region,
        estb: row.estb,
        tuitionRevenue: row.tuitionRevenue,
        ordinaryExpenseTransfer: row.ordinaryExpenseTransfer,
        legalObligationTransfer: row.legalObligationTransfer,
        assetTransfer: row.assetTransfer,
        totalTransfer: row.totalTransfer,
      });
      continue;
    }
    existing.tuitionRevenue += row.tuitionRevenue;
    existing.ordinaryExpenseTransfer += row.ordinaryExpenseTransfer;
    existing.legalObligationTransfer += row.legalObligationTransfer;
    existing.assetTransfer += row.assetTransfer;
    existing.totalTransfer += row.totalTransfer;
  }

  return [...groups.values()].map((g) => {
    const rateRaw = g.tuitionRevenue
      ? (g.totalTransfer / g.tuitionRevenue) * 100
      : 0;
    const transferRatio =
      rateDigits === 2 ? round2(rateRaw) : round1(rateRaw);
    return {
      year: g.year,
      schoolCodeStd: g.repCode,
      schoolName: g.schoolName,
      schoolDivision: g.schoolDivision,
      schoolKind: g.schoolKind,
      region: g.region,
      estb: g.estb,
      tuitionRevenue: g.tuitionRevenue,
      ordinaryExpenseTransfer: g.ordinaryExpenseTransfer,
      legalObligationTransfer: g.legalObligationTransfer,
      assetTransfer: g.assetTransfer,
      totalTransfer: g.totalTransfer,
      transferRatio,
    };
  });
}

const schoolSeeds = buildSchoolSeeds(mulberry32(20250807));

const freshmanCampus = buildFreshmanRows(schoolSeeds, mulberry32(11));
const enrolledCampus = buildEnrolledRows(schoolSeeds, mulberry32(22));
const dropoutCampus = buildDropoutRows(schoolSeeds, mulberry32(33));

export const STUDENT_FILL_MOCK_YEARS = [...YEARS];

export const STUDENT_FILL_MOCK_ROWS: Record<
  StudentFillMockMetric,
  Record<StudentFillViewMode, CorpTransferRatioAdvancedRow[]>
> = {
  freshman: {
    campus: freshmanCampus,
    consolidated: consolidateByRep(freshmanCampus, schoolSeeds, 1),
  },
  enrolled: {
    campus: enrolledCampus,
    consolidated: consolidateByRep(enrolledCampus, schoolSeeds, 1),
  },
  dropout: {
    campus: dropoutCampus,
    consolidated: consolidateByRep(dropoutCampus, schoolSeeds, 2),
  },
};

export function countMockSchools(
  metric: StudentFillMockMetric,
  viewMode: StudentFillViewMode,
  year: number,
): number {
  return STUDENT_FILL_MOCK_ROWS[metric][viewMode].filter((r) => r.year === year)
    .length;
}
