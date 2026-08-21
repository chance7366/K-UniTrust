import {
  roundBenefitRate,
  wonToEok,
} from "@/lib/ingest/financial-support-benefit-rate-config";
import {
  loadSchoolCampusIndex,
  MAIN_BRANCH_LABEL,
  outputIdentityFromCampus,
  type SchoolCampusEntry,
} from "@/lib/ingest/school-code-campus-index";

export type RawFinancialSupportCampusRow = {
  year: number;
  schoolCodeStd: string;
  schoolName: string;
  estb: string;
  region: string;
  schoolDivision: string;
  ministryOfEducation: number;
  nationalScholarship: number;
  ministryOfScienceIct: number;
  ministryOfEmployment: number;
  ministryOfTrade: number;
  ministryOfHealth: number;
  ministryOfCulture: number;
  ministryOfSme: number;
  ministryOfAgriculture: number;
  otherMinistries: number;
  localGovernment: number;
  totalSupport: number;
  /** R열 등록금수입(원) — 분리 업로드 시 본교 행만 값이 있는 경우 많음 */
  tuitionRevenueWon: number;
  /** S열 재정지원수혜율 — 없으면 합산 후 재계산 */
  benefitRate: number | null;
};

function num(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fallbackCampus(
  row: RawFinancialSupportCampusRow,
): SchoolCampusEntry {
  const code = row.schoolCodeStd.trim();
  return {
    schoolCodeStd: code,
    schoolRepCode: code,
    schoolRepName: row.schoolName,
    schoolName: row.schoolName,
    mainBranchName: MAIN_BRANCH_LABEL,
    schoolDivision: row.schoolDivision,
    schoolKind: "",
    region: row.region,
    estb: row.estb,
  };
}

/**
 * 학교코드_표준 기준 분교·캠퍼스 지원액을 본교(학교대표코드)로 합산합니다.
 * 등록금수입(원)은 합산하고, 재정지원수혜율은 합산 금액으로 재계산합니다.
 */
export async function consolidateFinancialSupportBenefitRateRows(
  campusRows: RawFinancialSupportCampusRow[],
  uploadedAt: string,
): Promise<{ rows: Record<string, string>[]; skippedCount: number }> {
  const index = await loadSchoolCampusIndex();

  type Group = {
    year: number;
    schoolCodeStd: string;
    schoolName: string;
    schoolDivision: string;
    schoolKind: string;
    region: string;
    estb: string;
    campusCount: number;
    campusCodes: string[];
    ministryOfEducation: number;
    nationalScholarship: number;
    ministryOfScienceIct: number;
    ministryOfEmployment: number;
    ministryOfTrade: number;
    ministryOfHealth: number;
    ministryOfCulture: number;
    ministryOfSme: number;
    ministryOfAgriculture: number;
    otherMinistries: number;
    localGovernment: number;
    totalSupport: number;
    tuitionRevenueWon: number;
  };

  const groups = new Map<string, Group>();
  let skippedCount = 0;

  for (const row of campusRows) {
    const campus =
      index.resolve(row.year, row.schoolCodeStd, row.schoolName) ??
      fallbackCampus(row);

    if (!campus.schoolRepCode && !campus.schoolCodeStd) {
      skippedCount += 1;
      continue;
    }

    const repCode = campus.schoolRepCode || campus.schoolCodeStd;
    const estb = campus.estb || row.estb;
    const schoolKind = campus.schoolKind;
    let schoolDivision = campus.schoolDivision || row.schoolDivision;
    if (schoolDivision !== "대학" && schoolDivision !== "전문대학") {
      schoolDivision = row.schoolDivision === "대학" ? "대학" : "전문대학";
    }

    const key = `${row.year}:${repCode}:${schoolKind}:${estb}`;
    let group = groups.get(key);
    if (!group) {
      const identity = outputIdentityFromCampus(campus);
      group = {
        year: row.year,
        schoolCodeStd: identity.code,
        schoolName: identity.name,
        schoolDivision,
        schoolKind,
        region: campus.region || row.region,
        estb,
        campusCount: 0,
        campusCodes: [],
        ministryOfEducation: 0,
        nationalScholarship: 0,
        ministryOfScienceIct: 0,
        ministryOfEmployment: 0,
        ministryOfTrade: 0,
        ministryOfHealth: 0,
        ministryOfCulture: 0,
        ministryOfSme: 0,
        ministryOfAgriculture: 0,
        otherMinistries: 0,
        localGovernment: 0,
        totalSupport: 0,
        tuitionRevenueWon: 0,
      };
      groups.set(key, group);
    }

    group.campusCount += 1;
    if (!group.campusCodes.includes(campus.schoolCodeStd)) {
      group.campusCodes.push(campus.schoolCodeStd);
    }
    if (campus.mainBranchName === MAIN_BRANCH_LABEL) {
      const identity = outputIdentityFromCampus(campus);
      group.schoolCodeStd = identity.code;
      group.schoolName = identity.name;
      group.region = campus.region || group.region;
    }

    group.ministryOfEducation += row.ministryOfEducation;
    group.nationalScholarship += row.nationalScholarship;
    group.ministryOfScienceIct += row.ministryOfScienceIct;
    group.ministryOfEmployment += row.ministryOfEmployment;
    group.ministryOfTrade += row.ministryOfTrade;
    group.ministryOfHealth += row.ministryOfHealth;
    group.ministryOfCulture += row.ministryOfCulture;
    group.ministryOfSme += row.ministryOfSme;
    group.ministryOfAgriculture += row.ministryOfAgriculture;
    group.otherMinistries += row.otherMinistries;
    group.localGovernment += row.localGovernment;
    group.totalSupport += row.totalSupport;
    group.tuitionRevenueWon += row.tuitionRevenueWon;
  }

  const rows: Record<string, string>[] = [];

  for (const group of groups.values()) {
    const tuitionEok = wonToEok(group.tuitionRevenueWon) ?? 0;
    const benefitRate =
      group.tuitionRevenueWon > 0
        ? roundBenefitRate(
            (group.totalSupport / group.tuitionRevenueWon) * 100,
          ) ?? 0
        : 0;

    rows.push({
      year: String(group.year),
      school_code_std: group.schoolCodeStd,
      school_name: group.schoolName,
      school_division: group.schoolDivision,
      school_kind: group.schoolKind,
      region: group.region,
      estb: group.estb,
      campus_count: String(group.campusCount),
      ministry_of_education: String(Math.round(group.ministryOfEducation)),
      national_scholarship: String(Math.round(group.nationalScholarship)),
      ministry_of_science_ict: String(Math.round(group.ministryOfScienceIct)),
      ministry_of_employment: String(Math.round(group.ministryOfEmployment)),
      ministry_of_trade: String(Math.round(group.ministryOfTrade)),
      ministry_of_health: String(Math.round(group.ministryOfHealth)),
      ministry_of_culture: String(Math.round(group.ministryOfCulture)),
      ministry_of_sme: String(Math.round(group.ministryOfSme)),
      ministry_of_agriculture: String(Math.round(group.ministryOfAgriculture)),
      other_ministries: String(Math.round(group.otherMinistries)),
      local_government: String(Math.round(group.localGovernment)),
      total_support: String(Math.round(group.totalSupport)),
      tuition_revenue: String(tuitionEok),
      benefit_rate: String(benefitRate),
      uploaded_at: uploadedAt,
    });
  }

  rows.sort((a, b) => {
    const yearDiff = num(a.year) - num(b.year);
    if (yearDiff !== 0) return yearDiff;
    const regionDiff = (a.region ?? "").localeCompare(b.region ?? "", "ko");
    if (regionDiff !== 0) return regionDiff;
    return (a.school_name ?? "").localeCompare(b.school_name ?? "", "ko");
  });

  return { rows, skippedCount };
}
