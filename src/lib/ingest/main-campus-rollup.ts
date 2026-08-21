import {
  loadSchoolCampusIndex,
  MAIN_BRANCH_LABEL,
  outputIdentityFromCampus,
  padSchoolCode,
  type SchoolCampusEntry,
  type SchoolCampusIndex,
} from "@/lib/ingest/school-code-campus-index";

function parseNum(v: string | undefined): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type MainCampusRollupSpec = {
  /** 합산할 숫자 필드 */
  sumFields: readonly string[];
  /**
   * 그룹화 시 메타에 school_kind를 포함할지.
   * false면 year+rep(+estb)만 사용 (권장: 학교코드 표준 kind 사용).
   */
  includeSchoolKindInKey?: boolean;
  includeEstbInKey?: boolean;
  /** 합산 후 파생 필드(비율 등) 재계산 */
  finalize: (
    sums: Record<string, number>,
    identity: {
      year: number;
      schoolCodeStd: string;
      schoolName: string;
      schoolDivision: string;
      schoolKind: string;
      region: string;
      estb: string;
      campusCount: number;
      campusCodes: string[];
      sampleRow: Record<string, string>;
    },
  ) => Record<string, string>;
};

function fallbackCampus(
  year: number,
  row: Record<string, string>,
): SchoolCampusEntry {
  const code = padSchoolCode(row.school_code_std ?? "");
  return {
    schoolCodeStd: code,
    schoolRepCode: code,
    schoolRepName: row.school_name?.trim() || "",
    schoolName: row.school_name?.trim() || "",
    mainBranchName: MAIN_BRANCH_LABEL,
    schoolDivision: row.school_division?.trim() || "",
    schoolKind: row.school_kind?.trim() || "",
    region: row.region?.trim() || "",
    estb: row.estb?.trim() || "",
  };
}

/**
 * 학교코드_표준 → 학교대표코드 기준 분교·캠퍼스 행을 본교로 합산합니다.
 * 업로드가 이미 본교만 있어도 identity 매핑으로 동작합니다.
 */
export function rollupRowsToMainCampus(
  rows: Record<string, string>[],
  index: SchoolCampusIndex,
  spec: MainCampusRollupSpec,
): Record<string, string>[] {
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
    sums: Record<string, number>;
    sampleRow: Record<string, string>;
    hasMainBranch: boolean;
  };

  const groups = new Map<string, Group>();
  const includeKind = spec.includeSchoolKindInKey === true;
  const includeEstb = spec.includeEstbInKey !== false;

  for (const row of rows) {
    const year = parseNum(row.year);
    if (!year) continue;

    const campus =
      index.resolve(year, row.school_code_std ?? "", row.school_name ?? "") ??
      fallbackCampus(year, row);

    const repCode = campus.schoolRepCode || campus.schoolCodeStd;
    const estb = campus.estb || row.estb?.trim() || "";
    const schoolKind = campus.schoolKind || row.school_kind?.trim() || "";
    let schoolDivision =
      campus.schoolDivision || row.school_division?.trim() || "";
    if (schoolDivision !== "대학" && schoolDivision !== "전문대학") {
      const fallback = row.school_division?.trim() ?? "";
      schoolDivision =
        fallback === "대학" || fallback === "전문대학" ? fallback : schoolDivision;
    }

    const keyParts = [String(year), repCode];
    if (includeKind) keyParts.push(schoolKind);
    if (includeEstb) keyParts.push(estb);
    const key = keyParts.join(":");

    let group = groups.get(key);
    if (!group) {
      const identity = outputIdentityFromCampus(campus);
      group = {
        year,
        schoolCodeStd: identity.code,
        schoolName: identity.name,
        schoolDivision,
        schoolKind,
        region: campus.region || row.region?.trim() || "",
        estb,
        campusCount: 0,
        campusCodes: [],
        sums: Object.fromEntries(spec.sumFields.map((f) => [f, 0])),
        sampleRow: row,
        hasMainBranch: false,
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
      group.schoolDivision = campus.schoolDivision || group.schoolDivision;
      group.schoolKind = campus.schoolKind || group.schoolKind;
      group.estb = campus.estb || group.estb;
      group.sampleRow = row;
      group.hasMainBranch = true;
    }

    for (const field of spec.sumFields) {
      group.sums[field] = (group.sums[field] ?? 0) + parseNum(row[field]);
    }
  }

  const out: Record<string, string>[] = [];
  for (const group of groups.values()) {
    const finalized = spec.finalize(group.sums, {
      year: group.year,
      schoolCodeStd: group.schoolCodeStd,
      schoolName: group.schoolName,
      schoolDivision: group.schoolDivision,
      schoolKind: group.schoolKind,
      region: group.region,
      estb: group.estb,
      campusCount: group.campusCount,
      campusCodes: group.campusCodes,
      sampleRow: group.sampleRow,
    });
    out.push(finalized);
  }

  out.sort((a, b) => {
    const yearDiff = parseNum(a.year) - parseNum(b.year);
    if (yearDiff !== 0) return yearDiff;
    const regionDiff = (a.region ?? "").localeCompare(b.region ?? "", "ko");
    if (regionDiff !== 0) return regionDiff;
    return (a.school_name ?? "").localeCompare(b.school_name ?? "", "ko");
  });

  return out;
}

export async function rollupCsvRowsToMainCampus(
  rows: Record<string, string>[],
  spec: MainCampusRollupSpec,
): Promise<Record<string, string>[]> {
  const index = await loadSchoolCampusIndex();
  return rollupRowsToMainCampus(rows, index, spec);
}

function baseIdentity(
  identity: Parameters<MainCampusRollupSpec["finalize"]>[1],
  uploadedAt: string,
): Record<string, string> {
  return {
    year: String(identity.year),
    school_code_std: identity.schoolCodeStd,
    school_name: identity.schoolName,
    school_division: identity.schoolDivision,
    school_kind: identity.schoolKind,
    region: identity.region,
    estb: identity.estb,
    uploaded_at: uploadedAt || identity.sampleRow.uploaded_at || "",
  };
}

/** 자금확보율: 금액 합산 후 자금확보율 = 자금합계 / 등록금수입 × 100 */
export const FUND_SECURE_MAIN_CAMPUS_SPEC: MainCampusRollupSpec = {
  sumFields: [
    "school_funds_carryover",
    "school_funds_endowment",
    "industry_carryover",
    "industry_endowment",
    "total_funds",
    "tuition_revenue",
  ],
  finalize: (sums, identity) => {
    const partsSum =
      sums.school_funds_carryover +
      sums.school_funds_endowment +
      sums.industry_carryover +
      sums.industry_endowment;
    const totalFunds = partsSum !== 0 ? partsSum : sums.total_funds;
    const tuition = sums.tuition_revenue;
    const rate = tuition > 0 ? round1((totalFunds / tuition) * 100) : 0;
    return {
      ...baseIdentity(identity, ""),
      school_funds_carryover: String(sums.school_funds_carryover),
      school_funds_endowment: String(sums.school_funds_endowment),
      industry_carryover: String(sums.industry_carryover),
      industry_endowment: String(sums.industry_endowment),
      total_funds: String(totalFunds),
      tuition_revenue: String(tuition),
      fund_secure_rate: String(rate),
    };
  },
};

/** 등록금의존율: 금액 합산 후 의존율 = 등록금수입 / 운영수입합계 × 100 */
export const TUITION_DEPENDENCY_MAIN_CAMPUS_SPEC: MainCampusRollupSpec = {
  sumFields: [
    "tuition_revenue",
    "school_operating_revenue",
    "industry_operating_revenue",
    "total_operating_revenue",
  ],
  finalize: (sums, identity) => {
    const partsSum =
      sums.school_operating_revenue + sums.industry_operating_revenue;
    const totalOp = partsSum !== 0 ? partsSum : sums.total_operating_revenue;
    const tuition = sums.tuition_revenue;
    const rate = totalOp > 0 ? round1((tuition / totalOp) * 100) : 0;
    return {
      ...baseIdentity(identity, ""),
      tuition_revenue: String(tuition),
      school_operating_revenue: String(sums.school_operating_revenue),
      industry_operating_revenue: String(sums.industry_operating_revenue),
      total_operating_revenue: String(totalOp),
      tuition_dependency_rate: String(rate),
    };
  },
};

/**
 * 재정지원수혜율: 지원액(원)·등록금수입(억원 CSV) 합산 후
 * 수혜율 = 지원액합계 / (등록금수입억원×1e8) × 100
 */
export const FINANCIAL_SUPPORT_MAIN_CAMPUS_SPEC: MainCampusRollupSpec = {
  sumFields: [
    "campus_count",
    "ministry_of_education",
    "national_scholarship",
    "ministry_of_science_ict",
    "ministry_of_employment",
    "ministry_of_trade",
    "ministry_of_health",
    "ministry_of_culture",
    "ministry_of_sme",
    "ministry_of_agriculture",
    "other_ministries",
    "local_government",
    "total_support",
    "tuition_revenue",
  ],
  includeSchoolKindInKey: true,
  finalize: (sums, identity) => {
    const totalSupport = Math.round(sums.total_support);
    const tuitionEok = Math.round(sums.tuition_revenue);
    const tuitionWon = tuitionEok * 100_000_000;
    const rate =
      tuitionWon > 0 ? round1((totalSupport / tuitionWon) * 100) : 0;
    const campusCount =
      sums.campus_count > 0 ? Math.round(sums.campus_count) : identity.campusCount;
    return {
      ...baseIdentity(identity, ""),
      campus_count: String(campusCount),
      ministry_of_education: String(Math.round(sums.ministry_of_education)),
      national_scholarship: String(Math.round(sums.national_scholarship)),
      ministry_of_science_ict: String(Math.round(sums.ministry_of_science_ict)),
      ministry_of_employment: String(Math.round(sums.ministry_of_employment)),
      ministry_of_trade: String(Math.round(sums.ministry_of_trade)),
      ministry_of_health: String(Math.round(sums.ministry_of_health)),
      ministry_of_culture: String(Math.round(sums.ministry_of_culture)),
      ministry_of_sme: String(Math.round(sums.ministry_of_sme)),
      ministry_of_agriculture: String(Math.round(sums.ministry_of_agriculture)),
      other_ministries: String(Math.round(sums.other_ministries)),
      local_government: String(Math.round(sums.local_government)),
      total_support: String(totalSupport),
      tuition_revenue: String(tuitionEok),
      benefit_rate: String(rate),
    };
  },
};

/** 법인전입금비율: 전입금·등록금 합산 후 비율 = 전입금합계 / 등록금수입 × 100 */
export const CORP_TRANSFER_MAIN_CAMPUS_SPEC: MainCampusRollupSpec = {
  sumFields: [
    "ordinary_expense_transfer",
    "legal_obligation_transfer",
    "asset_transfer",
    "total_transfer",
    "tuition_revenue",
  ],
  finalize: (sums, identity) => {
    const partsSum =
      sums.ordinary_expense_transfer +
      sums.legal_obligation_transfer +
      sums.asset_transfer;
    const totalTransfer = partsSum !== 0 ? partsSum : sums.total_transfer;
    const tuition = sums.tuition_revenue;
    const rate = tuition > 0 ? round1((totalTransfer / tuition) * 100) : 0;
    return {
      ...baseIdentity(identity, ""),
      ordinary_expense_transfer: String(sums.ordinary_expense_transfer),
      legal_obligation_transfer: String(sums.legal_obligation_transfer),
      asset_transfer: String(sums.asset_transfer),
      total_transfer: String(totalTransfer),
      tuition_revenue: String(tuition),
      transfer_ratio: String(rate),
    };
  },
};

/** 수익용재산확보율: 평가액·순수입 합산 (비율은 화면에서 등록금 조인 후 계산) */
export const INCOME_PROPERTY_MAIN_CAMPUS_SPEC: MainCampusRollupSpec = {
  sumFields: [
    "land_appraised",
    "land_net_income",
    "building_appraised",
    "building_net_income",
    "securities_appraised",
    "securities_net_income",
    "deposit_appraised",
    "deposit_net_income",
    "other_appraised",
    "other_net_income",
    "collateral_deduction",
    "total_appraised",
    "total_net_income",
  ],
  finalize: (sums, identity) => {
    const partsAppraised =
      sums.land_appraised +
      sums.building_appraised +
      sums.securities_appraised +
      sums.deposit_appraised +
      sums.other_appraised -
      sums.collateral_deduction;
    const totalAppraised =
      partsAppraised !== 0 ? partsAppraised : sums.total_appraised;
    const partsNet =
      sums.land_net_income +
      sums.building_net_income +
      sums.securities_net_income +
      sums.deposit_net_income +
      sums.other_net_income;
    const totalNetIncome =
      partsNet !== 0 ? partsNet : sums.total_net_income;
    return {
      ...baseIdentity(identity, identity.sampleRow.uploaded_at || ""),
      corp_name: identity.sampleRow.corp_name ?? "",
      school_status: identity.sampleRow.school_status ?? "",
      land_appraised: String(sums.land_appraised),
      land_net_income: String(sums.land_net_income),
      building_appraised: String(sums.building_appraised),
      building_net_income: String(sums.building_net_income),
      securities_appraised: String(sums.securities_appraised),
      securities_net_income: String(sums.securities_net_income),
      deposit_appraised: String(sums.deposit_appraised),
      deposit_net_income: String(sums.deposit_net_income),
      other_appraised: String(sums.other_appraised),
      other_net_income: String(sums.other_net_income),
      collateral_deduction: String(sums.collateral_deduction),
      total_appraised: String(totalAppraised),
      total_net_income: String(totalNetIncome),
      uploaded_at: identity.sampleRow.uploaded_at || "",
    };
  },
};